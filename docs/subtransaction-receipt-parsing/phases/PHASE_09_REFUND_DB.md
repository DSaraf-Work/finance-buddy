# Phase 9: Refund Database

## Objective
Add refund tracking columns and matching functions to the database.

---

## Migration File
`infra/migrations/0007_smart_refunds.sql`

---

## Schema Changes

### New Columns on `fb_emails_processed`

```sql
-- Add refund columns
ALTER TABLE fb_emails_processed
ADD COLUMN refund_of_transaction_id UUID REFERENCES fb_emails_processed(id) ON DELETE SET NULL,
ADD COLUMN refund_of_sub_transaction_id UUID REFERENCES fb_emails_processed(id) ON DELETE SET NULL,
ADD COLUMN is_refund BOOLEAN DEFAULT FALSE,
ADD COLUMN refund_type TEXT CHECK (refund_type IN ('full', 'partial', 'item')),
ADD COLUMN refund_reason TEXT;
```

---

## Validation Trigger

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
-- Refund indexes
CREATE INDEX idx_fb_txn_refund_of
  ON fb_emails_processed(refund_of_transaction_id)
  WHERE refund_of_transaction_id IS NOT NULL;

CREATE INDEX idx_fb_txn_is_refund
  ON fb_emails_processed(user_id, is_refund)
  WHERE is_refund = TRUE;

CREATE INDEX idx_fb_txn_refund_sub
  ON fb_emails_processed(refund_of_sub_transaction_id)
  WHERE refund_of_sub_transaction_id IS NOT NULL;
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
      t.splitwise_expense_id,
      EXISTS (
        SELECT 1 FROM fb_emails_processed sub
        WHERE sub.parent_transaction_id = t.id
      ) as has_subs,
      -- Calculate match score (0-100)
      0
      -- Merchant match (40 points)
      + CASE
          WHEN LOWER(COALESCE(t.merchant_normalized, '')) = LOWER(COALESCE(credit_txn.merchant_normalized, ''))
            AND t.merchant_normalized IS NOT NULL THEN 40
          WHEN LOWER(COALESCE(t.merchant_name, '')) ILIKE '%' || COALESCE(credit_txn.merchant_normalized, '') || '%'
            AND credit_txn.merchant_normalized IS NOT NULL THEN 20
          ELSE 0
        END
      -- Amount match (30 points)
      + CASE
          WHEN t.amount >= credit_txn.amount THEN 30
          ELSE 0
        END
      -- Time proximity (20 points)
      + CASE
          WHEN t.txn_time >= (credit_txn.txn_time - INTERVAL '90 days')
               AND t.txn_time <= credit_txn.txn_time THEN 20
          ELSE 0
        END
      AS score,
      -- Collect match reasons
      ARRAY_REMOVE(ARRAY[
        CASE WHEN LOWER(COALESCE(t.merchant_normalized, '')) = LOWER(COALESCE(credit_txn.merchant_normalized, ''))
             AND t.merchant_normalized IS NOT NULL
             THEN 'Exact merchant match' END,
        CASE WHEN t.amount >= credit_txn.amount THEN 'Amount eligible' END,
        CASE WHEN t.txn_time >= (credit_txn.txn_time - INTERVAL '90 days')
             AND t.txn_time <= credit_txn.txn_time
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
    cd.id,
    cd.merchant_name,
    cd.merchant_normalized,
    cd.amount,
    cd.txn_time,
    cd.splitwise_expense_id,
    cd.score,
    cd.reasons,
    cd.has_subs
  FROM candidate_debits cd
  WHERE cd.score >= 50
  ORDER BY cd.score DESC, cd.txn_time DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

---

## Rollback Script

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS trg_validate_refund_linkage ON fb_emails_processed;

-- Drop functions
DROP FUNCTION IF EXISTS validate_refund_linkage();
DROP FUNCTION IF EXISTS get_refund_status(UUID);
DROP FUNCTION IF EXISTS suggest_refund_matches(UUID, UUID, INTEGER);

-- Drop indexes
DROP INDEX IF EXISTS idx_fb_txn_refund_sub;
DROP INDEX IF EXISTS idx_fb_txn_is_refund;
DROP INDEX IF EXISTS idx_fb_txn_refund_of;

-- Drop columns
ALTER TABLE fb_emails_processed
DROP COLUMN IF EXISTS refund_reason,
DROP COLUMN IF EXISTS refund_type,
DROP COLUMN IF EXISTS is_refund,
DROP COLUMN IF EXISTS refund_of_sub_transaction_id,
DROP COLUMN IF EXISTS refund_of_transaction_id;
```

---

## Validation Steps

1. **Run migration**
   ```bash
   npx supabase db push
   ```

2. **Verify columns exist**
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'fb_emails_processed'
   AND column_name LIKE 'refund%';
   ```

3. **Test refund validation trigger**
   ```sql
   -- Should succeed
   UPDATE fb_emails_processed
   SET refund_of_transaction_id = '<debit_txn_id>'
   WHERE id = '<credit_txn_id>';

   -- Should fail (credit linked to credit)
   UPDATE fb_emails_processed
   SET refund_of_transaction_id = '<credit_txn_id>'
   WHERE id = '<another_credit_id>';
   ```

4. **Test suggestion function**
   ```sql
   SELECT * FROM suggest_refund_matches(
     '<user_id>',
     '<credit_txn_id>'
   );
   ```

---

## Success Criteria

- [ ] Refund columns added
- [ ] Validation trigger working
- [ ] Cannot link credit to credit
- [ ] Cannot exceed original amount
- [ ] Auto-sets is_refund and refund_type
- [ ] Suggestion function returns ranked matches
- [ ] Refund status function accurate
