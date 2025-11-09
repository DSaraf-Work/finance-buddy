# Email to Transaction Relationship

**Last Updated**: 2025-11-09

---

## 📊 **Visual Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                         RELATIONSHIP                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐              ┌──────────────────────────┐
│     fb_emails        │              │ fb_extracted_transactions│
├──────────────────────┤              ├──────────────────────────┤
│ id (PK)              │◄─────────────│ email_row_id (FK)        │
│ user_id              │              │ id (PK)                  │
│ google_user_id       │              │ user_id                  │
│ connection_id        │              │ google_user_id           │
│ email_address        │              │ connection_id            │
│ message_id           │              │                          │
│ thread_id            │              │ txn_time                 │
│ from_address         │              │ amount                   │
│ to_addresses         │              │ currency                 │
│ subject              │              │ direction                │
│ snippet              │              │ merchant_name            │
│ plain_body           │              │ merchant_normalized      │
│ internal_date        │              │ category                 │
│ status               │              │ account_hint             │
│ error_reason         │              │ reference_id             │
│ processed_at         │              │ location                 │
│ created_at           │              │ confidence               │
│ updated_at           │              │ extraction_version       │
└──────────────────────┘              │ account_type             │
                                      │ transaction_type         │
                                      │ ai_notes                 │
                                      │ user_notes               │
                                      │ status                   │
                                      │ created_at               │
                                      │ updated_at               │
                                      └──────────────────────────┘

Relationship: ONE-TO-ONE (currently enforced by UNIQUE constraint)
Cascade: ON DELETE CASCADE (delete email → delete transaction)
```

---

## 🔄 **Data Flow Diagram**

```
┌─────────────┐
│   Gmail     │
│     API     │
└──────┬──────┘
       │
       │ Fetch Email
       ↓
┌─────────────────────────────────────────────────────────────┐
│                    Email Sync Process                        │
└──────┬──────────────────────────────────────────────────────┘
       │
       │ Store Email
       ↓
┌──────────────────┐
│   fb_emails      │
│ status='Fetched' │
└──────┬───────────┘
       │
       │ Process Email
       ↓
┌─────────────────────────────────────────────────────────────┐
│              AI Transaction Extraction                       │
│  (OpenAI / Anthropic / Google AI)                           │
└──────┬──────────────────────────────────────────────────────┘
       │
       │ Extract Transaction Data
       ↓
┌──────────────────────────┐
│ fb_extracted_transactions│
│ email_row_id = email.id  │
└──────┬───────────────────┘
       │
       │ Update Status
       ↓
┌──────────────────────┐
│   fb_emails          │
│ status='Processed'   │
└──────────────────────┘
```

---

## 🎯 **Overview**

The `fb_emails` and `fb_extracted_transactions` tables have a **one-to-many relationship**, where:
- **One email** can have **zero or one transaction** (currently enforced by unique constraint)
- **One transaction** belongs to **exactly one email**

---

## 📊 **Database Relationship**

### **Foreign Key**

```sql
CREATE TABLE fb_extracted_transactions (
  id UUID PRIMARY KEY,

  -- Foreign key to fb_emails
  email_row_id UUID NOT NULL REFERENCES fb_emails(id) ON DELETE CASCADE,

  -- Other columns...
);
```

**Key Points**:
- ✅ `email_row_id` is **NOT NULL** - every transaction must have an email
- ✅ `ON DELETE CASCADE` - if email is deleted, transaction is also deleted
- ✅ **Unique constraint** on `email_row_id` - one email = one transaction (currently)

---

## 🔄 **Complete Flow**

### **Step 1: Email Sync**

```
Gmail API
    ↓
Fetch email
    ↓
Store in fb_emails
    ↓
email.status = 'Fetched'
```

**SQL**:
```sql
INSERT INTO fb_emails (
  id,
  user_id,
  google_user_id,
  connection_id,
  email_address,
  message_id,
  thread_id,
  from_address,
  to_addresses,
  subject,
  snippet,
  plain_body,
  internal_date,
  status,  -- 'Fetched'
  created_at,
  updated_at
) VALUES (...);
```

---

### **Step 2: Transaction Extraction**

```
Email stored in fb_emails
    ↓
AI processes email content
    ↓
Extract transaction data
    ↓
Store in fb_extracted_transactions
    ↓
Link via email_row_id
    ↓
