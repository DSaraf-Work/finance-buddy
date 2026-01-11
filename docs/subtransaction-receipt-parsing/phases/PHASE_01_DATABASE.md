# Phase 1: Database Migration

## Objective
Add sub-transaction support columns and triggers to `fb_emails_processed`.

---

## Migration File
`infra/migrations/0005_sub_transactions.sql`

---

## Schema Changes

### New Columns on `fb_emails_processed`

```sql
-- Add sub-transaction columns
ALTER TABLE fb_emails_processed
ADD COLUMN parent_transaction_id UUID REFERENCES fb_emails_processed(id) ON DELETE CASCADE,
ADD COLUMN is_sub_transaction BOOLEAN DEFAULT FALSE,
ADD COLUMN sub_transaction_order INTEGER DEFAULT 0,
ADD COLUMN receipt_item_id UUID;  -- FK added after fb_receipt_items exists

-- Add constraint
ALTER TABLE fb_emails_processed
ADD CONSTRAINT chk_sub_transaction_has_parent
CHECK (
  (is_sub_transaction = FALSE AND parent_transaction_id IS NULL) OR
  (is_sub_transaction = TRUE AND parent_transaction_id IS NOT NULL)
);
```

---

## Triggers

### 1. Field Inheritance Trigger

```sql
CREATE OR REPLACE FUNCTION inherit_sub_transaction_fields()
RETURNS TRIGGER AS $$
DECLARE
  parent RECORD;
BEGIN
  IF NEW.is_sub_transaction = TRUE AND NEW.parent_transaction_id IS NOT NULL THEN
    SELECT * INTO parent
    FROM fb_emails_processed
    WHERE id = NEW.parent_transaction_id;

    IF parent.id IS NULL THEN
      RAISE EXCEPTION 'Parent transaction not found';
    END IF;

    NEW.user_id := parent.user_id;
    NEW.google_user_id := parent.google_user_id;
    NEW.connection_id := parent.connection_id;
    NEW.email_row_id := parent.email_row_id;
    NEW.currency := COALESCE(NEW.currency, parent.currency);
    NEW.direction := COALESCE(NEW.direction, parent.direction);
    NEW.txn_time := COALESCE(NEW.txn_time, parent.txn_time);
    NEW.splitwise_expense_id := parent.splitwise_expense_id;
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

### 2. Nested Prevention Trigger

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

```sql
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

---

## Indexes

```sql
CREATE INDEX idx_fb_txn_parent_id
  ON fb_emails_processed(parent_transaction_id)
  WHERE parent_transaction_id IS NOT NULL;

CREATE INDEX idx_fb_txn_is_sub
  ON fb_emails_processed(is_sub_transaction)
  WHERE is_sub_transaction = TRUE;

CREATE INDEX idx_fb_txn_parent_order
  ON fb_emails_processed(parent_transaction_id, sub_transaction_order)
  WHERE parent_transaction_id IS NOT NULL;
```

---

## Rollback Script

```sql
-- Drop triggers
DROP TRIGGER IF EXISTS trg_lock_parent_amount ON fb_emails_processed;
DROP TRIGGER IF EXISTS trg_cascade_splitwise ON fb_emails_processed;
DROP TRIGGER IF EXISTS trg_validate_sub_amounts ON fb_emails_processed;
DROP TRIGGER IF EXISTS trg_no_nested_sub_transactions ON fb_emails_processed;
DROP TRIGGER IF EXISTS trg_sub_txn_inherit_fields ON fb_emails_processed;

-- Drop functions
DROP FUNCTION IF EXISTS lock_parent_amount();
DROP FUNCTION IF EXISTS cascade_splitwise_to_children();
DROP FUNCTION IF EXISTS validate_sub_transaction_amounts();
DROP FUNCTION IF EXISTS check_no_nested_sub_transactions();
DROP FUNCTION IF EXISTS inherit_sub_transaction_fields();

-- Drop indexes
DROP INDEX IF EXISTS idx_fb_txn_parent_order;
DROP INDEX IF EXISTS idx_fb_txn_is_sub;
DROP INDEX IF EXISTS idx_fb_txn_parent_id;

-- Drop constraint
ALTER TABLE fb_emails_processed DROP CONSTRAINT IF EXISTS chk_sub_transaction_has_parent;

-- Drop columns
ALTER TABLE fb_emails_processed
DROP COLUMN IF EXISTS receipt_item_id,
DROP COLUMN IF EXISTS sub_transaction_order,
DROP COLUMN IF EXISTS is_sub_transaction,
DROP COLUMN IF EXISTS parent_transaction_id;
```

---

## Validation Steps

1. **Run migration**
   ```bash
   npx supabase db push
   ```

2. **Verify columns exist**
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'fb_emails_processed'
   AND column_name IN ('parent_transaction_id', 'is_sub_transaction', 'sub_transaction_order');
   ```

3. **Test inheritance trigger**
   ```sql
   -- Insert a sub-transaction (should inherit fields)
   INSERT INTO fb_emails_processed (
     id, is_sub_transaction, parent_transaction_id, amount, merchant_name
   ) VALUES (
     gen_random_uuid(), TRUE, '<existing_txn_id>', 100, 'Test Sub'
   );
   -- Verify user_id, email_row_id were inherited
   ```

4. **Test nested prevention**
   ```sql
   -- Should fail
   INSERT INTO fb_emails_processed (
     id, is_sub_transaction, parent_transaction_id, amount
   ) VALUES (
     gen_random_uuid(), TRUE, '<sub_txn_id>', 50
   );
   ```

5. **Test amount validation**
   ```sql
   -- Should fail if sum exceeds parent
   ```

---

## Success Criteria

- [ ] All 3 columns added successfully
- [ ] All 5 triggers created without errors
- [ ] All 3 indexes created
- [ ] Constraint validates properly
- [ ] Existing transactions unaffected
- [ ] RLS still works correctly
