-- ============================================================================
-- Migration: 0007_receipt_parsing.sql
-- Description: Receipt parsing tables for Phase 2
-- Date: 2025-01-18
-- IDEMPOTENT: Yes - safe to re-run
--
-- Creates:
--   - fb_receipts: Receipt metadata (file info, parsing status)
--   - fb_receipt_items: Parsed line items from receipts
--   - fb_receipt_item_links: Links receipt items to sub-transactions (1:1)
--
-- Architecture:
--   - Link table pattern (no FK on fb_sub_transactions)
--   - Receipt items can exist without links
--   - Supports future expansion to 1:N relationships
-- ============================================================================

-- ============================================================================
-- TABLE: fb_receipts
-- Receipt metadata and parsing status
-- ============================================================================

CREATE TABLE IF NOT EXISTS fb_receipts (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Parent transaction reference
  transaction_id UUID NOT NULL REFERENCES fb_emails_processed(id) ON DELETE CASCADE,

  -- File storage info (Supabase Storage)
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  file_size_bytes INTEGER,

  -- Parsed receipt metadata
  store_name TEXT,
  store_address TEXT,
  receipt_date DATE,
  receipt_number TEXT,
  receipt_total NUMERIC(18,2),
  currency TEXT DEFAULT 'INR',

  -- Parsing status
  parsing_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (parsing_status IN ('pending', 'processing', 'completed', 'failed', 'manual_review')),
  parsing_error TEXT,
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),

  -- AI metadata
  ai_model_used TEXT,
  raw_ai_response JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  parsed_at TIMESTAMPTZ,

  -- One receipt per transaction (can be relaxed later if needed)
  UNIQUE(transaction_id)
);

COMMENT ON TABLE fb_receipts IS 'Receipt metadata and parsing status for uploaded receipt images';
COMMENT ON COLUMN fb_receipts.file_path IS 'Path in Supabase Storage bucket';
COMMENT ON COLUMN fb_receipts.parsing_status IS 'pending=uploaded, processing=AI parsing, completed=success, failed=error, manual_review=low confidence';
COMMENT ON COLUMN fb_receipts.confidence IS 'AI confidence score 0.0-1.0';

-- ============================================================================
-- TABLE: fb_receipt_items
-- Parsed line items from receipts
-- ============================================================================

CREATE TABLE IF NOT EXISTS fb_receipt_items (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES fb_receipts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Item details (as parsed from receipt)
  item_name TEXT NOT NULL,
  item_description TEXT,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(18,2),
  total_price NUMERIC(18,2) NOT NULL,

  -- Categorization
  category TEXT,

  -- Item classification flags
  is_tax BOOLEAN NOT NULL DEFAULT FALSE,
  is_discount BOOLEAN NOT NULL DEFAULT FALSE,
  is_tip BOOLEAN NOT NULL DEFAULT FALSE,
  is_service_charge BOOLEAN NOT NULL DEFAULT FALSE,
  is_excluded BOOLEAN NOT NULL DEFAULT FALSE,  -- User excluded from split

  -- Ordering
  line_number INTEGER NOT NULL DEFAULT 0,

  -- AI parsing metadata
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  raw_text TEXT,  -- Original text from receipt

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_receipt_line UNIQUE (receipt_id, line_number)
);

COMMENT ON TABLE fb_receipt_items IS 'Individual line items parsed from receipt images';
COMMENT ON COLUMN fb_receipt_items.is_excluded IS 'User can exclude items from sub-transaction generation';
COMMENT ON COLUMN fb_receipt_items.raw_text IS 'Original text extracted by AI for debugging';

-- ============================================================================
-- TABLE: fb_receipt_item_links
-- Links receipt items to sub-transactions (1:1 relationship)
-- ============================================================================

