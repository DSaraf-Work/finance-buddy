-- Migration: 0007_sub_transaction_status.sql
-- Purpose: Enable sub-transactions to appear as independent transactions
-- Author: Claude Code
-- Date: 2026-01-18
-- IDEMPOTENT: Yes - safe to re-run

-- ============================================================================
-- PART 1: Extend parent transaction schema
-- ============================================================================

-- 1.1 Add column to store status before split (for restoration)
ALTER TABLE fb_emails_processed
ADD COLUMN IF NOT EXISTS status_before_split TEXT;

-- 1.2 Extend status CHECK constraint to include 'split'
-- First drop the existing constraint (may have different name)
DO $$
BEGIN
  -- Try to drop constraint if it exists
  ALTER TABLE fb_emails_processed DROP CONSTRAINT IF EXISTS fb_emails_processed_status_check;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignore if doesn't exist
END $$;

ALTER TABLE fb_emails_processed
ADD CONSTRAINT fb_emails_processed_status_check
CHECK (status IN ('REVIEW', 'APPROVED', 'INVALID', 'REJECTED', 'split'));

-- ============================================================================
-- PART 2: Add status to sub-transactions (for independent workflow)
-- ============================================================================

-- 2.1 Add status column to sub-transactions (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fb_sub_transactions' AND column_name = 'status'
  ) THEN
    ALTER TABLE fb_sub_transactions
    ADD COLUMN status TEXT DEFAULT 'REVIEW';

    -- Add check constraint separately
    ALTER TABLE fb_sub_transactions
    ADD CONSTRAINT fb_sub_transactions_status_check
    CHECK (status IN ('REVIEW', 'APPROVED', 'INVALID', 'REJECTED'));
  END IF;
END $$;

-- ============================================================================
-- PART 3: Create unified view for mixed transaction list
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
  'parent'::TEXT AS record_type,  -- Discriminator: parent vs sub (renamed to avoid collision with transaction_type Dr/Cr)
  NULL::UUID AS parent_transaction_id,
  created_at,
  updated_at,
  splitwise_expense_id,
  user_notes,
  transaction_type,  -- Original Dr/Cr field preserved
  -- Parent-specific fields (not on sub-txns)
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

-- Sub-transactions (inheriting parent metadata)
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
  'sub'::TEXT AS record_type,  -- Discriminator: parent vs sub
  s.parent_transaction_id,
  s.created_at,
  s.updated_at,
  s.splitwise_expense_id,
  s.user_notes,
  p.transaction_type,  -- Inherit parent's Dr/Cr field
  -- Inherit parent-specific fields
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

-- 3.1 Grant permissions to Supabase roles
-- service_role needs SELECT for admin client queries
GRANT SELECT ON v_all_transactions TO service_role;
GRANT SELECT ON v_all_transactions TO authenticated;
GRANT SELECT ON v_all_transactions TO anon;

-- ============================================================================
-- PART 4: Triggers for automatic status management
-- ============================================================================

-- 4.1 Set parent to 'split' when first sub-transaction created
CREATE OR REPLACE FUNCTION set_parent_split_on_sub_insert()
RETURNS TRIGGER AS $$
DECLARE
  parent_current_status TEXT;
BEGIN
  -- Get current parent status
  SELECT status INTO parent_current_status
  FROM fb_emails_processed
  WHERE id = NEW.parent_transaction_id;

  -- Only update if parent is not already split
  IF parent_current_status IS NOT NULL AND parent_current_status != 'split' THEN
    UPDATE fb_emails_processed
    SET
      status_before_split = parent_current_status,
      status = 'split'
    WHERE id = NEW.parent_transaction_id;

    -- Inherit parent's previous status to new sub-transaction
    IF NEW.status IS NULL OR NEW.status = 'REVIEW' THEN
      NEW.status := parent_current_status;
    END IF;
  ELSIF parent_current_status = 'split' THEN
    -- Parent already split, inherit its original status for consistency
    IF NEW.status IS NULL OR NEW.status = 'REVIEW' THEN
      SELECT COALESCE(status_before_split, 'REVIEW') INTO NEW.status
      FROM fb_emails_processed
      WHERE id = NEW.parent_transaction_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_parent_split_trigger ON fb_sub_transactions;
