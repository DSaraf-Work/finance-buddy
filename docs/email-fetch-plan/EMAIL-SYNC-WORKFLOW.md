# Email Sync Workflow Documentation

**Last Updated**: 2025-11-09  
**Status**: Active (Polling-Based Auto-Sync)

---

## 🎯 **Overview**

Finance Buddy uses a **polling-based auto-sync system** to fetch emails from Gmail. There are **NO webhooks or push notifications** - the system periodically checks Gmail for new emails.

---

## 🔄 **Email Sync Methods**

### **1. Auto-Sync (Recommended)**

**Endpoint**: `GET /api/cron/gmail-auto-sync`  
**Trigger**: Vercel Cron (every 15 minutes)  
**Purpose**: Automatic background email syncing

#### **Flow**

```
Vercel Cron (every 15 min)
    ↓
GET /api/cron/gmail-auto-sync
    ↓
Find connections with auto_sync_enabled = true
    ↓
For each connection:
    ↓
    Check last_auto_sync_at
    ↓
    If eligible for sync:
        ↓
        Refresh access token (if expired)
        ↓
        Call Gmail API: users.messages.list
        ↓
        Filter by sync filters (if configured)
        ↓
        Get new message IDs
        ↓
        Check for duplicates in fb_emails
        ↓
        Fetch full messages (batch of 10)
        ↓
        Store in fb_emails table
        ↓
        (Optional) Process for transactions with AI
        ↓
        Create notifications
        ↓
        Update last_auto_sync_at
    ↓
Return summary (connections synced, emails fetched, etc.)
```

#### **Configuration**

**Enable Auto-Sync**:
```sql
UPDATE fb_gmail_connections
SET auto_sync_enabled = true,
    auto_sync_interval_minutes = 15
WHERE id = 'connection-id';
```

**Cron Schedule** (in `vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/gmail-auto-sync",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

---

### **2. Manual Sync**

**Endpoint**: `POST /api/gmail/manual-sync`  
**Trigger**: User-initiated  
**Purpose**: On-demand email fetching

#### **Flow**

```
User clicks "Sync Now"
    ↓
POST /api/gmail/manual-sync
    ↓
Request body:
{
  "connection_id": "uuid",
  "start_date": "2025-01-01",
  "end_date": "2025-01-31",
  "sender_filter": "noreply@bank.com" (optional),
  "max_results": 100 (optional)
}
    ↓
Validate user owns connection
    ↓
Refresh access token (if expired)
    ↓
Call Gmail API: users.messages.list
    ↓
Apply date range and sender filters
    ↓
Get message IDs
    ↓
Check for duplicates in fb_emails
    ↓
Fetch full messages (batch of 10)
    ↓
Store in fb_emails table
    ↓
Return response:
{
  "success": true,
  "newMessages": 25,
  "duplicates": 5,
  "emailIds": ["uuid1", "uuid2", ...]
}
```

#### **API Request**

```bash
curl -X POST https://your-domain.vercel.app/api/gmail/manual-sync \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=..." \
  -d '{
    "connection_id": "uuid",
    "start_date": "2025-01-01T00:00:00Z",
    "end_date": "2025-01-31T23:59:59Z",
    "sender_filter": "noreply@bank.com",
    "max_results": 100
  }'
```

---

### **3. Email Search with Auto-Sync**

**Endpoint**: `POST /api/emails/search`  
**Trigger**: User search  
**Purpose**: Search emails with optional auto-sync

#### **Flow**

```
User searches for emails
    ↓
POST /api/emails/search
    ↓
Request body:
{
  "connection_id": "uuid",
  "query": "from:bank.com",
  "start_date": "2025-01-01",
  "end_date": "2025-01-31",
  "auto_sync": true (optional)
}
    ↓
If auto_sync = true:
    ↓
    Trigger manual sync first
    ↓
    Wait for sync to complete
    ↓
Search fb_emails table
    ↓
