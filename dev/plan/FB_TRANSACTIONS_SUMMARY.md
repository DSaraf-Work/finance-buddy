# fb_transactions Table - Quick Reference

**Full Documentation:** [FB_TRANSACTIONS_PLANNING.md](./FB_TRANSACTIONS_PLANNING.md)

---

## Overview

Unified transactions table that serves as the **single source of truth** for all financial transactions, combining auto-synced email-based transactions and manual entries.

### Key Features
- ✅ Auto-sync from confirmed emails (`fb_emails_processed`)
- ✅ Manual transaction entry (cash, offline payments)
- ✅ Source traceability (email vs manual)
- ✅ Dedicated UI route (`/transactions`)
- ✅ Comprehensive filtering and statistics
- ✅ Edit/delete capabilities
- ✅ RLS security

---

## Quick Start

### 1. Database Setup
```bash
# Run migration
npm run supabase:migration:apply -- 20250116_fb_transactions
```

### 2. Auto-Sync (Automatic)
```typescript
// When email status changes to 'confirmed', transaction auto-created
await updateEmailStatus(emailId, 'confirmed');
// → Transaction automatically created in fb_transactions
```

### 3. Manual Transaction (API)
```typescript
POST /api/transactions
{
  "amount": 150.00,
  "direction": "debit",
  "merchant_name": "Local Restaurant",
  "category": "Dining",
  "txn_time": "2025-11-16T19:30:00Z",
  "account_type": "cash",
  "notes": "Dinner with friends",
  "tags": ["dining", "social"]
}
```

---

## Database Schema

```sql
CREATE TABLE fb_transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Source tracking
  source_type VARCHAR(20) NOT NULL,  -- 'email' or 'manual'
  email_processed_id UUID,           -- Link to fb_emails_processed (if email-based)
  
  -- Transaction details
  amount DECIMAL(10,2) NOT NULL,
  direction VARCHAR(10) NOT NULL,    -- 'debit' or 'credit'
  merchant_name VARCHAR(255),
  category VARCHAR(100),
  txn_time TIMESTAMPTZ NOT NULL,
  account_hint VARCHAR(50),
  account_type VARCHAR(50),
  
  -- Metadata
  description TEXT,
  notes TEXT,
  tags TEXT[],
  location VARCHAR(255),
  
  -- Status
  is_verified BOOLEAN DEFAULT FALSE,
  is_recurring BOOLEAN DEFAULT FALSE,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(50) DEFAULT 'system'  -- 'system' or 'user'
);
```

---

## Transaction Sources

| Source Type | Description | email_processed_id | created_by |
|-------------|-------------|-------------------|------------|
| **email** | Auto-synced from confirmed email | Populated | system |
| **manual** | User-created transaction | NULL | user |

---

## API Endpoints

```
POST   /api/transactions                    # Create manual transaction
GET    /api/transactions                    # List all transactions
GET    /api/transactions/:id                # Get transaction details
PUT    /api/transactions/:id                # Update transaction
DELETE /api/transactions/:id                # Delete transaction
GET    /api/transactions/search             # Advanced search
GET    /api/transactions/stats              # Get statistics
GET    /api/transactions/export             # Export (CSV/JSON)
```

---

## UI Routes

```
/transactions              # List all transactions (email + manual)
/transactions/new          # Create manual transaction
/transactions/:id          # View transaction details
/transactions/:id/edit     # Edit transaction
```

---

## Auto-Sync Logic

**Trigger:** When `fb_emails_processed.status` changes to `'confirmed'`

**Action:** Automatically create entry in `fb_transactions`

**Implementation:** Database trigger
```sql
CREATE TRIGGER trigger_sync_confirmed_email
  AFTER INSERT OR UPDATE ON fb_emails_processed
  FOR EACH ROW
  EXECUTE FUNCTION sync_confirmed_email_to_transaction();
```

**Idempotency:** Unique constraint on `email_processed_id` prevents duplicates

---

## Data Flow

### Email-Based Transaction
```
fb_emails_fetched (raw email)
  ↓ email_row_id
fb_emails_processed (AI extracted)
  ↓ status = 'confirmed'
fb_transactions (auto-synced)
```

### Manual Transaction
```
User Input
  ↓ POST /api/transactions
fb_transactions (created directly)
```

---

## Statistics

**Available Metrics:**
- Total count (email + manual)
- Total debit / Total credit
- Net amount
- By category breakdown
- By merchant breakdown
- Source type distribution

**Example:**
```json
{
  "total_count": 45,
  "email_count": 38,
  "manual_count": 7,
  "total_debit": 15420.50,
  "total_credit": 8200.00,
  "net_amount": -7220.50
}
```

---

## Common Use Cases

### 1. Auto-Sync Email Transaction
```
1. Email fetched and processed
2. User confirms email
3. Transaction automatically created
4. Appears in /transactions list
```

### 2. Manual Cash Transaction
```
1. User clicks "+ Add New" on /transactions
2. Fills in details (amount, merchant, date)
3. Selects "Cash" as account type
4. Transaction created with source_type = 'manual'
```

### 3. Edit Transaction
```
1. User views transaction detail
2. Clicks "Edit"
3. Updates notes, category, or tags
4. Changes saved
```

---

## Business Rules

### Email-Based Transactions
- ✅ Can edit: notes, tags, category, is_verified
- ⚠️ Can edit with warning: amount, merchant_name, txn_time
- ❌ Cannot edit: source_type, email_processed_id
- ⚠️ Can delete with warning

### Manual Transactions
- ✅ Can edit: all fields (except id, user_id, created_at)
- ✅ Can delete: no restrictions

---

## Implementation Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1** | Week 1 | Database, Sync Trigger, Backfill |
| **Phase 2** | Week 2 | API Endpoints, Business Logic |
| **Phase 3** | Week 3 | UI Pages, Components |
| **Phase 4** | Week 4 | Polish, Integration, Export |

**Total:** 4 weeks

---

**For detailed information, see:** [FB_TRANSACTIONS_PLANNING.md](./FB_TRANSACTIONS_PLANNING.md)