CREATE TRIGGER set_parent_split_trigger
  BEFORE INSERT ON fb_sub_transactions
  FOR EACH ROW EXECUTE FUNCTION set_parent_split_on_sub_insert();

-- 4.2 Restore parent when ALL sub-transactions deleted
CREATE OR REPLACE FUNCTION restore_parent_on_all_subs_deleted()
RETURNS TRIGGER AS $$
DECLARE
  remaining_count INTEGER;
  original_status TEXT;
BEGIN
  -- Count remaining sub-transactions for this parent
  SELECT COUNT(*) INTO remaining_count
  FROM fb_sub_transactions
  WHERE parent_transaction_id = OLD.parent_transaction_id;

  -- If this was the last one, restore parent
  IF remaining_count = 0 THEN
    -- Get the original status
    SELECT status_before_split INTO original_status
    FROM fb_emails_processed
    WHERE id = OLD.parent_transaction_id;

    UPDATE fb_emails_processed
    SET
      status = COALESCE(original_status, 'REVIEW'),
      status_before_split = NULL
    WHERE id = OLD.parent_transaction_id
    AND status = 'split';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS restore_parent_trigger ON fb_sub_transactions;
CREATE TRIGGER restore_parent_trigger
  AFTER DELETE ON fb_sub_transactions
  FOR EACH ROW EXECUTE FUNCTION restore_parent_on_all_subs_deleted();

-- ============================================================================
-- PART 5: Helper functions
-- ============================================================================

-- Count sub-transactions for a parent
CREATE OR REPLACE FUNCTION get_sub_transaction_count(p_parent_id UUID)
RETURNS INTEGER
LANGUAGE SQL STABLE AS $$
  SELECT COUNT(*)::INTEGER
  FROM fb_sub_transactions
  WHERE parent_transaction_id = p_parent_id;
$$;

-- Get sibling sub-transactions (for cascade delete modal)
CREATE OR REPLACE FUNCTION get_sibling_sub_transactions(p_sub_id UUID)
RETURNS TABLE (
  id UUID,
  parent_id UUID,
  amount NUMERIC(18,2),
  merchant_name TEXT,
  category TEXT
)
LANGUAGE SQL STABLE AS $$
  SELECT
    s.id,
    s.parent_transaction_id AS parent_id,
    s.amount,
    s.merchant_name,
    s.category
  FROM fb_sub_transactions s
  WHERE s.parent_transaction_id = (
    SELECT parent_transaction_id
    FROM fb_sub_transactions
    WHERE id = p_sub_id
  )
  ORDER BY s.sub_transaction_order;
$$;

-- ============================================================================
-- PART 6: Documentation
-- ============================================================================

COMMENT ON VIEW v_all_transactions IS
  'Unified view of all transactions: regular parents (non-split) + sub-transactions. Use this for transaction list APIs.';

COMMENT ON COLUMN fb_emails_processed.status_before_split IS
  'Stores original status before splitting. Restored when all sub-transactions deleted.';

COMMENT ON COLUMN fb_sub_transactions.status IS
  'Individual workflow status for sub-transaction. Independent of parent.';

COMMENT ON FUNCTION set_parent_split_on_sub_insert() IS
  'Trigger function: Sets parent status to split when first sub-transaction is created. Preserves original status.';

COMMENT ON FUNCTION restore_parent_on_all_subs_deleted() IS
  'Trigger function: Restores parent to original status when all sub-transactions are deleted.';

COMMENT ON FUNCTION get_sibling_sub_transactions(UUID) IS
  'Returns all sibling sub-transactions for a given sub-transaction ID. Used for cascade delete confirmation modal.';
