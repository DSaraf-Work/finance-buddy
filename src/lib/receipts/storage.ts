/**
 * Receipt Storage
 *
 * Handles file upload and download for receipts using Supabase Storage.
 *
 * @module lib/receipts/storage
 */

import { supabaseAdmin } from '@/lib/supabase';
import type { ReceiptFileType } from '@/types/receipts';
import { RECEIPT_LIMITS, isValidReceiptFileType, getExtensionFromMimeType } from '@/types/receipts';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Supabase Storage bucket name for receipts
 */
export const RECEIPTS_BUCKET = 'receipts';

/**
 * Maximum file size for upload (10MB)
 */
export const MAX_FILE_SIZE = RECEIPT_LIMITS.MAX_FILE_SIZE;

// ============================================================================
// TYPES
// ============================================================================

export interface UploadResult {
  path: string;
  publicUrl: string | null;
}

export interface DownloadResult {
  data: Blob;
  contentType: string;
}

// ============================================================================
// STORAGE FUNCTIONS
// ============================================================================

/**
 * Upload a receipt file to Supabase Storage
 *
 * @param userId - User ID for storage path
 * @param transactionId - Transaction ID for storage path
 * @param file - File buffer or Blob
 * @param fileName - Original file name
 * @param mimeType - File MIME type
 * @returns Upload result with storage path and public URL
 */
export async function uploadReceipt(
  userId: string,
  transactionId: string,
  file: Buffer | Blob,
  fileName: string,
  mimeType: string
): Promise<UploadResult> {
  // Validate file type
  if (!isValidReceiptFileType(mimeType)) {
    throw new Error(`Invalid file type: ${mimeType}. Supported types: ${RECEIPT_LIMITS.SUPPORTED_EXTENSIONS.join(', ')}`);
  }

  // Validate file size
  const fileSize = file instanceof Blob ? file.size : file.byteLength;
  if (fileSize > MAX_FILE_SIZE) {
    throw new Error(`File size ${(fileSize / 1024 / 1024).toFixed(2)}MB exceeds maximum ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Generate storage path: receipts/{userId}/{transactionId}/{timestamp}_{filename}
  const timestamp = Date.now();
  const safeFileName = sanitizeFileName(fileName);
  const extension = getExtensionFromMimeType(mimeType as ReceiptFileType);
  const storagePath = `${userId}/${transactionId}/${timestamp}_${safeFileName}${extension}`;

  // Upload to Supabase Storage
  const { data, error } = await supabaseAdmin.storage
    .from(RECEIPTS_BUCKET)
    .upload(storagePath, file, {
      contentType: mimeType,
      upsert: false, // Don't overwrite existing files
    });

  if (error) {
    console.error('[ReceiptStorage] Upload failed:', error);
    throw new Error(`Failed to upload receipt: ${error.message}`);
  }

  // Get public URL (if bucket is public) or signed URL
  const publicUrl = getPublicUrl(data.path);

  return {
    path: data.path,
    publicUrl,
  };
}

/**
 * Download a receipt file from Supabase Storage
 *
 * @param path - Storage path
 * @returns Download result with file data and content type
 */
export async function downloadReceipt(path: string): Promise<DownloadResult> {
  const { data, error } = await supabaseAdmin.storage
    .from(RECEIPTS_BUCKET)
    .download(path);

  if (error) {
    console.error('[ReceiptStorage] Download failed:', error);
    throw new Error(`Failed to download receipt: ${error.message}`);
  }

  return {
    data,
    contentType: data.type,
  };
}

/**
 * Get receipt file as base64 for AI processing
 *
 * @param path - Storage path
 * @returns Base64-encoded file data (without data URI prefix)
 */
export async function getReceiptAsBase64(path: string): Promise<string> {
  const { data } = await downloadReceipt(path);

  // Convert Blob to base64
  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

/**
 * Delete a receipt file from Supabase Storage
 *
 * @param path - Storage path
 */
export async function deleteReceipt(path: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(RECEIPTS_BUCKET)
    .remove([path]);

  if (error) {
    console.error('[ReceiptStorage] Delete failed:', error);
    throw new Error(`Failed to delete receipt: ${error.message}`);
  }
}

/**
 * Generate a signed URL for temporary access
 *
 * @param path - Storage path
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL
 */
export async function getSignedUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('[ReceiptStorage] Signed URL creation failed:', error);
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get public URL for a storage path
 * Returns null if bucket is not public
 */
function getPublicUrl(path: string): string | null {
  const { data } = supabaseAdmin.storage
    .from(RECEIPTS_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl || null;
}

/**
 * Sanitize file name for storage
 * Removes special characters and spaces
 */
function sanitizeFileName(fileName: string): string {
  // Remove extension (we'll add it back based on MIME type)
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');

  // Replace special characters with underscores
  const sanitized = nameWithoutExt
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 50); // Limit length

  return sanitized || 'receipt';
}

/**
 * Check if receipts bucket exists and create if needed
 * Should be called during app initialization
 */
export async function ensureReceiptsBucketExists(): Promise<void> {
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();

  if (listError) {
    console.error('[ReceiptStorage] Failed to list buckets:', listError);
    return;
  }

  const exists = buckets.some((b) => b.name === RECEIPTS_BUCKET);
  if (exists) return;

  // Create the bucket
  const { error: createError } = await supabaseAdmin.storage.createBucket(RECEIPTS_BUCKET, {
    public: false, // Private bucket - use signed URLs
    fileSizeLimit: MAX_FILE_SIZE,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  });

  if (createError) {
    console.error('[ReceiptStorage] Failed to create bucket:', createError);
  } else {
    console.log('[ReceiptStorage] Created receipts bucket');
  }
}
