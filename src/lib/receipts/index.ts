/**
 * Receipt Module
 *
 * Complete module for receipt parsing and management.
 * Provides storage, parsing, and mapping utilities.
 *
 * @module receipts
 *
 * @example
 * ```typescript
 * import {
 *   getReceiptParser,
 *   uploadReceipt,
 *   mapReceiptToPublic,
 * } from '@/lib/receipts';
 *
 * // Upload a receipt
 * const result = await uploadReceipt(userId, transactionId, file, fileName, mimeType);
 *
 * // Parse the receipt
 * const parser = getReceiptParser();
 * const parsed = await parser.parseReceipt(base64Data, mimeType);
 *
 * // Map to public format
 * const publicReceipt = mapReceiptToPublic(dbRow);
 * ```
 */

// Parser
export { ReceiptParser, getReceiptParser } from './parser';

// Storage
export {
  RECEIPTS_BUCKET,
  MAX_FILE_SIZE,
  uploadReceipt,
  downloadReceipt,
  getReceiptAsBase64,
  deleteReceipt,
  getSignedUrl,
  ensureReceiptsBucketExists,
} from './storage';
export type { UploadResult, DownloadResult } from './storage';

// Mappers
export {
  mapReceiptToPublic,
  mapReceiptsToPublic,
  mapReceiptSummaryToPublic,
  mapReceiptItemToPublic,
  mapReceiptItemsToPublic,
  createLinksMap,
  receiptToDbRow,
  receiptItemToDbRow,
} from './mappers';
