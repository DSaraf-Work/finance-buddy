/**
 * POST /api/receipts/parse
 *
 * Stateless receipt scanning for new manual transactions.
 * Accepts a multipart image upload and returns extracted top-level transaction fields:
 *   merchant name, total amount, currency, date, category, direction.
 *
 * No DB persistence — used purely to pre-fill CreateTransactionModal form.
 * Image pipeline: HEIC→JPEG → Sharp resize/grayscale/compress → OpenRouter Claude Haiku.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import formidable, { type Files as FormidableFiles } from 'formidable';
import { readFileSync } from 'fs';
import sharp from 'sharp';
import { withAuth } from '@/lib/auth';
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

export default withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
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

  try {
    const fields = await parseTransactionFields({ fileBuffer, mimeType: effectiveMime });
    console.log('✅ Transaction fields extracted from receipt:', {
      store_name: fields.store_name,
      total_amount: fields.total_amount,
      category: fields.category,
      direction: fields.direction,
    });
    return res.status(200).json({ fields });
  } catch (err) {
    if (err instanceof ReceiptParseError) {
      if (err.code === 'NOT_A_RECEIPT') {
        return res.status(422).json({
          error: 'The uploaded image does not appear to be a receipt',
          reason: err.reason,
        });
      }
      return res.status(500).json({ error: err.message });
    }
    console.error('Transaction fields parsing failed:', err);
    return res.status(500).json({ error: 'Failed to parse receipt' });
  }
});
