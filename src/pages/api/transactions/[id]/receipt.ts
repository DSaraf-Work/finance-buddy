/**
 * POST /api/transactions/[id]/receipt
 *
 * Accepts a multipart upload (image file), runs it through:
 *   1. HEIC→JPEG conversion (if applicable)
 *   2. Sharp resize/grayscale/compress (1024px, grayscale, 70% JPEG)
 *   3. Supabase Storage upload
 *   4. OpenRouter Claude Haiku OCR parsing
 *   5. DB save (fb_receipts + fb_receipt_items)
 *
 * Returns: { receipt_id, parsed: ParsedReceipt }
 */

import { NextApiRequest, NextApiResponse } from 'next';
import formidable, { type Files as FormidableFiles } from 'formidable';
import { readFileSync } from 'fs';
import sharp from 'sharp';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { TABLE_EMAILS_PROCESSED, TABLE_RECEIPTS, TABLE_RECEIPT_ITEMS } from '@/lib/constants/database';
import { parseReceiptWithOpenRouter, ReceiptParseError } from '@/lib/receipt/parser';

// Disable Next.js body parser — formidable handles multipart
export const config = { api: { bodyParser: false } };

const ACCEPTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id: transactionId } = req.query;
  if (!transactionId || typeof transactionId !== 'string') {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }

  // Verify transaction belongs to this user
  // Cast needed because Supabase types are not auto-generated for this project
  const { data: txn, error: txnError } = await (supabaseAdmin as any)
    .from(TABLE_EMAILS_PROCESSED)
    .select('id, amount')
    .eq('id', transactionId)
    .eq('user_id', user.id)
    .single() as { data: { id: string; amount: number | null } | null; error: unknown };

  if (txnError || !txn) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  // Parse multipart upload
  const form = formidable({ maxFileSize: MAX_FILE_SIZE });
  let files: FormidableFiles;
  try {
    [, files] = await form.parse(req);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('maxFileSize')) {
      return res.status(400).json({ error: 'File exceeds 20MB limit' });
    }
    return res.status(400).json({ error: 'Failed to parse upload', details: message });
  }

  // Get the uploaded file
  const uploadedFiles = files.file;
  if (!uploadedFiles || uploadedFiles.length === 0) {
    return res.status(400).json({ error: 'No file uploaded. Use field name "file".' });
  }
  const uploadedFile = uploadedFiles[0];
  const detectedMime = (uploadedFile.mimetype || '').toLowerCase();

  // Reject PDFs
  if (detectedMime === 'application/pdf') {
    return res.status(400).json({
      error: 'PDF receipts are not supported. Please upload a JPEG, PNG, WebP, or HEIC image.',
    });
  }

  // Reject unknown types
  if (!ACCEPTED_IMAGE_TYPES.has(detectedMime)) {
    return res.status(400).json({
      error: `Unsupported file type: ${detectedMime}. Accepted: JPEG, PNG, WebP, HEIC.`,
    });
  }

  // Read file buffer from temp path
  let fileBuffer: Buffer = readFileSync(uploadedFile.filepath);

  // HEIC/HEIF → JPEG conversion
  let effectiveMime = detectedMime;
  if (detectedMime === 'image/heic' || detectedMime === 'image/heif') {
    try {
      // Dynamic import to avoid loading heic-convert unless needed
      const heicConvert = (await import('heic-convert')).default;
      const converted = await heicConvert({
        buffer: fileBuffer,
        format: 'JPEG',
        quality: 1, // Sharp handles final quality
      });
      fileBuffer = Buffer.from(converted);
      effectiveMime = 'image/jpeg';
    } catch (err) {
      console.error('HEIC conversion failed:', err);
      return res.status(500).json({ error: 'Failed to process HEIC image' });
    }
  }

  // Sharp: resize to 1024px max, convert to grayscale, JPEG 70%
  // Grayscale + downsize = 4x cheaper with Claude Vision (fewer tiles)
  try {
    fileBuffer = await sharp(fileBuffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .grayscale()
      .jpeg({ quality: 70 })
      .toBuffer();
    effectiveMime = 'image/jpeg';
  } catch (err) {
    console.error('Sharp processing failed:', err);
    return res.status(500).json({ error: 'Failed to process image' });
  }

  // Generate receipt ID for storage path
  const receiptId = crypto.randomUUID();
  const storagePath = `${user.id}/${receiptId}/receipt.jpg`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabaseAdmin.storage
    .from('receipts')
    .upload(storagePath, fileBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (uploadError) {
    console.error('Storage upload failed:', uploadError);
    return res.status(500).json({ error: 'Failed to upload receipt image' });
  }

  // OCR parsing via OpenRouter
  const parentAmount = txn.amount ? Number(txn.amount) : null;
  let parsed;
  try {
    parsed = await parseReceiptWithOpenRouter({
      fileBuffer,
      mimeType: 'image/jpeg',
      parentAmount,
    });
  } catch (err) {
    // Clean up orphaned storage file on parse failure
    await supabaseAdmin.storage.from('receipts').remove([storagePath]);

    if (err instanceof ReceiptParseError) {
      if (err.code === 'NOT_A_RECEIPT') {
        return res.status(422).json({
          error: 'The uploaded image does not appear to be a receipt',
          reason: err.reason,
        });
      }
      return res.status(500).json({ error: err.message });
    }
    console.error('Receipt parsing failed:', err);
    return res.status(500).json({ error: 'Failed to parse receipt' });
  }

  // Save receipt metadata to fb_receipts
  // as any: Supabase types not generated for the new receipt tables
  const receiptRow = {
    id: receiptId,
    user_id: user.id,
    transaction_id: transactionId,
    storage_path: storagePath,
    original_filename: uploadedFile.originalFilename || 'receipt.jpg',
    file_type: detectedMime,
    file_size_bytes: uploadedFile.size ?? null,
    store_name: parsed.store_name,
    receipt_date: parsed.receipt_date,
    receipt_number: parsed.receipt_number,
    subtotal: parsed.subtotal,
    tax_amount: parsed.tax_amount,
    discount_amount: parsed.discount_amount,
    total_amount: parsed.total_amount,
    currency: parsed.currency,
    raw_ocr_response: JSON.stringify(parsed.raw),
    parsing_status: 'completed' as const,
    confidence: parsed.confidence,
    ai_model_used: 'anthropic/claude-haiku-3-5',
  };

  const { error: dbError } = await (supabaseAdmin as any).from(TABLE_RECEIPTS).insert(receiptRow);

  if (dbError) {
    // Orphan prevention: delete storage file if DB insert fails
    await supabaseAdmin.storage.from('receipts').remove([storagePath]);
    console.error('Failed to save receipt to DB:', dbError);
    return res.status(500).json({ error: 'Failed to save receipt' });
  }

  // Bulk insert line items into fb_receipt_items
  if (parsed.items.length > 0) {
    const itemRows = parsed.items.map((item, idx) => ({
      receipt_id: receiptId,
      user_id: user.id,
      item_order: idx,
      item_name: item.item_name,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      total_price: item.total_price,
      suggested_category: item.suggested_category,
      is_tax_line: item.is_tax_line,
      is_discount_line: item.is_discount_line,
    }));

    const { error: itemsError } = await (supabaseAdmin as any).from(TABLE_RECEIPT_ITEMS).insert(itemRows);
    if (itemsError) {
      // Non-fatal: receipt is saved, items failed — log and continue
      console.error('Failed to save receipt items:', itemsError);
    }
  }

  console.log('✅ Receipt parsed successfully:', {
    receipt_id: receiptId,
    transaction_id: transactionId,
    item_count: parsed.items.length,
    confidence: parsed.confidence,
    has_mismatch: parsed.mismatch.has_mismatch,
  });

  return res.status(200).json({
    receipt_id: receiptId,
    parsed,
  });
});
