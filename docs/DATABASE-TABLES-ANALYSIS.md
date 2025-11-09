# Database Tables Analysis - Finance Buddy

**Last Updated**: 2025-11-09  
**Status**: Critical Analysis

---

## 🚨 **CRITICAL ISSUE: Duplicate Table Structure**

### **Current State in Supabase**

Finance Buddy currently has **DUPLICATE table structures** for emails and transactions:

#### **Email Tables**
1. **`fb_emails`** (OLD - ARCHIVED)
   - Original table
   - Still contains data
   - Referenced by `fb_emails_with_status` view
   - Referenced by `fb_extracted_transactions` foreign key
   - Referenced by `fb_rejected_emails` foreign key

2. **`fb_emails_fetched`** (NEW - ACTIVE IN CODE)
   - New table created in migration `0005_rename_tables.sql`
   - Contains copy of all data from `fb_emails`
   - Referenced by `fb_emails_processed` foreign key
   - Referenced by `fb_notifications` foreign key
   - **Used in all application code**

#### **Transaction Tables**
1. **`fb_extracted_transactions`** (OLD - ARCHIVED)
   - Original table
   - Still contains data
   - References `fb_emails.id` via `email_row_id`
   - Referenced by `fb_emails_with_status` view

2. **`fb_emails_processed`** (NEW - ACTIVE IN CODE)
   - New table created in migration `0005_rename_tables.sql`
   - Contains copy of all data from `fb_extracted_transactions`
   - References `fb_emails_fetched.id` via `email_row_id`
   - Referenced by `fb_notifications` foreign key
   - **Used in all application code**

---

## 📊 **Complete Table Inventory**

### **Active Tables (Used in Code)**

| Table | Type | Purpose | Foreign Keys |
|-------|------|---------|--------------|
| `fb_emails_fetched` | BASE TABLE | Emails fetched from Gmail | → `fb_gmail_connections.id` |
| `fb_emails_processed` | BASE TABLE | Processed emails with transactions | → `fb_emails_fetched.id`, → `fb_gmail_connections.id` |
| `fb_gmail_connections` | BASE TABLE | Gmail OAuth connections | None |
| `fb_notifications` | BASE TABLE | User notifications | → `fb_emails_fetched.id`, → `fb_emails_processed.id` |
| `fb_config` | BASE TABLE | System configuration | None |
| `fb_sync_filters` | BASE TABLE | Email sync filters | → `fb_gmail_connections.id` |
| `fb_transaction_keywords` | BASE TABLE | Transaction keywords | None |
| `fb_jobs` | BASE TABLE | Background jobs | None |

### **Archived Tables (NOT Used in Code)**

| Table | Type | Purpose | Status |
|-------|------|---------|--------|
| `fb_emails` | BASE TABLE | Old emails table | ⚠️ ARCHIVED - Still in DB |
| `fb_extracted_transactions` | BASE TABLE | Old transactions table | ⚠️ ARCHIVED - Still in DB |
| `fb_gmail_webhook_audit` | BASE TABLE | Pub/Sub audit logs | ⚠️ ARCHIVED - Pub/Sub removed |

### **Problematic Tables (Mixed References)**

| Table | Type | Issue |
|-------|------|-------|
| `fb_rejected_emails` | BASE TABLE | ⚠️ References OLD `fb_emails.id` |
| `fb_emails_with_status` | VIEW | ⚠️ Queries OLD `fb_emails` and `fb_extracted_transactions` |

---

## 🔗 **Relationship Diagram**

### **NEW Structure (Active in Code)**

```
fb_gmail_connections
    ↓ (connection_id)
fb_emails_fetched
    ↓ (email_row_id)
fb_emails_processed
    ↓ (transaction_id)
fb_notifications
```

### **OLD Structure (Still in Database)**

```
fb_gmail_connections
    ↓ (connection_id)
fb_emails
    ↓ (email_row_id)
fb_extracted_transactions
```

### **Problematic Mixed References**

```
fb_emails (OLD)
    ↓ (email_row_id)
fb_rejected_emails ⚠️ BROKEN REFERENCE
    
fb_emails (OLD) + fb_extracted_transactions (OLD)
    ↓ (LEFT JOIN)
fb_emails_with_status (VIEW) ⚠️ QUERIES OLD TABLES
```

---

## ⚠️ **Critical Problems**

### **Problem 1: Data Synchronization**
- **Issue**: Data exists in BOTH old and new tables
- **Risk**: New data written to `fb_emails_fetched` won't appear in `fb_emails`
- **Impact**: `fb_emails_with_status` view will show stale data

### **Problem 2: Broken Foreign Keys**
- **Issue**: `fb_rejected_emails` references `fb_emails.id` (old table)
- **Risk**: New emails in `fb_emails_fetched` cannot be rejected
- **Impact**: Rejection functionality broken

### **Problem 3: View Inconsistency**
- **Issue**: `fb_emails_with_status` queries old tables
- **Risk**: View shows old data, code queries new tables
- **Impact**: Data mismatch between view and application

