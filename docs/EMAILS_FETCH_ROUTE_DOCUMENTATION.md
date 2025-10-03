# Emails Fetch Route Documentation

## Overview

The Finance Buddy emails fetch route provides a comprehensive system for managing Gmail emails with both database-only and Gmail API integration capabilities. This system allows users to search, filter, and process emails for financial transaction extraction.

## API Endpoints

### 1. Email Search API
**Endpoint:** `POST /api/emails/search`

**Description:** Searches for emails with optional Gmail sync integration.

**Request Body:**
```typescript
interface EmailSearchRequest {
  google_user_id?: string;
  email_address?: string;
  date_from?: string; // YYYY-MM-DD format
  date_to?: string; // YYYY-MM-DD format
  sender?: string;
  status?: EmailStatus;
  q?: string; // search query for subject/snippet
  page?: number; // default: 1
  pageSize?: number; // default: 50, max: 100
  sort?: 'asc' | 'desc'; // default: 'asc'
  db_only?: boolean; // default: false
}
```

**Response:**
```typescript
interface PaginatedResponse<EmailPublic> {
  items: EmailPublic[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

**Behavior:**
- When `db_only` is `true`: Only queries the Supabase database
- When `db_only` is `false`: Syncs with Gmail API first (up to 100 messages), then queries database
- Gmail sync is limited to 20 new messages per request to avoid timeouts
- Automatically refreshes expired Gmail access tokens

### 2. Email Status Update API
**Endpoint:** `PATCH /api/emails/[id]/status`

**Description:** Updates the status and remarks of a specific email.

**Request Body:**
```typescript
interface UpdateStatusRequest {
  status: EmailStatus;
  remarks?: string;
}
```

**Response:** Updated EmailPublic object

### 3. Email Processing API
**Endpoint:** `POST /api/emails/[id]/process`

**Description:** Processes an email to extract transaction data and updates status to 'Processed'.

**Response:**
```typescript
{
  message: string;
  transaction: ExtractedTransaction;
}
```

## Email Status Types

```typescript
type EmailStatus = 
  | 'Fetched'           // Initial status when email is retrieved from Gmail
  | 'Processed'         // Email has been processed and transaction extracted
  | 'Failed'            // Processing failed
  | 'Invalid'           // Email is invalid or corrupted
  | 'NON_TRANSACTIONAL' // Email doesn't contain transaction information
  | 'REJECT'            // Email has been rejected by user
```

## Database Schema

### fb_emails Table
```sql
CREATE TABLE fb_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  google_user_id TEXT NOT NULL,
  connection_id UUID REFERENCES fb_gmail_connections(id),
  email_address TEXT NOT NULL,
  message_id TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  from_address TEXT,
  to_addresses TEXT[],
  subject TEXT,
  snippet TEXT,
  internal_date TIMESTAMPTZ,
  plain_body TEXT,
  status TEXT NOT NULL DEFAULT 'Fetched',
  error_reason TEXT,
  processed_at TIMESTAMPTZ,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, google_user_id, message_id)
);
```

## Frontend Features

### Email Management Page (`/emails`)

**Default Behavior:**
- Shows emails from the last 7 days by default
- Database-only search is enabled by default
- Page size: 25 emails per page
- Pagination supports up to 50 pages

**Filter Options:**
1. **Date Range:** From/To date filters (YYYY-MM-DD format)
2. **Account:** Filter by specific Gmail account
3. **Status:** Filter by email status
4. **Sender:** Filter by sender email address
5. **Search Query:** Search in subject and snippet
6. **Page Controls:** Page number dropdown and page size input
7. **Data Source Toggle:** Database-only vs Gmail integration

**Action Buttons (Sticky Column):**
1. **👁️ View:** Opens email details drawer
2. **✅ Process:** (Green tick) Processes email and creates transaction
3. **❌ Reject:** (Red cross) Marks email as rejected with "Non-transactional" remark
4. **⚙️ Status:** Opens modal for custom status update with remarks

### Email Details Drawer
- Shows complete email information
- Displays email headers, body, and metadata
- Allows viewing of processing history

### Status Update Modal
- Dropdown for selecting new status
- Text area for entering remarks/reasons
- Validates status transitions
- Updates processed_at timestamp for 'Processed' status

## Gmail Integration

### Sync Process
1. **Token Validation:** Checks if access token is expired
2. **Token Refresh:** Automatically refreshes expired tokens using refresh token
3. **Query Building:** Constructs Gmail API query with date range and sender filters
4. **Message Retrieval:** Fetches up to 100 message IDs from Gmail
5. **Deduplication:** Checks database for existing messages
6. **Batch Processing:** Processes up to 20 new messages per sync
7. **Data Extraction:** Extracts headers, body, and metadata
8. **Database Storage:** Upserts emails into fb_emails table

### Error Handling
- Graceful fallback to database-only search if Gmail sync fails
- Automatic token refresh for expired credentials
- Detailed error logging for debugging
- User-friendly error messages

## Usage Examples

### Basic Search (Database Only)
```javascript
const response = await fetch('/api/emails/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    date_from: '2025-09-26',
    date_to: '2025-10-03',
    db_only: true,
    page: 1,
    pageSize: 25
  })
});
```

### Search with Gmail Sync
```javascript
const response = await fetch('/api/emails/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    date_from: '2025-09-26',
    date_to: '2025-10-03',
    sender: 'paypal.com',
    db_only: false,
    page: 1,
    pageSize: 25
  })
});
```

### Update Email Status
```javascript
const response = await fetch(`/api/emails/${emailId}/status`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'NON_TRANSACTIONAL',
    remarks: 'Marketing email, no transaction data'
  })
});
```

### Process Email
```javascript
const response = await fetch(`/api/emails/${emailId}/process`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});
```

## Performance Considerations

1. **Gmail API Limits:** Sync is limited to 100 messages per request and 20 new messages processed
2. **Pagination:** Frontend supports up to 50 pages to prevent performance issues
3. **Token Management:** Automatic token refresh prevents authentication failures
4. **Database Indexing:** Unique constraints and indexes optimize query performance
5. **Error Recovery:** Graceful degradation ensures system remains functional

## Security Features

1. **User Isolation:** All queries are scoped to the authenticated user
2. **Token Security:** Access tokens are automatically refreshed and stored securely
3. **Input Validation:** All API inputs are validated and sanitized
4. **Permission Checks:** Users can only access their own emails and connections

## Future Enhancements

1. **Advanced Transaction Extraction:** Implement ML-based transaction parsing
2. **Bulk Operations:** Support for bulk status updates and processing
3. **Email Templates:** Recognition of common email formats from financial institutions
4. **Real-time Sync:** WebSocket-based real-time email synchronization
5. **Advanced Filtering:** More sophisticated search and filtering options
