/**
 * Sub-Transaction Mappers
 *
 * Mapping functions for transforming database rows to API responses.
 *
 * @module sub-transactions/mappers
 */

import type { SubTransactionPublic } from '@/types/sub-transactions';

/**
 * Map database row to public interface (excludes user_id for security)
 */
export function mapSubTransactionToPublic(row: {
  id: string;
  parent_transaction_id: string;
  email_row_id: string;
  currency: string;
  direction: string;
  txn_time: string | null;
  amount: number | string;
  category: string | null;
  merchant_name: string | null;
  user_notes: string | null;
  sub_transaction_order?: number | null;
  splitwise_expense_id: string | null;
  created_at: string;
  updated_at: string;
}): SubTransactionPublic {
  return {
    id: row.id,
    parent_transaction_id: row.parent_transaction_id,
    email_row_id: row.email_row_id,
    currency: row.currency,
    direction: row.direction as 'debit' | 'credit',
    txn_time: row.txn_time,
    amount: Number(row.amount),
    category: row.category,
    merchant_name: row.merchant_name,
    user_notes: row.user_notes,
    sub_transaction_order: row.sub_transaction_order ?? 0,
    splitwise_expense_id: row.splitwise_expense_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Map array of database rows to public interface
 */
export function mapSubTransactionsToPublic(
  rows: Parameters<typeof mapSubTransactionToPublic>[0][]
): SubTransactionPublic[] {
  return rows.map(mapSubTransactionToPublic);
}