### **Problem 4: Code vs Database Mismatch**
- **Code**: Uses `fb_emails_fetched` and `fb_emails_processed`
- **Database**: Has both old and new tables
- **Risk**: Confusion, maintenance nightmare
- **Impact**: Future developers will be confused

---

## 🔍 **View Definition Analysis**

### **`fb_emails_with_status`**

```sql
SELECT 
  e.id,
  e.user_id,
  e.google_user_id,
  e.connection_id,
  e.email_address,
  e.message_id,
  e.thread_id,
  e.from_address,
  e.to_addresses,
  e.subject,
  e.snippet,
  e.internal_date,
  e.plain_body,
  e.error_reason,
  e.processed_at,
  e.created_at,
  e.updated_at,
  e.remarks,
  CASE
    WHEN r.email_row_id IS NOT NULL THEN 'REJECTED'
    WHEN t.email_row_id IS NOT NULL THEN 'PROCESSED'
    ELSE 'FETCHED'
  END AS status
FROM fb_emails e                              -- ⚠️ OLD TABLE
LEFT JOIN fb_extracted_transactions t         -- ⚠️ OLD TABLE
  ON e.id = t.email_row_id
LEFT JOIN fb_rejected_emails r
  ON e.id = r.email_row_id;
```

**Problems**:
- ✅ Queries `fb_emails` (old table)
- ✅ Queries `fb_extracted_transactions` (old table)
- ❌ Does NOT query `fb_emails_fetched` (new table)
- ❌ Does NOT query `fb_emails_processed` (new table)

---

## 📋 **Foreign Key Relationships**

### **Active Relationships (NEW)**

```
fb_emails_fetched.connection_id → fb_gmail_connections.id
fb_emails_processed.email_row_id → fb_emails_fetched.id
fb_emails_processed.connection_id → fb_gmail_connections.id
fb_notifications.email_id → fb_emails_fetched.id
fb_notifications.transaction_id → fb_emails_processed.id
```

### **Archived Relationships (OLD)**

```
fb_emails.connection_id → fb_gmail_connections.id
fb_extracted_transactions.email_row_id → fb_emails.id
fb_extracted_transactions.connection_id → fb_gmail_connections.id
```

### **Broken Relationships**

```
fb_rejected_emails.email_row_id → fb_emails.id  ⚠️ REFERENCES OLD TABLE
fb_rejected_emails.connection_id → fb_gmail_connections.id
```

---

## 🎯 **Recommended Actions**

### **Option A: Complete Migration (RECOMMENDED)**

1. **Update `fb_rejected_emails` foreign key**:
   ```sql
   ALTER TABLE fb_rejected_emails
     DROP CONSTRAINT fb_rejected_emails_email_row_id_fkey,
     ADD CONSTRAINT fb_rejected_emails_email_row_id_fkey
       FOREIGN KEY (email_row_id) 
       REFERENCES fb_emails_fetched(id) 
       ON DELETE CASCADE;
   ```

2. **Recreate `fb_emails_with_status` view**:
   ```sql
   DROP VIEW fb_emails_with_status;
   
   CREATE VIEW fb_emails_with_status AS
   SELECT 
     e.*,
     CASE
       WHEN r.email_row_id IS NOT NULL THEN 'REJECTED'
       WHEN t.email_row_id IS NOT NULL THEN 'PROCESSED'
       ELSE 'FETCHED'
     END AS status
   FROM fb_emails_fetched e
   LEFT JOIN fb_emails_processed t ON e.id = t.email_row_id
   LEFT JOIN fb_rejected_emails r ON e.id = r.email_row_id;
   ```

3. **Drop old tables** (after backup):
   ```sql
   DROP TABLE fb_extracted_transactions CASCADE;
   DROP TABLE fb_emails CASCADE;
   ```

### **Option B: Revert Migration**

1. Revert all code changes
2. Use old table names (`fb_emails`, `fb_extracted_transactions`)
3. Drop new tables (`fb_emails_fetched`, `fb_emails_processed`)

---

## 📊 **Data Consistency Check**

### **Check for Data Drift**

```sql
-- Check if new data exists in new tables but not old
SELECT COUNT(*) as new_emails_only
FROM fb_emails_fetched
WHERE id NOT IN (SELECT id FROM fb_emails);

SELECT COUNT(*) as new_transactions_only
FROM fb_emails_processed
WHERE id NOT IN (SELECT id FROM fb_extracted_transactions);
```

---

## 🚨 **Current Status**

- ✅ **Code**: Uses new tables (`fb_emails_fetched`, `fb_emails_processed`)
- ❌ **Database**: Has BOTH old and new tables
- ❌ **View**: Queries old tables
- ❌ **Foreign Keys**: Mixed (some old, some new)
- ⚠️ **Risk Level**: **HIGH** - Data inconsistency imminent

---

## 📝 **Next Steps**

1. **URGENT**: Fix `fb_emails_with_status` view to query new tables
2. **URGENT**: Fix `fb_rejected_emails` foreign key to reference new table
3. **IMPORTANT**: Verify no data drift between old and new tables
4. **IMPORTANT**: Drop old tables after verification
5. **CRITICAL**: Test all functionality end-to-end

---

**This analysis reveals a critical incomplete migration that must be resolved immediately.**