Return paginated results
```

---

## 📊 **Database Tables**

### **fb_gmail_connections**

Stores Gmail OAuth connections and auto-sync settings.

```sql
CREATE TABLE fb_gmail_connections (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  email_address TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  
  -- Auto-sync settings
  auto_sync_enabled BOOLEAN DEFAULT false,
  auto_sync_interval_minutes INTEGER DEFAULT 15,
  last_auto_sync_at TIMESTAMPTZ,
  
  -- Metadata
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### **fb_emails**

Stores synced emails from Gmail.

```sql
CREATE TABLE fb_emails (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  connection_id UUID REFERENCES fb_gmail_connections(id),
  
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
  status TEXT DEFAULT 'Fetched',
  processed_at TIMESTAMPTZ,
  error_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Idempotency
  UNIQUE(user_id, google_user_id, message_id)
);
```

---

### **fb_sync_filters** (Optional)

Defines email filters for auto-sync.

```sql
CREATE TABLE fb_sync_filters (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  connection_id UUID NOT NULL,
  
  -- Filter configuration
  filter_name TEXT NOT NULL,
  filter_type TEXT CHECK (filter_type IN ('sender', 'subject', 'label', 'query')),
  filter_value TEXT NOT NULL,
  gmail_query TEXT NOT NULL,
  
  -- Status
  enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_count INTEGER DEFAULT 0,
  
  UNIQUE(connection_id, filter_name)
);
```

---

## 🔐 **Authentication & Security**

### **Token Management**

1. **Access Token**: Short-lived (1 hour)
2. **Refresh Token**: Long-lived (stored securely)
3. **Auto-Refresh**: Tokens refreshed automatically before expiry

```typescript
// Token refresh logic
if (new Date(connection.token_expiry) <= new Date()) {
  const refreshed = await refreshAccessToken(connection.refresh_token);
  
  await supabaseAdmin
    .from('fb_gmail_connections')
    .update({
      access_token: refreshed.access_token,
      token_expiry: refreshed.expiry,
    })
    .eq('id', connection.id);
}
```

### **Row Level Security (RLS)**

All tables enforce `user_id = auth.uid()`:

```sql
CREATE POLICY "Users can only access their own data"
  ON fb_emails FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

## ⚙️ **Configuration**

### **Environment Variables**

```bash
# Gmail OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/gmail/callback

# Cron Security
CRON_SECRET=your-cron-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### **Vercel Cron Configuration**

```json
{
  "crons": [
    {
      "path": "/api/cron/gmail-auto-sync",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

---

## 📈 **Monitoring**

### **Check Auto-Sync Status**

```sql
SELECT 
  email_address,
  auto_sync_enabled,
  last_auto_sync_at,
  auto_sync_interval_minutes
FROM fb_gmail_connections
WHERE user_id = 'user-id';
```

### **Check Recent Syncs**

```sql
SELECT 
  email_address,
  COUNT(*) as emails_synced,
  MAX(created_at) as last_email_synced
FROM fb_emails
WHERE user_id = 'user-id'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY email_address;
```

### **Vercel Logs**

```bash
vercel logs --follow
```

Look for:
- "Auto-sync cron job started"
- "Found X connections with auto-sync enabled"
- "Syncing connection..."
- "Sync completed"

---

## 🚨 **Error Handling**

### **Common Errors**

| Error | Cause | Solution |
|-------|-------|----------|
| Token expired | Access token expired | Auto-refreshed |
| Invalid grant | Refresh token revoked | User must reconnect |
| Rate limit | Too many API calls | Retry with backoff |
| Network error | Gmail API unavailable | Retry later |

### **Error Logging**

```sql
UPDATE fb_gmail_connections
SET last_error = 'Error message',
    updated_at = NOW()
WHERE id = 'connection-id';
```

---

## 🔄 **Migration from Pub/Sub**

**Previous System**: Gmail push notifications via Google Pub/Sub  
**Current System**: Polling-based auto-sync

**Why Changed**:
- ❌ Pub/Sub was overly complex
- ❌ Required watch renewals every 7 days
- ❌ Additional GCP infrastructure costs
- ✅ Polling is simpler and more reliable
- ✅ 15-minute interval is sufficient for most use cases

---

## 📝 **Best Practices**

1. **Enable Auto-Sync**: Set `auto_sync_enabled = true` for all active connections
2. **Use Sync Filters**: Configure filters to reduce API calls
3. **Monitor Logs**: Check Vercel logs regularly
4. **Handle Errors**: Implement retry logic for transient errors
5. **Idempotency**: Always check for duplicates before inserting

---

## 🆘 **Troubleshooting**

### **Emails Not Syncing**

1. Check `auto_sync_enabled = true`
2. Check `last_auto_sync_at` timestamp
3. Check `last_error` for error messages
4. Verify cron job is running in Vercel
5. Check Gmail API quota

### **Duplicate Emails**

- Should not happen due to UNIQUE constraint
- If duplicates exist, check `message_id` uniqueness

### **Token Issues**

```sql
-- Check token expiry
SELECT email_address, token_expiry
FROM fb_gmail_connections
WHERE token_expiry < NOW();

-- Force reconnect
-- User must disconnect and reconnect via UI
```

---

**For more details, see**:
- `src/lib/gmail-auto-sync/` - Auto-sync implementation
- `src/pages/api/cron/gmail-auto-sync.ts` - Cron endpoint
- `src/pages/api/gmail/manual-sync.ts` - Manual sync endpoint

