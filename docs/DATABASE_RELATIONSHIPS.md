# Database Relationships - Email Processing

## Table Relationships

### Overview
```
fb_emails_fetched (PARENT)
    ├── fb_emails_processed (CHILD) - 1:0..1 relationship
    └── fb_rejected_emails (CHILD) - 1:0..1 relationship
```

### Detailed Schema

```sql
┌─────────────────────────────────────────────────────────────┐
│                    fb_emails_fetched                        │
│  (Master table - all fetched emails)                        │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                     │
│ user_id                                                     │
│ google_user_id                                              │
│ connection_id → fb_gmail_connections.id (SET NULL)          │
│ message_id                                                  │
│ subject                                                     │
│ plain_body                                                  │
│ status (AUTO-MAINTAINED BY TRIGGERS)                        │
│   - 'Fetched' (default)                                     │
│   - 'Processed' (has row in fb_emails_processed)            │
│   - 'Rejected' (has row in fb_rejected_emails)              │
│ processed_at                                                │
│ created_at                                                  │
│ updated_at                                                  │
└─────────────────────────────────────────────────────────────┘
         │                                    │
         │ 1:0..1                             │ 1:0..1
         ▼                                    ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│  fb_emails_processed     │    │  fb_rejected_emails      │
│  (Successfully processed)│    │  (Failed to process)     │
├──────────────────────────┤    ├──────────────────────────┤
│ id (PK)                  │    │ id (PK)                  │
│ email_row_id (FK, UNIQUE)│    │ email_row_id (FK, UNIQUE)│
│   → fb_emails_fetched.id │    │   → fb_emails_fetched.id │
│   ON DELETE CASCADE      │    │   ON DELETE CASCADE      │
│ merchant_name            │    │ rejection_reason         │
│ amount                   │    │ rejection_type           │
│ currency                 │    │ error_details            │
│ direction                │    │ rejected_at              │
│ category                 │    │ created_at               │
│ status                   │    │ updated_at               │
│ created_at               │    │                          │
│ updated_at               │    │                          │
└──────────────────────────┘    └──────────────────────────┘
```

## Constraints

### Foreign Keys
1. **fb_emails_processed.email_row_id → fb_emails_fetched.id**
   - ON DELETE CASCADE
   - When parent email is deleted, processed record is also deleted

2. **fb_rejected_emails.email_row_id → fb_emails_fetched.id**
   - ON DELETE CASCADE
   - When parent email is deleted, rejection record is also deleted

### Unique Constraints
1. **fb_emails_processed.email_row_id** - UNIQUE
   - One email can only be processed once
   - Prevents duplicate processing

2. **fb_rejected_emails.email_row_id** - UNIQUE
   - One email can only be rejected once
   - Prevents duplicate rejections

### Business Rules
- An email can be in **ONE** of three states:
  1. **Fetched**: Not yet processed or rejected
  2. **Processed**: Has a row in `fb_emails_processed`
  3. **Rejected**: Has a row in `fb_rejected_emails`

- An email **CANNOT** be both processed AND rejected
  - Enforced by UNIQUE constraints on `email_row_id`

## Automatic Status Updates (Triggers)

### 1. Insert into fb_emails_processed
```sql
TRIGGER: trigger_update_email_status_on_process
FIRES: AFTER INSERT
ACTION: 
  - Sets fb_emails_fetched.status = 'Processed'
  - Sets fb_emails_fetched.processed_at = NOW()
```

### 2. Insert into fb_rejected_emails
```sql
TRIGGER: trigger_update_email_status_on_reject
FIRES: AFTER INSERT
ACTION:
  - Sets fb_emails_fetched.status = 'Rejected'
  - Sets fb_emails_fetched.error_reason = rejection_reason
```

### 3. Delete from fb_emails_processed
```sql
TRIGGER: trigger_revert_email_status_on_delete_process
FIRES: AFTER DELETE
ACTION:
  - IF email is in fb_rejected_emails: Keep status = 'Rejected'
  - ELSE: Revert status = 'Fetched', clear processed_at
```

### 4. Delete from fb_rejected_emails
```sql
TRIGGER: trigger_revert_email_status_on_delete_reject
FIRES: AFTER DELETE
ACTION:
  - IF email is in fb_emails_processed: Keep status = 'Processed'
  - ELSE: Revert status = 'Fetched', clear error_reason
```

## Views

### fb_emails_with_status
Complete view joining all three tables:
```sql
SELECT * FROM fb_emails_with_status
WHERE user_id = 'xxx';
```

Returns:
- All email fields
- Transaction data (if processed)
- Rejection data (if rejected)
- Derived boolean flags: is_processed, is_rejected, is_pending

### fb_email_status_summary
Summary statistics by user:
```sql
SELECT * FROM fb_email_status_summary
WHERE user_id = 'xxx';
```

Returns:
- total_emails
- fetched_count
- processed_count
- rejected_count
- processed_percentage
- rejected_percentage

## Usage Examples

### Query all processed emails with transaction data
```sql
SELECT * FROM fb_emails_with_status
WHERE user_id = 'xxx'
  AND is_processed = true;
```

### Query all pending emails
```sql
SELECT * FROM fb_emails_with_status
WHERE user_id = 'xxx'
  AND is_pending = true;
```

### Get processing statistics
```sql
SELECT * FROM fb_email_status_summary
WHERE user_id = 'xxx';
```

