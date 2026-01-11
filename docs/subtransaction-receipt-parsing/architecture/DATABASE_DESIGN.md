# Database Design

## Schema Overview

### New Columns on `fb_emails_processed`

```sql
-- Sub-transaction columns
parent_transaction_id UUID REFERENCES fb_emails_processed(id) ON DELETE CASCADE
is_sub_transaction BOOLEAN DEFAULT FALSE
sub_transaction_order INTEGER DEFAULT 0
receipt_item_id UUID REFERENCES fb_receipt_items(id) ON DELETE SET NULL

-- Refund columns
refund_of_transaction_id UUID REFERENCES fb_emails_processed(id) ON DELETE SET NULL
refund_of_sub_transaction_id UUID REFERENCES fb_emails_processed(id) ON DELETE SET NULL
is_refund BOOLEAN DEFAULT FALSE
refund_type TEXT CHECK (refund_type IN ('full', 'partial', 'item'))
refund_reason TEXT
```

### New Tables

#### `fb_receipts`
```sql
CREATE TABLE fb_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES fb_emails_processed(id) ON DELETE CASCADE,

  -- File info
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,

  -- Parsed metadata
  store_name TEXT,
  receipt_date TIMESTAMPTZ,
  receipt_number TEXT,

  -- Amounts
  subtotal NUMERIC(18,2),
  tax_amount NUMERIC(18,2),
  discount_amount NUMERIC(18,2),
  total_amount NUMERIC(18,2),
  currency TEXT DEFAULT 'INR',

  -- Parsing info
  raw_ocr_text TEXT,
  parsing_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (parsing_status IN ('pending', 'processing', 'completed', 'failed')),
  parsing_error TEXT,
  confidence NUMERIC(3,2),
  ai_model_used TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `fb_receipt_items`
```sql
CREATE TABLE fb_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES fb_receipts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Item details
  item_order INTEGER NOT NULL DEFAULT 0,
  item_name TEXT NOT NULL,
  item_description TEXT,
  quantity NUMERIC(10,3) DEFAULT 1,
  unit TEXT,
  unit_price NUMERIC(18,2),
  total_price NUMERIC(18,2) NOT NULL,

  -- Classification
  category TEXT,
  is_tax BOOLEAN DEFAULT FALSE,
  is_discount BOOLEAN DEFAULT FALSE,
  is_excluded BOOLEAN DEFAULT FALSE,

  -- Link to sub-transaction
  sub_transaction_id UUID REFERENCES fb_emails_processed(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Triggers

### 1. Field Inheritance Trigger

**Purpose**: Auto-inherit fields from parent when creating sub-transaction.

```sql
CREATE OR REPLACE FUNCTION inherit_sub_transaction_fields()
RETURNS TRIGGER AS $$
DECLARE
  parent RECORD;
BEGIN
  IF NEW.is_sub_transaction = TRUE AND NEW.parent_transaction_id IS NOT NULL THEN
    -- Get parent transaction
    SELECT * INTO parent
    FROM fb_emails_processed
    WHERE id = NEW.parent_transaction_id;

    IF parent.id IS NULL THEN
      RAISE EXCEPTION 'Parent transaction not found';
    END IF;

    -- Inherit fields
    NEW.user_id := parent.user_id;
    NEW.google_user_id := parent.google_user_id;
    NEW.connection_id := parent.connection_id;
    NEW.email_row_id := parent.email_row_id;  -- CRITICAL: solves NOT NULL
    NEW.currency := COALESCE(NEW.currency, parent.currency);
    NEW.direction := COALESCE(NEW.direction, parent.direction);
    NEW.txn_time := COALESCE(NEW.txn_time, parent.txn_time);
    NEW.splitwise_expense_id := parent.splitwise_expense_id;  -- CASCADE
    NEW.account_type := COALESCE(NEW.account_type, parent.account_type);
    NEW.status := COALESCE(NEW.status, parent.status);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sub_txn_inherit_fields
  BEFORE INSERT ON fb_emails_processed
  FOR EACH ROW
  EXECUTE FUNCTION inherit_sub_transaction_fields();
```

### 2. Nested Sub-Transaction Prevention

**Purpose**: Block sub-transactions of sub-transactions.

```sql
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
```

### 3. Amount Validation Trigger

**Purpose**: Ensure sub-transaction amounts don't exceed parent.

```sql
CREATE OR REPLACE FUNCTION validate_sub_transaction_amounts()
RETURNS TRIGGER AS $$
DECLARE
  parent_amount NUMERIC(18,2);
  sub_total NUMERIC(18,2);
BEGIN
  IF NEW.is_sub_transaction = TRUE AND NEW.parent_transaction_id IS NOT NULL THEN
    -- Get parent amount
    SELECT amount INTO parent_amount
    FROM fb_emails_processed
    WHERE id = NEW.parent_transaction_id;

    -- Calculate current sub-total (excluding this record if update)
    SELECT COALESCE(SUM(amount), 0) INTO sub_total
    FROM fb_emails_processed
    WHERE parent_transaction_id = NEW.parent_transaction_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    -- Add new amount
    sub_total := sub_total + COALESCE(NEW.amount, 0);

    -- Validate
    IF sub_total > parent_amount THEN
      RAISE EXCEPTION 'Sub-transaction amounts (%) exceed parent amount (%)',
        sub_total, parent_amount;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_sub_amounts
  BEFORE INSERT OR UPDATE ON fb_emails_processed
  FOR EACH ROW
  EXECUTE FUNCTION validate_sub_transaction_amounts();
```

### 4. Splitwise Cascade Trigger

**Purpose**: Cascade Splitwise ID changes to children.

```sql
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
```

### 5. Parent Amount Lock Trigger

**Purpose**: Block parent amount changes when children exist.

```sql
CREATE OR REPLACE FUNCTION lock_parent_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.amount IS DISTINCT FROM NEW.amount THEN
    IF EXISTS (
      SELECT 1 FROM fb_emails_processed
      WHERE parent_transaction_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Cannot modify amount of transaction with sub-transactions';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lock_parent_amount
  BEFORE UPDATE OF amount ON fb_emails_processed
  FOR EACH ROW
  EXECUTE FUNCTION lock_parent_amount();
```

### 6. Refund Validation Trigger

**Purpose**: Validate refund linkage constraints.

```sql
CREATE OR REPLACE FUNCTION validate_refund_linkage()
RETURNS TRIGGER AS $$
DECLARE
  original_txn RECORD;
  total_refunded NUMERIC(18,2);
BEGIN
  IF NEW.refund_of_transaction_id IS NOT NULL THEN
    -- Get original transaction
    SELECT * INTO original_txn
    FROM fb_emails_processed
    WHERE id = NEW.refund_of_transaction_id
      AND user_id = NEW.user_id;

    -- Validate exists
    IF original_txn.id IS NULL THEN
      RAISE EXCEPTION 'Original transaction not found';
    END IF;

    -- Validate directions
    IF NEW.direction != 'credit' THEN
      RAISE EXCEPTION 'Refund must be a credit transaction';
    END IF;
    IF original_txn.direction != 'debit' THEN
      RAISE EXCEPTION 'Original must be a debit transaction';
    END IF;

    -- Prevent chains
    IF original_txn.refund_of_transaction_id IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot link refund to another refund';
    END IF;

    -- Calculate total refunded
    SELECT COALESCE(SUM(amount), 0) INTO total_refunded
    FROM fb_emails_processed
    WHERE refund_of_transaction_id = NEW.refund_of_transaction_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    -- Validate amount
    IF (total_refunded + COALESCE(NEW.amount, 0)) > COALESCE(original_txn.amount, 0) THEN
      RAISE EXCEPTION 'Total refunds exceed original amount';
    END IF;

    -- Auto-set flags
    NEW.is_refund := TRUE;
    IF NEW.refund_type IS NULL THEN
      NEW.refund_type := CASE
        WHEN NEW.amount = original_txn.amount THEN 'full'
        ELSE 'partial'
      END;
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
```

---

## Indexes

```sql
-- Sub-transaction indexes
CREATE INDEX idx_fb_txn_parent_id
  ON fb_emails_processed(parent_transaction_id)
  WHERE parent_transaction_id IS NOT NULL;

CREATE INDEX idx_fb_txn_is_sub
  ON fb_emails_processed(is_sub_transaction)
  WHERE is_sub_transaction = TRUE;

CREATE INDEX idx_fb_txn_parent_order
  ON fb_emails_processed(parent_transaction_id, sub_transaction_order)
  WHERE parent_transaction_id IS NOT NULL;

-- Receipt indexes
CREATE INDEX idx_fb_receipts_transaction ON fb_receipts(transaction_id);
CREATE INDEX idx_fb_receipts_user ON fb_receipts(user_id);
CREATE INDEX idx_fb_receipts_status ON fb_receipts(parsing_status);

CREATE INDEX idx_fb_receipt_items_receipt ON fb_receipt_items(receipt_id);
CREATE INDEX idx_fb_receipt_items_user ON fb_receipt_items(user_id);
CREATE INDEX idx_fb_receipt_items_sub_txn ON fb_receipt_items(sub_transaction_id)
  WHERE sub_transaction_id IS NOT NULL;

-- Refund indexes
CREATE INDEX idx_fb_txn_refund_of
  ON fb_emails_processed(refund_of_transaction_id)
  WHERE refund_of_transaction_id IS NOT NULL;

CREATE INDEX idx_fb_txn_is_refund
  ON fb_emails_processed(user_id, is_refund)
  WHERE is_refund = TRUE;
```

---

## Database Functions

### Get Refund Status

```sql
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
```

### Suggest Refund Matches

```sql
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
  splitwise_expense_id TEXT,
  match_score INTEGER,
  match_reasons TEXT[],
  has_sub_transactions BOOLEAN
) AS $$
DECLARE
  credit_txn RECORD;
BEGIN
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
      t.splitwise_expense_id,
      EXISTS (
        SELECT 1 FROM fb_emails_processed sub
        WHERE sub.parent_transaction_id = t.id
      ) as has_subs,
      -- Calculate match score (0-100)
      0
      + CASE
          WHEN LOWER(t.merchant_normalized) = LOWER(credit_txn.merchant_normalized) THEN 40
          WHEN LOWER(t.merchant_name) ILIKE '%' || COALESCE(credit_txn.merchant_normalized, '') || '%' THEN 20
          ELSE 0
        END
      + CASE WHEN t.amount >= credit_txn.amount THEN 30 ELSE 0 END
      + CASE
          WHEN t.txn_time >= (credit_txn.txn_time - INTERVAL '90 days')
               AND t.txn_time <= credit_txn.txn_time THEN 20
          ELSE 0
        END
      AS score,
      ARRAY_REMOVE(ARRAY[
        CASE WHEN LOWER(t.merchant_normalized) = LOWER(credit_txn.merchant_normalized)
             THEN 'Exact merchant match' END,
        CASE WHEN t.amount >= credit_txn.amount THEN 'Amount eligible' END,
        CASE WHEN t.txn_time >= (credit_txn.txn_time - INTERVAL '90 days')
             THEN 'Within 90 days' END
      ], NULL) AS reasons
    FROM fb_emails_processed t
    WHERE t.user_id = p_user_id
      AND t.direction = 'debit'
      AND t.is_sub_transaction = FALSE
      AND t.refund_of_transaction_id IS NULL
      AND t.txn_time >= (credit_txn.txn_time - INTERVAL '90 days')
      AND t.txn_time <= credit_txn.txn_time
  )
  SELECT
    cd.id, cd.merchant_name, cd.merchant_normalized, cd.amount,
    cd.txn_time, cd.splitwise_expense_id, cd.score, cd.reasons, cd.has_subs
  FROM candidate_debits cd
  WHERE cd.score >= 50
  ORDER BY cd.score DESC, cd.txn_time DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

---

## RLS Policies

```sql
-- fb_receipts
ALTER TABLE fb_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own receipts" ON fb_receipts
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- fb_receipt_items
ALTER TABLE fb_receipt_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own receipt items" ON fb_receipt_items
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

## Constraints

```sql
-- Sub-transaction must have parent
ALTER TABLE fb_emails_processed
  ADD CONSTRAINT chk_sub_transaction_has_parent
  CHECK (
    (is_sub_transaction = FALSE AND parent_transaction_id IS NULL) OR
    (is_sub_transaction = TRUE AND parent_transaction_id IS NOT NULL)
  );
```
