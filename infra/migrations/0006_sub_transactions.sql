-- Migration: 0006_sub_transactions.sql
-- Purpose: Create fb_sub_transactions table for splitting parent transactions into line items
-- Author: Claude Code
-- Date: 2026-01-18
-- IDEMPOTENT: Yes - safe to re-run

-- ============================================================================
-- REUSABLE TIMESTAMP TRIGGER FUNCTION (DRY - use for all new tables)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MAIN TABLE: fb_sub_transactions
-- ============================================================================

CREATE TABLE IF NOT EXISTS fb_sub_transactions (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_transaction_id UUID NOT NULL REFERENCES fb_emails_processed(id) ON DELETE CASCADE,

  -- Ownership & Email linkage (denormalized for RLS and query performance)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_row_id UUID NOT NULL REFERENCES fb_emails_fetched(id) ON DELETE CASCADE,

  -- Denormalized from parent (consistency enforced via trigger)
  currency TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('debit', 'credit')),
  txn_time TIMESTAMPTZ,

  -- Sub-transaction specific data
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  category TEXT,
  merchant_name TEXT,
  user_notes TEXT,

  -- Ordering within parent
  sub_transaction_order INTEGER NOT NULL DEFAULT 0,

  -- Splitwise integration (inherited from parent, cascaded on update)
  splitwise_expense_id TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique ordering within parent
  CONSTRAINT unique_parent_order UNIQUE (parent_transaction_id, sub_transaction_order)
);

-- ============================================================================
-- INDEXES (Performance Critical) - Idempotent with DROP IF EXISTS
-- ============================================================================

-- Most common: Get all children of a parent
DROP INDEX IF EXISTS idx_sub_transactions_parent;
CREATE INDEX idx_sub_transactions_parent ON fb_sub_transactions(parent_transaction_id);

-- Dashboard aggregations: User's sub-transactions by time
DROP INDEX IF EXISTS idx_sub_transactions_user_time;
CREATE INDEX idx_sub_transactions_user_time ON fb_sub_transactions(user_id, txn_time DESC);

-- Category analytics
DROP INDEX IF EXISTS idx_sub_transactions_category;
CREATE INDEX idx_sub_transactions_category ON fb_sub_transactions(user_id, category) WHERE category IS NOT NULL;

-- Splitwise queries
DROP INDEX IF EXISTS idx_sub_transactions_splitwise;
CREATE INDEX idx_sub_transactions_splitwise ON fb_sub_transactions(splitwise_expense_id) WHERE splitwise_expense_id IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY - Idempotent
-- ============================================================================

ALTER TABLE fb_sub_transactions ENABLE ROW LEVEL SECURITY;

-- Standard user-scoped policy (same pattern as all other tables)
DROP POLICY IF EXISTS "Users can only access own sub-transactions" ON fb_sub_transactions;
CREATE POLICY "Users can only access own sub-transactions"
  ON fb_sub_transactions
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- TRIGGER 1: validate_sub_transaction
-- Enforces:
--   - Inherited fields match parent (user_id, email_row_id, currency, direction)
--   - Total amount of all sub-transactions <= parent amount
--   - parent_transaction_id cannot be changed after creation (immutable)
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

  IF NEW.email_row_id != parent_record.email_row_id THEN
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

DROP TRIGGER IF EXISTS validate_sub_transaction_trigger ON fb_sub_transactions;
CREATE TRIGGER validate_sub_transaction_trigger
  BEFORE INSERT OR UPDATE ON fb_sub_transactions
  FOR EACH ROW EXECUTE FUNCTION validate_sub_transaction();

-- ============================================================================
-- TRIGGER 2: inherit_splitwise_on_insert
-- On INSERT: Auto-inherit splitwise_expense_id from parent if parent has one
-- ============================================================================

CREATE OR REPLACE FUNCTION inherit_splitwise_on_insert()
RETURNS TRIGGER AS $$
DECLARE
  parent_splitwise TEXT;
BEGIN
  -- Only inherit if not explicitly set
  IF NEW.splitwise_expense_id IS NULL THEN
    SELECT splitwise_expense_id INTO parent_splitwise
    FROM fb_emails_processed
    WHERE id = NEW.parent_transaction_id;

    IF parent_splitwise IS NOT NULL THEN
      NEW.splitwise_expense_id := parent_splitwise;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inherit_splitwise_on_insert_trigger ON fb_sub_transactions;
CREATE TRIGGER inherit_splitwise_on_insert_trigger
  BEFORE INSERT ON fb_sub_transactions
  FOR EACH ROW EXECUTE FUNCTION inherit_splitwise_on_insert();

-- ============================================================================
-- TRIGGER 3: cascade_splitwise_on_parent_update
-- On parent UPDATE: Cascade splitwise_expense_id changes to all children
-- Note: This trigger is on fb_emails_processed, not fb_sub_transactions
-- ============================================================================

CREATE OR REPLACE FUNCTION cascade_splitwise_to_children()
RETURNS TRIGGER AS $$
BEGIN
  -- Only cascade if splitwise_expense_id changed
  IF OLD.splitwise_expense_id IS DISTINCT FROM NEW.splitwise_expense_id THEN
    UPDATE fb_sub_transactions
    SET splitwise_expense_id = NEW.splitwise_expense_id
    WHERE parent_transaction_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cascade_splitwise_to_children_trigger ON fb_emails_processed;
