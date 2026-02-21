/**
 * POST /api/receipts/parse
 *
 * Stateless-ish receipt scanning for new manual transactions.
 * Accepts a multipart image upload, processes it, runs OCR, persists the image
 * to Supabase Storage + fb_receipts (with transaction_id=null), and returns
 * extracted top-level transaction fields + receipt_id + signed URL so the UI
 * can show a thumbnail and link the receipt after transaction creation.
 *
 * Image pipeline: HEIC→JPEG → Sharp resize/grayscale/compress → Storage → OCR
 * Returns: { receipt_id, signed_url, fields: ParsedTransactionFields }
 */

import { NextApiRequest, NextApiResponse } from 'next';
import formidable, { type Files as FormidableFiles } from 'formidable';
import { readFileSync } from 'fs';
import sharp from 'sharp';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { TABLE_RECEIPTS } from '@/lib/constants/database';
import { parseTransactionFields, ReceiptParseError } from '@/lib/receipt/parser';

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

  const uploadedFiles = files.file;
  if (!uploadedFiles || uploadedFiles.length === 0) {
    return res.status(400).json({ error: 'No file uploaded. Use field name "file".' });
  }

  const uploadedFile = uploadedFiles[0];
  const detectedMime = (uploadedFile.mimetype || '').toLowerCase();

  if (detectedMime === 'application/pdf') {
    return res.status(400).json({
      error: 'PDF receipts are not supported. Please upload a JPEG, PNG, WebP, or HEIC image.',
    });
  }

  if (!ACCEPTED_IMAGE_TYPES.has(detectedMime)) {
    return res.status(400).json({
      error: `Unsupported file type: ${detectedMime}. Accepted: JPEG, PNG, WebP, HEIC.`,
    });
  }

  let fileBuffer: Buffer = readFileSync(uploadedFile.filepath);

  // HEIC/HEIF → JPEG conversion
  let effectiveMime = detectedMime;
  if (detectedMime === 'image/heic' || detectedMime === 'image/heif') {
    try {
      const heicConvert = (await import('heic-convert')).default;
      const converted = await heicConvert({ buffer: fileBuffer, format: 'JPEG', quality: 1 });
      fileBuffer = Buffer.from(converted);
      effectiveMime = 'image/jpeg';
    } catch (err) {
      console.error('HEIC conversion failed:', err);
      return res.status(500).json({ error: 'Failed to process HEIC image' });
    }
  }

  // Sharp: resize to 1024px max, grayscale, JPEG 70% — 4x cheaper with Claude Vision
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

  // Upload processed image to Supabase Storage so user can view it later
  const receiptId = crypto.randomUUID();
  const storagePath = `${user.id}/${receiptId}/receipt.jpg`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('receipts')
    .upload(storagePath, fileBuffer, { contentType: 'image/jpeg', upsert: false });

  if (uploadError) {
    console.error('Storage upload failed:', uploadError);
    return res.status(500).json({ error: 'Failed to upload receipt image' });
  }

  // OCR: extract top-level transaction fields
  let fields;
  try {
    fields = await parseTransactionFields({ fileBuffer, mimeType: effectiveMime });
  } catch (err) {
    // Clean up orphaned storage file on OCR failure
    await supabaseAdmin.storage.from('receipts').remove([storagePath]);

    if (err instanceof ReceiptParseError) {
      if (err.code === 'NOT_A_RECEIPT') {
        return res.status(422).json({
          error: 'The uploaded image does not appear to be a receipt',
          reason: (err as ReceiptParseError).reason,
        });
      }
      return res.status(500).json({ error: err.message });
    }
    console.error('Transaction fields parsing failed:', err);
    return res.status(500).json({ error: 'Failed to parse receipt' });
  }

  // Save receipt record with transaction_id=null (will be linked after transaction creation)
  const receiptRow = {
    id: receiptId,
    user_id: user.id,
    transaction_id: null,
    storage_path: storagePath,
    original_filename: uploadedFile.originalFilename || 'receipt.jpg',
    file_type: detectedMime,
    file_size_bytes: uploadedFile.size ?? null,
    store_name: fields.store_name,
    receipt_date: fields.date,
    total_amount: fields.total_amount,
    currency: fields.currency,
    parsing_status: 'completed' as const,
    confidence: null,
    ai_model_used: 'anthropic/claude-haiku-4.5',
  };

  const { error: dbError } = await (supabaseAdmin as any).from(TABLE_RECEIPTS).insert(receiptRow);

  if (dbError) {
    // Orphan prevention: delete storage file if DB insert fails
    await supabaseAdmin.storage.from('receipts').remove([storagePath]);
    console.error('Failed to save receipt to DB:', dbError);
    return res.status(500).json({ error: 'Failed to save receipt' });
  }

  // Generate a 1-hour signed URL for the frontend to display as thumbnail
  const { data: signedData, error: signError } = await supabaseAdmin.storage
    .from('receipts')
    .createSignedUrl(storagePath, 3600);

  if (signError || !signedData?.signedUrl) {
    console.error('Failed to generate signed URL:', signError);
    // Non-fatal: return without signed URL (thumbnail won't show but OCR still worked)
    return res.status(200).json({ receipt_id: receiptId, signed_url: null, fields });
  }

  console.log('✅ Transaction fields extracted from receipt:', {
    receipt_id: receiptId,
    store_name: fields.store_name,
    total_amount: fields.total_amount,
    category: fields.category,
    direction: fields.direction,
  });

  return res.status(200).json({
    receipt_id: receiptId,
    signed_url: signedData.signedUrl,
    fields,
  });
});
