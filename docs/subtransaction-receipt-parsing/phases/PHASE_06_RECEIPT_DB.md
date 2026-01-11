# Phase 6: Receipt Database

## Objective
Create database tables and storage for receipt parsing feature.

---

## Migration File
`infra/migrations/0006_receipts.sql`

---

## New Tables

### `fb_receipts`

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

### `fb_receipt_items`

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

## Foreign Key Addition

Add FK to `fb_emails_processed` for receipt item link:

```sql
-- Add FK for receipt_item_id (column already exists from Phase 1)
ALTER TABLE fb_emails_processed
ADD CONSTRAINT fk_receipt_item
FOREIGN KEY (receipt_item_id)
REFERENCES fb_receipt_items(id)
ON DELETE SET NULL;
```

---

## Indexes

```sql
-- Receipt indexes
CREATE INDEX idx_fb_receipts_transaction ON fb_receipts(transaction_id);
CREATE INDEX idx_fb_receipts_user ON fb_receipts(user_id);
CREATE INDEX idx_fb_receipts_status ON fb_receipts(parsing_status);

-- Receipt items indexes
CREATE INDEX idx_fb_receipt_items_receipt ON fb_receipt_items(receipt_id);
CREATE INDEX idx_fb_receipt_items_user ON fb_receipt_items(user_id);
CREATE INDEX idx_fb_receipt_items_sub_txn ON fb_receipt_items(sub_transaction_id)
  WHERE sub_transaction_id IS NOT NULL;
```

---

## RLS Policies

```sql
-- Enable RLS
ALTER TABLE fb_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_receipt_items ENABLE ROW LEVEL SECURITY;

-- fb_receipts policies
CREATE POLICY "Users can view own receipts"
ON fb_receipts FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create own receipts"
ON fb_receipts FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own receipts"
ON fb_receipts FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own receipts"
ON fb_receipts FOR DELETE
USING (user_id = auth.uid());

-- fb_receipt_items policies
CREATE POLICY "Users can view own receipt items"
ON fb_receipt_items FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create own receipt items"
ON fb_receipt_items FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own receipt items"
ON fb_receipt_items FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own receipt items"
ON fb_receipt_items FOR DELETE
USING (user_id = auth.uid());
```

---

## Storage Bucket

### Create bucket in Supabase Dashboard or via SQL:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  false,
  20971520,  -- 20MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
);
```

### Storage RLS Policies:

```sql
-- Users can upload to their own folder
CREATE POLICY "Users can upload own receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own receipts
CREATE POLICY "Users can view own receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own receipts
CREATE POLICY "Users can delete own receipts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Storage Path Convention:
```
receipts/{user_id}/{receipt_id}/{filename}
```

---

## Updated Timestamp Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fb_receipts_updated_at
  BEFORE UPDATE ON fb_receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_fb_receipt_items_updated_at
  BEFORE UPDATE ON fb_receipt_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

---

## Rollback Script

```sql
-- Drop triggers
DROP TRIGGER IF EXISTS trg_fb_receipt_items_updated_at ON fb_receipt_items;
DROP TRIGGER IF EXISTS trg_fb_receipts_updated_at ON fb_receipts;

-- Drop FK
ALTER TABLE fb_emails_processed DROP CONSTRAINT IF EXISTS fk_receipt_item;

-- Drop policies
DROP POLICY IF EXISTS "Users can delete own receipt items" ON fb_receipt_items;
DROP POLICY IF EXISTS "Users can update own receipt items" ON fb_receipt_items;
DROP POLICY IF EXISTS "Users can create own receipt items" ON fb_receipt_items;
DROP POLICY IF EXISTS "Users can view own receipt items" ON fb_receipt_items;

DROP POLICY IF EXISTS "Users can delete own receipts" ON fb_receipts;
DROP POLICY IF EXISTS "Users can update own receipts" ON fb_receipts;
DROP POLICY IF EXISTS "Users can create own receipts" ON fb_receipts;
DROP POLICY IF EXISTS "Users can view own receipts" ON fb_receipts;

-- Drop storage policies
DROP POLICY IF EXISTS "Users can delete own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own receipts" ON storage.objects;

-- Drop indexes
DROP INDEX IF EXISTS idx_fb_receipt_items_sub_txn;
DROP INDEX IF EXISTS idx_fb_receipt_items_user;
DROP INDEX IF EXISTS idx_fb_receipt_items_receipt;
DROP INDEX IF EXISTS idx_fb_receipts_status;
DROP INDEX IF EXISTS idx_fb_receipts_user;
DROP INDEX IF EXISTS idx_fb_receipts_transaction;

-- Drop tables
DROP TABLE IF EXISTS fb_receipt_items;
DROP TABLE IF EXISTS fb_receipts;

-- Delete storage bucket
DELETE FROM storage.buckets WHERE id = 'receipts';
```

---

## Validation Steps

1. **Run migration**
   ```bash
   npx supabase db push
   ```

2. **Verify tables exist**
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('fb_receipts', 'fb_receipt_items');
   ```

3. **Test RLS**
   ```typescript
   // As authenticated user
   const { data, error } = await supabase
     .from('fb_receipts')
     .select('*');
   // Should only return user's receipts
   ```

4. **Test storage upload**
   ```typescript
   const { data, error } = await supabase.storage
     .from('receipts')
     .upload(`${userId}/${receiptId}/receipt.jpg`, file);
   ```

---

## Success Criteria

- [ ] `fb_receipts` table created
- [ ] `fb_receipt_items` table created
- [ ] Foreign key to `fb_emails_processed` added
- [ ] All indexes created
- [ ] RLS policies working
- [ ] Storage bucket created
- [ ] Storage policies working
- [ ] Can upload/download files
