-- Migration 0012: Make fb_receipts.transaction_id nullable
-- Allows storing receipts before the transaction is created (e.g., receipt scan during manual transaction creation)

-- Step 1: Drop NOT NULL constraint
ALTER TABLE fb_receipts ALTER COLUMN transaction_id DROP NOT NULL;

-- Step 2: Change FK from CASCADE DELETE to SET NULL
-- (So deleting a manual transaction doesn't delete its receipt)
ALTER TABLE fb_receipts DROP CONSTRAINT fb_receipts_transaction_id_fkey;
ALTER TABLE fb_receipts
  ADD CONSTRAINT fb_receipts_transaction_id_fkey
  FOREIGN KEY (transaction_id)
  REFERENCES fb_emails_processed(id)
  ON DELETE SET NULL;

-- Step 3: Recreate index as partial (only index non-null transaction_id rows)
DROP INDEX IF EXISTS idx_receipts_transaction;
CREATE INDEX idx_receipts_transaction
  ON fb_receipts(transaction_id)
  WHERE transaction_id IS NOT NULL;
