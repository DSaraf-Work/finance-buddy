/**
 * Receipt Mappers
 *
 * Maps database rows to public API response types.
 *
 * @module lib/receipts/mappers
 */

import type {
  Receipt,
  ReceiptPublic,
  ReceiptItem,
  ReceiptItemPublic,
  ReceiptItemLink,
  ReceiptFileType,
  ReceiptParsingStatus,
} from '@/types/receipts';

// ============================================================================
// RECEIPT MAPPERS
// ============================================================================

/**
 * Map database receipt row to public API response
 */
export function mapReceiptToPublic(
  row: Record<string, any>,
  itemCount?: number,
  linkedItemCount?: number,
  itemsTotal?: number
): ReceiptPublic {
  return {
    id: row.id,
    transaction_id: row.transaction_id,
    file_name: row.file_name,
    file_type: row.file_type as ReceiptFileType,
    store_name: row.store_name,
    store_address: row.store_address,
    receipt_date: row.receipt_date,
    receipt_number: row.receipt_number,
    receipt_total: row.receipt_total !== null ? Number(row.receipt_total) : null,
    currency: row.currency || 'INR',
    parsing_status: row.parsing_status as ReceiptParsingStatus,
    parsing_error: row.parsing_error,
    confidence: row.confidence !== null ? Number(row.confidence) : null,
    created_at: row.created_at,
    parsed_at: row.parsed_at,
    item_count: itemCount,
    linked_item_count: linkedItemCount,
    items_total: itemsTotal,
  };
}

/**
 * Map multiple receipt rows to public API responses
 */
export function mapReceiptsToPublic(rows: Record<string, any>[]): ReceiptPublic[] {
  return rows.map((row) => mapReceiptToPublic(row));
}

/**
 * Map database receipt with summary view data
 */
export function mapReceiptSummaryToPublic(row: Record<string, any>): ReceiptPublic {
  return mapReceiptToPublic(
    row,
    row.item_count !== null ? Number(row.item_count) : undefined,
    row.linked_item_count !== null ? Number(row.linked_item_count) : undefined,
    row.items_total !== null ? Number(row.items_total) : undefined
  );
}

// ============================================================================
// RECEIPT ITEM MAPPERS
// ============================================================================

/**
 * Map database receipt item row to public API response
 */
export function mapReceiptItemToPublic(
  row: Record<string, any>,
  link?: ReceiptItemLink | null
): ReceiptItemPublic {
  return {
    id: row.id,
    receipt_id: row.receipt_id,
    item_name: row.item_name,
    item_description: row.item_description,
    quantity: Number(row.quantity),
    unit_price: row.unit_price !== null ? Number(row.unit_price) : null,
    total_price: Number(row.total_price),
    category: row.category,
    is_tax: Boolean(row.is_tax),
    is_discount: Boolean(row.is_discount),
    is_tip: Boolean(row.is_tip),
    is_service_charge: Boolean(row.is_service_charge),
    is_excluded: Boolean(row.is_excluded),
    line_number: Number(row.line_number),
    confidence: row.confidence !== null ? Number(row.confidence) : null,
    linked_sub_transaction_id: link?.sub_transaction_id ?? null,
  };
}

/**
 * Map multiple receipt item rows to public API responses
 */
export function mapReceiptItemsToPublic(
  rows: Record<string, any>[],
  linksMap?: Map<string, ReceiptItemLink>
): ReceiptItemPublic[] {
  return rows.map((row) => {
    const link = linksMap?.get(row.id);
    return mapReceiptItemToPublic(row, link);
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a map of receipt item ID to link for efficient lookup
 */
export function createLinksMap(
  links: ReceiptItemLink[]
): Map<string, ReceiptItemLink> {
  const map = new Map<string, ReceiptItemLink>();
  for (const link of links) {
    map.set(link.receipt_item_id, link);
  }
  return map;
}

/**
 * Convert Receipt to full database row format
 */
export function receiptToDbRow(receipt: Partial<Receipt>): Record<string, any> {
  const row: Record<string, any> = {};

  if (receipt.id !== undefined) row.id = receipt.id;
  if (receipt.user_id !== undefined) row.user_id = receipt.user_id;
  if (receipt.transaction_id !== undefined) row.transaction_id = receipt.transaction_id;
  if (receipt.file_path !== undefined) row.file_path = receipt.file_path;
  if (receipt.file_name !== undefined) row.file_name = receipt.file_name;
  if (receipt.file_type !== undefined) row.file_type = receipt.file_type;
  if (receipt.file_size_bytes !== undefined) row.file_size_bytes = receipt.file_size_bytes;
  if (receipt.store_name !== undefined) row.store_name = receipt.store_name;
  if (receipt.store_address !== undefined) row.store_address = receipt.store_address;
  if (receipt.receipt_date !== undefined) row.receipt_date = receipt.receipt_date;
  if (receipt.receipt_number !== undefined) row.receipt_number = receipt.receipt_number;
  if (receipt.receipt_total !== undefined) row.receipt_total = receipt.receipt_total;
  if (receipt.currency !== undefined) row.currency = receipt.currency;
  if (receipt.parsing_status !== undefined) row.parsing_status = receipt.parsing_status;
  if (receipt.parsing_error !== undefined) row.parsing_error = receipt.parsing_error;
  if (receipt.confidence !== undefined) row.confidence = receipt.confidence;
  if (receipt.ai_model_used !== undefined) row.ai_model_used = receipt.ai_model_used;
  if (receipt.raw_ai_response !== undefined) row.raw_ai_response = receipt.raw_ai_response;

  return row;
}

/**
 * Convert ReceiptItem to database row format
 */
export function receiptItemToDbRow(item: Partial<ReceiptItem>): Record<string, any> {
  const row: Record<string, any> = {};

  if (item.id !== undefined) row.id = item.id;
  if (item.receipt_id !== undefined) row.receipt_id = item.receipt_id;
  if (item.user_id !== undefined) row.user_id = item.user_id;
  if (item.item_name !== undefined) row.item_name = item.item_name;
  if (item.item_description !== undefined) row.item_description = item.item_description;
  if (item.quantity !== undefined) row.quantity = item.quantity;
  if (item.unit_price !== undefined) row.unit_price = item.unit_price;
  if (item.total_price !== undefined) row.total_price = item.total_price;
  if (item.category !== undefined) row.category = item.category;
  if (item.is_tax !== undefined) row.is_tax = item.is_tax;
  if (item.is_discount !== undefined) row.is_discount = item.is_discount;
  if (item.is_tip !== undefined) row.is_tip = item.is_tip;
  if (item.is_service_charge !== undefined) row.is_service_charge = item.is_service_charge;
  if (item.is_excluded !== undefined) row.is_excluded = item.is_excluded;
  if (item.line_number !== undefined) row.line_number = item.line_number;
  if (item.confidence !== undefined) row.confidence = item.confidence;
  if (item.raw_text !== undefined) row.raw_text = item.raw_text;

  return row;
}