Update email.status = 'Processed'
```

**SQL**:
```sql
-- Insert transaction
INSERT INTO fb_extracted_transactions (
  id,
  user_id,
  google_user_id,
  connection_id,
  email_row_id,  -- Links to fb_emails.id
  txn_time,
  amount,
  currency,
  direction,
  merchant_name,
  merchant_normalized,
  category,
  account_hint,
  reference_id,
  location,
  confidence,
  extraction_version,
  created_at,
  updated_at
) VALUES (...);

-- Update email status
UPDATE fb_emails
SET status = 'Processed',
    processed_at = NOW()
WHERE id = email_row_id;
```

---

## 📋 **Table Schemas**

### **fb_emails**

```sql
CREATE TABLE fb_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_user_id TEXT NOT NULL,
  connection_id UUID REFERENCES fb_gmail_connections(id) ON DELETE SET NULL,
  email_address TEXT NOT NULL,

  -- Gmail identifiers
  message_id TEXT NOT NULL,
  thread_id TEXT NOT NULL,

  -- Email content
  from_address TEXT,
  to_addresses TEXT[],
  subject TEXT,
  snippet TEXT,
  plain_body TEXT,
  internal_date TIMESTAMPTZ,

  -- Processing status
  status TEXT NOT NULL DEFAULT 'Fetched'
    CHECK (status IN ('Fetched', 'Processed', 'Failed', 'Invalid')),
  error_reason TEXT,
  processed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Idempotency
  UNIQUE(user_id, google_user_id, message_id)
);
```

**Status Values**:
- `Fetched` - Email synced from Gmail, not yet processed
- `Processed` - Transaction extracted successfully
- `Failed` - Transaction extraction failed
- `Invalid` - Email doesn't contain transaction data

---

### **fb_extracted_transactions**

```sql
CREATE TABLE fb_extracted_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_user_id TEXT NOT NULL,
  connection_id UUID REFERENCES fb_gmail_connections(id) ON DELETE SET NULL,

  -- Link to source email
  email_row_id UUID NOT NULL REFERENCES fb_emails(id) ON DELETE CASCADE,

  -- Transaction details
  txn_time TIMESTAMPTZ,
  amount NUMERIC(18,2),
  currency TEXT,
  direction TEXT CHECK (direction IN ('debit', 'credit')),
  merchant_name TEXT,
  merchant_normalized TEXT,
  category TEXT,
  account_hint TEXT,
  reference_id TEXT,
  location TEXT,

  -- AI extraction metadata
  confidence NUMERIC(3,2),
  extraction_version TEXT,

  -- Additional fields
  account_type TEXT,
  transaction_type TEXT CHECK (transaction_type IN ('Dr', 'Cr')),
  ai_notes TEXT,
  user_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'rejected')),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One transaction per email (currently)
  UNIQUE(email_row_id)
);
```

---

## 🔍 **Querying the Relationship**

### **Get Transaction with Email**

```sql
SELECT
  t.*,
  e.from_address,
  e.subject,
  e.internal_date,
  e.plain_body
FROM fb_extracted_transactions t
JOIN fb_emails e ON e.id = t.email_row_id
WHERE t.user_id = 'user-id'
ORDER BY t.txn_time DESC;
```

### **Get Email with Transaction (if exists)**

```sql
SELECT
  e.*,
  t.id as transaction_id,
  t.amount,
  t.merchant_name,
  t.category
FROM fb_emails e
LEFT JOIN fb_extracted_transactions t ON t.email_row_id = e.id
WHERE e.user_id = 'user-id'
ORDER BY e.internal_date DESC;
```

### **Get Emails Without Transactions**

```sql
SELECT e.*
FROM fb_emails e
LEFT JOIN fb_extracted_transactions t ON t.email_row_id = e.id
WHERE e.user_id = 'user-id'
  AND t.id IS NULL
  AND e.status = 'Fetched';
```

### **Get Emails with Failed Processing**

```sql
SELECT *
FROM fb_emails
WHERE user_id = 'user-id'
  AND status = 'Failed'
ORDER BY created_at DESC;
```

---

## 🔗 **API Usage**

### **Fetch Transaction with Email**

```typescript
// In API endpoint
const { data: transaction } = await supabaseAdmin
  .from('fb_extracted_transactions')
  .select(`
    *,
    email:fb_emails!email_row_id (
      id,
      message_id,
      from_address,
      subject,
      snippet,
      internal_date,
      plain_body,
      status
    )
  `)
  .eq('id', transactionId)
  .eq('user_id', userId)
  .single();
