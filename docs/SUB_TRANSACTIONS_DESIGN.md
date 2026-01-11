# Sub-Transactions, Receipt Parsing & Smart Refunds - Technical Design Document

> **Status**: Approved for Implementation
> **Created**: 2026-01-08
> **Updated**: 2026-01-09 (Added Smart Refund System)
> **Author**: Claude Code

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Requirements](#2-requirements)
3. [Current Architecture](#3-current-architecture)
4. [Database Design](#4-database-design)
5. [API Design](#5-api-design)
6. [TypeScript Types](#6-typescript-types)
7. [UI Components](#7-ui-components)
8. [Business Logic](#8-business-logic)
9. [Edge Cases](#9-edge-cases)
10. [Implementation Order](#10-implementation-order)
11. [Testing Strategy](#11-testing-strategy)
12. [**Receipt Parsing Feature**](#12-receipt-parsing-feature)
13. [**Smart Refund System**](#13-smart-refund-system) *(NEW)*

---

## 1. Executive Summary

### Purpose
Enable users to:
1. **Split transactions** into multiple sub-transactions for better categorization
2. **Upload receipts** and auto-extract line items via AI
3. **Convert receipt items** to sub-transactions with one click
4. **Track refunds** with smart linking to original transactions *(NEW)*

### Key Features

**Sub-Transactions:**
- Split any transaction into 2-10 sub-transactions
- Sub-transaction amounts must sum exactly to parent amount
- Splitwise expense ID automatically cascades from parent to children
- Single-level nesting only (sub-transactions cannot have sub-transactions)

**Receipt Parsing:**
- Upload receipt images (JPEG, PNG) or PDFs
- AI-powered extraction using Claude Vision API
- Auto-detect store name, date, line items, tax, total
- Edit parsed items before conversion
- One-click creation of sub-transactions from receipt items

**Smart Refund System:** *(NEW)*
- Link credit transactions to original debit transactions
- Support full, partial, and item-level refunds
- AI-powered smart matching suggestions (merchant, amount, time)
- Sub-transaction refunds (return specific items from a purchase)
- Splitwise integration warnings when refunding split transactions

### Design Principles
- **Self-referential FK**: Use existing `fb_emails_processed` table with parent reference
- **Database-level validation**: Triggers enforce constraints for data integrity
- **Cascading behavior**: Splitwise ID and deletions cascade automatically
- **AI-first parsing**: Leverage existing Claude integration for receipt OCR
- **Smart matching**: AI suggests refund links based on merchant, amount, timing
- **UI consistency**: Follow existing design system patterns

---

## 2. Requirements

### Functional Requirements - Sub-Transactions

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Split transaction into multiple sub-transactions | Must |
| FR-2 | Sub-transaction amounts must equal parent exactly | Must |
| FR-3 | Splitwise ID cascades from parent to children | Must |
| FR-4 | View sub-transactions in expandable list | Must |
| FR-5 | Edit individual sub-transaction category/notes | Must |
| FR-6 | Delete individual or all sub-transactions | Must |
| FR-7 | Minimum 2, maximum 10 sub-transactions | Should |
| FR-8 | Real-time amount validation in UI | Should |

### Functional Requirements - Receipt Parsing *(NEW)*

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-R1 | Upload receipt image/PDF for a transaction | Must |
| FR-R2 | AI extracts line items (name, qty, price) | Must |
| FR-R3 | Store receipt file in cloud storage | Must |
| FR-R4 | Edit/correct parsed items before saving | Must |
| FR-R5 | Create sub-transactions from receipt items | Must |
| FR-R6 | Support Indian receipts (INR, GST) | Must |
| FR-R7 | Show parsing confidence score | Should |
| FR-R8 | Retry parsing if failed | Should |
| FR-R9 | View original receipt alongside items | Should |

### Functional Requirements - Smart Refunds *(NEW)*

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-RF1 | Link credit transaction to original debit as refund | Must |
| FR-RF2 | Support full refunds (100% of original amount) | Must |
| FR-RF3 | Support partial refunds (< 100% of original) | Must |
| FR-RF4 | Support item/sub-transaction refunds | Must |
| FR-RF5 | Smart matching suggestions (merchant, amount, time) | Must |
| FR-RF6 | Show refund status on original transaction | Must |
| FR-RF7 | Allow multiple partial refunds per transaction | Should |
| FR-RF8 | Warn when refunding Splitwise-split transactions | Should |
| FR-RF9 | AI detection of refund keywords in emails | Should |
| FR-RF10 | Option to create reverse Splitwise expense | Could |

### Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | Sub-transactions excluded from main list by default |
| NFR-2 | Parent amount locked when sub-transactions exist |
| NFR-3 | No nested sub-transactions (max 1 level) |
| NFR-4 | Splitwise button disabled on sub-transactions |
| NFR-5 | Receipt files stored securely with RLS |
| NFR-6 | Receipt parsing completes within 10 seconds |
| NFR-7 | Total refunds cannot exceed original amount |
| NFR-8 | Refund suggestions load within 2 seconds |

---

## 3. Current Architecture

### 3.1 Database Schema (Current)

**Table**: `fb_emails_processed` (renamed from `fb_extracted_transactions`)

```sql
-- Key fields relevant to this feature
id                    UUID PRIMARY KEY
user_id               UUID NOT NULL REFERENCES auth.users(id)
google_user_id        TEXT NOT NULL
email_row_id          UUID NOT NULL REFERENCES fb_emails(id)
txn_time              TIMESTAMPTZ
amount                NUMERIC(18,2)
currency              TEXT
direction             TEXT CHECK (direction IN ('debit','credit'))
merchant_name         TEXT
merchant_normalized   TEXT
category              TEXT
account_type          TEXT
user_notes            TEXT
status                TEXT
splitwise_expense_id  TEXT  -- Link to Splitwise expense
created_at            TIMESTAMPTZ DEFAULT now()
updated_at            TIMESTAMPTZ DEFAULT now()
```

### 3.2 Existing AI Integration

The app has a robust multi-model AI system:

```
src/lib/ai/
├── manager.ts      -- Model selection & fallback
├── config.ts       -- Model hierarchy
└── models/
    ├── openai.ts   -- GPT-4o Mini, GPT-3.5
    ├── anthropic.ts -- Claude 3 Sonnet, Haiku
    ├── google.ts   -- Gemini 1.5 Flash
    └── perplexity.ts -- Sonar, Sonar Pro
```

**Key**: Anthropic SDK already configured - can use Claude Vision API.

### 3.3 Storage Status

**Current**: Supabase Storage NOT configured (database only)
**Required**: Configure `receipts` bucket for file storage

---

## 4. Database Design

### 4.1 Sub-Transaction Schema Changes

Add columns to `fb_emails_processed`:

```sql
parent_transaction_id  UUID REFERENCES fb_emails_processed(id) ON DELETE CASCADE
is_sub_transaction     BOOLEAN DEFAULT FALSE
sub_transaction_order  INTEGER DEFAULT 0
receipt_item_id        UUID REFERENCES fb_receipt_items(id)  -- Link to source receipt item
```

### 4.1b Refund Schema Changes *(NEW)*

Add columns to `fb_emails_processed`:

```sql
refund_of_transaction_id     UUID REFERENCES fb_emails_processed(id) ON DELETE SET NULL
refund_of_sub_transaction_id UUID REFERENCES fb_emails_processed(id) ON DELETE SET NULL
is_refund                    BOOLEAN DEFAULT FALSE
refund_type                  TEXT CHECK (refund_type IN ('full', 'partial', 'item'))
refund_reason                TEXT
```

**Refund Relationships:**
```
Transaction (debit)
├── 1:N → Refunds (credits linked via refund_of_transaction_id)
│         └── Each refund is a credit transaction
└── 1:N → Sub-transactions
          └── 1:N → Sub-transaction Refunds (via refund_of_sub_transaction_id)
```

### 4.2 Receipt Tables *(NEW)*

**Table**: `fb_receipts`

```sql
CREATE TABLE fb_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES fb_emails_processed(id) ON DELETE CASCADE,

  -- File info
  file_path TEXT NOT NULL,           -- Supabase storage path
  file_name TEXT NOT NULL,           -- Original filename
  file_type TEXT NOT NULL,           -- MIME type
  file_size INTEGER,                 -- Bytes

  -- Parsed metadata
  store_name TEXT,                   -- Extracted merchant/store
  receipt_date TIMESTAMPTZ,          -- Date on receipt
  receipt_number TEXT,               -- Receipt/invoice number

  -- Amounts
  subtotal NUMERIC(18,2),
  tax_amount NUMERIC(18,2),
  discount_amount NUMERIC(18,2),
  total_amount NUMERIC(18,2),
  currency TEXT DEFAULT 'INR',

  -- Parsing info
  raw_ocr_text TEXT,                 -- Raw extracted text
  parsing_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (parsing_status IN ('pending', 'processing', 'completed', 'failed')),
  parsing_error TEXT,
  confidence NUMERIC(3,2),           -- 0.00 to 1.00
  ai_model_used TEXT,                -- Which model parsed it

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_fb_receipts_transaction ON fb_receipts(transaction_id);
CREATE INDEX idx_fb_receipts_user ON fb_receipts(user_id);
CREATE INDEX idx_fb_receipts_status ON fb_receipts(parsing_status);

-- RLS
ALTER TABLE fb_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own receipts" ON fb_receipts
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

**Table**: `fb_receipt_items`

```sql
CREATE TABLE fb_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES fb_receipts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Item details
  item_order INTEGER NOT NULL DEFAULT 0,
  item_name TEXT NOT NULL,
  item_description TEXT,             -- Additional details
  quantity NUMERIC(10,3) DEFAULT 1,
  unit TEXT,                         -- 'kg', 'pcs', 'L', etc.
  unit_price NUMERIC(18,2),
  total_price NUMERIC(18,2) NOT NULL,

  -- Classification
  category TEXT,                     -- Auto-detected or user-assigned
  is_tax BOOLEAN DEFAULT FALSE,
  is_discount BOOLEAN DEFAULT FALSE,
  is_excluded BOOLEAN DEFAULT FALSE, -- User excluded from sub-txn creation

  -- Link to sub-transaction (after conversion)
  sub_transaction_id UUID REFERENCES fb_emails_processed(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_fb_receipt_items_receipt ON fb_receipt_items(receipt_id);
CREATE INDEX idx_fb_receipt_items_user ON fb_receipt_items(user_id);
CREATE INDEX idx_fb_receipt_items_sub_txn ON fb_receipt_items(sub_transaction_id)
  WHERE sub_transaction_id IS NOT NULL;

-- RLS
ALTER TABLE fb_receipt_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own receipt items" ON fb_receipt_items
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### 4.3 Supabase Storage Bucket *(NEW)*

```sql
-- Run in Supabase Dashboard > SQL Editor
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  false,  -- Private bucket
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
);

-- Storage RLS policy
CREATE POLICY "Users can manage own receipts"
ON storage.objects FOR ALL
USING (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### 4.4 Full Migration File

**File**: `infra/migrations/0006_sub_transactions_and_receipts.sql`

```sql
-- ============================================================
-- Migration: 0006_sub_transactions_and_receipts.sql
-- Purpose: Add sub-transaction support and receipt parsing
-- ============================================================

-- =====================
-- PART 1: SUB-TRANSACTIONS
-- =====================

-- Step 1.1: Add sub-transaction columns
ALTER TABLE fb_emails_processed
  ADD COLUMN IF NOT EXISTS parent_transaction_id UUID,
  ADD COLUMN IF NOT EXISTS is_sub_transaction BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sub_transaction_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS receipt_item_id UUID;

-- Step 1.2: Add self-referential foreign key
ALTER TABLE fb_emails_processed
  ADD CONSTRAINT fk_parent_transaction
  FOREIGN KEY (parent_transaction_id)
  REFERENCES fb_emails_processed(id)
  ON DELETE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

-- Step 1.3: Create indexes for sub-transactions
CREATE INDEX IF NOT EXISTS idx_fb_txn_parent_id
  ON fb_emails_processed(parent_transaction_id)
  WHERE parent_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fb_txn_is_sub
  ON fb_emails_processed(is_sub_transaction)
  WHERE is_sub_transaction = TRUE;

CREATE INDEX IF NOT EXISTS idx_fb_txn_parent_order
  ON fb_emails_processed(parent_transaction_id, sub_transaction_order)
  WHERE parent_transaction_id IS NOT NULL;

-- Step 1.4: Check constraint - sub-transactions must have parent
ALTER TABLE fb_emails_processed
  ADD CONSTRAINT chk_sub_transaction_has_parent
  CHECK (
    (is_sub_transaction = FALSE AND parent_transaction_id IS NULL) OR
    (is_sub_transaction = TRUE AND parent_transaction_id IS NOT NULL)
  );

-- Step 1.5: Trigger to prevent nested sub-transactions
CREATE OR REPLACE FUNCTION check_no_nested_sub_transactions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_sub_transaction = TRUE AND NEW.parent_transaction_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM fb_emails_processed
      WHERE id = NEW.parent_transaction_id
      AND is_sub_transaction = TRUE
    ) THEN
      RAISE EXCEPTION 'Cannot create sub-transaction of a sub-transaction';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_no_nested_sub_transactions
  BEFORE INSERT OR UPDATE ON fb_emails_processed
  FOR EACH ROW
  EXECUTE FUNCTION check_no_nested_sub_transactions();

-- Step 1.6: Trigger to validate sub-transaction amounts
CREATE OR REPLACE FUNCTION validate_sub_transaction_amounts()
RETURNS TRIGGER AS $$
DECLARE
  parent_amount NUMERIC(18,2);
  sub_total NUMERIC(18,2);
BEGIN
  IF NEW.is_sub_transaction = TRUE AND NEW.parent_transaction_id IS NOT NULL THEN
    SELECT amount INTO parent_amount
    FROM fb_emails_processed
    WHERE id = NEW.parent_transaction_id;

    SELECT COALESCE(SUM(amount), 0) INTO sub_total
    FROM fb_emails_processed
    WHERE parent_transaction_id = NEW.parent_transaction_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    sub_total := sub_total + COALESCE(NEW.amount, 0);

    IF sub_total > parent_amount THEN
      RAISE EXCEPTION 'Sub-transaction amounts (%) exceed parent amount (%)', sub_total, parent_amount;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_sub_amounts
  BEFORE INSERT OR UPDATE ON fb_emails_processed
  FOR EACH ROW
  EXECUTE FUNCTION validate_sub_transaction_amounts();

-- Step 1.7: Trigger to cascade Splitwise ID
CREATE OR REPLACE FUNCTION cascade_splitwise_to_children()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.splitwise_expense_id IS DISTINCT FROM NEW.splitwise_expense_id THEN
    UPDATE fb_emails_processed
    SET splitwise_expense_id = NEW.splitwise_expense_id,
        updated_at = NOW()
    WHERE parent_transaction_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cascade_splitwise
  AFTER UPDATE ON fb_emails_processed
  FOR EACH ROW
  WHEN (OLD.splitwise_expense_id IS DISTINCT FROM NEW.splitwise_expense_id)
  EXECUTE FUNCTION cascade_splitwise_to_children();

-- =====================
-- PART 2: RECEIPTS
-- =====================

-- Step 2.1: Create receipts table
CREATE TABLE IF NOT EXISTS fb_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES fb_emails_processed(id) ON DELETE CASCADE,

  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,

  store_name TEXT,
  receipt_date TIMESTAMPTZ,
  receipt_number TEXT,

  subtotal NUMERIC(18,2),
  tax_amount NUMERIC(18,2),
  discount_amount NUMERIC(18,2),
  total_amount NUMERIC(18,2),
  currency TEXT DEFAULT 'INR',

  raw_ocr_text TEXT,
  parsing_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (parsing_status IN ('pending', 'processing', 'completed', 'failed')),
  parsing_error TEXT,
  confidence NUMERIC(3,2),
  ai_model_used TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fb_receipts_transaction ON fb_receipts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_fb_receipts_user ON fb_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_fb_receipts_status ON fb_receipts(parsing_status);

ALTER TABLE fb_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own receipts" ON fb_receipts
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Step 2.2: Create receipt items table
CREATE TABLE IF NOT EXISTS fb_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES fb_receipts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  item_order INTEGER NOT NULL DEFAULT 0,
  item_name TEXT NOT NULL,
  item_description TEXT,
  quantity NUMERIC(10,3) DEFAULT 1,
  unit TEXT,
  unit_price NUMERIC(18,2),
  total_price NUMERIC(18,2) NOT NULL,

  category TEXT,
  is_tax BOOLEAN DEFAULT FALSE,
  is_discount BOOLEAN DEFAULT FALSE,
  is_excluded BOOLEAN DEFAULT FALSE,

  sub_transaction_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fb_receipt_items_receipt ON fb_receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_fb_receipt_items_user ON fb_receipt_items(user_id);
CREATE INDEX IF NOT EXISTS idx_fb_receipt_items_sub_txn ON fb_receipt_items(sub_transaction_id)
  WHERE sub_transaction_id IS NOT NULL;

ALTER TABLE fb_receipt_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own receipt items" ON fb_receipt_items
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Step 2.3: Add FK from sub-transactions to receipt items
ALTER TABLE fb_emails_processed
  ADD CONSTRAINT fk_receipt_item
  FOREIGN KEY (receipt_item_id)
  REFERENCES fb_receipt_items(id)
  ON DELETE SET NULL;

-- Step 2.4: Add FK from receipt items to sub-transactions
ALTER TABLE fb_receipt_items
  ADD CONSTRAINT fk_sub_transaction
  FOREIGN KEY (sub_transaction_id)
  REFERENCES fb_emails_processed(id)
  ON DELETE SET NULL;

-- Step 2.5: Comments
COMMENT ON TABLE fb_receipts IS 'Uploaded receipt files and parsed metadata';
COMMENT ON TABLE fb_receipt_items IS 'Line items parsed from receipts';
COMMENT ON COLUMN fb_emails_processed.parent_transaction_id IS 'Self-referential FK for sub-transactions';
COMMENT ON COLUMN fb_emails_processed.receipt_item_id IS 'Link to source receipt item if created from receipt';

-- =====================
-- PART 3: SMART REFUNDS
-- =====================

-- Step 3.1: Add refund columns
ALTER TABLE fb_emails_processed
  ADD COLUMN IF NOT EXISTS refund_of_transaction_id UUID,
  ADD COLUMN IF NOT EXISTS refund_of_sub_transaction_id UUID,
  ADD COLUMN IF NOT EXISTS is_refund BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS refund_type TEXT CHECK (refund_type IN ('full', 'partial', 'item') OR refund_type IS NULL),
  ADD COLUMN IF NOT EXISTS refund_reason TEXT;

-- Step 3.2: Add FK for refund linkage (SET NULL on delete to preserve refund records)
ALTER TABLE fb_emails_processed
  ADD CONSTRAINT fk_refund_of_transaction
  FOREIGN KEY (refund_of_transaction_id)
  REFERENCES fb_emails_processed(id)
  ON DELETE SET NULL;

ALTER TABLE fb_emails_processed
  ADD CONSTRAINT fk_refund_of_sub_transaction
  FOREIGN KEY (refund_of_sub_transaction_id)
  REFERENCES fb_emails_processed(id)
  ON DELETE SET NULL;

-- Step 3.3: Create indexes for refund lookups
CREATE INDEX IF NOT EXISTS idx_fb_txn_refund_of
  ON fb_emails_processed(refund_of_transaction_id)
  WHERE refund_of_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fb_txn_is_refund
  ON fb_emails_processed(user_id, is_refund)
  WHERE is_refund = TRUE;

-- Step 3.4: Trigger to validate refund linkage
CREATE OR REPLACE FUNCTION validate_refund_linkage()
RETURNS TRIGGER AS $$
DECLARE
  original_txn RECORD;
  total_refunded NUMERIC(18,2);
BEGIN
  -- Only validate if setting a refund link
  IF NEW.refund_of_transaction_id IS NOT NULL THEN
    -- Get original transaction
    SELECT * INTO original_txn
    FROM fb_emails_processed
    WHERE id = NEW.refund_of_transaction_id
      AND user_id = NEW.user_id;

    -- Validate original exists and belongs to same user
    IF original_txn.id IS NULL THEN
      RAISE EXCEPTION 'Original transaction not found or belongs to different user';
    END IF;

    -- Validate directions: refund must be credit, original must be debit
    IF NEW.direction != 'credit' THEN
      RAISE EXCEPTION 'Refund transaction must have direction=credit';
    END IF;

    IF original_txn.direction != 'debit' THEN
      RAISE EXCEPTION 'Original transaction must have direction=debit';
    END IF;

    -- Validate no circular/nested refund chains
    IF original_txn.refund_of_transaction_id IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot link refund to another refund (no nested chains)';
    END IF;

    -- Calculate total already refunded for this original transaction
    SELECT COALESCE(SUM(amount), 0) INTO total_refunded
    FROM fb_emails_processed
    WHERE refund_of_transaction_id = NEW.refund_of_transaction_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    -- Validate total refunds don't exceed original amount
    IF (total_refunded + COALESCE(NEW.amount, 0)) > COALESCE(original_txn.amount, 0) THEN
      RAISE EXCEPTION 'Total refunds (% + %) exceed original amount (%)',
        total_refunded, NEW.amount, original_txn.amount;
    END IF;

    -- Auto-set is_refund flag and determine refund_type
    NEW.is_refund := TRUE;

    IF NEW.refund_type IS NULL THEN
      IF NEW.amount = original_txn.amount THEN
        NEW.refund_type := 'full';
      ELSE
        NEW.refund_type := 'partial';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_refund_linkage
  BEFORE INSERT OR UPDATE OF refund_of_transaction_id
  ON fb_emails_processed
  FOR EACH ROW
  EXECUTE FUNCTION validate_refund_linkage();

-- Step 3.5: Function to get refund status for a transaction
CREATE OR REPLACE FUNCTION get_refund_status(txn_id UUID)
RETURNS TABLE (
  total_refunded NUMERIC(18,2),
  refund_count INTEGER,
  original_amount NUMERIC(18,2),
  remaining_amount NUMERIC(18,2),
  is_fully_refunded BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(r.amount), 0)::NUMERIC(18,2) as total_refunded,
    COUNT(r.id)::INTEGER as refund_count,
    t.amount::NUMERIC(18,2) as original_amount,
    (COALESCE(t.amount, 0) - COALESCE(SUM(r.amount), 0))::NUMERIC(18,2) as remaining_amount,
    (COALESCE(SUM(r.amount), 0) >= COALESCE(t.amount, 0)) as is_fully_refunded
  FROM fb_emails_processed t
  LEFT JOIN fb_emails_processed r ON r.refund_of_transaction_id = t.id
  WHERE t.id = txn_id
  GROUP BY t.id, t.amount;
END;
$$ LANGUAGE plpgsql;

-- Step 3.6: Function to suggest potential refund matches
CREATE OR REPLACE FUNCTION suggest_refund_matches(
  p_user_id UUID,
  p_credit_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  transaction_id UUID,
  merchant_name TEXT,
  merchant_normalized TEXT,
  amount NUMERIC(18,2),
  txn_time TIMESTAMPTZ,
  reference_id TEXT,
  splitwise_expense_id TEXT,
  match_score INTEGER,
  match_reasons TEXT[]
) AS $$
DECLARE
  credit_txn RECORD;
BEGIN
  -- Get the credit transaction details
  SELECT * INTO credit_txn
  FROM fb_emails_processed
  WHERE id = p_credit_id AND user_id = p_user_id;

  IF credit_txn.id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH candidate_debits AS (
    SELECT
      t.id,
      t.merchant_name,
      t.merchant_normalized,
      t.amount,
      t.txn_time,
      t.reference_id,
      t.splitwise_expense_id,
      -- Calculate match score (0-100)
      0
      + CASE WHEN LOWER(t.merchant_normalized) = LOWER(credit_txn.merchant_normalized) THEN 40
             WHEN LOWER(t.merchant_name) ILIKE '%' || COALESCE(credit_txn.merchant_normalized, '') || '%' THEN 20
             ELSE 0 END
      + CASE WHEN t.amount >= credit_txn.amount THEN 30 ELSE 0 END
      + CASE WHEN t.txn_time >= (credit_txn.txn_time - INTERVAL '90 days')
             AND t.txn_time <= credit_txn.txn_time THEN 20 ELSE 0 END
      + CASE WHEN t.reference_id IS NOT NULL
             AND credit_txn.reference_id IS NOT NULL
             AND t.reference_id = credit_txn.reference_id THEN 10 ELSE 0 END
      AS score,
      ARRAY_REMOVE(ARRAY[
        CASE WHEN LOWER(t.merchant_normalized) = LOWER(credit_txn.merchant_normalized) THEN 'Exact merchant match' END,
        CASE WHEN t.amount >= credit_txn.amount THEN 'Amount eligible' END,
        CASE WHEN t.txn_time >= (credit_txn.txn_time - INTERVAL '90 days') THEN 'Within 90 days' END,
        CASE WHEN t.reference_id = credit_txn.reference_id THEN 'Reference match' END
      ], NULL) AS reasons
    FROM fb_emails_processed t
    WHERE t.user_id = p_user_id
      AND t.direction = 'debit'
      AND t.id != p_credit_id
      AND t.refund_of_transaction_id IS NULL
      AND t.txn_time >= (credit_txn.txn_time - INTERVAL '90 days')
      AND t.txn_time <= credit_txn.txn_time
      AND t.amount >= credit_txn.amount
  )
  SELECT cd.id, cd.merchant_name, cd.merchant_normalized, cd.amount,
         cd.txn_time, cd.reference_id, cd.splitwise_expense_id, cd.score, cd.reasons
  FROM candidate_debits cd
  WHERE cd.score > 0
  ORDER BY cd.score DESC, cd.txn_time DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Step 3.7: Refund comments
COMMENT ON COLUMN fb_emails_processed.refund_of_transaction_id IS 'Links this credit to the original debit transaction it refunds';
COMMENT ON COLUMN fb_emails_processed.refund_of_sub_transaction_id IS 'For item-level refunds, links to specific sub-transaction';
COMMENT ON COLUMN fb_emails_processed.is_refund IS 'Flag indicating this transaction is a refund of another transaction';
COMMENT ON COLUMN fb_emails_processed.refund_type IS 'Type of refund: full, partial, or item-level';
COMMENT ON COLUMN fb_emails_processed.refund_reason IS 'User-provided or AI-detected reason for the refund';
```

---

## 5. API Design

### 5.1 Sub-Transaction Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/transactions/[id]/sub-transactions` | POST | Create sub-transactions |
| `/api/transactions/[id]/sub-transactions` | GET | List sub-transactions |
| `/api/transactions/[id]/sub-transactions` | DELETE | Delete all sub-transactions |
| `/api/transactions/[id]/sub-transactions/[subId]` | PATCH | Update sub-transaction |
| `/api/transactions/[id]/sub-transactions/[subId]` | DELETE | Delete sub-transaction |

### 5.2 Receipt Endpoints *(NEW)*

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/transactions/[id]/receipts` | POST | Upload receipt file |
| `/api/transactions/[id]/receipts` | GET | List receipts for transaction |
| `/api/receipts/[id]` | GET | Get receipt with items |
| `/api/receipts/[id]` | PATCH | Update receipt metadata |
| `/api/receipts/[id]` | DELETE | Delete receipt + file |
| `/api/receipts/[id]/parse` | POST | Retry parsing |
| `/api/receipts/[id]/items` | GET | Get receipt items |
| `/api/receipts/[id]/items/[itemId]` | PATCH | Update single item |
| `/api/receipts/[id]/items/[itemId]` | DELETE | Delete single item |
| `/api/receipts/[id]/create-sub-transactions` | POST | Convert items to sub-txns |

### 5.2b Refund Endpoints *(NEW)*

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/transactions/[id]/link-refund` | POST | Link credit as refund of this transaction |
| `/api/transactions/[id]/link-refund` | DELETE | Unlink refund from transaction |
| `/api/transactions/[id]/refund-suggestions` | GET | Get smart matching suggestions |
| `/api/transactions/[id]/refund-status` | GET | Get refund status for transaction |

### 5.3 Receipt API Details

#### POST `/api/transactions/[id]/receipts`

Upload a receipt file and trigger parsing.

**Request**: `multipart/form-data`
```
file: <binary>  // Required: image or PDF
```

**Response (201)**:
```typescript
{
  success: true;
  receipt: {
    id: string;
    file_path: string;
    file_name: string;
    parsing_status: 'processing';
    // ... other fields
  };
  message: 'Receipt uploaded, parsing in progress';
}
```

#### GET `/api/receipts/[id]`

Get receipt with all items.

**Response (200)**:
```typescript
{
  success: true;
  receipt: {
    id: string;
    transaction_id: string;
    store_name: string;
    receipt_date: string;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    parsing_status: 'completed';
    confidence: number;
    items: ReceiptItem[];
  };
}
```

#### POST `/api/receipts/[id]/create-sub-transactions`

Convert receipt items to sub-transactions.

**Request**:
```typescript
{
  excludeItemIds?: string[];  // Items to exclude
  adjustLastItem?: boolean;   // Adjust last item to match parent
}
```

**Response (201)**:
```typescript
{
  success: true;
  subTransactions: SubTransaction[];
  validation: {
    receiptTotal: number;
    transactionAmount: number;
    difference: number;
    adjusted: boolean;
  };
}
```

---

## 6. TypeScript Types

### 6.1 Sub-Transaction Types

**File**: `src/types/sub-transactions.ts`

```typescript
import { Transaction } from '@/pages/transactions';

export interface SubTransactionFields {
  parent_transaction_id: string;
  is_sub_transaction: true;
  sub_transaction_order: number;
  receipt_item_id?: string;  // If created from receipt
}

export interface SubTransaction extends Transaction, SubTransactionFields {}

export interface TransactionWithSubTransactions extends Transaction {
  sub_transactions?: SubTransaction[];
  has_sub_transactions?: boolean;
  receipts?: Receipt[];  // NEW
  has_receipts?: boolean;  // NEW
}

export interface CreateSubTransactionInput {
  amount: number;
  category: string;
  merchant_name?: string;
  user_notes?: string;
  receipt_item_id?: string;  // NEW
}

export const SUB_TRANSACTION_LIMITS = {
  MIN_COUNT: 2,
  MAX_COUNT: 10,
  MIN_AMOUNT: 0.01,
  TOLERANCE: 0.01,
} as const;
```

### 6.2 Receipt Types *(NEW)*

**File**: `src/types/receipts.ts`

```typescript
export type ParsingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Receipt {
  id: string;
  user_id: string;
  transaction_id: string;

  // File info
  file_path: string;
  file_name: string;
  file_type: string;
  file_size?: number;

  // Parsed metadata
  store_name?: string;
  receipt_date?: string;
  receipt_number?: string;

  // Amounts
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  currency: string;

  // Parsing
  raw_ocr_text?: string;
  parsing_status: ParsingStatus;
  parsing_error?: string;
  confidence?: number;
  ai_model_used?: string;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Nested
  items?: ReceiptItem[];
}

export interface ReceiptItem {
  id: string;
  receipt_id: string;
  user_id: string;

  item_order: number;
  item_name: string;
  item_description?: string;
  quantity: number;
  unit?: string;
  unit_price?: number;
  total_price: number;

  category?: string;
  is_tax: boolean;
  is_discount: boolean;
  is_excluded: boolean;

  sub_transaction_id?: string;

  created_at: string;
  updated_at: string;
}

export interface CreateReceiptInput {
  file: File;
}

export interface UpdateReceiptInput {
  store_name?: string;
  receipt_date?: string;
  subtotal?: number;
  tax_amount?: number;
  total_amount?: number;
}

export interface UpdateReceiptItemInput {
  item_name?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  category?: string;
  is_excluded?: boolean;
}

export interface ParsedReceiptData {
  store_name?: string;
  receipt_date?: string;
  receipt_number?: string;
  currency?: string;
  items: {
    name: string;
    quantity?: number;
    unit?: string;
    unit_price?: number;
    total_price: number;
    category?: string;
    is_tax?: boolean;
    is_discount?: boolean;
  }[];
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
}

// Supabase Storage
export const RECEIPT_STORAGE = {
  BUCKET: 'receipts',
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
} as const;
```

---

## 7. UI Components

### 7.1 Sub-Transaction Components

#### SubTransactionEditor
**File**: `src/components/transactions/SubTransactionEditor.tsx`

Modal for manual sub-transaction creation with amount validation.

### 7.2 Receipt Components *(NEW)*

#### ReceiptUploader
**File**: `src/components/transactions/ReceiptUploader.tsx`

```typescript
interface ReceiptUploaderProps {
  transactionId: string;
  transactionAmount: number;
  onUploadComplete: (receipt: Receipt) => void;
  onCancel: () => void;
}
```

**UI Design**:
```
┌─────────────────────────────────────────────────────┐
│ Upload Receipt                              [×]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │                                               │  │
│  │     📷 Drag & drop receipt image here        │  │
│  │         or click to browse                   │  │
│  │                                               │  │
│  │     Supported: JPG, PNG, PDF (max 10MB)      │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  [Preview thumbnail after selection]                │
│                                                     │
│              [Cancel]  [Upload & Parse]             │
└─────────────────────────────────────────────────────┘
```

#### ReceiptViewer
**File**: `src/components/transactions/ReceiptViewer.tsx`

```typescript
interface ReceiptViewerProps {
  receipt: Receipt;
  onClose: () => void;
}
```

Displays receipt image with zoom/pan controls.

#### ReceiptItemsEditor
**File**: `src/components/transactions/ReceiptItemsEditor.tsx`

```typescript
interface ReceiptItemsEditorProps {
  receipt: Receipt;
  items: ReceiptItem[];
  transactionAmount: number;
  onItemsChange: (items: ReceiptItem[]) => void;
  onCreateSubTransactions: () => void;
}
```

**UI Design**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Receipt Items                               Store: Big Bazaar   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ □  Item Name          Qty    Price     Category     Total   │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ ☑  Rice Basmati       2 kg   ₹85.00    Groceries    ₹170.00 │ │
│ │ ☑  Cooking Oil        1 L    ₹145.00   Groceries    ₹145.00 │ │
│ │ ☑  Shampoo            1      ₹220.00   Personal     ₹220.00 │ │
│ │ ☑  Chips Lays         3      ₹30.00    Snacks       ₹90.00  │ │
│ │ ☐  CGST 2.5%          -      -         Tax          ₹15.63  │ │
│ │ ☐  SGST 2.5%          -      -         Tax          ₹15.62  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [+ Add Item]                                                    │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Subtotal:        ₹625.00                                    │ │
│ │ Tax:             ₹31.25                                     │ │
│ │ Receipt Total:   ₹656.25                                    │ │
│ │ ─────────────────────────────────────                       │ │
│ │ Transaction:     ₹656.00 (Difference: ₹0.25)               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ☑ Exclude tax items from sub-transactions                      │
│                                                                 │
│         [View Original]  [Create Sub-transactions (4 items)]   │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 TransactionModal Integration

**Changes to** `src/components/TransactionModal.tsx`:

Add new tabs/sections:
1. **Details** - Existing transaction details
2. **Receipt** - Upload/view receipt, parsed items
3. **Sub-transactions** - Manual splits or receipt-created
4. **Splitwise** - Existing integration

```
TransactionModal
├── [Header: Transaction Title + Amount]
├── [Tab Bar: Details | Receipt | Splits | Splitwise]
│
├── [Details Tab]
│   └── Existing form fields
│
├── [Receipt Tab]  ← NEW
│   ├── No receipt → ReceiptUploader
│   └── Has receipt →
│       ├── ReceiptViewer (thumbnail, click to expand)
│       ├── ReceiptItemsEditor
│       └── "Create Sub-transactions" button
│
├── [Splits Tab]
│   ├── No splits → SubTransactionEditor
│   └── Has splits → List of sub-transactions
│
└── [Splitwise Tab]
    └── Existing SplitwiseDropdown
```

---

## 8. Business Logic

### 8.1 Receipt Parsing Flow

```
1. User uploads receipt image
   ↓
2. Store file in Supabase Storage
   Path: {user_id}/{receipt_id}/{filename}
   ↓
3. Create fb_receipts record (status: 'processing')
   ↓
4. Call Claude Vision API
   - Send image as base64
   - Use structured extraction prompt
   ↓
5. Parse response → Create fb_receipt_items
   ↓
6. Update fb_receipts (status: 'completed', totals)
   ↓
7. Return receipt with items to frontend
```

### 8.2 Claude Vision Prompt

**File**: `src/lib/receipt-parsing/prompts.ts`

```typescript
export const RECEIPT_PARSING_PROMPT = `
Analyze this receipt image and extract structured data.

Return a JSON object with this exact structure:
{
  "store_name": "Store/merchant name",
  "receipt_date": "YYYY-MM-DD format or null",
  "receipt_number": "Receipt/invoice number or null",
  "currency": "INR" or detected currency code,
  "items": [
    {
      "name": "Item name as shown",
      "quantity": 1,
      "unit": "kg/L/pcs or null",
      "unit_price": 100.00,
      "total_price": 100.00,
      "category": "Groceries/Electronics/Personal/etc",
      "is_tax": false,
      "is_discount": false
    }
  ],
  "subtotal": 500.00,
  "tax_amount": 25.00,
  "discount_amount": 0,
  "total_amount": 525.00
}

Rules:
- Extract ALL line items including tax lines
- Mark tax lines with is_tax: true (CGST, SGST, GST, VAT, etc.)
- Mark discounts with is_discount: true
- Use null for missing/unclear values
- Amounts should be numbers, not strings
- Categories: Groceries, Electronics, Personal, Clothing, Food, Beverages, Household, Snacks, Other
- For Indian receipts, look for GST numbers (format: 22AAAAA0000A1Z5)
`;
```

### 8.3 Receipt → Sub-transactions Conversion

**Logic**:
```typescript
async function createSubTransactionsFromReceipt(
  receiptId: string,
  options: { excludeItemIds?: string[]; adjustLastItem?: boolean }
) {
  // 1. Get receipt with items
  const receipt = await getReceiptWithItems(receiptId);
  const transaction = await getTransaction(receipt.transaction_id);

  // 2. Filter items (exclude tax, discounts, user-excluded)
  const itemsToConvert = receipt.items.filter(item =>
    !item.is_tax &&
    !item.is_discount &&
    !item.is_excluded &&
    !options.excludeItemIds?.includes(item.id)
  );

  // 3. Calculate totals
  const itemsTotal = itemsToConvert.reduce((sum, i) => sum + i.total_price, 0);
  const transactionAmount = parseFloat(transaction.amount);
  const difference = Math.abs(transactionAmount - itemsTotal);

  // 4. Adjust if needed
  if (options.adjustLastItem && difference > 0.01 && difference < 10) {
    const lastItem = itemsToConvert[itemsToConvert.length - 1];
    lastItem.total_price += (transactionAmount - itemsTotal);
  }

  // 5. Validate
  if (itemsTotal > transactionAmount + 0.01) {
    throw new Error('Receipt items total exceeds transaction amount');
  }

  // 6. Create sub-transactions
  const subTransactions = await Promise.all(
    itemsToConvert.map((item, index) => createSubTransaction({
      parent_transaction_id: transaction.id,
      amount: item.total_price,
      category: item.category || transaction.category,
      merchant_name: receipt.store_name || transaction.merchant_name,
      is_sub_transaction: true,
      sub_transaction_order: index,
      receipt_item_id: item.id,
    }))
  );

  // 7. Update receipt items with sub_transaction_id
  await Promise.all(
    subTransactions.map((sub, index) =>
      updateReceiptItem(itemsToConvert[index].id, {
        sub_transaction_id: sub.id
      })
    )
  );

  return subTransactions;
}
```

---

## 9. Edge Cases

### 9.1 Sub-Transaction Edge Cases

| Scenario | Handling |
|----------|----------|
| Parent has sub-txns, user creates Splitwise | Cascade ID to all sub-txns |
| Delete sub-txn breaks sum | Allow, show warning |
| Nested sub-transactions | Blocked by trigger |
| Parent amount change with subs | Blocked by API |

### 9.2 Receipt Edge Cases *(NEW)*

| Scenario | Handling |
|----------|----------|
| Receipt total ≠ transaction amount | Show warning, allow proceed with adjustment option |
| Parsing fails | Set status='failed', allow retry |
| Blurry/unreadable receipt | Low confidence score, show warning |
| Receipt already exists | Allow multiple receipts per transaction |
| File too large | Reject with error (10MB limit) |
| Unsupported file type | Reject with error |
| Receipt items already converted | Block re-conversion, show message |
| User edits item after conversion | Update sub-transaction? (Option: keep independent) |

### 9.3 Integration Edge Cases

| Scenario | Handling |
|----------|----------|
| Manual sub-txns exist, user uploads receipt | Allow receipt, warn before converting |
| Receipt-based sub-txns exist, user adds manual | Allow, update totals |
| Delete receipt with converted items | Keep sub-txns, clear receipt_item_id |
| Delete sub-txn linked to receipt item | Clear sub_transaction_id on item |

---

## 10. Implementation Order

### Phase 1: Database (Day 1)
1. ✅ Design migration file (done in this doc)
2. Run migration on local Supabase
3. Configure storage bucket
4. Verify RLS policies

### Phase 2: Types & Validation (Day 1)
1. Create `src/types/sub-transactions.ts`
2. Create `src/types/receipts.ts`
3. Create `src/lib/validation/sub-transactions.ts`
4. Create `src/lib/validation/receipts.ts`

### Phase 3: Receipt Parsing Core (Day 2)
1. Create `src/lib/receipt-parsing/parser.ts` (Claude Vision integration)
2. Create `src/lib/receipt-parsing/prompts.ts`
3. Create `src/lib/receipt-parsing/storage.ts` (Supabase Storage helpers)

### Phase 4: Sub-Transaction APIs (Day 2)
1. Create sub-transaction CRUD endpoints
2. Modify existing transaction endpoints

### Phase 5: Receipt APIs (Day 3)
1. Create receipt upload endpoint
2. Create receipt CRUD endpoints
3. Create receipt → sub-txn conversion endpoint

### Phase 6: UI - Receipt Components (Day 3-4)
1. Create ReceiptUploader
2. Create ReceiptViewer
3. Create ReceiptItemsEditor

### Phase 7: UI - Sub-Transaction Components (Day 4)
1. Create SubTransactionEditor
2. Update TxnCard (expand/collapse)
3. Update TxnList (nested rendering)

### Phase 8: UI - Integration (Day 5)
1. Update TransactionModal (tabs, integration)
2. End-to-end testing
3. Error handling & polish

---

## 11. Testing Strategy

### 11.1 Database Tests

```sql
-- Test receipt creation
INSERT INTO fb_receipts (user_id, transaction_id, file_path, file_name, file_type)
VALUES ('user-uuid', 'txn-uuid', 'user-uuid/receipt-uuid/receipt.jpg', 'receipt.jpg', 'image/jpeg');

-- Test receipt item creation
INSERT INTO fb_receipt_items (receipt_id, user_id, item_name, total_price)
VALUES ('receipt-uuid', 'user-uuid', 'Test Item', 100.00);

-- Test sub-txn with receipt link
INSERT INTO fb_emails_processed (..., receipt_item_id)
VALUES (..., 'item-uuid');
```

### 11.2 API Tests

```bash
# Upload receipt
curl -X POST /api/transactions/{id}/receipts \
  -F "file=@receipt.jpg"

# Get receipt with items
curl /api/receipts/{id}

# Create sub-transactions from receipt
curl -X POST /api/receipts/{id}/create-sub-transactions \
  -d '{"excludeItemIds": []}'
```

### 11.3 E2E Flow Test

1. Open transaction (₹1000 grocery purchase)
2. Go to Receipt tab → Upload receipt image
3. Wait for parsing (Claude Vision)
4. Review parsed items (Rice ₹200, Oil ₹300, Vegetables ₹450, GST ₹50)
5. Edit item if needed (correct category)
6. Exclude GST from conversion
7. Click "Create Sub-transactions"
8. Verify 3 sub-transactions created (₹200 + ₹300 + ₹450 = ₹950)
9. See warning about ₹50 difference
10. Adjust last item to ₹500 → totals match
11. Go to Splits tab, see 3 sub-transactions
12. Create Splitwise on parent
13. Verify all sub-transactions have Splitwise ID

---

## 12. Receipt Parsing Feature

*(This section consolidates all receipt-specific details)*

### 12.1 Technology Choice

**Approach**: Claude Vision API (via existing Anthropic SDK)

**Rationale**:
- Already have Anthropic API key configured
- 90%+ accuracy on receipts
- Handles Indian receipts (INR, GST) well
- No additional dependencies
- Structured JSON output

**Alternative considered**: Tesseract.js + LLM
- Rejected: Extra complexity, lower accuracy

### 12.2 File Structure

```
src/
├── lib/
│   ├── receipt-parsing/
│   │   ├── parser.ts         -- Claude Vision integration
│   │   ├── prompts.ts        -- Extraction prompts
│   │   └── storage.ts        -- Supabase Storage helpers
│   └── validation/
│       └── receipts.ts       -- Receipt validation
├── pages/api/
│   ├── transactions/[id]/
│   │   └── receipts/
│   │       └── index.ts      -- POST (upload), GET (list)
│   └── receipts/
│       ├── [id]/
│       │   ├── index.ts      -- GET, PATCH, DELETE
│       │   ├── parse.ts      -- POST (retry parsing)
│       │   ├── items/
│       │   │   ├── index.ts  -- GET items
│       │   │   └── [itemId].ts -- PATCH, DELETE item
│       │   └── create-sub-transactions.ts -- POST
├── components/transactions/
│   ├── ReceiptUploader.tsx
│   ├── ReceiptViewer.tsx
│   └── ReceiptItemsEditor.tsx
└── types/
    └── receipts.ts
```

### 12.3 Constants

**File**: `src/lib/constants/receipts.ts`

```typescript
export const RECEIPT_CONFIG = {
  STORAGE_BUCKET: 'receipts',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ],
  PARSING_TIMEOUT: 30000, // 30 seconds
  DEFAULT_CURRENCY: 'INR',
} as const;

export const RECEIPT_CATEGORIES = [
  'Groceries',
  'Electronics',
  'Personal',
  'Clothing',
  'Food',
  'Beverages',
  'Household',
  'Snacks',
  'Medical',
  'Transport',
  'Entertainment',
  'Other',
] as const;
```

---

## 13. Smart Refund System

### 13.1 Overview

The Smart Refund System enables tracking refunds against original transactions with intelligent matching, partial refund support, and item-level refund tracking for sub-transactions.

**Core Capabilities:**
- **Full Refunds**: 100% of original transaction amount
- **Partial Refunds**: Any amount less than original (restocking fees, partial returns)
- **Item-Level Refunds**: Return specific items from a sub-transaction split
- **Smart Matching**: AI-assisted suggestion of original transactions for credit entries

### 13.2 Refund Types

```typescript
// src/types/refunds.ts

export type RefundType = 'full' | 'partial' | 'item';

export interface RefundLinkage {
  refund_of_transaction_id: string | null;      // Links to parent transaction
  refund_of_sub_transaction_id: string | null;  // Links to specific sub-txn/item
  is_refund: boolean;
  refund_type: RefundType | null;
  refund_reason: string | null;
}

export interface RefundStatus {
  transaction_id: string;
  original_amount: number;
  total_refunded: number;
  remaining_amount: number;
  refund_percentage: number;
  is_fully_refunded: boolean;
  refund_count: number;
  refunds: RefundTransaction[];
}

export interface RefundTransaction {
  id: string;
  amount: number;
  refund_type: RefundType;
  refund_reason: string | null;
  txn_time: string;
  merchant_name: string;
}

export interface RefundSuggestion {
  transaction_id: string;
  merchant_name: string;
  amount: number;
  txn_time: string;
  match_score: number;           // 0-100
  match_reasons: string[];       // Why this was suggested
  remaining_refundable: number;  // Amount not yet refunded
  has_sub_transactions: boolean;
  sub_transactions?: SubTransactionSuggestion[];
}

export interface SubTransactionSuggestion {
  id: string;
  merchant_name: string;
  category: string;
  amount: number;
  remaining_refundable: number;
  receipt_item_name?: string;    // If linked to receipt item
}

export interface LinkRefundRequest {
  refund_of_transaction_id?: string;
  refund_of_sub_transaction_id?: string;
  refund_type: RefundType;
  refund_reason?: string;
}
```

### 13.3 Smart Matching Algorithm

The system uses a weighted scoring algorithm to suggest original transactions for credit entries:

```typescript
// src/lib/refunds/matching.ts

interface MatchConfig {
  merchantWeight: number;      // 40 points max
  amountWeight: number;        // 30 points max
  timeProximityWeight: number; // 20 points max
  referenceWeight: number;     // 10 points max
}

const DEFAULT_CONFIG: MatchConfig = {
  merchantWeight: 40,
  amountWeight: 30,
  timeProximityWeight: 20,
  referenceWeight: 10,
};

/**
 * Scoring breakdown:
 * - Merchant match (exact/normalized): 40 points
 * - Amount match (exact=30, within 10%=20, within 25%=10): 30 points max
 * - Time proximity (0-7 days=20, 8-14 days=15, 15-30 days=10, 31-60 days=5): 20 points max
 * - Reference ID match: 10 points
 *
 * Minimum threshold for suggestion: 50 points
 */
export function calculateMatchScore(
  credit: Transaction,
  debit: Transaction,
  config: MatchConfig = DEFAULT_CONFIG
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Merchant matching (40 points)
  if (credit.merchant_normalized && debit.merchant_normalized) {
    if (credit.merchant_normalized === debit.merchant_normalized) {
      score += config.merchantWeight;
      reasons.push('Exact merchant match');
    } else if (credit.merchant_name?.toLowerCase().includes(debit.merchant_name?.toLowerCase() || '')) {
      score += config.merchantWeight * 0.7;
      reasons.push('Similar merchant name');
    }
  }

  // Amount matching (30 points)
  const amountRatio = credit.amount / debit.amount;
  if (amountRatio === 1) {
    score += config.amountWeight;
    reasons.push('Exact amount match (likely full refund)');
  } else if (amountRatio >= 0.9 && amountRatio <= 1) {
    score += config.amountWeight * 0.67;
    reasons.push('Amount within 10% (possible restocking fee)');
  } else if (amountRatio >= 0.75 && amountRatio < 0.9) {
    score += config.amountWeight * 0.33;
    reasons.push('Amount within 25% (partial refund)');
  } else if (amountRatio > 0 && amountRatio < 0.75) {
    score += config.amountWeight * 0.2;
    reasons.push('Partial amount (item-level refund likely)');
  }

  // Time proximity (20 points) - credit should be AFTER debit
  const daysDiff = Math.floor(
    (new Date(credit.txn_time).getTime() - new Date(debit.txn_time).getTime())
    / (1000 * 60 * 60 * 24)
  );

  if (daysDiff >= 0 && daysDiff <= 7) {
    score += config.timeProximityWeight;
    reasons.push('Within 7 days');
  } else if (daysDiff > 7 && daysDiff <= 14) {
    score += config.timeProximityWeight * 0.75;
    reasons.push('Within 14 days');
  } else if (daysDiff > 14 && daysDiff <= 30) {
    score += config.timeProximityWeight * 0.5;
    reasons.push('Within 30 days');
  } else if (daysDiff > 30 && daysDiff <= 60) {
    score += config.timeProximityWeight * 0.25;
    reasons.push('Within 60 days');
  }

  // Reference ID matching (10 points)
  if (credit.reference_id && debit.reference_id) {
    if (credit.reference_id === debit.reference_id) {
      score += config.referenceWeight;
      reasons.push('Reference ID match');
    } else if (credit.reference_id.includes(debit.reference_id) ||
               debit.reference_id.includes(credit.reference_id)) {
      score += config.referenceWeight * 0.5;
      reasons.push('Partial reference match');
    }
  }

  return { score: Math.round(score), reasons };
}
```

### 13.4 UI Components

#### 13.4.1 RefundStatusBadge

```tsx
// src/components/transactions/RefundStatusBadge.tsx

import { memo } from 'react';
import { Undo2, CheckCircle2, AlertCircle } from 'lucide-react';

interface RefundStatusBadgeProps {
  status: RefundStatus | null;
  isRefund?: boolean;
  compact?: boolean;
}

export const RefundStatusBadge = memo(function RefundStatusBadge({
  status,
  isRefund,
  compact = false
}: RefundStatusBadgeProps) {
  // This transaction IS a refund
  if (isRefund) {
    return (
      <div className="flex items-center gap-1 text-blue-400">
        <Undo2 className="h-3 w-3" />
        {!compact && <span className="text-xs">Refund</span>}
      </div>
    );
  }

  // This transaction has refunds against it
  if (!status || status.refund_count === 0) return null;

  if (status.is_fully_refunded) {
    return (
      <div className="flex items-center gap-1 text-green-400">
        <CheckCircle2 className="h-3 w-3" />
        {!compact && <span className="text-xs">Fully Refunded</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-amber-400">
      <AlertCircle className="h-3 w-3" />
      {!compact && (
        <span className="text-xs">
          {Math.round(status.refund_percentage)}% Refunded
        </span>
      )}
    </div>
  );
});
```

#### 13.4.2 RefundLinkModal

```tsx
// src/components/transactions/RefundLinkModal.tsx

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, Link2, Unlink, AlertTriangle } from 'lucide-react';

interface RefundLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditTransaction: Transaction;
  onLink: (request: LinkRefundRequest) => Promise<void>;
  onUnlink: () => Promise<void>;
}

export function RefundLinkModal({
  isOpen,
  onClose,
  creditTransaction,
  onLink,
  onUnlink
}: RefundLinkModalProps) {
  const [suggestions, setSuggestions] = useState<RefundSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [selectedSubTransaction, setSelectedSubTransaction] = useState<string | null>(null);
  const [refundType, setRefundType] = useState<RefundType>('full');
  const [refundReason, setRefundReason] = useState('');
  const [hasSplitwiseWarning, setHasSplitwiseWarning] = useState(false);

  useEffect(() => {
    if (isOpen && creditTransaction.direction === 'credit') {
      fetchSuggestions();
    }
  }, [isOpen, creditTransaction.id]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/transactions/${creditTransaction.id}/refund-suggestions`
      );
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTransaction = (txnId: string) => {
    setSelectedTransaction(txnId);
    setSelectedSubTransaction(null);

    const selected = suggestions.find(s => s.transaction_id === txnId);
    if (selected) {
      // Auto-detect refund type
      if (creditTransaction.amount === selected.remaining_refundable) {
        setRefundType('full');
      } else if (selected.has_sub_transactions) {
        setRefundType('item');
      } else {
        setRefundType('partial');
      }

      // Check for Splitwise warning
      // (would need to fetch transaction details to check splitwise_expense_id)
    }
  };

  const handleLink = async () => {
    if (!selectedTransaction) return;

    await onLink({
      refund_of_transaction_id: selectedTransaction,
      refund_of_sub_transaction_id: selectedSubTransaction || undefined,
      refund_type: refundType,
      refund_reason: refundReason || undefined,
    });

    onClose();
  };

  const isAlreadyLinked = creditTransaction.refund_of_transaction_id !== null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Link as Refund
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Credit transaction info */}
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="text-sm text-muted-foreground">Credit Amount</div>
            <div className="text-lg font-mono text-green-400">
              +₹{creditTransaction.amount.toLocaleString('en-IN')}
            </div>
            <div className="text-sm">{creditTransaction.merchant_name}</div>
          </div>

          {/* Already linked warning */}
          {isAlreadyLinked && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Already linked as refund</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={onUnlink}
              >
                <Unlink className="h-4 w-4 mr-2" />
                Unlink Refund
              </Button>
            </div>
          )}

          {/* Suggestions */}
          {!isAlreadyLinked && (
            <>
              <div>
                <Label className="text-sm font-medium">
                  Suggested Original Transactions
                </Label>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    No matching transactions found
                  </div>
                ) : (
                  <RadioGroup
                    value={selectedTransaction || ''}
                    onValueChange={handleSelectTransaction}
                    className="mt-2 space-y-2"
                  >
                    {suggestions.map((suggestion) => (
                      <div
                        key={suggestion.transaction_id}
                        className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                          selectedTransaction === suggestion.transaction_id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-border/80'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <RadioGroupItem
                            value={suggestion.transaction_id}
                            id={suggestion.transaction_id}
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">
                                  {suggestion.merchant_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(suggestion.txn_time).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono text-red-400">
                                  -₹{suggestion.amount.toLocaleString('en-IN')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {suggestion.match_score}% match
                                </div>
                              </div>
                            </div>

                            {/* Match reasons */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {suggestion.match_reasons.map((reason, i) => (
                                <span
                                  key={i}
                                  className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                                >
                                  {reason}
                                </span>
                              ))}
                            </div>

                            {/* Sub-transactions if item-level */}
                            {suggestion.has_sub_transactions &&
                             selectedTransaction === suggestion.transaction_id && (
                              <div className="mt-3 pl-4 border-l-2 border-border space-y-2">
                                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                                  Or select specific item:
                                </div>
                                {suggestion.sub_transactions?.map((sub) => (
                                  <div
                                    key={sub.id}
                                    className={`p-2 rounded border cursor-pointer ${
                                      selectedSubTransaction === sub.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border/50'
                                    }`}
                                    onClick={() => {
                                      setSelectedSubTransaction(sub.id);
                                      setRefundType('item');
                                    }}
                                  >
                                    <div className="flex justify-between">
                                      <span className="text-sm">
                                        {sub.receipt_item_name || sub.merchant_name}
                                      </span>
                                      <span className="font-mono text-sm">
                                        ₹{sub.amount.toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </div>

              {/* Refund type selection */}
              {selectedTransaction && (
                <div>
                  <Label className="text-sm font-medium">Refund Type</Label>
                  <Select value={refundType} onValueChange={(v) => setRefundType(v as RefundType)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Refund</SelectItem>
                      <SelectItem value="partial">Partial Refund</SelectItem>
                      <SelectItem value="item">Item Return</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Reason */}
              {selectedTransaction && (
                <div>
                  <Label className="text-sm font-medium">Reason (optional)</Label>
                  <Input
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="e.g., Defective product, Wrong size..."
                    className="mt-1"
                  />
                </div>
              )}

              {/* Splitwise warning */}
              {hasSplitwiseWarning && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Original transaction was split on Splitwise
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Consider creating a reverse expense in Splitwise to settle the refund.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleLink}
                  disabled={!selectedTransaction}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Link Refund
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 13.5 API Implementation

#### 13.5.1 Link Refund API

```typescript
// src/pages/api/transactions/[id]/link-refund.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { TABLE_EMAILS_PROCESSED } from '@/lib/constants/database';
import { LinkRefundRequest } from '@/types/refunds';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  const { id } = req.query; // This is the CREDIT transaction being marked as refund

  if (req.method === 'POST') {
    // Link credit as refund
    const {
      refund_of_transaction_id,
      refund_of_sub_transaction_id,
      refund_type,
      refund_reason
    } = req.body as LinkRefundRequest;

    // Validate credit transaction exists and belongs to user
    const { data: creditTxn, error: creditError } = await supabaseAdmin
      .from(TABLE_EMAILS_PROCESSED)
      .select('id, direction, amount')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (creditError || !creditTxn) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (creditTxn.direction !== 'credit') {
      return res.status(400).json({ error: 'Only credit transactions can be linked as refunds' });
    }

    // Validate target transaction exists
    const { data: targetTxn, error: targetError } = await supabaseAdmin
      .from(TABLE_EMAILS_PROCESSED)
      .select('id, direction, amount, splitwise_expense_id')
      .eq('id', refund_of_transaction_id)
      .eq('user_id', user.id)
      .single();

    if (targetError || !targetTxn) {
      return res.status(404).json({ error: 'Target transaction not found' });
    }

    if (targetTxn.direction !== 'debit') {
      return res.status(400).json({ error: 'Can only link refunds to debit transactions' });
    }

    // Check if sub-transaction target is valid (if provided)
    if (refund_of_sub_transaction_id) {
      const { data: subTxn, error: subError } = await supabaseAdmin
        .from(TABLE_EMAILS_PROCESSED)
        .select('id, parent_transaction_id')
        .eq('id', refund_of_sub_transaction_id)
        .eq('user_id', user.id)
        .single();

      if (subError || !subTxn || subTxn.parent_transaction_id !== refund_of_transaction_id) {
        return res.status(400).json({
          error: 'Sub-transaction not found or does not belong to target transaction'
        });
      }
    }

    // Update credit transaction with refund linkage
    const { data, error } = await supabaseAdmin
      .from(TABLE_EMAILS_PROCESSED)
      .update({
        refund_of_transaction_id,
        refund_of_sub_transaction_id,
        is_refund: true,
        refund_type,
        refund_reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to link refund:', error);
      return res.status(500).json({ error: 'Failed to link refund' });
    }

    // Return with Splitwise warning if applicable
    return res.status(200).json({
      success: true,
      transaction: data,
      splitwise_warning: targetTxn.splitwise_expense_id ? {
        message: 'Original transaction was split on Splitwise',
        expense_id: targetTxn.splitwise_expense_id
      } : null
    });

  } else if (req.method === 'DELETE') {
    // Unlink refund
    const { data, error } = await supabaseAdmin
      .from(TABLE_EMAILS_PROCESSED)
      .update({
        refund_of_transaction_id: null,
        refund_of_sub_transaction_id: null,
        is_refund: false,
        refund_type: null,
        refund_reason: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to unlink refund:', error);
      return res.status(500).json({ error: 'Failed to unlink refund' });
    }

    return res.status(200).json({ success: true, transaction: data });

  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
});
```

#### 13.5.2 Refund Suggestions API

```typescript
// src/pages/api/transactions/[id]/refund-suggestions.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { TABLE_EMAILS_PROCESSED } from '@/lib/constants/database';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const minScore = parseInt(req.query.min_score as string) || 50;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);

  // Get the credit transaction
  const { data: creditTxn, error: creditError } = await supabaseAdmin
    .from(TABLE_EMAILS_PROCESSED)
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (creditError || !creditTxn) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  if (creditTxn.direction !== 'credit') {
    return res.status(400).json({ error: 'Only credit transactions can have refund suggestions' });
  }

  // Call database function for suggestions
  const { data: suggestions, error } = await supabaseAdmin.rpc(
    'suggest_refund_matches',
    {
      p_credit_txn_id: id,
      p_user_id: user.id,
      p_min_score: minScore,
      p_limit: limit
    }
  );

  if (error) {
    console.error('Failed to get refund suggestions:', error);
    return res.status(500).json({ error: 'Failed to get suggestions' });
  }

  // For each suggestion, fetch sub-transactions if they exist
  const enrichedSuggestions = await Promise.all(
    (suggestions || []).map(async (suggestion: any) => {
      if (suggestion.has_sub_transactions) {
        const { data: subs } = await supabaseAdmin
          .from(TABLE_EMAILS_PROCESSED)
          .select(`
            id,
            merchant_name,
            category,
            amount,
            receipt_item_id
          `)
          .eq('parent_transaction_id', suggestion.transaction_id)
          .eq('is_sub_transaction', true)
          .eq('user_id', user.id)
          .order('sub_transaction_order');

        // Get receipt item names if linked
        if (subs && subs.length > 0) {
          const itemIds = subs.filter(s => s.receipt_item_id).map(s => s.receipt_item_id);
          let itemNames: Record<string, string> = {};

          if (itemIds.length > 0) {
            const { data: items } = await supabaseAdmin
              .from('fb_receipt_items')
              .select('id, item_name')
              .in('id', itemIds);

            itemNames = (items || []).reduce((acc, item) => {
              acc[item.id] = item.item_name;
              return acc;
            }, {} as Record<string, string>);
          }

          suggestion.sub_transactions = subs.map(sub => ({
            ...sub,
            receipt_item_name: sub.receipt_item_id ? itemNames[sub.receipt_item_id] : null,
            remaining_refundable: sub.amount // TODO: calculate actual remaining
          }));
        }
      }
      return suggestion;
    })
  );

  return res.status(200).json({
    success: true,
    credit_transaction: {
      id: creditTxn.id,
      amount: creditTxn.amount,
      merchant_name: creditTxn.merchant_name,
      txn_time: creditTxn.txn_time
    },
    suggestions: enrichedSuggestions
  });
});
```

### 13.6 Business Rules

#### 13.6.1 Validation Rules

1. **Direction Constraint**: Only `credit` transactions can be marked as refunds
2. **Target Constraint**: Refunds can only link to `debit` transactions
3. **Amount Validation**: Sum of all refunds ≤ original transaction amount (enforced by trigger)
4. **Self-Reference Prevention**: Transaction cannot be its own refund
5. **Chain Prevention**: A refund cannot be marked as a refund of another refund
6. **Sub-transaction Hierarchy**: Item-level refunds must link to valid sub-transactions of the parent

#### 13.6.2 Edge Cases

| Scenario | Handling |
|----------|----------|
| Multiple partial refunds | Allowed, tracked separately, sum validated |
| Refund > original amount | Blocked by database trigger |
| Delete original transaction | Refund linkage set to NULL (ON DELETE SET NULL) |
| Delete sub-transaction | Item refund linkage set to NULL |
| Splitwise split transaction | Warning shown, manual Splitwise adjustment suggested |
| Already refunded sub-item | Show remaining refundable amount |

#### 13.6.3 Splitwise Integration

When a transaction with a Splitwise expense is refunded:

1. **Display Warning**: Show that original was split on Splitwise
2. **No Auto-Modification**: Never automatically modify Splitwise expenses
3. **Suggest Actions**:
   - For full refund: Suggest deleting the Splitwise expense
   - For partial refund: Suggest creating a reverse/settlement expense
4. **Future Enhancement**: "Create Reverse Expense" button to auto-create

### 13.7 TxnCard Updates for Refunds

```tsx
// Updates to src/components/transactions/TxnCard.tsx

// Add to the transaction info section:
{transaction.is_refund && (
  <div className="flex items-center gap-1 text-blue-400">
    <Undo2 className="h-3 w-3" />
    <span className="text-xs">Refund</span>
  </div>
)}

// Add refund status indicator for debit transactions:
{transaction.direction === 'debit' && transaction.refund_status && (
  <RefundStatusBadge status={transaction.refund_status} compact />
)}
```

### 13.8 Implementation Checklist

| Task | Status |
|------|--------|
| Add refund columns to migration | ✅ Included in Section 4.1b |
| Create refund types | Pending |
| Create matching algorithm | Pending |
| Create RefundStatusBadge component | Pending |
| Create RefundLinkModal component | Pending |
| Create link-refund API | Pending |
| Create refund-suggestions API | Pending |
| Create refund-status API | Pending |
| Update TxnCard for refund display | Pending |
| Update TransactionModal with refund tab | Pending |
| Add Splitwise warning logic | Pending |

---

## Appendix A: Files Summary

### New Files

| File | Purpose |
|------|---------|
| `infra/migrations/0006_sub_transactions_and_receipts.sql` | Database migration |
| `src/types/sub-transactions.ts` | Sub-transaction types |
| `src/types/receipts.ts` | Receipt types |
| `src/lib/validation/sub-transactions.ts` | Sub-txn validation |
| `src/lib/validation/receipts.ts` | Receipt validation |
| `src/lib/receipt-parsing/parser.ts` | Claude Vision integration |
| `src/lib/receipt-parsing/prompts.ts` | AI prompts |
| `src/lib/receipt-parsing/storage.ts` | Storage helpers |
| `src/lib/constants/receipts.ts` | Receipt constants |
| `src/pages/api/transactions/[id]/sub-transactions/index.ts` | Sub-txn bulk API |
| `src/pages/api/transactions/[id]/sub-transactions/[subId].ts` | Sub-txn single API |
| `src/pages/api/transactions/[id]/receipts/index.ts` | Receipt upload/list |
| `src/pages/api/receipts/[id]/index.ts` | Receipt CRUD |
| `src/pages/api/receipts/[id]/parse.ts` | Retry parsing |
| `src/pages/api/receipts/[id]/items/index.ts` | Receipt items |
| `src/pages/api/receipts/[id]/items/[itemId].ts` | Single item CRUD |
| `src/pages/api/receipts/[id]/create-sub-transactions.ts` | Conversion |
| `src/components/transactions/SubTransactionEditor.tsx` | Manual split UI |
| `src/components/transactions/ReceiptUploader.tsx` | Upload UI |
| `src/components/transactions/ReceiptViewer.tsx` | View receipt |
| `src/components/transactions/ReceiptItemsEditor.tsx` | Edit items |
| `src/types/refunds.ts` | Refund types & interfaces |
| `src/lib/refunds/matching.ts` | Smart matching algorithm |
| `src/pages/api/transactions/[id]/link-refund.ts` | Link/unlink refund API |
| `src/pages/api/transactions/[id]/refund-suggestions.ts` | Smart suggestions API |
| `src/pages/api/transactions/[id]/refund-status.ts` | Refund status API |
| `src/components/transactions/RefundStatusBadge.tsx` | Refund status indicator |
| `src/components/transactions/RefundLinkModal.tsx` | Refund linking UI |

### Modified Files

| File | Changes |
|------|---------|
| `src/pages/api/transactions/[id]/index.ts` | Include subs, receipts & refund status |
| `src/pages/api/transactions/search.ts` | Filter sub-txns, include refund fields |
| `src/pages/transactions.tsx` | Add type fields, refund status |
| `src/components/transactions/TxnCard.tsx` | Expand/collapse, badges, refund indicators |
| `src/components/transactions/TxnList.tsx` | Nested rendering |
| `src/components/TransactionModal.tsx` | Tabs for receipt, splits & refund linking |

---

## Appendix B: Database Table Reference

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `fb_emails_processed` | Transactions + sub-transactions + refunds | `parent_transaction_id`, `is_sub_transaction`, `receipt_item_id`, `refund_of_transaction_id`, `is_refund`, `refund_type` |
| `fb_receipts` | Uploaded receipt files | `transaction_id`, `file_path`, `parsing_status`, `total_amount` |
| `fb_receipt_items` | Parsed line items | `receipt_id`, `item_name`, `total_price`, `sub_transaction_id` |

**New Refund Columns on fb_emails_processed**:
| Column | Type | Description |
|--------|------|-------------|
| `refund_of_transaction_id` | UUID | FK to original debit transaction |
| `refund_of_sub_transaction_id` | UUID | FK to specific sub-transaction being refunded |
| `is_refund` | BOOLEAN | Flag indicating this is a refund |
| `refund_type` | TEXT | 'full', 'partial', or 'item' |
| `refund_reason` | TEXT | User-provided reason for refund |

**Relationships**:
```
Transaction (fb_emails_processed)
├── 1:N → Sub-transactions (self-referential via parent_transaction_id)
├── 1:N → Refunds (self-referential via refund_of_transaction_id)
│         └── N:1 → Original debit transaction
│         └── N:1 → Sub-transaction (for item-level refunds)
├── 1:N → Receipts (fb_receipts)
│         └── 1:N → Receipt Items (fb_receipt_items)
│                   └── 1:1 → Sub-transaction (bidirectional link)
└── 1:1 → Splitwise expense (external)
```

**Database Functions**:
| Function | Purpose |
|----------|---------|
| `get_refund_status(txn_id)` | Returns refund status for a transaction |
| `suggest_refund_matches(credit_id, user_id, min_score, limit)` | Smart matching for refund suggestions |
| `validate_refund_linkage()` | Trigger function to validate refund constraints |

---

## Appendix C: Comprehensive API Specifications

### C.1 Sub-Transaction APIs - Complete Specifications

#### C.1.1 POST `/api/transactions/[id]/sub-transactions`

**Purpose**: Create multiple sub-transactions for a parent transaction

**Authentication**: Required (JWT via `withAuth`)

**Authorization**: User must own the parent transaction

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Parent transaction ID |

**Request Body**:
```typescript
{
  sub_transactions: Array<{
    amount: number;           // Required: Amount > 0, max 2 decimal places
    category: string;         // Required: Non-empty, max 100 chars
    merchant_name?: string;   // Optional: Max 200 chars
    user_notes?: string;      // Optional: Max 500 chars
    receipt_item_id?: string; // Optional: UUID of linked receipt item
  }>;
  validate_only?: boolean;    // Optional: If true, only validate without creating
}
```

**Validation Rules**:
| Field | Rule | Error Code |
|-------|------|------------|
| `id` | Must be valid UUID | `INVALID_PARENT_ID` |
| `id` | Transaction must exist | `PARENT_NOT_FOUND` |
| `id` | User must own transaction | `UNAUTHORIZED` |
| `id` | Parent cannot be a sub-transaction | `NESTED_SUB_TRANSACTIONS` |
| `sub_transactions` | Array length 2-10 | `INVALID_SUB_COUNT` |
| `amount` | Must be > 0 | `INVALID_AMOUNT` |
| `amount` | Must have ≤ 2 decimal places | `INVALID_DECIMAL_PLACES` |
| `amount` | Sum must equal parent amount (±0.01) | `AMOUNT_MISMATCH` |
| `category` | Non-empty, ≤ 100 chars | `INVALID_CATEGORY` |
| `receipt_item_id` | Must belong to a receipt of this transaction | `INVALID_RECEIPT_ITEM` |

**Success Response (201 Created)**:
```typescript
{
  success: true;
  sub_transactions: Array<{
    id: string;
    parent_transaction_id: string;
    is_sub_transaction: true;
    sub_transaction_order: number;
    amount: number;
    category: string;
    merchant_name: string;
    user_notes: string | null;
    receipt_item_id: string | null;
    splitwise_expense_id: string | null;  // Cascaded from parent
    created_at: string;
    updated_at: string;
  }>;
  validation: {
    parent_amount: number;
    sub_total: number;
    difference: number;
    is_valid: true;
  };
}
```

**Error Responses**:

| Status | Error Code | Description |
|--------|------------|-------------|
| 400 | `INVALID_PARENT_ID` | Parent transaction ID is not a valid UUID |
| 400 | `NESTED_SUB_TRANSACTIONS` | Cannot create sub-transactions of a sub-transaction |
| 400 | `INVALID_SUB_COUNT` | Must create between 2 and 10 sub-transactions |
| 400 | `INVALID_AMOUNT` | Amount must be positive number |
| 400 | `AMOUNT_MISMATCH` | Sub-transaction amounts don't equal parent (within tolerance) |
| 400 | `HAS_EXISTING_SUBS` | Transaction already has sub-transactions |
| 401 | `UNAUTHORIZED` | User not authenticated or doesn't own transaction |
| 404 | `PARENT_NOT_FOUND` | Parent transaction not found |
| 500 | `INTERNAL_ERROR` | Database or server error |

**Error Response Format**:
```typescript
{
  success: false;
  error: string;                // Human-readable message
  error_code: string;           // Machine-readable code
  details?: {
    field?: string;             // Field that caused error
    expected?: any;             // Expected value/format
    received?: any;             // Received value
    validation?: {              // For amount validation errors
      parent_amount: number;
      sub_total: number;
      difference: number;
      tolerance: number;
    };
  };
}
```

**Example Request**:
```bash
curl -X POST \
  'https://api.financebuddy.com/api/transactions/abc123-def456/sub-transactions' \
  -H 'Authorization: Bearer eyJhbGc...' \
  -H 'Content-Type: application/json' \
  -d '{
    "sub_transactions": [
      {"amount": 500.00, "category": "Groceries", "merchant_name": "Rice"},
      {"amount": 300.00, "category": "Groceries", "merchant_name": "Vegetables"},
      {"amount": 200.00, "category": "Household", "merchant_name": "Cleaning"}
    ]
  }'
```

---

#### C.1.2 GET `/api/transactions/[id]/sub-transactions`

**Purpose**: List all sub-transactions for a parent transaction

**Request Headers**:
```
Authorization: Bearer <jwt_token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Parent transaction ID |

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `include_receipt_items` | boolean | false | Include linked receipt item details |

**Success Response (200 OK)**:
```typescript
{
  success: true;
  parent_transaction: {
    id: string;
    amount: number;
    merchant_name: string;
    category: string;
    splitwise_expense_id: string | null;
  };
  sub_transactions: Array<{
    id: string;
    sub_transaction_order: number;
    amount: number;
    category: string;
    merchant_name: string;
    user_notes: string | null;
    receipt_item_id: string | null;
    receipt_item?: {          // Only if include_receipt_items=true
      item_name: string;
      quantity: number;
      unit_price: number;
    };
    created_at: string;
    updated_at: string;
  }>;
  summary: {
    count: number;
    total_amount: number;
    parent_amount: number;
    difference: number;
  };
}
```

---

#### C.1.3 DELETE `/api/transactions/[id]/sub-transactions`

**Purpose**: Delete ALL sub-transactions for a parent transaction

**Warning**: This operation is irreversible

**Success Response (200 OK)**:
```typescript
{
  success: true;
  deleted_count: number;
  message: string;  // "Deleted 5 sub-transactions"
}
```

---

#### C.1.4 PATCH `/api/transactions/[id]/sub-transactions/[subId]`

**Purpose**: Update a single sub-transaction

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Parent transaction ID |
| `subId` | UUID | Yes | Sub-transaction ID |

**Request Body** (all fields optional):
```typescript
{
  amount?: number;           // New amount (triggers total validation)
  category?: string;
  merchant_name?: string;
  user_notes?: string;
}
```

**Validation Rules**:
- If `amount` is changed, new sum of all sub-transactions must equal parent (±0.01)
- Sub-transaction must belong to the specified parent

**Success Response (200 OK)**:
```typescript
{
  success: true;
  sub_transaction: SubTransaction;
  validation?: {              // Only if amount changed
    new_total: number;
    parent_amount: number;
    difference: number;
  };
}
```

---

#### C.1.5 DELETE `/api/transactions/[id]/sub-transactions/[subId]`

**Purpose**: Delete a single sub-transaction

**Warning Conditions**:
- If this leaves only 1 sub-transaction, warn user (should delete all or keep at least 2)
- If linked to receipt item, warn that linkage will be lost

**Success Response (200 OK)**:
```typescript
{
  success: true;
  deleted_id: string;
  warning?: {
    type: 'SINGLE_REMAINING' | 'RECEIPT_LINK_LOST';
    message: string;
  };
  remaining: {
    count: number;
    total_amount: number;
    parent_amount: number;
    difference: number;
  };
}
```

---

### C.2 Receipt APIs - Complete Specifications

#### C.2.1 POST `/api/transactions/[id]/receipts`

**Purpose**: Upload a receipt file and trigger AI parsing

**Content-Type**: `multipart/form-data`

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Receipt image or PDF |

**File Validation**:
| Rule | Limit | Error Code |
|------|-------|------------|
| Max file size | 10MB | `FILE_TOO_LARGE` |
| Allowed types | JPEG, PNG, WebP, PDF | `INVALID_FILE_TYPE` |
| Min dimensions | 200x200px | `IMAGE_TOO_SMALL` |
| Max dimensions | 10000x10000px | `IMAGE_TOO_LARGE` |

**Processing Flow**:
1. Validate file type and size
2. Upload to Supabase Storage: `receipts/{user_id}/{receipt_id}/{filename}`
3. Create `fb_receipts` record with `parsing_status: 'processing'`
4. Send to Claude Vision API asynchronously
5. Return immediately with receipt ID (parsing continues in background)

**Success Response (201 Created)**:
```typescript
{
  success: true;
  receipt: {
    id: string;
    transaction_id: string;
    file_path: string;
    file_name: string;
    file_type: string;
    file_size: number;
    parsing_status: 'processing';
    created_at: string;
  };
  message: 'Receipt uploaded, parsing in progress';
  estimated_parse_time: '5-10 seconds';
}
```

**Error Responses**:
| Status | Error Code | Description |
|--------|------------|-------------|
| 400 | `NO_FILE` | No file provided in request |
| 400 | `FILE_TOO_LARGE` | File exceeds 10MB limit |
| 400 | `INVALID_FILE_TYPE` | File type not supported |
| 400 | `IMAGE_TOO_SMALL` | Image dimensions too small |
| 400 | `CORRUPT_FILE` | File is corrupt or unreadable |
| 401 | `UNAUTHORIZED` | User not authenticated |
| 404 | `TRANSACTION_NOT_FOUND` | Transaction not found |
| 500 | `STORAGE_ERROR` | Failed to upload to storage |
| 500 | `DATABASE_ERROR` | Failed to create receipt record |

---

#### C.2.2 GET `/api/receipts/[id]`

**Purpose**: Get receipt with all parsed items

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `include_signed_url` | boolean | false | Include temporary signed URL for image |

**Success Response (200 OK)**:
```typescript
{
  success: true;
  receipt: {
    id: string;
    user_id: string;
    transaction_id: string;

    // File info
    file_path: string;
    file_name: string;
    file_type: string;
    file_size: number;
    signed_url?: string;      // Only if include_signed_url=true, expires in 1 hour

    // Parsed metadata
    store_name: string | null;
    receipt_date: string | null;
    receipt_number: string | null;

    // Amounts
    subtotal: number | null;
    tax_amount: number | null;
    discount_amount: number | null;
    total_amount: number | null;
    currency: string;

    // Parsing info
    parsing_status: 'pending' | 'processing' | 'completed' | 'failed';
    parsing_error: string | null;
    confidence: number | null;  // 0.00-1.00
    ai_model_used: string | null;

    // Nested items
    items: ReceiptItem[];

    // Computed fields
    items_count: number;
    converted_count: number;    // Items already converted to sub-txns
    unconverted_count: number;

    // Timestamps
    created_at: string;
    updated_at: string;
  };
  transaction: {
    id: string;
    amount: number;
    merchant_name: string;
    txn_time: string;
  };
  comparison: {
    receipt_total: number | null;
    transaction_amount: number;
    difference: number | null;
    percentage_diff: number | null;
    within_tolerance: boolean;
  };
}
```

---

#### C.2.3 POST `/api/receipts/[id]/parse`

**Purpose**: Retry parsing for a failed receipt

**Request Body** (optional):
```typescript
{
  force?: boolean;  // Force re-parse even if already completed
}
```

**Validation**:
- If `parsing_status` is `'completed'` and `force` is not true, return error
- If `parsing_status` is `'processing'`, return error (already in progress)

**Success Response (200 OK)**:
```typescript
{
  success: true;
  receipt: {
    id: string;
    parsing_status: 'processing';
  };
  message: 'Parsing started';
}
```

**Error Responses**:
| Status | Error Code | Description |
|--------|------------|-------------|
| 400 | `ALREADY_COMPLETED` | Receipt already parsed (use force=true to re-parse) |
| 400 | `ALREADY_PROCESSING` | Parsing already in progress |
| 404 | `RECEIPT_NOT_FOUND` | Receipt not found |

---

#### C.2.4 POST `/api/receipts/[id]/create-sub-transactions`

**Purpose**: Convert receipt items to sub-transactions

**Request Body**:
```typescript
{
  item_ids?: string[];           // Specific items to convert (default: all non-excluded)
  exclude_tax_items?: boolean;   // Default: true
  exclude_discount_items?: boolean;  // Default: true
  adjust_to_match?: boolean;     // Adjust last item to match parent amount (default: true)
  adjustment_threshold?: number; // Max adjustment allowed (default: 10.00)
}
```

**Pre-conditions**:
- Receipt must have `parsing_status: 'completed'`
- Transaction must not have existing sub-transactions
- At least 2 items must be available for conversion

**Conversion Logic**:
1. Filter items based on `exclude_tax_items`, `exclude_discount_items`, `item_ids`
2. Remove already-converted items (`sub_transaction_id` not null)
3. Validate count (2-10 items)
4. Calculate sum of item totals
5. If `adjust_to_match` and difference < `adjustment_threshold`:
   - Adjust last item's amount to make sum equal parent
6. Create sub-transactions for each item
7. Update receipt items with `sub_transaction_id`

**Success Response (201 Created)**:
```typescript
{
  success: true;
  sub_transactions: SubTransaction[];
  validation: {
    items_total: number;
    transaction_amount: number;
    difference_before: number;
    adjusted: boolean;
    adjustment_amount: number | null;
    difference_after: number;
  };
  items_converted: number;
  items_skipped: number;
  skipped_reasons?: Array<{
    item_id: string;
    item_name: string;
    reason: 'IS_TAX' | 'IS_DISCOUNT' | 'IS_EXCLUDED' | 'ALREADY_CONVERTED' | 'NOT_SELECTED';
  }>;
}
```

**Error Responses**:
| Status | Error Code | Description |
|--------|------------|-------------|
| 400 | `RECEIPT_NOT_PARSED` | Receipt parsing not completed |
| 400 | `EXISTING_SUB_TRANSACTIONS` | Transaction already has sub-transactions |
| 400 | `INSUFFICIENT_ITEMS` | Less than 2 items available for conversion |
| 400 | `EXCEEDS_PARENT` | Items total exceeds transaction amount beyond threshold |
| 400 | `ADJUSTMENT_TOO_LARGE` | Required adjustment exceeds threshold |

---

### C.3 Refund APIs - Complete Specifications

#### C.3.1 POST `/api/transactions/[id]/link-refund`

**Purpose**: Link a credit transaction as a refund of this transaction

**Note**: `[id]` is the CREDIT transaction being marked as a refund

**Request Body**:
```typescript
{
  refund_of_transaction_id: string;     // Required: Original debit transaction ID
  refund_of_sub_transaction_id?: string; // Optional: Specific sub-transaction
  refund_type: 'full' | 'partial' | 'item';
  refund_reason?: string;               // Optional: Max 500 chars
}
```

**Validation Rules**:
| Rule | Error Code |
|------|------------|
| Credit transaction must have direction='credit' | `NOT_A_CREDIT` |
| Original transaction must have direction='debit' | `NOT_A_DEBIT` |
| Both transactions must belong to same user | `UNAUTHORIZED` |
| Credit amount ≤ remaining refundable amount | `EXCEEDS_REFUNDABLE` |
| Original cannot already be a refund | `CIRCULAR_REFUND` |
| Sub-transaction must belong to original | `INVALID_SUB_TRANSACTION` |
| Credit transaction not already linked | `ALREADY_LINKED` |

**Success Response (200 OK)**:
```typescript
{
  success: true;
  transaction: Transaction;  // Updated credit transaction
  refund_status: {
    original_id: string;
    original_amount: number;
    total_refunded: number;
    remaining_amount: number;
    is_fully_refunded: boolean;
    refund_count: number;
  };
  splitwise_warning?: {
    has_splitwise: true;
    expense_id: string;
    message: 'Original transaction was split on Splitwise. Consider creating a reverse expense.';
    suggested_action: 'CREATE_REVERSE_EXPENSE' | 'DELETE_EXPENSE';
  };
}
```

---

#### C.3.2 DELETE `/api/transactions/[id]/link-refund`

**Purpose**: Unlink a refund from original transaction

**Success Response (200 OK)**:
```typescript
{
  success: true;
  transaction: Transaction;  // Updated credit transaction (refund fields cleared)
  message: 'Refund link removed';
}
```

---

#### C.3.3 GET `/api/transactions/[id]/refund-suggestions`

**Purpose**: Get AI-powered suggestions for matching original transactions

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Credit transaction ID |

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `min_score` | number | 50 | Minimum match score (0-100) |
| `limit` | number | 10 | Max suggestions (1-20) |
| `include_sub_transactions` | boolean | true | Include sub-transaction options |
| `lookback_days` | number | 90 | Max days before credit to search |

**Success Response (200 OK)**:
```typescript
{
  success: true;
  credit_transaction: {
    id: string;
    amount: number;
    merchant_name: string;
    merchant_normalized: string;
    txn_time: string;
    reference_id: string | null;
  };
  suggestions: Array<{
    transaction_id: string;
    merchant_name: string;
    merchant_normalized: string;
    amount: number;
    txn_time: string;
    reference_id: string | null;
    splitwise_expense_id: string | null;

    // Match details
    match_score: number;        // 0-100
    match_breakdown: {
      merchant_score: number;   // 0-40
      amount_score: number;     // 0-30
      time_score: number;       // 0-20
      reference_score: number;  // 0-10
    };
    match_reasons: string[];

    // Refund status
    has_prior_refunds: boolean;
    total_refunded: number;
    remaining_refundable: number;

    // Sub-transactions
    has_sub_transactions: boolean;
    sub_transactions?: Array<{
      id: string;
      merchant_name: string;
      category: string;
      amount: number;
      receipt_item_name: string | null;
      total_refunded: number;
      remaining_refundable: number;
    }>;
  }>;
  meta: {
    total_candidates_scanned: number;
    suggestions_returned: number;
    min_score_applied: number;
    lookback_days_applied: number;
  };
}
```

---

#### C.3.4 GET `/api/transactions/[id]/refund-status`

**Purpose**: Get refund status for a debit transaction

**Success Response (200 OK)**:
```typescript
{
  success: true;
  transaction: {
    id: string;
    amount: number;
    merchant_name: string;
    txn_time: string;
    splitwise_expense_id: string | null;
  };
  refund_status: {
    original_amount: number;
    total_refunded: number;
    remaining_amount: number;
    refund_percentage: number;
    is_fully_refunded: boolean;
    refund_count: number;
    refunds: Array<{
      id: string;
      amount: number;
      refund_type: 'full' | 'partial' | 'item';
      refund_reason: string | null;
      refund_of_sub_transaction_id: string | null;
      txn_time: string;
      merchant_name: string;
      created_at: string;
    }>;
  };
  sub_transaction_refund_status?: Array<{
    sub_transaction_id: string;
    merchant_name: string;
    category: string;
    amount: number;
    total_refunded: number;
    remaining_amount: number;
    is_fully_refunded: boolean;
    refund_count: number;
  }>;
}
```

---

## Appendix D: Error Handling Specifications

### D.1 Global Error Codes

| Code Range | Category | Description |
|------------|----------|-------------|
| 1000-1099 | Authentication | Auth-related errors |
| 1100-1199 | Authorization | Permission errors |
| 2000-2099 | Validation | Input validation errors |
| 2100-2199 | Business Logic | Business rule violations |
| 3000-3099 | Database | Database operation errors |
| 4000-4099 | External Services | AI, storage errors |
| 5000-5099 | Internal | Unexpected server errors |

### D.2 Complete Error Code Registry

```typescript
// src/lib/constants/error-codes.ts

export const ERROR_CODES = {
  // Authentication (1000-1099)
  AUTH_REQUIRED: { code: 1000, status: 401, message: 'Authentication required' },
  AUTH_INVALID_TOKEN: { code: 1001, status: 401, message: 'Invalid or expired token' },
  AUTH_TOKEN_EXPIRED: { code: 1002, status: 401, message: 'Token has expired' },

  // Authorization (1100-1199)
  AUTHZ_UNAUTHORIZED: { code: 1100, status: 403, message: 'Not authorized to access this resource' },
  AUTHZ_WRONG_USER: { code: 1101, status: 403, message: 'Resource belongs to different user' },
  AUTHZ_INSUFFICIENT_PERMISSIONS: { code: 1102, status: 403, message: 'Insufficient permissions' },

  // Validation - General (2000-2019)
  VAL_INVALID_UUID: { code: 2000, status: 400, message: 'Invalid UUID format' },
  VAL_MISSING_FIELD: { code: 2001, status: 400, message: 'Required field missing' },
  VAL_INVALID_TYPE: { code: 2002, status: 400, message: 'Invalid data type' },
  VAL_OUT_OF_RANGE: { code: 2003, status: 400, message: 'Value out of allowed range' },
  VAL_STRING_TOO_LONG: { code: 2004, status: 400, message: 'String exceeds maximum length' },
  VAL_INVALID_ENUM: { code: 2005, status: 400, message: 'Invalid enum value' },
  VAL_INVALID_DATE: { code: 2006, status: 400, message: 'Invalid date format' },

  // Validation - Sub-transactions (2020-2039)
  SUB_INVALID_COUNT: { code: 2020, status: 400, message: 'Sub-transaction count must be 2-10' },
  SUB_AMOUNT_MISMATCH: { code: 2021, status: 400, message: 'Sub-transaction amounts do not equal parent' },
  SUB_NEGATIVE_AMOUNT: { code: 2022, status: 400, message: 'Amount must be positive' },
  SUB_NESTED_NOT_ALLOWED: { code: 2023, status: 400, message: 'Cannot create sub-transaction of sub-transaction' },
  SUB_PARENT_REQUIRED: { code: 2024, status: 400, message: 'Sub-transaction must have parent' },
  SUB_ALREADY_EXISTS: { code: 2025, status: 400, message: 'Transaction already has sub-transactions' },

  // Validation - Receipts (2040-2059)
  RCPT_NO_FILE: { code: 2040, status: 400, message: 'No file provided' },
  RCPT_FILE_TOO_LARGE: { code: 2041, status: 400, message: 'File exceeds 10MB limit' },
  RCPT_INVALID_TYPE: { code: 2042, status: 400, message: 'File type not supported (use JPEG, PNG, PDF)' },
  RCPT_CORRUPT_FILE: { code: 2043, status: 400, message: 'File is corrupt or unreadable' },
  RCPT_NOT_PARSED: { code: 2044, status: 400, message: 'Receipt parsing not completed' },
  RCPT_ALREADY_PROCESSING: { code: 2045, status: 400, message: 'Parsing already in progress' },
  RCPT_INSUFFICIENT_ITEMS: { code: 2046, status: 400, message: 'Less than 2 items available for conversion' },

  // Validation - Refunds (2060-2079)
  REF_NOT_A_CREDIT: { code: 2060, status: 400, message: 'Only credit transactions can be marked as refunds' },
  REF_NOT_A_DEBIT: { code: 2061, status: 400, message: 'Can only link refunds to debit transactions' },
  REF_EXCEEDS_AMOUNT: { code: 2062, status: 400, message: 'Refund amount exceeds remaining refundable' },
  REF_CIRCULAR: { code: 2063, status: 400, message: 'Cannot create circular refund chain' },
  REF_ALREADY_LINKED: { code: 2064, status: 400, message: 'Transaction already linked as refund' },
  REF_INVALID_SUB: { code: 2065, status: 400, message: 'Sub-transaction does not belong to original' },

  // Business Logic (2100-2199)
  BIZ_TRANSACTION_LOCKED: { code: 2100, status: 400, message: 'Transaction is locked and cannot be modified' },
  BIZ_SPLITWISE_CASCADE: { code: 2101, status: 400, message: 'Cannot modify sub-transaction Splitwise ID directly' },
  BIZ_CONVERSION_CONFLICT: { code: 2102, status: 400, message: 'Cannot convert - sub-transactions already exist' },

  // Database (3000-3099)
  DB_NOT_FOUND: { code: 3000, status: 404, message: 'Resource not found' },
  DB_CONSTRAINT_VIOLATION: { code: 3001, status: 400, message: 'Database constraint violation' },
  DB_CONNECTION_ERROR: { code: 3002, status: 503, message: 'Database connection error' },
  DB_QUERY_ERROR: { code: 3003, status: 500, message: 'Database query failed' },

  // External Services (4000-4099)
  EXT_AI_ERROR: { code: 4000, status: 502, message: 'AI service error' },
  EXT_AI_TIMEOUT: { code: 4001, status: 504, message: 'AI service timeout' },
  EXT_AI_RATE_LIMIT: { code: 4002, status: 429, message: 'AI service rate limited' },
  EXT_STORAGE_ERROR: { code: 4010, status: 502, message: 'Storage service error' },
  EXT_STORAGE_UPLOAD_FAILED: { code: 4011, status: 500, message: 'File upload failed' },

  // Internal (5000-5099)
  INT_UNEXPECTED: { code: 5000, status: 500, message: 'An unexpected error occurred' },
  INT_NOT_IMPLEMENTED: { code: 5001, status: 501, message: 'Feature not implemented' },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;
```

### D.3 Error Response Helper

```typescript
// src/lib/api/error-response.ts

import { NextApiResponse } from 'next';
import { ERROR_CODES, ErrorCode } from '@/lib/constants/error-codes';

interface ErrorDetails {
  field?: string;
  expected?: unknown;
  received?: unknown;
  [key: string]: unknown;
}

export function sendError(
  res: NextApiResponse,
  errorCode: ErrorCode,
  details?: ErrorDetails,
  overrideMessage?: string
) {
  const error = ERROR_CODES[errorCode];

  console.error(`[API Error] ${errorCode}:`, {
    code: error.code,
    status: error.status,
    message: overrideMessage || error.message,
    details,
    timestamp: new Date().toISOString(),
  });

  return res.status(error.status).json({
    success: false,
    error: overrideMessage || error.message,
    error_code: errorCode,
    code: error.code,
    details,
  });
}

// Usage example:
// sendError(res, 'SUB_AMOUNT_MISMATCH', {
//   expected: 1000,
//   received: 950,
//   difference: 50,
// });
```

---

## Appendix E: Validation Rules - Complete Reference

### E.1 Sub-Transaction Validation

```typescript
// src/lib/validation/sub-transactions.ts

import { z } from 'zod';
import { SUB_TRANSACTION_LIMITS } from '@/types/sub-transactions';

// Single sub-transaction input
export const subTransactionInputSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be positive')
    .multipleOf(0.01, 'Amount can have at most 2 decimal places')
    .max(99999999.99, 'Amount exceeds maximum'),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(100, 'Category must be 100 characters or less'),
  merchant_name: z
    .string()
    .max(200, 'Merchant name must be 200 characters or less')
    .optional(),
  user_notes: z
    .string()
    .max(500, 'Notes must be 500 characters or less')
    .optional(),
  receipt_item_id: z
    .string()
    .uuid('Invalid receipt item ID')
    .optional(),
});

// Bulk create request
export const createSubTransactionsSchema = z.object({
  sub_transactions: z
    .array(subTransactionInputSchema)
    .min(SUB_TRANSACTION_LIMITS.MIN_COUNT, `At least ${SUB_TRANSACTION_LIMITS.MIN_COUNT} sub-transactions required`)
    .max(SUB_TRANSACTION_LIMITS.MAX_COUNT, `Maximum ${SUB_TRANSACTION_LIMITS.MAX_COUNT} sub-transactions allowed`),
  validate_only: z.boolean().optional(),
});

// Update request
export const updateSubTransactionSchema = z.object({
  amount: z
    .number()
    .positive()
    .multipleOf(0.01)
    .optional(),
  category: z
    .string()
    .min(1)
    .max(100)
    .optional(),
  merchant_name: z
    .string()
    .max(200)
    .optional()
    .nullable(),
  user_notes: z
    .string()
    .max(500)
    .optional()
    .nullable(),
});

// Amount sum validation
export function validateAmountSum(
  subAmounts: number[],
  parentAmount: number,
  tolerance: number = SUB_TRANSACTION_LIMITS.TOLERANCE
): { valid: boolean; total: number; difference: number; message?: string } {
  const total = subAmounts.reduce((sum, amt) => sum + amt, 0);
  const difference = Math.abs(parentAmount - total);
  const valid = difference <= tolerance;

  return {
    valid,
    total: Math.round(total * 100) / 100,
    difference: Math.round(difference * 100) / 100,
    message: valid
      ? undefined
      : `Sub-transactions total (₹${total.toFixed(2)}) differs from parent (₹${parentAmount.toFixed(2)}) by ₹${difference.toFixed(2)}`,
  };
}
```

### E.2 Receipt Validation

```typescript
// src/lib/validation/receipts.ts

import { z } from 'zod';
import { RECEIPT_STORAGE } from '@/types/receipts';

// File validation (performed before upload)
export function validateReceiptFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > RECEIPT_STORAGE.MAX_SIZE) {
    return {
      valid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum (10MB)`,
    };
  }

  // Check file type
  if (!RECEIPT_STORAGE.ALLOWED_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: `File type "${file.type}" not supported. Use: ${RECEIPT_STORAGE.ALLOWED_TYPES.join(', ')}`,
    };
  }

  return { valid: true };
}

// Receipt metadata update
export const updateReceiptSchema = z.object({
  store_name: z.string().max(200).optional().nullable(),
  receipt_date: z.string().datetime().optional().nullable(),
  receipt_number: z.string().max(100).optional().nullable(),
  subtotal: z.number().nonnegative().optional().nullable(),
  tax_amount: z.number().nonnegative().optional().nullable(),
  discount_amount: z.number().nonnegative().optional().nullable(),
  total_amount: z.number().nonnegative().optional().nullable(),
});

// Receipt item update
export const updateReceiptItemSchema = z.object({
  item_name: z.string().min(1).max(200).optional(),
  item_description: z.string().max(500).optional().nullable(),
  quantity: z.number().positive().max(9999).optional(),
  unit: z.string().max(20).optional().nullable(),
  unit_price: z.number().nonnegative().optional().nullable(),
  total_price: z.number().positive().optional(),
  category: z.string().max(100).optional().nullable(),
  is_tax: z.boolean().optional(),
  is_discount: z.boolean().optional(),
  is_excluded: z.boolean().optional(),
});

// Create sub-transactions request
export const createSubTransactionsFromReceiptSchema = z.object({
  item_ids: z.array(z.string().uuid()).optional(),
  exclude_tax_items: z.boolean().default(true),
  exclude_discount_items: z.boolean().default(true),
  adjust_to_match: z.boolean().default(true),
  adjustment_threshold: z.number().nonnegative().max(100).default(10),
});
```

### E.3 Refund Validation

```typescript
// src/lib/validation/refunds.ts

import { z } from 'zod';

// Link refund request
export const linkRefundSchema = z.object({
  refund_of_transaction_id: z
    .string()
    .uuid('Invalid original transaction ID'),
  refund_of_sub_transaction_id: z
    .string()
    .uuid('Invalid sub-transaction ID')
    .optional()
    .nullable(),
  refund_type: z.enum(['full', 'partial', 'item'], {
    errorMap: () => ({ message: 'Refund type must be full, partial, or item' }),
  }),
  refund_reason: z
    .string()
    .max(500, 'Reason must be 500 characters or less')
    .optional()
    .nullable(),
});

// Refund suggestions query
export const refundSuggestionsQuerySchema = z.object({
  min_score: z.coerce.number().min(0).max(100).default(50),
  limit: z.coerce.number().min(1).max(20).default(10),
  include_sub_transactions: z.coerce.boolean().default(true),
  lookback_days: z.coerce.number().min(1).max(365).default(90),
});

// Validation helpers
export function validateRefundAmount(
  refundAmount: number,
  originalAmount: number,
  existingRefunds: number
): { valid: boolean; remaining: number; message?: string } {
  const remaining = originalAmount - existingRefunds;

  if (refundAmount > remaining) {
    return {
      valid: false,
      remaining,
      message: `Refund amount (₹${refundAmount.toFixed(2)}) exceeds remaining refundable (₹${remaining.toFixed(2)})`,
    };
  }

  return { valid: true, remaining };
}
```

---

## Appendix F: Security Specifications

### F.1 Authentication & Authorization

**Authentication Flow**:
1. All API endpoints use `withAuth` middleware
2. JWT token extracted from `Authorization: Bearer <token>` header
3. Token validated against Supabase Auth
4. User ID extracted and attached to request

```typescript
// src/lib/auth.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

interface AuthenticatedUser {
  id: string;
  email: string;
}

type AuthenticatedHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  user: AuthenticatedUser
) => Promise<void>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          error_code: 'AUTH_REQUIRED',
        });
      }

      const token = authHeader.substring(7);

      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
          error_code: 'AUTH_INVALID_TOKEN',
        });
      }

      return handler(req, res, {
        id: user.id,
        email: user.email || '',
      });
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authentication error',
        error_code: 'INT_UNEXPECTED',
      });
    }
  };
}
```

**Authorization Rules**:
| Resource | Rule |
|----------|------|
| Transaction | `user_id` must match authenticated user |
| Sub-transaction | Parent transaction must belong to user |
| Receipt | `user_id` must match authenticated user |
| Receipt Item | Via receipt ownership |
| Refund Link | Both credit and debit transactions must belong to user |

### F.2 Row Level Security (RLS) Policies

```sql
-- fb_emails_processed RLS (existing, verify)
CREATE POLICY "Users can only access own transactions"
ON fb_emails_processed
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- fb_receipts RLS
CREATE POLICY "Users can only access own receipts"
ON fb_receipts
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- fb_receipt_items RLS
CREATE POLICY "Users can only access own receipt items"
ON fb_receipt_items
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Storage RLS (receipts bucket)
CREATE POLICY "Users can manage own receipt files"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### F.3 Input Sanitization

```typescript
// src/lib/security/sanitize.ts

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize user-provided text fields to prevent XSS
 */
export function sanitizeText(input: string | null | undefined): string | null {
  if (!input) return null;

  // Remove HTML tags and entities
  const clean = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });

  // Trim and normalize whitespace
  return clean.trim().replace(/\s+/g, ' ');
}

/**
 * Sanitize for SQL LIKE patterns (escape wildcards)
 */
export function sanitizeForLike(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

/**
 * Validate and sanitize file path to prevent directory traversal
 */
export function sanitizeFilePath(path: string): string {
  // Remove any path traversal attempts
  return path
    .replace(/\.\./g, '')
    .replace(/\/\//g, '/')
    .replace(/^\//, '');
}
```

### F.4 Rate Limiting

```typescript
// src/lib/security/rate-limit.ts

import { LRUCache } from 'lru-cache';

interface RateLimitOptions {
  interval: number;  // Window in ms
  uniqueTokenPerInterval: number;  // Max users
}

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache<string, number[]>({
    max: options.uniqueTokenPerInterval,
    ttl: options.interval,
  });

  return {
    check: async (
      limit: number,
      token: string
    ): Promise<{ success: boolean; remaining: number }> => {
      const tokenCount = tokenCache.get(token) || [];
      const currentTime = Date.now();
      const windowStart = currentTime - options.interval;

      // Filter to only requests in current window
      const validTokens = tokenCount.filter(t => t > windowStart);

      if (validTokens.length >= limit) {
        return { success: false, remaining: 0 };
      }

      validTokens.push(currentTime);
      tokenCache.set(token, validTokens);

      return {
        success: true,
        remaining: limit - validTokens.length,
      };
    },
  };
}

// Usage for receipt parsing (expensive operation)
export const receiptParsingLimiter = rateLimit({
  interval: 60 * 1000,  // 1 minute
  uniqueTokenPerInterval: 500,
});

// Check before parsing
// const { success, remaining } = await receiptParsingLimiter.check(10, userId);
// if (!success) return res.status(429).json({ error: 'Rate limit exceeded' });
```

### F.5 API Security Headers

```typescript
// src/pages/api/_middleware.ts (Next.js middleware example)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' blob: data:; script-src 'self' 'unsafe-eval' 'unsafe-inline'"
  );

  return response;
}
```

---

## Appendix G: Performance Specifications

### G.1 Database Indexes

```sql
-- Sub-transactions indexes (critical for nested queries)
CREATE INDEX CONCURRENTLY idx_fb_txn_parent_order_user
  ON fb_emails_processed(user_id, parent_transaction_id, sub_transaction_order)
  WHERE parent_transaction_id IS NOT NULL;

-- Receipts indexes
CREATE INDEX CONCURRENTLY idx_fb_receipts_txn_status
  ON fb_receipts(transaction_id, parsing_status);

-- Refund indexes (critical for refund status queries)
CREATE INDEX CONCURRENTLY idx_fb_txn_refund_user
  ON fb_emails_processed(user_id, refund_of_transaction_id)
  WHERE refund_of_transaction_id IS NOT NULL;

-- Compound index for smart matching
CREATE INDEX CONCURRENTLY idx_fb_txn_matching
  ON fb_emails_processed(user_id, direction, merchant_normalized, txn_time)
  WHERE direction = 'debit';
```

### G.2 Query Optimization Guidelines

```typescript
// GOOD: Use specific select with exact fields needed
const { data } = await supabase
  .from('fb_emails_processed')
  .select('id, amount, category, merchant_name')
  .eq('parent_transaction_id', parentId)
  .order('sub_transaction_order');

// BAD: Select * fetches unnecessary data
const { data } = await supabase
  .from('fb_emails_processed')
  .select('*')
  .eq('parent_transaction_id', parentId);

// GOOD: Batch related queries
const [{ data: transaction }, { data: subTransactions }, { data: receipts }] = await Promise.all([
  supabase.from('fb_emails_processed').select('*').eq('id', id).single(),
  supabase.from('fb_emails_processed').select('*').eq('parent_transaction_id', id),
  supabase.from('fb_receipts').select('*').eq('transaction_id', id),
]);

// BAD: Sequential queries
const transaction = await supabase.from('fb_emails_processed').select('*').eq('id', id).single();
const subTransactions = await supabase.from('fb_emails_processed').select('*').eq('parent_transaction_id', id);
const receipts = await supabase.from('fb_receipts').select('*').eq('transaction_id', id);
```

### G.3 Caching Strategy

```typescript
// src/lib/cache/receipt-cache.ts

import { LRUCache } from 'lru-cache';

// Cache parsed receipts (parsing is expensive)
const receiptCache = new LRUCache<string, ParsedReceiptData>({
  max: 100,
  ttl: 1000 * 60 * 30,  // 30 minutes
});

export function getCachedReceipt(receiptId: string): ParsedReceiptData | undefined {
  return receiptCache.get(receiptId);
}

export function setCachedReceipt(receiptId: string, data: ParsedReceiptData): void {
  receiptCache.set(receiptId, data);
}

export function invalidateReceipt(receiptId: string): void {
  receiptCache.delete(receiptId);
}

// Cache refund suggestions (computed results)
const suggestionCache = new LRUCache<string, RefundSuggestion[]>({
  max: 200,
  ttl: 1000 * 60 * 5,  // 5 minutes (shorter due to data freshness needs)
});
```

### G.4 Performance Targets

| Operation | Target | Max Acceptable |
|-----------|--------|----------------|
| List sub-transactions | < 100ms | 300ms |
| Create sub-transactions | < 200ms | 500ms |
| Upload receipt | < 2s | 5s |
| Parse receipt (AI) | < 10s | 30s |
| Get refund suggestions | < 500ms | 2s |
| Link refund | < 200ms | 500ms |
| Search transactions (with subs) | < 300ms | 1s |

### G.5 Frontend Optimization

```typescript
// Optimistic updates for sub-transactions
const createSubTransactions = useMutation({
  mutationFn: async (input) => {
    return api.post(`/transactions/${id}/sub-transactions`, input);
  },
  onMutate: async (input) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['transaction', id]);

    // Snapshot previous value
    const previousTransaction = queryClient.getQueryData(['transaction', id]);

    // Optimistically update
    queryClient.setQueryData(['transaction', id], (old) => ({
      ...old,
      has_sub_transactions: true,
      sub_transactions: input.sub_transactions.map((sub, i) => ({
        ...sub,
        id: `temp-${i}`,
        is_sub_transaction: true,
        sub_transaction_order: i,
      })),
    }));

    return { previousTransaction };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['transaction', id], context.previousTransaction);
  },
  onSettled: () => {
    // Refetch to get real data
    queryClient.invalidateQueries(['transaction', id]);
  },
});
```

---

## Appendix H: Step-by-Step Implementation Guides

### H.1 Phase 1: Database Migration

**Prerequisites**:
- Supabase project with admin access
- Local development environment with Supabase CLI

**Step 1.1: Create Migration File**
```bash
# Navigate to project root
cd /Users/dsaraf/Documents/Repos/finance-buddy

# Create migration directory if not exists
mkdir -p infra/migrations

# Create migration file
touch infra/migrations/0006_sub_transactions_and_receipts.sql
```

**Step 1.2: Copy Migration SQL**
- Copy complete migration SQL from Section 4.4 into the file
- Verify all three parts (Sub-transactions, Receipts, Refunds) are included

**Step 1.3: Apply Migration Locally**
```bash
# Start local Supabase
supabase start

# Apply migration
supabase db reset

# Or apply just this migration
psql -h localhost -p 54322 -U postgres -d postgres -f infra/migrations/0006_sub_transactions_and_receipts.sql
```

**Step 1.4: Configure Storage Bucket**
```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;
```

**Step 1.5: Verify Migration**
```sql
-- Check new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'fb_emails_processed'
AND column_name IN ('parent_transaction_id', 'is_sub_transaction', 'refund_of_transaction_id', 'is_refund');

-- Check new tables exist
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('fb_receipts', 'fb_receipt_items');

-- Check triggers exist
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table = 'fb_emails_processed';

-- Check functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_name IN ('get_refund_status', 'suggest_refund_matches', 'validate_refund_linkage');
```

**Step 1.6: Verify RLS Policies**
```sql
-- Check policies
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('fb_receipts', 'fb_receipt_items');
```

---

### H.2 Phase 2: TypeScript Types

**Step 2.1: Create Sub-Transaction Types**

File: `src/types/sub-transactions.ts`
```bash
touch src/types/sub-transactions.ts
```
- Copy type definitions from Section 6.1
- Export all types and constants

**Step 2.2: Create Receipt Types**

File: `src/types/receipts.ts`
```bash
touch src/types/receipts.ts
```
- Copy type definitions from Section 6.2

**Step 2.3: Create Refund Types**

File: `src/types/refunds.ts`
```bash
touch src/types/refunds.ts
```
- Copy type definitions from Section 13.2

**Step 2.4: Update Main Types Export**

File: `src/types/index.ts`
```typescript
export * from './sub-transactions';
export * from './receipts';
export * from './refunds';
```

**Step 2.5: Run Type Check**
```bash
npm run type-check
# or
npx tsc --noEmit
```

---

### H.3 Phase 3: Receipt Parsing Core

**Step 3.1: Create Directory Structure**
```bash
mkdir -p src/lib/receipt-parsing
mkdir -p src/lib/constants
mkdir -p src/lib/validation
```

**Step 3.2: Create Constants File**

File: `src/lib/constants/receipts.ts`
- Copy constants from Section 12.3

**Step 3.3: Create Prompts File**

File: `src/lib/receipt-parsing/prompts.ts`
- Copy RECEIPT_PARSING_PROMPT from Section 8.2
- Add additional prompts for retry scenarios

**Step 3.4: Create Storage Helpers**

File: `src/lib/receipt-parsing/storage.ts`
```typescript
import { supabaseAdmin } from '@/lib/supabase';
import { RECEIPT_STORAGE } from '@/types/receipts';

export async function uploadReceiptFile(
  userId: string,
  receiptId: string,
  file: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ path: string; error?: string }> {
  const path = `${userId}/${receiptId}/${fileName}`;

  const { error } = await supabaseAdmin.storage
    .from(RECEIPT_STORAGE.BUCKET)
    .upload(path, file, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    console.error('Storage upload error:', error);
    return { path: '', error: error.message };
  }

  return { path };
}

export async function getReceiptSignedUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<{ url: string | null; error?: string }> {
  const { data, error } = await supabaseAdmin.storage
    .from(RECEIPT_STORAGE.BUCKET)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    return { url: null, error: error.message };
  }

  return { url: data.signedUrl };
}

export async function deleteReceiptFile(filePath: string): Promise<boolean> {
  const { error } = await supabaseAdmin.storage
    .from(RECEIPT_STORAGE.BUCKET)
    .remove([filePath]);

  return !error;
}
```

**Step 3.5: Create Parser**

File: `src/lib/receipt-parsing/parser.ts`
```typescript
import Anthropic from '@anthropic-ai/sdk';
import { ParsedReceiptData } from '@/types/receipts';
import { RECEIPT_PARSING_PROMPT } from './prompts';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function parseReceiptImage(
  imageBase64: string,
  mimeType: string
): Promise<{ data: ParsedReceiptData | null; error?: string; rawText?: string }> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: RECEIPT_PARSING_PROMPT,
            },
          ],
        },
      ],
    });

    // Extract JSON from response
    const content = response.content[0];
    if (content.type !== 'text') {
      return { data: null, error: 'Unexpected response format' };
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { data: null, error: 'No JSON found in response', rawText: content.text };
    }

    const parsed = JSON.parse(jsonMatch[0]) as ParsedReceiptData;

    return { data: parsed, rawText: content.text };
  } catch (error) {
    console.error('Receipt parsing error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown parsing error',
    };
  }
}
```

---

### H.4 Phase 4-6: API Implementation

*(Detailed implementation steps for each API endpoint following patterns established above)*

**Directory Structure**:
```
src/pages/api/
├── transactions/
│   └── [id]/
│       ├── sub-transactions/
│       │   ├── index.ts      # POST, GET, DELETE
│       │   └── [subId].ts    # PATCH, DELETE
│       ├── receipts/
│       │   └── index.ts      # POST, GET
│       ├── link-refund.ts    # POST, DELETE
│       ├── refund-suggestions.ts  # GET
│       └── refund-status.ts  # GET
└── receipts/
    └── [id]/
        ├── index.ts          # GET, PATCH, DELETE
        ├── parse.ts          # POST
        ├── items/
        │   ├── index.ts      # GET
        │   └── [itemId].ts   # PATCH, DELETE
        └── create-sub-transactions.ts  # POST
```

**For each API file**:
1. Create file with proper path
2. Import `withAuth` and validation schemas
3. Implement request body parsing
4. Add validation using Zod schemas
5. Implement database operations
6. Add error handling using error response helper
7. Return properly typed responses

---

### H.5 Phase 7-9: UI Components

**Component Implementation Checklist**:

For each component:
1. Create file in `src/components/transactions/`
2. Define TypeScript interface for props
3. Implement component following design system rules
4. Add loading states
5. Add error handling
6. Add optimistic updates where appropriate
7. Export from index file

**Key Components**:
- `SubTransactionEditor.tsx` - Manual split UI
- `ReceiptUploader.tsx` - Drag/drop upload
- `ReceiptViewer.tsx` - Image viewer with zoom
- `ReceiptItemsEditor.tsx` - Edit parsed items
- `RefundStatusBadge.tsx` - Refund status indicator
- `RefundLinkModal.tsx` - Link refund UI

---

### H.6 Phase 10: Integration & Testing

**Integration Steps**:

1. **Update TransactionModal.tsx**:
   - Add tab navigation (Details | Receipt | Splits | Refunds | Splitwise)
   - Conditionally render components based on tab
   - Add state management for active tab

2. **Update TxnCard.tsx**:
   - Add expand/collapse for sub-transactions
   - Add refund status badge
   - Add receipt indicator icon

3. **Update TxnList.tsx**:
   - Handle nested rendering of sub-transactions
   - Filter out sub-transactions from main list

4. **Update transactions.tsx**:
   - Add new fields to Transaction type
   - Update search API calls to include new fields

**Testing Checklist**:
- [ ] Create sub-transactions manually
- [ ] Validate amount matching
- [ ] Upload receipt image
- [ ] Verify AI parsing results
- [ ] Edit parsed items
- [ ] Convert items to sub-transactions
- [ ] Link credit as refund
- [ ] View refund suggestions
- [ ] Check refund status display
- [ ] Test Splitwise cascade
- [ ] Test edge cases (delete, modify, etc.)

---

## Appendix I: Data Flow Diagrams

### I.1 Sub-Transaction Creation Flow

```
User clicks "Split Transaction"
         │
         ▼
┌─────────────────────────────────┐
│   SubTransactionEditor opens    │
│   - Shows parent amount         │
│   - Empty sub-transaction rows  │
└─────────────────────────────────┘
         │
         ▼
User enters amounts & categories
         │
         ▼
┌─────────────────────────────────┐
│   Real-time validation          │
│   - Check sum vs parent         │
│   - Show difference             │
│   - Enable/disable submit       │
└─────────────────────────────────┘
         │
         ▼
User clicks "Create"
         │
         ▼
┌─────────────────────────────────┐
│   POST /api/transactions/[id]/  │
│        sub-transactions         │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   API Validation                │
│   - User owns transaction       │
│   - Parent not a sub-txn        │
│   - Count 2-10                  │
│   - Sum equals parent           │
└─────────────────────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
 Valid     Invalid
    │         │
    ▼         ▼
┌────────┐  ┌─────────────────────┐
│ INSERT │  │ Return error with   │
│ rows   │  │ validation details  │
└────────┘  └─────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│   Trigger: cascade_splitwise    │
│   - Copy parent splitwise_id    │
│     to all new sub-transactions │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│   Return success response       │
│   - Created sub-transactions    │
│   - Validation summary          │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│   UI updates                    │
│   - Close editor modal          │
│   - Show sub-txns in list       │
│   - Update parent card UI       │
└─────────────────────────────────┘
```

### I.2 Receipt Parsing Flow

```
User clicks "Upload Receipt"
         │
         ▼
┌─────────────────────────────────┐
│   ReceiptUploader component     │
│   - Drag & drop zone            │
│   - File browser button         │
└─────────────────────────────────┘
         │
         ▼
User selects file
         │
         ▼
┌─────────────────────────────────┐
│   Client-side validation        │
│   - File size < 10MB            │
│   - File type supported         │
│   - Show preview thumbnail      │
└─────────────────────────────────┘
         │
         ▼
User clicks "Upload & Parse"
         │
         ▼
┌─────────────────────────────────┐
│   POST /api/transactions/[id]/  │
│        receipts (multipart)     │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Server-side validation        │
│   - Re-validate file            │
│   - Generate receipt UUID       │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Upload to Supabase Storage    │
│   Path: receipts/{user}/{id}/   │
│         {filename}              │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Create fb_receipts record     │
│   parsing_status: 'processing'  │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Return immediately to client  │
│   (receipt created, parsing     │
│    continues async)             │
└─────────────────────────────────┘
         │
         ├──────────────────────────────────┐
         ▼                                  ▼
┌─────────────────────────────────┐  ┌─────────────────────┐
│   UI: Show "Parsing..."         │  │   Async: Call       │
│   Poll for status updates       │  │   Claude Vision API │
└─────────────────────────────────┘  └─────────────────────┘
                                             │
                                             ▼
                                    ┌─────────────────────┐
                                    │   Parse JSON from   │
                                    │   AI response       │
                                    └─────────────────────┘
                                             │
                                        ┌────┴────┐
                                        ▼         ▼
                                    Success    Failed
                                        │         │
                                        ▼         ▼
┌─────────────────────────────────┐  ┌─────────────────────┐
│   Create fb_receipt_items       │  │   Update receipt    │
│   for each parsed line item     │  │   status: 'failed'  │
│                                 │  │   parsing_error:    │
│   Update fb_receipts:           │  │   <error message>   │
│   - status: 'completed'         │  └─────────────────────┘
│   - store_name, totals, etc.    │
│   - confidence score            │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Client receives update        │
│   (via polling or WebSocket)    │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   ReceiptItemsEditor opens      │
│   - Show parsed items           │
│   - Allow editing               │
│   - Show receipt vs txn diff    │
└─────────────────────────────────┘
         │
         ▼
User reviews, edits items
         │
         ▼
User clicks "Create Sub-transactions"
         │
         ▼
┌─────────────────────────────────┐
│   POST /api/receipts/[id]/      │
│        create-sub-transactions  │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Filter items (exclude tax,    │
│   discount, user-excluded)      │
│                                 │
│   Adjust last item if needed    │
│                                 │
│   Create sub-transactions       │
│                                 │
│   Link items ↔ sub-txns         │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Return success                │
│   - Created sub-transactions    │
│   - Adjustment details          │
│   - Skipped items reasons       │
└─────────────────────────────────┘
```

### I.3 Refund Linking Flow

```
User sees credit transaction
         │
         ▼
User clicks "Link as Refund"
         │
         ▼
┌─────────────────────────────────┐
│   RefundLinkModal opens         │
│   - Shows credit amount         │
│   - Starts loading suggestions  │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   GET /api/transactions/[id]/   │
│        refund-suggestions       │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Smart Matching Algorithm      │
│                                 │
│   For each debit in last 90d:   │
│   - Merchant match: +40 pts     │
│   - Amount match:   +30 pts     │
│   - Time proximity: +20 pts     │
│   - Reference match: +10 pts    │
│                                 │
│   Filter: score >= 50           │
│   Sort: highest score first     │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Enrich with sub-transactions  │
│   for item-level refund option  │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Return suggestions list       │
│   - Match scores & reasons      │
│   - Remaining refundable amts   │
│   - Sub-transaction options     │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   UI: Show suggestions          │
│   - Radio buttons for selection │
│   - Match reason badges         │
│   - Optional sub-txn selection  │
└─────────────────────────────────┘
         │
         ▼
User selects original transaction
(optionally selects specific sub-txn)
         │
         ▼
User selects refund type & reason
         │
         ▼
User clicks "Link Refund"
         │
         ▼
┌─────────────────────────────────┐
│   POST /api/transactions/[id]/  │
│        link-refund              │
│                                 │
│   Body:                         │
│   - refund_of_transaction_id    │
│   - refund_of_sub_transaction_id│
│   - refund_type                 │
│   - refund_reason               │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Validation (API)              │
│   - Credit is direction=credit  │
│   - Target is direction=debit   │
│   - Same user owns both         │
│   - Amount <= remaining         │
│   - No circular chains          │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Trigger: validate_refund      │
│   - Additional DB-level checks  │
│   - Auto-set is_refund=true     │
│   - Auto-detect refund_type     │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Check for Splitwise warning   │
│   - If original has SW expense  │
│   - Include warning in response │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Return success                │
│   - Updated credit transaction  │
│   - Refund status of original   │
│   - Splitwise warning (if any)  │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   UI Updates                    │
│   - Close modal                 │
│   - Update credit card UI       │
│     (show "Refund" badge)       │
│   - Update original card UI     │
│     (show refund status)        │
│   - Show SW warning if present  │
└─────────────────────────────────┘
```

---

## Appendix J: Testing Specifications

### J.1 Unit Tests

```typescript
// src/__tests__/lib/validation/sub-transactions.test.ts

import { validateAmountSum, createSubTransactionsSchema } from '@/lib/validation/sub-transactions';

describe('validateAmountSum', () => {
  test('returns valid when sum equals parent', () => {
    const result = validateAmountSum([500, 300, 200], 1000);
    expect(result.valid).toBe(true);
    expect(result.difference).toBe(0);
  });

  test('returns valid when within tolerance', () => {
    const result = validateAmountSum([500, 300, 199.99], 1000);
    expect(result.valid).toBe(true);
    expect(result.difference).toBe(0.01);
  });

  test('returns invalid when exceeds tolerance', () => {
    const result = validateAmountSum([500, 300, 199], 1000);
    expect(result.valid).toBe(false);
    expect(result.difference).toBe(1);
    expect(result.message).toContain('differs from parent');
  });

  test('handles floating point precision', () => {
    // 33.33 + 33.33 + 33.34 = 100 (with floating point issues)
    const result = validateAmountSum([33.33, 33.33, 33.34], 100);
    expect(result.valid).toBe(true);
  });
});

describe('createSubTransactionsSchema', () => {
  test('validates minimum count', () => {
    const result = createSubTransactionsSchema.safeParse({
      sub_transactions: [{ amount: 100, category: 'Test' }],
    });
    expect(result.success).toBe(false);
  });

  test('validates maximum count', () => {
    const result = createSubTransactionsSchema.safeParse({
      sub_transactions: Array(11).fill({ amount: 10, category: 'Test' }),
    });
    expect(result.success).toBe(false);
  });

  test('validates amount precision', () => {
    const result = createSubTransactionsSchema.safeParse({
      sub_transactions: [
        { amount: 100.123, category: 'Test' },
        { amount: 50, category: 'Test' },
      ],
    });
    expect(result.success).toBe(false);
  });
});
```

### J.2 Integration Tests

```typescript
// src/__tests__/api/sub-transactions.test.ts

import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/transactions/[id]/sub-transactions';

describe('/api/transactions/[id]/sub-transactions', () => {
  beforeEach(() => {
    // Mock auth
    jest.spyOn(auth, 'withAuth').mockImplementation((handler) => handler);
  });

  test('POST creates sub-transactions when valid', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { id: 'valid-parent-uuid' },
      body: {
        sub_transactions: [
          { amount: 500, category: 'Groceries' },
          { amount: 500, category: 'Household' },
        ],
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.sub_transactions).toHaveLength(2);
  });

  test('POST rejects nested sub-transactions', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { id: 'existing-sub-transaction-uuid' },
      body: {
        sub_transactions: [
          { amount: 100, category: 'Test' },
          { amount: 100, category: 'Test' },
        ],
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error_code).toBe('SUB_NESTED_NOT_ALLOWED');
  });
});
```

### J.3 E2E Test Scenarios

```typescript
// cypress/e2e/sub-transactions.cy.ts

describe('Sub-Transactions Feature', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/transactions');
  });

  it('creates sub-transactions from manual split', () => {
    // Click on a transaction
    cy.get('[data-testid="transaction-card"]').first().click();

    // Go to Splits tab
    cy.get('[data-testid="tab-splits"]').click();

    // Click Split Transaction
    cy.get('[data-testid="btn-split"]').click();

    // Add sub-transactions
    cy.get('[data-testid="sub-amount-0"]').type('500');
    cy.get('[data-testid="sub-category-0"]').select('Groceries');
    cy.get('[data-testid="sub-amount-1"]').type('300');
    cy.get('[data-testid="sub-category-1"]').select('Household');
    cy.get('[data-testid="btn-add-sub"]').click();
    cy.get('[data-testid="sub-amount-2"]').type('200');
    cy.get('[data-testid="sub-category-2"]').select('Personal');

    // Verify validation
    cy.get('[data-testid="validation-status"]').should('contain', 'Valid');

    // Submit
    cy.get('[data-testid="btn-create-subs"]').click();

    // Verify created
    cy.get('[data-testid="sub-transaction-list"]').children().should('have.length', 3);
  });

  it('uploads and parses receipt', () => {
    cy.get('[data-testid="transaction-card"]').first().click();
    cy.get('[data-testid="tab-receipt"]').click();

    // Upload receipt
    cy.get('[data-testid="receipt-upload"]').attachFile('test-receipt.jpg');

    // Wait for parsing
    cy.get('[data-testid="parsing-status"]', { timeout: 30000 })
      .should('contain', 'Completed');

    // Verify items parsed
    cy.get('[data-testid="receipt-item"]').should('have.length.gt', 0);

    // Convert to sub-transactions
    cy.get('[data-testid="btn-convert-to-subs"]').click();
    cy.get('[data-testid="confirm-convert"]').click();

    // Verify sub-transactions created
    cy.get('[data-testid="tab-splits"]').click();
    cy.get('[data-testid="sub-transaction-list"]').children().should('have.length.gt', 0);
  });

  it('links credit as refund', () => {
    // Find a credit transaction
    cy.get('[data-testid="filter-direction"]').select('credit');
    cy.get('[data-testid="transaction-card"]').first().click();

    // Open refund modal
    cy.get('[data-testid="btn-link-refund"]').click();

    // Wait for suggestions
    cy.get('[data-testid="refund-suggestions"]', { timeout: 5000 })
      .children().should('have.length.gt', 0);

    // Select first suggestion
    cy.get('[data-testid="suggestion-0"]').click();

    // Confirm link
    cy.get('[data-testid="btn-confirm-link"]').click();

    // Verify linked
    cy.get('[data-testid="refund-badge"]').should('be.visible');
  });
});
```

### J.4 Database Tests

```sql
-- Test sub-transaction trigger prevents nesting
DO $$
BEGIN
  -- Create parent transaction
  INSERT INTO fb_emails_processed (id, user_id, google_user_id, email_row_id, amount, direction, merchant_name)
  VALUES ('test-parent-1', 'user-1', 'google-1', 'email-1', 1000, 'debit', 'Test Store');

  -- Create sub-transaction
  INSERT INTO fb_emails_processed (id, user_id, google_user_id, email_row_id, amount, direction, merchant_name, parent_transaction_id, is_sub_transaction)
  VALUES ('test-sub-1', 'user-1', 'google-1', 'email-1', 500, 'debit', 'Test Store', 'test-parent-1', true);

  -- This should fail: nested sub-transaction
  BEGIN
    INSERT INTO fb_emails_processed (id, user_id, google_user_id, email_row_id, amount, direction, merchant_name, parent_transaction_id, is_sub_transaction)
    VALUES ('test-nested-1', 'user-1', 'google-1', 'email-1', 250, 'debit', 'Test Store', 'test-sub-1', true);

    RAISE EXCEPTION 'Should have failed for nested sub-transaction';
  EXCEPTION
    WHEN raise_exception THEN
      IF SQLERRM LIKE '%Cannot create sub-transaction%' THEN
        RAISE NOTICE 'Correctly prevented nested sub-transaction';
      ELSE
        RAISE;
      END IF;
  END;

  -- Cleanup
  DELETE FROM fb_emails_processed WHERE id LIKE 'test-%';
END $$;
```
