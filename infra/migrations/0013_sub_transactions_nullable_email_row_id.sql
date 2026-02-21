-- Migration 0013: Allow sub-transactions on manual transactions
--
-- Problem: fb_sub_transactions.email_row_id was NOT NULL, but manual
-- transactions (is_manual=true) have email_row_id=NULL. This caused the
-- create_sub_transactions RPC to fail with a NOT NULL constraint violation.
--
-- Also: the validate_sub_transaction trigger used `!=` to compare email_row_id,
-- which doesn't work for NULL values — NULL != NULL evaluates to NULL, not TRUE.
-- Fixed to use IS DISTINCT FROM so manual txns (both sides NULL) pass correctly.

-- ============================================================================
-- 1. Make email_row_id nullable on fb_sub_transactions
-- ============================================================================

ALTER TABLE fb_sub_transactions
  ALTER COLUMN email_row_id DROP NOT NULL;

-- ============================================================================
-- 2. Fix validate_sub_transaction trigger:
--    Replace `!=` comparison for email_row_id with IS DISTINCT FROM
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_sub_transaction()
RETURNS TRIGGER AS $$
DECLARE
  parent_record RECORD;
  total_sub_amount NUMERIC(18,2);
BEGIN
  -- Get parent transaction
  SELECT user_id, email_row_id, currency, direction, amount, txn_time
  INTO parent_record
  FROM fb_emails_processed
  WHERE id = NEW.parent_transaction_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parent transaction not found: %', NEW.parent_transaction_id;
  END IF;

  -- On UPDATE: Prevent changing parent_transaction_id (immutable)
  IF TG_OP = 'UPDATE' AND OLD.parent_transaction_id != NEW.parent_transaction_id THEN
    RAISE EXCEPTION 'Cannot change parent_transaction_id after creation';
  END IF;

  -- Validate inherited fields match parent
  IF NEW.user_id != parent_record.user_id THEN
    RAISE EXCEPTION 'user_id must match parent transaction';
  END IF;

  -- Use IS DISTINCT FROM so NULL == NULL passes (manual transactions have email_row_id=NULL)
  IF NEW.email_row_id IS DISTINCT FROM parent_record.email_row_id THEN
    RAISE EXCEPTION 'email_row_id must match parent transaction';
  END IF;

  IF NEW.currency != parent_record.currency THEN
    RAISE EXCEPTION 'currency must match parent transaction';
  END IF;

  IF NEW.direction != parent_record.direction THEN
    RAISE EXCEPTION 'direction must match parent transaction';
  END IF;

  -- Calculate total amount of all sub-transactions (excluding current for UPDATE)
  IF TG_OP = 'INSERT' THEN
    SELECT COALESCE(SUM(amount), 0) INTO total_sub_amount
    FROM fb_sub_transactions
    WHERE parent_transaction_id = NEW.parent_transaction_id;
  ELSE
    SELECT COALESCE(SUM(amount), 0) INTO total_sub_amount
    FROM fb_sub_transactions
    WHERE parent_transaction_id = NEW.parent_transaction_id
    AND id != NEW.id;
  END IF;

  -- Add current sub-transaction amount
  total_sub_amount := total_sub_amount + NEW.amount;

  -- Validate total doesn't exceed parent (allow partial splits)
  IF parent_record.amount IS NOT NULL AND total_sub_amount > parent_record.amount THEN
    RAISE EXCEPTION 'Total sub-transaction amount (%) exceeds parent amount (%)',
      total_sub_amount, parent_record.amount;
  END IF;

  -- Auto-inherit txn_time from parent if not set
  IF NEW.txn_time IS NULL THEN
    NEW.txn_time := parent_record.txn_time;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