CREATE TABLE IF NOT EXISTS fb_receipt_item_links (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Link endpoints
  receipt_item_id UUID NOT NULL REFERENCES fb_receipt_items(id) ON DELETE CASCADE,
  sub_transaction_id UUID NOT NULL REFERENCES fb_sub_transactions(id) ON DELETE CASCADE,

  -- Link metadata
  link_method TEXT NOT NULL DEFAULT 'auto' CHECK (link_method IN ('auto', 'manual')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Enforce 1:1 relationship (each item links to exactly one sub-transaction)
  UNIQUE(receipt_item_id),
  UNIQUE(sub_transaction_id)
);

COMMENT ON TABLE fb_receipt_item_links IS 'Links receipt line items to sub-transactions (1:1)';
COMMENT ON COLUMN fb_receipt_item_links.link_method IS 'auto=created during receipt-to-sub conversion, manual=user-linked';

-- ============================================================================
-- INDEXES (Idempotent with DROP IF EXISTS)
-- ============================================================================

-- fb_receipts indexes
DROP INDEX IF EXISTS idx_receipts_user;
CREATE INDEX idx_receipts_user ON fb_receipts(user_id);

DROP INDEX IF EXISTS idx_receipts_transaction;
CREATE INDEX idx_receipts_transaction ON fb_receipts(transaction_id);

DROP INDEX IF EXISTS idx_receipts_status;
CREATE INDEX idx_receipts_status ON fb_receipts(parsing_status);

DROP INDEX IF EXISTS idx_receipts_created;
CREATE INDEX idx_receipts_created ON fb_receipts(created_at DESC);

-- fb_receipt_items indexes
DROP INDEX IF EXISTS idx_receipt_items_receipt;
CREATE INDEX idx_receipt_items_receipt ON fb_receipt_items(receipt_id);

DROP INDEX IF EXISTS idx_receipt_items_user;
CREATE INDEX idx_receipt_items_user ON fb_receipt_items(user_id);

DROP INDEX IF EXISTS idx_receipt_items_category;
CREATE INDEX idx_receipt_items_category ON fb_receipt_items(category) WHERE category IS NOT NULL;

-- fb_receipt_item_links indexes
DROP INDEX IF EXISTS idx_receipt_item_links_user;
CREATE INDEX idx_receipt_item_links_user ON fb_receipt_item_links(user_id);

DROP INDEX IF EXISTS idx_receipt_item_links_receipt_item;
CREATE INDEX idx_receipt_item_links_receipt_item ON fb_receipt_item_links(receipt_item_id);

DROP INDEX IF EXISTS idx_receipt_item_links_sub_transaction;
CREATE INDEX idx_receipt_item_links_sub_transaction ON fb_receipt_item_links(sub_transaction_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE fb_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_receipt_item_links ENABLE ROW LEVEL SECURITY;

-- fb_receipts policies
DROP POLICY IF EXISTS "Users can only access own receipts" ON fb_receipts;
CREATE POLICY "Users can only access own receipts"
  ON fb_receipts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- fb_receipt_items policies
DROP POLICY IF EXISTS "Users can only access own receipt items" ON fb_receipt_items;
CREATE POLICY "Users can only access own receipt items"
  ON fb_receipt_items FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- fb_receipt_item_links policies
DROP POLICY IF EXISTS "Users can only access own receipt item links" ON fb_receipt_item_links;
CREATE POLICY "Users can only access own receipt item links"
  ON fb_receipt_item_links FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamps for fb_receipts
DROP TRIGGER IF EXISTS update_fb_receipts_timestamp ON fb_receipts;
CREATE TRIGGER update_fb_receipts_timestamp
  BEFORE UPDATE ON fb_receipts
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Auto-update timestamps for fb_receipt_items
DROP TRIGGER IF EXISTS update_fb_receipt_items_timestamp ON fb_receipt_items;
CREATE TRIGGER update_fb_receipt_items_timestamp
  BEFORE UPDATE ON fb_receipt_items
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to validate receipt item total matches receipt total
CREATE OR REPLACE FUNCTION validate_receipt_items_total()
RETURNS TRIGGER AS $$
DECLARE
  items_total NUMERIC(18,2);
  receipt_total NUMERIC(18,2);
BEGIN
  -- Calculate sum of non-excluded items
  SELECT COALESCE(SUM(total_price), 0)
  INTO items_total
  FROM fb_receipt_items
  WHERE receipt_id = NEW.receipt_id
    AND is_excluded = FALSE;

  -- Get receipt total
  SELECT COALESCE(r.receipt_total, 0)
  INTO receipt_total
  FROM fb_receipts r
  WHERE r.id = NEW.receipt_id;

  -- Log warning if mismatch (but don't block - receipts often have rounding)
  IF receipt_total > 0 AND ABS(items_total - receipt_total) > 1.00 THEN
    RAISE WARNING 'Receipt items total (%) differs from receipt total (%) by more than 1.00',
      items_total, receipt_total;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger (warning only, not blocking)
DROP TRIGGER IF EXISTS check_receipt_items_total ON fb_receipt_items;
CREATE TRIGGER check_receipt_items_total
  AFTER INSERT OR UPDATE ON fb_receipt_items
  FOR EACH ROW EXECUTE FUNCTION validate_receipt_items_total();

-- Function to auto-set user_id on receipt items from parent receipt
CREATE OR REPLACE FUNCTION inherit_receipt_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get user_id from parent receipt
  SELECT user_id INTO NEW.user_id
  FROM fb_receipts
  WHERE id = NEW.receipt_id;

  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'Parent receipt not found for receipt_id %', NEW.receipt_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply user_id inheritance trigger
DROP TRIGGER IF EXISTS inherit_receipt_item_user_id ON fb_receipt_items;
CREATE TRIGGER inherit_receipt_item_user_id
  BEFORE INSERT ON fb_receipt_items
  FOR EACH ROW
  WHEN (NEW.user_id IS NULL)
  EXECUTE FUNCTION inherit_receipt_user_id();

-- Function to update receipt parsed_at when status changes to completed
CREATE OR REPLACE FUNCTION update_receipt_parsed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parsing_status = 'completed' AND OLD.parsing_status != 'completed' THEN
    NEW.parsed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_receipt_parsed_at ON fb_receipts;
CREATE TRIGGER set_receipt_parsed_at
  BEFORE UPDATE ON fb_receipts
  FOR EACH ROW
  WHEN (NEW.parsing_status = 'completed')
  EXECUTE FUNCTION update_receipt_parsed_at();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Receipt summary with item counts
DROP VIEW IF EXISTS fb_receipt_summary;
CREATE VIEW fb_receipt_summary AS
SELECT
  r.id,
  r.user_id,
  r.transaction_id,
  r.store_name,
  r.receipt_date,
  r.receipt_total,
  r.parsing_status,
  r.confidence,
  r.created_at,
  COUNT(ri.id) AS item_count,
  COUNT(ril.id) AS linked_item_count,
  SUM(CASE WHEN ri.is_excluded THEN 0 ELSE ri.total_price END) AS items_total
FROM fb_receipts r
LEFT JOIN fb_receipt_items ri ON ri.receipt_id = r.id
LEFT JOIN fb_receipt_item_links ril ON ril.receipt_item_id = ri.id
GROUP BY r.id;

COMMENT ON VIEW fb_receipt_summary IS 'Receipt metadata with aggregated item statistics';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run: npx supabase gen types typescript --project-id $PROJECT_ID > src/types/database.ts
-- 2. Add TABLE_RECEIPTS, TABLE_RECEIPT_ITEMS, TABLE_RECEIPT_ITEM_LINKS to constants
-- 3. Enable RECEIPT_PARSING feature flag after testing
-- ============================================================================
