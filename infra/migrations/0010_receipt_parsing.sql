-- Migration: 0010_receipt_parsing.sql
-- Purpose: Create fb_receipts and fb_receipt_items tables for OCR receipt parsing
-- Author: Claude Code
-- Date: 2026-02-21
-- IDEMPOTENT: Yes - safe to re-run

-- ============================================================================
-- TABLE: fb_receipts
-- Stores receipt metadata and parse status
-- ============================================================================

CREATE TABLE IF NOT EXISTS fb_receipts (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES fb_emails_processed(id) ON DELETE CASCADE,

  -- Storage reference (in 'receipts' Supabase Storage bucket)
  storage_path TEXT NOT NULL,        -- e.g. {user_id}/{receipt_id}/receipt.jpg
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL,           -- MIME type as uploaded (image/heic, image/jpeg, etc.)
  file_size_bytes INTEGER,

  -- Parsed store-level metadata
  store_name TEXT,
  receipt_date DATE,
  receipt_number TEXT,

  -- Parsed totals
  subtotal NUMERIC(18,2),
  tax_amount NUMERIC(18,2),
  discount_amount NUMERIC(18,2),
  total_amount NUMERIC(18,2),
  currency TEXT NOT NULL DEFAULT 'INR',

  -- AI parsing metadata
  raw_ocr_response TEXT,             -- Full model JSON response (for debugging)
  parsing_status TEXT NOT NULL DEFAULT 'completed'
    CHECK (parsing_status IN ('completed', 'failed')),
  parsing_error TEXT,
  confidence NUMERIC(3,2),           -- 0.00 - 1.00
  ai_model_used TEXT,

  -- TTL: 60 days from creation
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '60 days'),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: fb_receipt_items
-- Individual line items extracted from the receipt
-- ============================================================================

CREATE TABLE IF NOT EXISTS fb_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES fb_receipts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Ordering
  item_order INTEGER NOT NULL DEFAULT 0,

  -- Item details from OCR
  item_name TEXT NOT NULL,
  quantity NUMERIC(10,3) DEFAULT 1,
  unit TEXT,                          -- kg, g, pcs, L, etc.
  unit_price NUMERIC(18,2),
  total_price NUMERIC(18,2) NOT NULL,

  -- AI-suggested classification
  suggested_category TEXT,
  is_tax_line BOOLEAN NOT NULL DEFAULT FALSE,
  is_discount_line BOOLEAN NOT NULL DEFAULT FALSE,

  -- Link to created sub-transaction (set when user confirms split)
  sub_transaction_id UUID REFERENCES fb_sub_transactions(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_receipts_transaction;
CREATE INDEX idx_receipts_transaction ON fb_receipts(transaction_id);

DROP INDEX IF EXISTS idx_receipts_user_created;
CREATE INDEX idx_receipts_user_created ON fb_receipts(user_id, created_at DESC);

DROP INDEX IF EXISTS idx_receipts_expires_at;
CREATE INDEX idx_receipts_expires_at ON fb_receipts(expires_at)
  WHERE parsing_status = 'completed';

DROP INDEX IF EXISTS idx_receipt_items_receipt;
CREATE INDEX idx_receipt_items_receipt ON fb_receipt_items(receipt_id);

DROP INDEX IF EXISTS idx_receipt_items_sub_transaction;
CREATE INDEX idx_receipt_items_sub_transaction ON fb_receipt_items(sub_transaction_id)
  WHERE sub_transaction_id IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE fb_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_receipt_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access own receipts" ON fb_receipts;
CREATE POLICY "Users can only access own receipts"
  ON fb_receipts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can only access own receipt items" ON fb_receipt_items;
CREATE POLICY "Users can only access own receipt items"
  ON fb_receipt_items FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- GRANTS (matches pattern from migration 0008)
-- ============================================================================

GRANT ALL ON TABLE fb_receipts TO service_role;
GRANT ALL ON TABLE fb_receipts TO authenticated;
GRANT ALL ON TABLE fb_receipts TO anon;
GRANT ALL ON TABLE fb_receipts TO postgres;

GRANT ALL ON TABLE fb_receipt_items TO service_role;
GRANT ALL ON TABLE fb_receipt_items TO authenticated;
GRANT ALL ON TABLE fb_receipt_items TO anon;
GRANT ALL ON TABLE fb_receipt_items TO postgres;

-- ============================================================================
-- TIMESTAMP TRIGGERS (reuse existing update_timestamp function)
-- ============================================================================

DROP TRIGGER IF EXISTS update_fb_receipts_timestamp ON fb_receipts;
CREATE TRIGGER update_fb_receipts_timestamp
  BEFORE UPDATE ON fb_receipts
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- SUPABASE STORAGE BUCKET
-- Creates the 'receipts' bucket if it does not already exist.
-- Private, 20MB limit, allowed MIME types.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  false,
  20971520,  -- 20MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can only access files under their own user-id folder
DROP POLICY IF EXISTS "Users can upload own receipts" ON storage.objects;
CREATE POLICY "Users can upload own receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can view own receipts" ON storage.objects;
CREATE POLICY "Users can view own receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own receipts" ON storage.objects;
CREATE POLICY "Users can delete own receipts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- RECEIPT SUMMARY VIEW (already declared in database.ts as VIEW_RECEIPT_SUMMARY)
-- ============================================================================

CREATE OR REPLACE VIEW fb_receipt_summary AS
SELECT
  r.id,
  r.transaction_id,
  r.user_id,
  r.store_name,
  r.receipt_date,
  r.total_amount,
  r.currency,
  r.parsing_status,
  r.confidence,
  r.expires_at,
  r.created_at,
  COUNT(ri.id) FILTER (WHERE NOT ri.is_tax_line AND NOT ri.is_discount_line) AS item_count,
  COUNT(ri.id) FILTER (WHERE ri.sub_transaction_id IS NOT NULL) AS linked_item_count
FROM fb_receipts r
LEFT JOIN fb_receipt_items ri ON ri.receipt_id = r.id
GROUP BY r.id;

GRANT SELECT ON fb_receipt_summary TO authenticated, service_role, anon;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE fb_receipts IS 'Receipt images uploaded for OCR parsing. Stored in Supabase Storage receipts bucket. 60-day TTL enforced by /api/cron/receipt-cleanup.';
COMMENT ON TABLE fb_receipt_items IS 'Line items extracted from receipt images via OpenRouter/Claude Vision.';
COMMENT ON COLUMN fb_receipts.expires_at IS '60-day TTL. Cron job at /api/cron/receipt-cleanup deletes expired rows and Storage files daily.';
COMMENT ON COLUMN fb_receipt_items.suggested_category IS 'Category suggested by the AI model; pre-populates SubTransactionEditor category field.';
COMMENT ON COLUMN fb_receipts.storage_path IS 'Path within the receipts Storage bucket: {user_id}/{receipt_id}/receipt.{ext}';
