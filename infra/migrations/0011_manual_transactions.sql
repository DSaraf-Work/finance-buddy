-- Migration: 0011_manual_transactions.sql
-- Purpose: Support manually created transactions (no source email).
--          1. Make email_row_id nullable (was NOT NULL FK to fb_emails_fetched)
--          2. Add is_manual BOOLEAN flag to distinguish user-created entries
--          3. Recreate v_all_transactions view to expose is_manual to the search API
--
-- Author: Claude Code
-- Date: 2026-02-21
-- IDEMPOTENT: Yes - safe to re-run

-- ============================================================================
-- 1. Make email_row_id nullable
-- ============================================================================
-- Manual transactions have no source email, so the FK must allow NULL.
-- PostgreSQL nullable FKs: NULL values bypass FK constraint checks (safe).
ALTER TABLE fb_emails_processed
  ALTER COLUMN email_row_id DROP NOT NULL;

-- ============================================================================
-- 2. Add is_manual flag
-- ============================================================================
ALTER TABLE fb_emails_processed
  ADD COLUMN IF NOT EXISTS is_manual BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN fb_emails_processed.is_manual IS
  'TRUE for manually created transactions (no source email). '
  'Only is_manual=TRUE rows may be deleted via the UI. '
  'email_row_id is NULL for these rows.';

-- ============================================================================
-- 3. Recreate v_all_transactions view with is_manual column
-- ============================================================================
-- Must DROP and recreate because the view lists columns explicitly.

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
  ai_notes,
  is_manual
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
  p.ai_notes,
  p.is_manual
FROM fb_emails_processed p
JOIN fb_sub_transactions s ON s.parent_transaction_id = p.id
WHERE p.status = 'split'
GROUP BY
  p.id, p.user_id, p.email_row_id, p.txn_time, p.amount, p.currency, p.direction,
  p.merchant_name, p.category, p.status, p.created_at, p.updated_at, p.splitwise_expense_id,
  p.user_notes, p.transaction_type, p.google_user_id, p.connection_id, p.merchant_normalized,
  p.account_hint, p.reference_id, p.location, p.confidence, p.extraction_version,
  p.account_type, p.ai_notes, p.is_manual

UNION ALL

-- Sub-transactions (inherit parent's is_manual)
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
  p.ai_notes,
  p.is_manual
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
   Split parents include sub_transaction_count for badge display.
   Non-split parents and sub-transactions have sub_transaction_count = 0.
   is_manual=TRUE for user-created transactions (email_row_id is NULL for these).
   Use record_type filter: parent=show in list, sub=sub-transaction detail.';