CREATE TRIGGER cascade_splitwise_to_children_trigger
  AFTER UPDATE ON fb_emails_processed
  FOR EACH ROW EXECUTE FUNCTION cascade_splitwise_to_children();

-- ============================================================================
-- TRIGGER 4: enforce_max_sub_transaction_count
-- Prevents more than 20 sub-transactions per parent
-- ============================================================================

CREATE OR REPLACE FUNCTION enforce_max_sub_transaction_count()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_count CONSTANT INTEGER := 20;
BEGIN
  SELECT COUNT(*) INTO current_count
  FROM fb_sub_transactions
  WHERE parent_transaction_id = NEW.parent_transaction_id;

  IF current_count >= max_count THEN
    RAISE EXCEPTION 'Maximum of % sub-transactions per parent exceeded', max_count;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_max_sub_transaction_count_trigger ON fb_sub_transactions;
CREATE TRIGGER enforce_max_sub_transaction_count_trigger
  BEFORE INSERT ON fb_sub_transactions
  FOR EACH ROW EXECUTE FUNCTION enforce_max_sub_transaction_count();

-- ============================================================================
-- TRIGGER 5: update_timestamp
-- Auto-update updated_at on any modification
-- ============================================================================

DROP TRIGGER IF EXISTS update_fb_sub_transactions_timestamp ON fb_sub_transactions;
CREATE TRIGGER update_fb_sub_transactions_timestamp
  BEFORE UPDATE ON fb_sub_transactions
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Atomic bulk insert with SELECT FOR UPDATE to prevent race conditions
CREATE OR REPLACE FUNCTION create_sub_transactions(
  p_parent_id UUID,
  p_items JSONB
)
RETURNS SETOF fb_sub_transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  parent_record RECORD;
  item JSONB;
  item_order INTEGER := 0;
BEGIN
  -- Lock parent row to prevent race conditions
  SELECT * INTO parent_record
  FROM fb_emails_processed
  WHERE id = p_parent_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parent transaction not found: %', p_parent_id;
  END IF;

  -- Insert each item
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    RETURN QUERY
    INSERT INTO fb_sub_transactions (
      parent_transaction_id,
      user_id,
      email_row_id,
      currency,
      direction,
      txn_time,
      amount,
      category,
      merchant_name,
      user_notes,
      sub_transaction_order
    ) VALUES (
      p_parent_id,
      parent_record.user_id,
      parent_record.email_row_id,
      parent_record.currency,
      parent_record.direction,
      parent_record.txn_time,
      (item->>'amount')::NUMERIC(18,2),
      item->>'category',
      item->>'merchant_name',
      item->>'user_notes',
      item_order
    )
    RETURNING *;

    item_order := item_order + 1;
  END LOOP;
END;
$$;

-- Validate if sum of sub-transactions equals parent amount
CREATE OR REPLACE FUNCTION validate_sub_transaction_sum(p_parent_id UUID)
RETURNS TABLE (
  is_valid BOOLEAN,
  parent_amount NUMERIC(18,2),
  sub_total NUMERIC(18,2),
  difference NUMERIC(18,2),
  sub_count INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  p_amount NUMERIC(18,2);
  s_total NUMERIC(18,2);
  s_count INTEGER;
BEGIN
  -- Get parent amount
  SELECT amount INTO p_amount
  FROM fb_emails_processed
  WHERE id = p_parent_id;

  -- Get sub-transaction totals
  SELECT COALESCE(SUM(amount), 0), COUNT(*) INTO s_total, s_count
  FROM fb_sub_transactions
  WHERE parent_transaction_id = p_parent_id;

  RETURN QUERY
  SELECT
    ABS(COALESCE(p_amount, 0) - s_total) < 0.01 AS is_valid,
    p_amount AS parent_amount,
    s_total AS sub_total,
    COALESCE(p_amount, 0) - s_total AS difference,
    s_count AS sub_count;
END;
$$;

-- Delete all sub-transactions for a parent
CREATE OR REPLACE FUNCTION delete_all_sub_transactions(
  p_parent_id UUID,
  p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM fb_sub_transactions
  WHERE parent_transaction_id = p_parent_id
  AND user_id = p_user_id;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE fb_sub_transactions IS 'Sub-transactions (line items) of parent transactions. Supports splitting a single transaction into categorized items.';
COMMENT ON COLUMN fb_sub_transactions.parent_transaction_id IS 'FK to fb_emails_processed - the parent transaction being split';
COMMENT ON COLUMN fb_sub_transactions.sub_transaction_order IS 'Ordering of sub-transactions within parent (0-indexed)';
COMMENT ON COLUMN fb_sub_transactions.splitwise_expense_id IS 'Inherited from parent on INSERT, cascaded on parent UPDATE';
COMMENT ON FUNCTION create_sub_transactions IS 'Atomic bulk insert with race condition prevention via SELECT FOR UPDATE';
COMMENT ON FUNCTION validate_sub_transaction_sum IS 'Check if sum of sub-transactions matches parent amount (within 0.01 tolerance)';