```

**Response**:
```json
{
  "id": "txn-uuid",
  "email_row_id": "email-uuid",
  "amount": "1234.56",
  "merchant_name": "Amazon",
  "email": {
    "id": "email-uuid",
    "from_address": "noreply@amazon.com",
    "subject": "Your order has been shipped",
    "internal_date": "2025-01-15T10:30:00Z",
    "plain_body": "..."
  }
}
```

---

## 📈 **Statistics Queries**

### **Email Processing Stats**

```sql
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM fb_emails
WHERE user_id = 'user-id'
GROUP BY status;
```

**Example Output**:
```
status      | count | percentage
------------|-------|------------
Fetched     | 150   | 60.00
Processed   | 90    | 36.00
Failed      | 8     | 3.20
Invalid     | 2     | 0.80
```

### **Transaction Extraction Rate**

```sql
SELECT
  COUNT(DISTINCT e.id) as total_emails,
  COUNT(DISTINCT t.id) as extracted_transactions,
  ROUND(COUNT(DISTINCT t.id) * 100.0 / COUNT(DISTINCT e.id), 2) as extraction_rate
FROM fb_emails e
LEFT JOIN fb_extracted_transactions t ON t.email_row_id = e.id
WHERE e.user_id = 'user-id';
```

---

## 🚨 **Important Constraints**

### **1. One Transaction Per Email**

```sql
UNIQUE(email_row_id)
```

**Current Limitation**: Each email can only have ONE transaction.

**Future Enhancement**: Remove this constraint to support multiple transactions per email (e.g., bank statement emails with multiple transactions).

### **2. Cascade Delete**

```sql
ON DELETE CASCADE
```

**Behavior**: If an email is deleted, its transaction is also deleted.

**Use Case**: Ensures data consistency - no orphaned transactions.

### **3. NOT NULL email_row_id**

```sql
email_row_id UUID NOT NULL
```

**Behavior**: Every transaction MUST have a source email.

**Use Case**: Maintains data lineage - always know where transaction came from.

---

## 🔄 **Processing Workflow**

### **Auto-Sync with Transaction Processing**

```
Cron Job (every 15 min)
    ↓
Fetch new emails from Gmail
    ↓
Store in fb_emails (status = 'Fetched')
    ↓
For each email:
    ↓
    Check if financial email (whitelisted sender)
    ↓
    If yes:
        ↓
        Extract transaction with AI
        ↓
        If successful:
            ↓
            Store in fb_extracted_transactions
            ↓
            Update email.status = 'Processed'
            ↓
            Create notification
        ↓
        If failed:
            ↓
            Update email.status = 'Failed'
            ↓
            Log error_reason
    ↓
    If no:
        ↓
        Keep email.status = 'Fetched'
```

---

## 📝 **Best Practices**

1. **Always Join on email_row_id**:
   ```sql
   JOIN fb_emails e ON e.id = t.email_row_id
   ```

2. **Check Email Status**:
   ```sql
   WHERE e.status = 'Processed'
   ```

3. **Use Cascade Delete**:
   - Deleting email automatically deletes transaction
   - Maintains referential integrity

4. **Filter by User**:
   ```sql
   WHERE t.user_id = auth.uid()
   ```

5. **Index on email_row_id**:
   - Already indexed via foreign key
   - Fast lookups

---

## 🆘 **Troubleshooting**

### **Transaction Missing for Email**

```sql
-- Check email status
SELECT id, status, error_reason
FROM fb_emails
WHERE id = 'email-uuid';

-- If status = 'Failed', check error_reason
-- If status = 'Fetched', transaction not yet processed
```

### **Orphaned Transactions**

```sql
-- Should return 0 rows (cascade delete prevents this)
SELECT t.*
FROM fb_extracted_transactions t
LEFT JOIN fb_emails e ON e.id = t.email_row_id
WHERE e.id IS NULL;
```

---

**For more details, see**:
- [EMAIL-SYNC-WORKFLOW.md](./EMAIL-SYNC-WORKFLOW.md) - Email sync process
- [Finance-Buddy-PRD-Tech.md](./Finance-Buddy-PRD-Tech.md) - Technical specification

