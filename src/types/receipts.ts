/**
 * Receipt Types
 *
 * Type definitions for the receipt parsing feature (Phase 2).
 * Receipts are uploaded images that get parsed by AI to extract line items,
 * which can then be converted to sub-transactions.
 *
 * @module types/receipts
 */

import type { UUID } from './dto';

// ============================================================================
// RECEIPT TYPES
// ============================================================================

/**
 * Parsing status for receipts
 */
export type ReceiptParsingStatus =
  | 'pending' // Uploaded, awaiting processing
  | 'processing' // AI is parsing
  | 'completed' // Successfully parsed
  | 'failed' // Parsing error
  | 'manual_review'; // Low confidence, needs human review

/**
 * Supported file types for receipt upload
 */
export type ReceiptFileType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'application/pdf';

/**
 * Receipt database row (matches Supabase schema)
 */
export interface Receipt {
  id: UUID;
  user_id: UUID;
  transaction_id: UUID;

  // File info
  file_path: string;
  file_name: string;
  file_type: ReceiptFileType;
  file_size_bytes: number | null;

  // Parsed metadata
  store_name: string | null;
  store_address: string | null;
  receipt_date: string | null; // ISO date string
  receipt_number: string | null;
  receipt_total: number | null;
  currency: string;

  // Parsing status
  parsing_status: ReceiptParsingStatus;
  parsing_error: string | null;
  confidence: number | null; // 0.0 - 1.0

  // AI metadata
  ai_model_used: string | null;
  raw_ai_response: Record<string, unknown> | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  parsed_at: string | null;

  // Nested items (when loaded with JOIN)
  items?: ReceiptItem[];
}

/**
 * Receipt for public API responses (excludes internal fields)
 */
export interface ReceiptPublic {
  id: UUID;
  transaction_id: UUID;
  file_name: string;
  file_type: ReceiptFileType;
  store_name: string | null;
  store_address: string | null;
  receipt_date: string | null;
  receipt_number: string | null;
  receipt_total: number | null;
  currency: string;
  parsing_status: ReceiptParsingStatus;
  parsing_error: string | null;
  confidence: number | null;
  created_at: string;
  parsed_at: string | null;
  item_count?: number;
  linked_item_count?: number;
  items_total?: number;
}

// ============================================================================
// RECEIPT ITEM TYPES
// ============================================================================

/**
 * Receipt line item database row
 */
export interface ReceiptItem {
  id: UUID;
  receipt_id: UUID;
  user_id: UUID;

  // Item details
  item_name: string;
  item_description: string | null;
  quantity: number;
  unit_price: number | null;
  total_price: number;

  // Classification
  category: string | null;
  is_tax: boolean;
  is_discount: boolean;
  is_tip: boolean;
  is_service_charge: boolean;
  is_excluded: boolean; // User excluded from sub-transaction generation

  // Ordering
  line_number: number;

  // AI metadata
  confidence: number | null;
  raw_text: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Nested link (when loaded with JOIN)
  link?: ReceiptItemLink | null;
}

/**
 * Receipt item for public API responses
 */
export interface ReceiptItemPublic {
  id: UUID;
  receipt_id: UUID;
  item_name: string;
  item_description: string | null;
  quantity: number;
  unit_price: number | null;
  total_price: number;
  category: string | null;
  is_tax: boolean;
  is_discount: boolean;
  is_tip: boolean;
  is_service_charge: boolean;
  is_excluded: boolean;
  line_number: number;
  confidence: number | null;
  linked_sub_transaction_id: UUID | null;
}

// ============================================================================
// RECEIPT ITEM LINK TYPES
// ============================================================================

/**
 * Link method for receipt item to sub-transaction
 */
export type ReceiptItemLinkMethod = 'auto' | 'manual';

/**
 * Receipt item link database row
 */
export interface ReceiptItemLink {
  id: UUID;
  user_id: UUID;
  receipt_item_id: UUID;
  sub_transaction_id: UUID;
  link_method: ReceiptItemLinkMethod;
  created_at: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Upload receipt request (multipart/form-data)
 */
export interface UploadReceiptRequest {
  file: File; // The receipt image file
}

/**
 * Upload receipt response
 */
export interface UploadReceiptResponse {
  receipt: ReceiptPublic;
  upload_url?: string; // Signed URL for direct viewing
}

/**
 * Parse receipt request
 */
export interface ParseReceiptRequest {
  force?: boolean; // Re-parse even if already completed
}

/**
 * Parse receipt response
 */
export interface ParseReceiptResponse {
  receipt: ReceiptPublic;
  items: ReceiptItemPublic[];
  parsing_duration_ms?: number;
}

/**
 * Create sub-transactions from receipt request
 */
export interface CreateSubTransactionsFromReceiptRequest {
  excluded_item_ids?: UUID[]; // Items to skip
  category_overrides?: Record<UUID, string>; // item_id -> category
}

/**
 * Create sub-transactions from receipt response
 */
export interface CreateSubTransactionsFromReceiptResponse {
  sub_transactions_created: number;
  links_created: number;
  skipped_items: number;
}

/**
 * List receipts response
 */
export interface ListReceiptsResponse {
  receipts: ReceiptPublic[];
  count: number;
}

/**
 * Get receipt response (with items)
 */
export interface GetReceiptResponse {
  receipt: ReceiptPublic;
  items: ReceiptItemPublic[];
}

// ============================================================================
// AI PARSING TYPES
// ============================================================================

/**
 * AI-extracted receipt data structure
 * This is what the Vision API returns after parsing
 */
export interface ParsedReceiptData {
  store_name: string | null;
  store_address: string | null;
  receipt_date: string | null; // YYYY-MM-DD format
  receipt_number: string | null;
  receipt_total: number | null;
  currency: string;
  items: ParsedReceiptItem[];
  confidence: number; // Overall parsing confidence
  raw_text?: string; // Full OCR text
}

/**
 * AI-extracted receipt line item
 */
export interface ParsedReceiptItem {
  item_name: string;
  item_description?: string;
  quantity: number;
  unit_price: number | null;
  total_price: number;
  category?: string;
  is_tax?: boolean;
  is_discount?: boolean;
  is_tip?: boolean;
  is_service_charge?: boolean;
  confidence: number;
  raw_text?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Receipt parsing limits and configuration
 */
export const RECEIPT_LIMITS = {
  /** Maximum file size in bytes (10MB) */
  MAX_FILE_SIZE: 10 * 1024 * 1024,

  /** Maximum items per receipt */
  MAX_ITEMS: 100,

  /** Confidence threshold for auto-completion */
  AUTO_COMPLETE_CONFIDENCE: 0.8,

  /** Confidence threshold requiring manual review */
  MANUAL_REVIEW_CONFIDENCE: 0.5,

  /** Supported file extensions */
  SUPPORTED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.pdf'] as const,

  /** MIME types to file extensions mapping */
  MIME_TO_EXT: {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
  } as const,
} as const;

/**
 * Validate if a file type is supported for receipt upload
 */
export function isValidReceiptFileType(
  mimeType: string
): mimeType is ReceiptFileType {
  return ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(
    mimeType
  );
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: ReceiptFileType): string {
  return RECEIPT_LIMITS.MIME_TO_EXT[mimeType] || '.bin';
}
