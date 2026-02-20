-- Migration: 0009_split_parents_in_list.sql
-- Purpose: Show split parent transactions in the transaction list with a sub_transaction_count badge.
--          Previously, split parents (status='split') were excluded from v_all_transactions,
--          causing transactions to disappear entirely after splitting.
--          This migration recreates the view to include split parents with their sub_transaction_count.
--
-- Author: Claude Code
-- Date: 2026-02-20
-- IDEMPOTENT: Yes - safe to re-run

-- ============================================================================
-- Recreate unified view to include split parents with sub_transaction_count
-- ============================================================================

DROP VIEW IF EXISTS v_all_transactions;

CREATE VIEW v_all_transactions AS

-- Regular (non-split) parent transactions
SELECT
  id,
  user_id,
  email_row_id,
  txn_time,
  amount,
  currency,
  direction,
  merchant_name,
  category,
  status,
  'parent'::TEXT AS record_type,
  NULL::UUID AS parent_transaction_id,
  0::INTEGER AS sub_transaction_count,
  created_at,
  updated_at,
  splitwise_expense_id,
  user_notes,
  transaction_type,
  google_user_id,
  connection_id,
  merchant_normalized,
  account_hint,
  reference_id,
  location,
  confidence,
  extraction_version,
  account_type,
  ai_notes
FROM fb_emails_processed
WHERE status != 'split'

UNION ALL

-- Split parent transactions (re-included with sub_transaction_count for badge display)
SELECT
  p.id,
  p.user_id,
  p.email_row_id,
  p.txn_time,
  p.amount,
  p.currency,
  p.direction,
  p.merchant_name,
  p.category,
  p.status,
  'parent'::TEXT AS record_type,
  NULL::UUID AS parent_transaction_id,
  COUNT(s.id)::INTEGER AS sub_transaction_count,
  p.created_at,
  p.updated_at,
  p.splitwise_expense_id,
  p.user_notes,
  p.transaction_type,
  p.google_user_id,
  p.connection_id,
  p.merchant_normalized,
  p.account_hint,
  p.reference_id,
  p.location,
  p.confidence,
  p.extraction_version,
  p.account_type,
  p.ai_notes
FROM fb_emails_processed p
JOIN fb_sub_transactions s ON s.parent_transaction_id = p.id
WHERE p.status = 'split'
GROUP BY
  p.id, p.user_id, p.email_row_id, p.txn_time, p.amount, p.currency, p.direction,
  p.merchant_name, p.category, p.status, p.created_at, p.updated_at, p.splitwise_expense_id,
  p.user_notes, p.transaction_type, p.google_user_id, p.connection_id, p.merchant_normalized,
  p.account_hint, p.reference_id, p.location, p.confidence, p.extraction_version,
  p.account_type, p.ai_notes

UNION ALL

-- Sub-transactions (available via API with record_type='sub' filter, excluded from main list)
SELECT
  s.id,
  s.user_id,
  s.email_row_id,
  s.txn_time,
  s.amount,
  s.currency,
  s.direction,
  COALESCE(s.merchant_name, p.merchant_name) AS merchant_name,
  COALESCE(s.category, p.category) AS category,
  s.status,
  'sub'::TEXT AS record_type,
  s.parent_transaction_id,
  0::INTEGER AS sub_transaction_count,
  s.created_at,
  s.updated_at,
  s.splitwise_expense_id,
  s.user_notes,
  p.transaction_type,
  p.google_user_id,
  p.connection_id,
  p.merchant_normalized,
  p.account_hint,
  p.reference_id,
  p.location,
  p.confidence,
  p.extraction_version,
  p.account_type,
  p.ai_notes
FROM fb_sub_transactions s
JOIN fb_emails_processed p ON s.parent_transaction_id = p.id;

-- Re-grant permissions (required after DROP VIEW)
GRANT SELECT ON v_all_transactions TO service_role;
GRANT SELECT ON v_all_transactions TO authenticated;
GRANT SELECT ON v_all_transactions TO anon;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON VIEW v_all_transactions IS
  'Unified view of all transactions: all parents (including split) + sub-transactions.
   Split parents include sub_transaction_count for badge display in the transaction list.
   Non-split parents and sub-transactions have sub_transaction_count = 0.
   Use record_type filter: parent=show in list, sub=sub-transaction detail.';
