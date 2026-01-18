/**
 * Refund Mappers
 *
 * Maps database rows to public API types for refund links.
 *
 * @module lib/refunds/mappers
 */

import type {
  RefundLink,
  RefundLinkPublic,
  RefundStatus,
  RefundLinkAggregate,
} from '@/types/refunds';

// ============================================================================
// REFUND LINK MAPPERS
// ============================================================================

/**
 * Map a database refund link row to public API type
 */
export function mapRefundLinkToPublic(link: RefundLink): RefundLinkPublic {
  return {
    id: link.id,
    refund_transaction_id: link.refund_transaction_id,
    original_transaction_id: link.original_transaction_id,
    original_sub_transaction_id: link.original_sub_transaction_id,
    allocated_amount: link.allocated_amount,
    refund_type: link.refund_type,
    match_confidence_score: link.match_confidence_score,
    match_method: link.match_method,
    match_reasons: link.match_reasons,
    created_at: link.created_at,
  };
}

/**
 * Map multiple refund links to public types
 */
export function mapRefundLinksToPublic(links: RefundLink[]): RefundLinkPublic[] {
  return links.map(mapRefundLinkToPublic);
}

// ============================================================================
// REFUND STATUS HELPERS
// ============================================================================

/**
 * Build a RefundStatus object from aggregate data and original amount
 */
export function buildRefundStatus(
  aggregate: RefundLinkAggregate | null,
  originalAmount: number,
  links?: RefundLinkPublic[]
): RefundStatus {
  const totalRefunded = aggregate?.total_refunded ?? 0;
  const refundCount = aggregate?.refund_count ?? 0;

  return {
    total_refunded: totalRefunded,
    refund_count: refundCount,
    original_amount: originalAmount,
    remaining_amount: Math.max(0, originalAmount - totalRefunded),
    is_fully_refunded: totalRefunded >= originalAmount,
    refund_links: links,
  };
}

/**
 * Build an empty refund status (no refunds yet)
 */
export function buildEmptyRefundStatus(originalAmount: number): RefundStatus {
  return {
    total_refunded: 0,
    refund_count: 0,
    original_amount: originalAmount,
    remaining_amount: originalAmount,
    is_fully_refunded: false,
    refund_links: [],
  };
}

// ============================================================================
// AGGREGATE HELPERS
// ============================================================================

/**
 * Create a map of original IDs to their refund aggregates
 * Useful for batch loading refund status
 */
export function createRefundAggregateMap(
  aggregates: RefundLinkAggregate[]
): Map<string, RefundLinkAggregate> {
  const map = new Map<string, RefundLinkAggregate>();

  for (const agg of aggregates) {
    map.set(agg.original_id, agg);
  }

  return map;
}

/**
 * Get aggregate for a transaction or sub-transaction
 */
export function getAggregateFromMap(
  map: Map<string, RefundLinkAggregate>,
  transactionId: string | null,
  subTransactionId: string | null
): RefundLinkAggregate | null {
  if (transactionId) {
    return map.get(transactionId) ?? null;
  }
  if (subTransactionId) {
    return map.get(subTransactionId) ?? null;
  }
  return null;
}
