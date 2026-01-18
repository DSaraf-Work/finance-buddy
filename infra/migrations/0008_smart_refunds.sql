-- ============================================================================
-- Migration: 0008_smart_refunds.sql
-- Description: Smart refund linking system for Phase 3
-- Date: 2025-01-18
-- IDEMPOTENT: Yes - safe to re-run
--
-- Creates:
--   - fb_refund_links: M:N link table for refund relationships
--   - fb_refund_link_aggregates: Pre-computed view for refund status
--
-- Architecture:
--   - Supports one debit → multiple partial refunds
--   - Supports one combined refund → multiple original debits
--   - XOR constraint: link to either transaction OR sub-transaction, not both
--   - allocated_amount tracks partial refund amounts
--   - Scoring metadata for AI matching audit trail
-- ============================================================================

-- ============================================================================
-- TABLE: fb_refund_links
-- Links refund transactions to their original purchases
-- ============================================================================

CREATE TABLE IF NOT EXISTS fb_refund_links (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- The refund transaction (credit in fb_emails_processed)
  -- NOT UNIQUE: One refund can link to multiple originals (combined refund)
  refund_transaction_id UUID NOT NULL REFERENCES fb_emails_processed(id) ON DELETE CASCADE,

  -- The original purchase (debit) - exactly ONE of these must be set
  -- NOT UNIQUE: One original can have multiple refunds (partial refunds)
  original_transaction_id UUID REFERENCES fb_emails_processed(id) ON DELETE CASCADE,
  original_sub_transaction_id UUID REFERENCES fb_sub_transactions(id) ON DELETE CASCADE,

  -- Amount ALLOCATED in THIS specific link (enables partial matching)
  -- For full refunds: allocated_amount = original amount
  -- For partial refunds: allocated_amount < original amount
  allocated_amount NUMERIC(18,2) NOT NULL CHECK (allocated_amount > 0),

  -- Refund classification
  refund_type TEXT NOT NULL CHECK (refund_type IN ('full', 'partial', 'combined'))
    DEFAULT 'full',

  -- Scoring metadata (audit trail for matching algorithm)
  match_confidence_score INTEGER CHECK (match_confidence_score BETWEEN 0 AND 100),
  match_method TEXT NOT NULL CHECK (match_method IN ('manual', 'ai_suggestion', 'auto_detected'))
    DEFAULT 'manual',
  match_reasons JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate links (same refund linking to same original twice)
  -- But ALLOW: same refund → different originals (combined refund)
  -- And ALLOW: different refunds → same original (partial refunds)
  UNIQUE(refund_transaction_id, original_transaction_id),
  UNIQUE(refund_transaction_id, original_sub_transaction_id),

  -- Exactly one original must be set (XOR constraint)
  CONSTRAINT exactly_one_original CHECK (
    (original_transaction_id IS NOT NULL AND original_sub_transaction_id IS NULL) OR
    (original_transaction_id IS NULL AND original_sub_transaction_id IS NOT NULL)
  )
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE fb_refund_links IS 'Links refund transactions to original purchases (M:N relationship)';
COMMENT ON COLUMN fb_refund_links.refund_transaction_id IS 'The credit transaction representing the refund';
COMMENT ON COLUMN fb_refund_links.original_transaction_id IS 'The original debit transaction (if refunding whole transaction)';
COMMENT ON COLUMN fb_refund_links.original_sub_transaction_id IS 'The original sub-transaction (if refunding a line item)';
COMMENT ON COLUMN fb_refund_links.allocated_amount IS 'Amount from this refund allocated to this original';
COMMENT ON COLUMN fb_refund_links.refund_type IS 'full=100% refund, partial=<100%, combined=multiple originals';
COMMENT ON COLUMN fb_refund_links.match_confidence_score IS 'AI confidence 0-100 for suggested matches';
COMMENT ON COLUMN fb_refund_links.match_method IS 'How the link was created: manual, ai_suggestion, or auto_detected';
COMMENT ON COLUMN fb_refund_links.match_reasons IS 'JSON array of reasons why this match was suggested';

-- ============================================================================
-- INDEXES (Idempotent with DROP IF EXISTS)
-- ============================================================================

-- User-scoped queries
DROP INDEX IF EXISTS idx_refund_links_user;
CREATE INDEX idx_refund_links_user ON fb_refund_links(user_id);

-- Find all refunds for a transaction
DROP INDEX IF EXISTS idx_refund_links_refund_txn;
CREATE INDEX idx_refund_links_refund_txn ON fb_refund_links(refund_transaction_id);

-- Find all refund links for an original transaction
DROP INDEX IF EXISTS idx_refund_links_original_txn;
CREATE INDEX idx_refund_links_original_txn ON fb_refund_links(original_transaction_id)
  WHERE original_transaction_id IS NOT NULL;

-- Find all refund links for an original sub-transaction
DROP INDEX IF EXISTS idx_refund_links_original_sub;
CREATE INDEX idx_refund_links_original_sub ON fb_refund_links(original_sub_transaction_id)
  WHERE original_sub_transaction_id IS NOT NULL;

-- Time-based queries for matching suggestions
DROP INDEX IF EXISTS idx_refund_links_created;
CREATE INDEX idx_refund_links_created ON fb_refund_links(created_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE fb_refund_links ENABLE ROW LEVEL SECURITY;

-- Standard user-scoped policy
DROP POLICY IF EXISTS "Users can only access own refund links" ON fb_refund_links;
CREATE POLICY "Users can only access own refund links"
  ON fb_refund_links FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamps
DROP TRIGGER IF EXISTS update_fb_refund_links_timestamp ON fb_refund_links;
CREATE TRIGGER update_fb_refund_links_timestamp
  BEFORE UPDATE ON fb_refund_links
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Validate allocated_amount doesn't exceed refund transaction amount
CREATE OR REPLACE FUNCTION validate_refund_link_amount()
RETURNS TRIGGER AS $$
DECLARE
  refund_amount NUMERIC(18,2);
  total_allocated NUMERIC(18,2);
BEGIN
  -- Get the refund transaction amount
  SELECT ABS(COALESCE(amount, 0))
  INTO refund_amount
  FROM fb_emails_processed
  WHERE id = NEW.refund_transaction_id;

  -- Calculate total already allocated from this refund (excluding current row on update)
  SELECT COALESCE(SUM(allocated_amount), 0)
  INTO total_allocated
  FROM fb_refund_links
  WHERE refund_transaction_id = NEW.refund_transaction_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  -- Check if new allocation would exceed refund amount
  IF (total_allocated + NEW.allocated_amount) > refund_amount THEN
    RAISE EXCEPTION 'Total allocated amount (%) would exceed refund amount (%)',
      total_allocated + NEW.allocated_amount, refund_amount;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_refund_link_amount ON fb_refund_links;
CREATE TRIGGER check_refund_link_amount
  BEFORE INSERT OR UPDATE ON fb_refund_links
  FOR EACH ROW EXECUTE FUNCTION validate_refund_link_amount();

-- ============================================================================
-- VIEW: fb_refund_link_aggregates
-- Pre-computed refund status for original transactions/sub-transactions
-- ============================================================================

DROP VIEW IF EXISTS fb_refund_link_aggregates;
CREATE VIEW fb_refund_link_aggregates AS
SELECT
  -- Identifier for the original (either transaction or sub-transaction)
  COALESCE(original_transaction_id::text, original_sub_transaction_id::text) as original_id,

  -- The actual foreign keys (one will be null)
  original_transaction_id,
  original_sub_transaction_id,

  -- User scoping
  user_id,

  -- Aggregated refund data
  SUM(allocated_amount) as total_refunded,
  COUNT(*) as refund_count,

  -- List of refund transaction IDs
  ARRAY_AGG(refund_transaction_id ORDER BY created_at) as refund_transaction_ids,

  -- Latest refund date
  MAX(created_at) as last_refund_at

FROM fb_refund_links
GROUP BY user_id, original_transaction_id, original_sub_transaction_id;

COMMENT ON VIEW fb_refund_link_aggregates IS 'Aggregated refund status per original transaction/sub-transaction';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if a transaction is fully refunded
CREATE OR REPLACE FUNCTION is_fully_refunded(
  txn_id UUID,
  is_sub_transaction BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN AS $$
DECLARE
  original_amount NUMERIC(18,2);
  total_refunded NUMERIC(18,2);
BEGIN
  IF is_sub_transaction THEN
    -- Get sub-transaction amount
    SELECT amount INTO original_amount
    FROM fb_sub_transactions WHERE id = txn_id;

    -- Get total refunded for this sub-transaction
    SELECT COALESCE(SUM(allocated_amount), 0) INTO total_refunded
    FROM fb_refund_links WHERE original_sub_transaction_id = txn_id;
  ELSE
    -- Get transaction amount
    SELECT ABS(COALESCE(amount, 0)) INTO original_amount
    FROM fb_emails_processed WHERE id = txn_id;

    -- Get total refunded for this transaction
    SELECT COALESCE(SUM(allocated_amount), 0) INTO total_refunded
    FROM fb_refund_links WHERE original_transaction_id = txn_id;
  END IF;

  RETURN total_refunded >= original_amount;
END;
$$ LANGUAGE plpgsql;

-- Function to get remaining refundable amount
CREATE OR REPLACE FUNCTION get_remaining_refundable(
  txn_id UUID,
  is_sub_transaction BOOLEAN DEFAULT FALSE
)
RETURNS NUMERIC(18,2) AS $$
DECLARE
  original_amount NUMERIC(18,2);
  total_refunded NUMERIC(18,2);
BEGIN
  IF is_sub_transaction THEN
    SELECT amount INTO original_amount
    FROM fb_sub_transactions WHERE id = txn_id;

    SELECT COALESCE(SUM(allocated_amount), 0) INTO total_refunded
    FROM fb_refund_links WHERE original_sub_transaction_id = txn_id;
  ELSE
    SELECT ABS(COALESCE(amount, 0)) INTO original_amount
    FROM fb_emails_processed WHERE id = txn_id;

    SELECT COALESCE(SUM(allocated_amount), 0) INTO total_refunded
    FROM fb_refund_links WHERE original_transaction_id = txn_id;
  END IF;

  RETURN GREATEST(0, original_amount - total_refunded);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- EXAMPLE USAGE COMMENTS
-- ============================================================================

/*
-- Example: Partial refunds (one debit → multiple credits)
-- Original purchase: ₹1000 (transaction A)
-- Refund 1: ₹300 → Link: refund=R1, original=A, allocated=300, type='partial'
-- Refund 2: ₹400 → Link: refund=R2, original=A, allocated=400, type='partial'
-- Refund 3: ₹300 → Link: refund=R3, original=A, allocated=300, type='partial'
-- Total refunded: ₹1000 (fully refunded)

INSERT INTO fb_refund_links (user_id, refund_transaction_id, original_transaction_id, allocated_amount, refund_type, match_method)
VALUES
  ('user-uuid', 'R1-uuid', 'A-uuid', 300, 'partial', 'manual'),
  ('user-uuid', 'R2-uuid', 'A-uuid', 400, 'partial', 'manual'),
  ('user-uuid', 'R3-uuid', 'A-uuid', 300, 'partial', 'manual');

-- Example: Combined refund (one credit → multiple debits)
-- Purchase 1: ₹500 (transaction A)
-- Purchase 2: ₹300 (transaction B)
-- Combined refund: ₹800 (transaction R)
-- Link 1: refund=R, original=A, allocated=500, type='combined'
-- Link 2: refund=R, original=B, allocated=300, type='combined'

INSERT INTO fb_refund_links (user_id, refund_transaction_id, original_transaction_id, allocated_amount, refund_type, match_method)
VALUES
  ('user-uuid', 'R-uuid', 'A-uuid', 500, 'combined', 'ai_suggestion'),
  ('user-uuid', 'R-uuid', 'B-uuid', 300, 'combined', 'ai_suggestion');
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run: npx supabase gen types typescript --project-id $PROJECT_ID > src/types/database.ts
-- 2. Add TABLE_REFUND_LINKS, VIEW_REFUND_AGGREGATES to constants
-- 3. Enable SMART_REFUNDS feature flag after testing
-- ============================================================================
