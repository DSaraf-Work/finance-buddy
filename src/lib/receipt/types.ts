/**
 * Types for OCR receipt parsing feature.
 */

export interface ParsedReceiptItem {
  item_name: string;
  quantity: number;
  unit: string | null;
  unit_price: number | null;
  total_price: number;
  suggested_category: string | null;
  is_tax_line: boolean;
  is_discount_line: boolean;
}

export interface ParsedReceipt {
  store_name: string | null;
  receipt_date: string | null;   // YYYY-MM-DD
  receipt_number: string | null;
  items: ParsedReceiptItem[];
  subtotal: number | null;
  tax_amount: number | null;
  discount_amount: number | null;
  total_amount: number | null;
  currency: string;
  confidence: number;
  raw: Record<string, unknown>;  // Raw model JSON saved to DB for debugging
  mismatch: {
    has_mismatch: boolean;
    difference: number;          // parentAmount - ocrTotal (positive = OCR under)
    others_amount: number | null; // Amount of auto-injected "Others" item
  };
}

export interface ReceiptParseInput {
  fileBuffer: Buffer;
  mimeType: string;              // effective MIME after HEIC→JPEG conversion
  parentAmount: number | null;
}
