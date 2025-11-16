# fb_transactions Table - Complete Planning Document

**Version:** 1.0
**Date:** 2025-11-16
**Status:** Planning
**Feature:** Unified transactions table with auto-sync from confirmed emails and manual entry support

---

## Table of Contents
1. [Overview](#1-overview)
2. [Requirements Analysis](#2-requirements-analysis)
3. [Data Model](#3-data-model)
4. [Sync Logic](#4-sync-logic)
5. [API Design](#5-api-design)
6. [UI/UX Design](#6-uiux-design)
7. [Business Logic](#7-business-logic)
8. [Implementation Plan](#8-implementation-plan)
9. [Edge Cases](#9-edge-cases)
10. [Testing Strategy](#10-testing-strategy)
11. [Migration Strategy](#11-migration-strategy)

---

## 1. Overview

### 1.1 Purpose
Create a unified `fb_transactions` table that serves as the **single source of truth** for all financial transactions, combining:
- **Auto-synced transactions** from confirmed email extractions (`fb_emails_processed`)
- **Manual transactions** added directly by users (cash, offline payments, etc.)

### 1.2 Key Characteristics
- **Unified View:** Single table for all transactions regardless of source
- **Auto-Sync:** Automatically creates entries when emails are confirmed
- **Manual Entry:** Users can add transactions without email source
- **Bidirectional Link:** Links back to source email if applicable
- **Immutable Source:** Original `fb_emails_processed` remains unchanged
- **Separate Route:** Dedicated UI route for managing all transactions

### 1.3 Goals
- ✅ Provide single source of truth for all transactions
- ✅ Support both email-based and manual transactions
- ✅ Maintain traceability to source emails
- ✅ Enable comprehensive transaction management
- ✅ Support future features (budgets, reports, analytics)
- ✅ Preserve audit trail and data integrity

### 1.4 Non-Goals
- ❌ Replace `fb_emails_processed` (it remains for email processing)
- ❌ Automatic categorization of manual transactions (user must specify)
- ❌ Bank account integration (future enhancement)
- ❌ Multi-currency conversion (future enhancement)

---

## 2. Requirements Analysis

### 2.1 Functional Requirements

**FR1: Auto-Sync from Confirmed Emails**
- When `fb_emails_processed.status` changes to `'confirmed'`, automatically create entry in `fb_transactions`
- Copy all relevant fields from `fb_emails_processed`
- Maintain link to source via `email_processed_id`
- Handle updates to confirmed emails (sync changes)

**FR2: Manual Transaction Entry**
- Users can create transactions without email source
- All fields are user-editable
- Support all transaction types (debit, credit, transfer)
- No `email_processed_id` for manual entries

**FR3: Transaction Management**
- View all transactions (email-based + manual) in unified list
- Edit transaction details
- Delete transactions (with confirmation)
- Filter by source (email vs manual)
- Search and filter capabilities

**FR4: Source Traceability**
- Email-based transactions link to `fb_emails_processed`
- Show email context when viewing transaction
- Navigate from transaction to source email
- Indicate transaction source in UI

**FR5: Data Integrity**
- Prevent duplicate auto-sync entries
- Validate required fields
- Maintain referential integrity
- Handle email deletion gracefully

### 2.2 Non-Functional Requirements

**NFR1: Performance**
- Auto-sync should complete within 1 second
- Transaction list should load within 2 seconds
- Support 100,000+ transactions per user

**NFR2: Data Consistency**
- ACID compliance for all operations
- No data loss during sync
- Consistent state between `fb_emails_processed` and `fb_transactions`

**NFR3: Scalability**
- Handle bulk email confirmations efficiently
- Support pagination for large transaction lists
- Optimize queries with proper indexes

**NFR4: Security**
- Row Level Security (RLS) on all operations
- User can only access their own transactions
- Audit trail for all changes

---

## 3. Data Model

### 3.1 Database Schema

```sql
-- Main transactions table (single source of truth)
CREATE TABLE fb_transactions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User ownership (for RLS)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Source tracking
  source_type VARCHAR(20) NOT NULL, -- 'email' or 'manual'
  email_processed_id UUID REFERENCES fb_emails_processed(id) ON DELETE SET NULL,
    -- NULL for manual transactions, populated for email-based transactions

  -- Transaction details (from EmailProcessed or user input)
  amount DECIMAL(10,2) NOT NULL,
  direction VARCHAR(10) NOT NULL, -- 'debit' or 'credit'
  merchant_name VARCHAR(255),
  category VARCHAR(100),
  txn_time TIMESTAMPTZ NOT NULL,

  -- Account information
  account_hint VARCHAR(50), -- Last 4 digits of account
  account_type VARCHAR(50), -- 'credit_card', 'debit_card', 'bank_account', 'upi', 'wallet', 'cash'

  -- Additional metadata
  description TEXT,
  notes TEXT, -- User-added notes
  tags TEXT[], -- User-defined tags

  -- Location (optional)
  location VARCHAR(255),


### 3.2 TypeScript Types

```typescript
// src/types/transactions.ts

export type TransactionSourceType = 'email' | 'manual';
export type TransactionDirection = 'debit' | 'credit';
export type AccountType = 'credit_card' | 'debit_card' | 'bank_account' | 'upi' | 'wallet' | 'cash';

export interface Transaction {
  id: string;
  user_id: string;
  source_type: TransactionSourceType;
  email_processed_id?: string;

  // Transaction details
  amount: number;
  direction: TransactionDirection;
  merchant_name?: string;
  category?: string;
  txn_time: string;

  // Account info
  account_hint?: string;
  account_type?: AccountType;

  // Metadata
  description?: string;
  notes?: string;
  tags?: string[];
  location?: string;

  // Status
  is_verified: boolean;
  is_recurring: boolean;

  // Audit
  created_at: string;
  updated_at: string;
  created_by: string;

  // Populated fields
  email_processed?: EmailProcessed;  // If source_type = 'email'
}

export interface CreateTransactionRequest {
  // Required fields
  amount: number;
  direction: TransactionDirection;
  txn_time: string;

  // Optional fields
  merchant_name?: string;
  category?: string;
  account_hint?: string;
  account_type?: AccountType;
  description?: string;
  notes?: string;
  tags?: string[];
  location?: string;
  is_recurring?: boolean;
}

export interface UpdateTransactionRequest {
  amount?: number;
  direction?: TransactionDirection;
  merchant_name?: string;
  category?: string;
  txn_time?: string;
  account_hint?: string;
  account_type?: AccountType;
  description?: string;
  notes?: string;
  tags?: string[];
  location?: string;
  is_verified?: boolean;
  is_recurring?: boolean;
}

export interface TransactionFilters {
  source_type?: TransactionSourceType;
  direction?: TransactionDirection;
  category?: string;
  merchant_name?: string;
  account_hint?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  tags?: string[];
  is_verified?: boolean;
  is_recurring?: boolean;
}

export interface TransactionStats {
  total_count: number;
  email_count: number;
  manual_count: number;
  total_debit: number;
  total_credit: number;
  net_amount: number;
  by_category: {
    category: string;
    count: number;
    total_amount: number;
  }[];
  by_merchant: {
    merchant: string;
    count: number;
    total_amount: number;
  }[];
}
```

### 3.3 Relationship with Existing Tables

**fb_emails_processed → fb_transactions:**
```
One-to-One relationship (when confirmed)
- Each confirmed email creates exactly one transaction
- Transaction links back via email_processed_id
- If email deleted, transaction remains (ON DELETE SET NULL)
```

**fb_emails_fetched → fb_emails_processed → fb_transactions:**
```
Complete chain for email-based transactions:
fb_emails_fetched (raw email)
  ↓ email_row_id
fb_emails_processed (AI extracted data)
  ↓ email_processed_id (when status = 'confirmed')
fb_transactions (unified transaction record)
```

**Manual transactions:**
```
No email source:
- source_type = 'manual'
- email_processed_id = NULL
- created_by = 'user'
- All fields user-provided
```

---

## 4. Sync Logic

### 4.1 Auto-Sync Trigger

**When to Sync:**
- Trigger: `fb_emails_processed.status` changes to `'confirmed'`
- Action: Create entry in `fb_transactions`
- Timing: Immediately after status update (database trigger or application logic)

**Database Trigger Approach:**
```sql
CREATE OR REPLACE FUNCTION sync_confirmed_email_to_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync when status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- Check if transaction already exists (idempotency)
    IF NOT EXISTS (SELECT 1 FROM fb_transactions WHERE email_processed_id = NEW.id) THEN
      INSERT INTO fb_transactions (
        user_id,
        source_type,
        email_processed_id,
        amount,
        direction,
        merchant_name,
        category,
        txn_time,
        account_hint,
        account_type,
        description,
        created_by
      ) VALUES (
        NEW.user_id,
        'email',
        NEW.id,
        NEW.amount,
        NEW.direction,
        NEW.merchant_name,
        NEW.category,
        NEW.txn_time,
        NEW.account_hint,
        NEW.account_type,
        NEW.ai_notes,
        'system'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_confirmed_email
  AFTER INSERT OR UPDATE ON fb_emails_processed
  FOR EACH ROW
  EXECUTE FUNCTION sync_confirmed_email_to_transaction();
```

**Application Logic Approach:**
```typescript
// src/lib/transactions/sync.ts

export async function syncConfirmedEmailToTransaction(
  emailProcessedId: string,
  supabase: SupabaseClient
): Promise<Transaction | null> {
  // 1. Get confirmed email
  const { data: email, error: emailError } = await supabase
    .from('fb_emails_processed')
    .select('*')
    .eq('id', emailProcessedId)
    .eq('status', 'confirmed')
    .single();

  if (emailError || !email) {
    console.error('Email not found or not confirmed:', emailError);
    return null;
  }

  // 2. Check if transaction already exists (idempotency)
  const { data: existing } = await supabase
    .from('fb_transactions')
    .select('id')
    .eq('email_processed_id', emailProcessedId)
    .single();

  if (existing) {
    console.log('Transaction already exists for this email');
    return existing;
  }

  // 3. Create transaction
  const { data: transaction, error: createError } = await supabase
    .from('fb_transactions')
    .insert({
      user_id: email.user_id,
      source_type: 'email',
      email_processed_id: email.id,
      amount: email.amount,
      direction: email.direction,
      merchant_name: email.merchant_name,
      category: email.category,
      txn_time: email.txn_time,
      account_hint: email.account_hint,
      account_type: email.account_type,
      description: email.ai_notes,
      created_by: 'system',
    })
    .select()
    .single();

  if (createError) {
    console.error('Failed to create transaction:', createError);
    return null;
  }

  return transaction;
}
```

### 4.2 Update Sync Logic

**When confirmed email is updated:**
```typescript
export async function syncEmailUpdateToTransaction(
  emailProcessedId: string,
  supabase: SupabaseClient
): Promise<void> {
  // Get updated email
  const { data: email } = await supabase
    .from('fb_emails_processed')
    .select('*')
    .eq('id', emailProcessedId)
    .single();

  if (!email || email.status !== 'confirmed') {
    return;
  }

  // Update corresponding transaction
  await supabase
    .from('fb_transactions')
    .update({
      amount: email.amount,
      direction: email.direction,
      merchant_name: email.merchant_name,
      category: email.category,
      txn_time: email.txn_time,
      account_hint: email.account_hint,
      account_type: email.account_type,
      description: email.ai_notes,
      updated_at: new Date().toISOString(),
    })
    .eq('email_processed_id', emailProcessedId);
}
```

### 4.3 Idempotency

**Prevent Duplicate Syncs:**
- Unique constraint on `email_processed_id`
- Check existence before insert
- Handle race conditions with UPSERT

```sql
-- Upsert approach
INSERT INTO fb_transactions (...)
VALUES (...)
ON CONFLICT (email_processed_id)
DO UPDATE SET
  amount = EXCLUDED.amount,
  merchant_name = EXCLUDED.merchant_name,
  updated_at = NOW();
```

---

## 5. API Design


  -- Status
  is_verified BOOLEAN DEFAULT FALSE, -- User verified this transaction
  is_recurring BOOLEAN DEFAULT FALSE, -- Part of recurring expense

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(50) DEFAULT 'system', -- 'system' for auto-sync, 'user' for manual

  -- Constraints
  CONSTRAINT valid_source_type CHECK (source_type IN ('email', 'manual')),
  CONSTRAINT valid_direction CHECK (direction IN ('debit', 'credit')),
  CONSTRAINT email_source_consistency CHECK (
    (source_type = 'email' AND email_processed_id IS NOT NULL) OR
    (source_type = 'manual' AND email_processed_id IS NULL)
  ),
  CONSTRAINT unique_email_transaction UNIQUE (email_processed_id)
    -- Each confirmed email can only create one transaction
);

-- Indexes for performance
CREATE INDEX idx_transactions_user ON fb_transactions(user_id);
CREATE INDEX idx_transactions_email_processed ON fb_transactions(email_processed_id);
CREATE INDEX idx_transactions_source_type ON fb_transactions(source_type);
CREATE INDEX idx_transactions_txn_time ON fb_transactions(txn_time DESC);
CREATE INDEX idx_transactions_merchant ON fb_transactions(merchant_name);
CREATE INDEX idx_transactions_category ON fb_transactions(category);
CREATE INDEX idx_transactions_direction ON fb_transactions(direction);
CREATE INDEX idx_transactions_account_hint ON fb_transactions(account_hint);
CREATE INDEX idx_transactions_created_at ON fb_transactions(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_transactions_user_time ON fb_transactions(user_id, txn_time DESC);
CREATE INDEX idx_transactions_user_source ON fb_transactions(user_id, source_type);
CREATE INDEX idx_transactions_user_category ON fb_transactions(user_id, category);

-- GIN index for tags array
CREATE INDEX idx_transactions_tags ON fb_transactions USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE fb_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own transactions"
  ON fb_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON fb_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON fb_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON fb_transactions FOR DELETE
  USING (auth.uid() = user_id);
```




### 7.1 Transaction Source Rules

**Email-based Transactions:**
- `source_type = 'email'`
- `email_processed_id` must be populated
- `created_by = 'system'`
- Auto-synced when email status = 'confirmed'
- Cannot be created manually via API
- Can be edited by user (updates don't sync back to email)

**Manual Transactions:**
- `source_type = 'manual'`
- `email_processed_id = NULL`
- `created_by = 'user'`
- Created via API or UI
- All fields user-provided
- No link to email system

### 7.2 Validation Rules

**Required Fields:**
- `amount` > 0
- `direction` in ('debit', 'credit')
- `txn_time` is valid timestamp
- `source_type` in ('email', 'manual')

**Conditional Requirements:**
- If `source_type = 'email'`, then `email_processed_id` must exist
- If `source_type = 'manual'`, then `email_processed_id` must be NULL

**Optional Fields:**
- All other fields are optional
- Recommended: merchant_name, category, account_hint

### 7.3 Edit/Delete Rules

**Email-based Transactions:**
- ✅ Can edit: notes, tags, category, is_verified, is_recurring
- ⚠️ Can edit with warning: amount, merchant_name, txn_time
- ❌ Cannot edit: source_type, email_processed_id, created_by
- ⚠️ Can delete with warning: "This transaction is from an email. The email will remain."

**Manual Transactions:**
- ✅ Can edit: all fields except id, user_id, created_at, created_by
- ✅ Can delete: no restrictions

### 7.4 Statistics Calculation

**Total Debit:**
```sql
SELECT SUM(amount) FROM fb_transactions
WHERE user_id = $1 AND direction = 'debit';
```

**Total Credit:**
```sql
SELECT SUM(amount) FROM fb_transactions
WHERE user_id = $1 AND direction = 'credit';
```

**Net Amount:**
```sql
SELECT
  SUM(CASE WHEN direction = 'credit' THEN amount ELSE 0 END) -
  SUM(CASE WHEN direction = 'debit' THEN amount ELSE 0 END) as net_amount
FROM fb_transactions
WHERE user_id = $1;
```

**By Category:**
```sql
SELECT
  category,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM fb_transactions
WHERE user_id = $1
GROUP BY category
ORDER BY total_amount DESC;
```

---

## 8. Implementation Plan

### 8.1 Phase 1: Database & Sync (Week 1)

**Database:**
- ✅ Create `fb_transactions` table
- ✅ Add indexes
- ✅ Enable RLS policies
- ✅ Create sync trigger/function
- ✅ Test migration

**Sync Logic:**
- ✅ Implement auto-sync on email confirmation
- ✅ Handle idempotency
- ✅ Test with existing confirmed emails
- ✅ Backfill existing confirmed emails

### 8.2 Phase 2: API & Backend (Week 2)

**API Endpoints:**
- ✅ Create manual transaction
- ✅ List transactions with filters
- ✅ Get transaction details
- ✅ Update transaction
- ✅ Delete transaction
- ✅ Get statistics

**Business Logic:**
- ✅ Validation rules
- ✅ Statistics calculation
- ✅ Filter/search logic

### 8.3 Phase 3: UI (Week 3)

**Pages:**
- ✅ Transactions list page (`/transactions`)
- ✅ Transaction detail page (`/transactions/:id`)
- ✅ Create transaction modal
- ✅ Edit transaction modal

**Components:**
- ✅ Transaction card
- ✅ Transaction filters
- ✅ Statistics summary
- ✅ Source indicator (email vs manual)

### 8.4 Phase 4: Polish & Integration (Week 4)

**Integration:**
- ✅ Link from email detail to transaction
- ✅ Show transaction status on email
- ✅ Navigation between email and transaction

**Polish:**
- ✅ Mobile optimization
- ✅ Export functionality
- ✅ Bulk operations
- ✅ Advanced filters

---

## 9. Edge Cases

### 9.1 Email Deleted After Sync
**Scenario:** User deletes confirmed email that created transaction

**Solution:**
- Transaction remains (ON DELETE SET NULL)
- `email_processed_id` becomes NULL
- Transaction still shows as email-based (`source_type = 'email'`)
- UI shows: "Source email deleted"

### 9.2 Email Un-confirmed After Sync
**Scenario:** User changes email status from 'confirmed' to 'pending'

**Solution:**
- Transaction remains unchanged
- No automatic deletion
- User must manually delete transaction if needed
- Show warning: "Email status changed. Transaction still exists."

### 9.3 Duplicate Manual Entry
**Scenario:** User manually creates transaction that matches existing email transaction

**Solution:**
- Allow creation (no duplicate detection for manual entries)
- Show warning if similar transaction exists
- User can merge or keep separate

### 9.4 Bulk Email Confirmation
**Scenario:** User confirms 100 emails at once

**Solution:**
- Sync happens in background
- Show progress indicator
- Queue-based processing
- Notify when complete

### 9.5 Edit Email After Sync
**Scenario:** User edits confirmed email (amount, merchant, etc.)

**Solution:**
- Option 1: Auto-sync updates to transaction
- Option 2: Show warning, require manual update
- **Recommended:** Option 1 with notification

### 9.6 Transaction Without Category
**Scenario:** Manual transaction created without category

**Solution:**
- Allow NULL category
- Show as "Uncategorized" in UI
- Provide quick-edit to add category

---

## 10. Testing Strategy

### 10.1 Unit Tests

```typescript
describe('Transaction Sync', () => {
  test('creates transaction when email confirmed', async () => {
    const email = await confirmEmail(emailId);
    const transaction = await getTransactionByEmailId(emailId);

    expect(transaction).toBeDefined();
    expect(transaction.source_type).toBe('email');
    expect(transaction.email_processed_id).toBe(emailId);
    expect(transaction.amount).toBe(email.amount);
  });

  test('does not create duplicate transaction', async () => {
    await confirmEmail(emailId);
    await confirmEmail(emailId); // Confirm again

    const transactions = await getTransactionsByEmailId(emailId);
    expect(transactions.length).toBe(1);
  });

  test('updates transaction when email updated', async () => {
    await confirmEmail(emailId);
    await updateEmail(emailId, { amount: 200 });

    const transaction = await getTransactionByEmailId(emailId);
    expect(transaction.amount).toBe(200);
  });
});

describe('Manual Transactions', () => {
  test('creates manual transaction', async () => {
    const transaction = await createTransaction({
      amount: 150,
      direction: 'debit',
      merchant_name: 'Test Merchant',
      txn_time: new Date().toISOString(),
    });

    expect(transaction.source_type).toBe('manual');
    expect(transaction.email_processed_id).toBeNull();
    expect(transaction.created_by).toBe('user');
  });

  test('validates required fields', async () => {
    await expect(
      createTransaction({ amount: -100 })
    ).rejects.toThrow('Amount must be positive');
  });
});

describe('Transaction Statistics', () => {
  test('calculates total debit correctly', async () => {
    await createTransaction({ amount: 100, direction: 'debit' });
    await createTransaction({ amount: 50, direction: 'debit' });

    const stats = await getTransactionStats();
    expect(stats.total_debit).toBe(150);
  });

  test('calculates net amount correctly', async () => {
    await createTransaction({ amount: 100, direction: 'debit' });
    await createTransaction({ amount: 200, direction: 'credit' });

    const stats = await getTransactionStats();
    expect(stats.net_amount).toBe(100); // 200 - 100
  });
});
```

### 10.2 Integration Tests

```typescript
describe('End-to-End Transaction Flow', () => {
  test('email to transaction workflow', async () => {
    // 1. Fetch email
    const email = await fetchEmail();

    // 2. Process email
    const processed = await processEmail(email.id);

    // 3. Confirm email
    await confirmEmail(processed.id);

    // 4. Verify transaction created
    const transaction = await getTransactionByEmailId(processed.id);
    expect(transaction).toBeDefined();
    expect(transaction.source_type).toBe('email');

    // 5. Edit transaction
    await updateTransaction(transaction.id, { notes: 'Test note' });

    // 6. Verify edit
    const updated = await getTransaction(transaction.id);
    expect(updated.notes).toBe('Test note');
  });
});
```

---

## 11. Migration Strategy

### 11.1 Database Migration

```sql
-- Migration: Create fb_transactions table
-- Version: 20250116_fb_transactions
-- Description: Unified transactions table with auto-sync from confirmed emails

BEGIN;

-- Create table
CREATE TABLE fb_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type VARCHAR(20) NOT NULL,
  email_processed_id UUID REFERENCES fb_emails_processed(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  direction VARCHAR(10) NOT NULL,
  merchant_name VARCHAR(255),
  category VARCHAR(100),
  txn_time TIMESTAMPTZ NOT NULL,
  account_hint VARCHAR(50),
  account_type VARCHAR(50),
  description TEXT,
  notes TEXT,
  tags TEXT[],
  location VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(50) DEFAULT 'system',
  CONSTRAINT valid_source_type CHECK (source_type IN ('email', 'manual')),
  CONSTRAINT valid_direction CHECK (direction IN ('debit', 'credit')),
  CONSTRAINT email_source_consistency CHECK (
    (source_type = 'email' AND email_processed_id IS NOT NULL) OR
    (source_type = 'manual' AND email_processed_id IS NULL)
  ),
  CONSTRAINT unique_email_transaction UNIQUE (email_processed_id)
);

-- Create indexes
CREATE INDEX idx_transactions_user ON fb_transactions(user_id);
CREATE INDEX idx_transactions_email_processed ON fb_transactions(email_processed_id);
CREATE INDEX idx_transactions_source_type ON fb_transactions(source_type);
CREATE INDEX idx_transactions_txn_time ON fb_transactions(txn_time DESC);
CREATE INDEX idx_transactions_merchant ON fb_transactions(merchant_name);
CREATE INDEX idx_transactions_category ON fb_transactions(category);
CREATE INDEX idx_transactions_direction ON fb_transactions(direction);
CREATE INDEX idx_transactions_account_hint ON fb_transactions(account_hint);
CREATE INDEX idx_transactions_created_at ON fb_transactions(created_at DESC);
CREATE INDEX idx_transactions_user_time ON fb_transactions(user_id, txn_time DESC);
CREATE INDEX idx_transactions_user_source ON fb_transactions(user_id, source_type);
CREATE INDEX idx_transactions_user_category ON fb_transactions(user_id, category);
CREATE INDEX idx_transactions_tags ON fb_transactions USING GIN(tags);

-- Enable RLS
ALTER TABLE fb_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own transactions"
  ON fb_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON fb_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON fb_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON fb_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Create sync trigger
CREATE OR REPLACE FUNCTION sync_confirmed_email_to_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    INSERT INTO fb_transactions (
      user_id, source_type, email_processed_id, amount, direction,
      merchant_name, category, txn_time, account_hint, account_type,
      description, created_by
    ) VALUES (
      NEW.user_id, 'email', NEW.id, NEW.amount, NEW.direction,
      NEW.merchant_name, NEW.category, NEW.txn_time, NEW.account_hint,
      NEW.account_type, NEW.ai_notes, 'system'
    )
    ON CONFLICT (email_processed_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_confirmed_email
  AFTER INSERT OR UPDATE ON fb_emails_processed
  FOR EACH ROW
  EXECUTE FUNCTION sync_confirmed_email_to_transaction();

COMMIT;
```

### 11.2 Backfill Existing Data

```sql
-- Backfill existing confirmed emails
INSERT INTO fb_transactions (
  user_id, source_type, email_processed_id, amount, direction,
  merchant_name, category, txn_time, account_hint, account_type,
  description, created_by, created_at
)
SELECT
  user_id, 'email', id, amount, direction,
  merchant_name, category, txn_time, account_hint, account_type,
  ai_notes, 'system', updated_at
FROM fb_emails_processed
WHERE status = 'confirmed'
ON CONFLICT (email_processed_id) DO NOTHING;
```

### 11.3 Rollback Plan

```sql
BEGIN;

-- Drop trigger
DROP TRIGGER IF EXISTS trigger_sync_confirmed_email ON fb_emails_processed;
DROP FUNCTION IF EXISTS sync_confirmed_email_to_transaction();

-- Drop policies
DROP POLICY IF EXISTS "Users can delete their own transactions" ON fb_transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON fb_transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON fb_transactions;
DROP POLICY IF EXISTS "Users can view their own transactions" ON fb_transactions;

-- Drop table
DROP TABLE IF EXISTS fb_transactions CASCADE;

COMMIT;
```

---

## 12. Summary

### Key Features
✅ Unified transactions table (email + manual)
✅ Auto-sync from confirmed emails
✅ Manual transaction entry
✅ Source traceability
✅ Comprehensive filtering and search
✅ Transaction statistics
✅ Dedicated UI route (`/transactions`)
✅ Edit/delete capabilities
✅ RLS security

### Technical Highlights
✅ Database trigger for auto-sync
✅ Idempotent sync logic
✅ Unique constraint prevents duplicates
✅ ON DELETE SET NULL preserves transactions
✅ Comprehensive indexes for performance
✅ Full RLS policies
✅ Backfill script for existing data

### Timeline
- **Phase 1 (Week 1):** Database & Sync
- **Phase 2 (Week 2):** API & Backend
- **Phase 3 (Week 3):** UI
- **Phase 4 (Week 4):** Polish & Integration

**Total:** 4 weeks from start to production

---

**Document End**
