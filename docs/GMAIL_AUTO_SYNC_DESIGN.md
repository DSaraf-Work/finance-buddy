# Gmail Auto-Sync Module - Design Document

## Overview
This document outlines the design and implementation plan for automatic Gmail email synchronization based on configurable filters.

## Architecture Decision

### Approach: Hybrid Polling + Gmail Push Notifications

**Rationale:**
- **Vercel Serverless**: Limited to HTTP endpoints, no long-running processes
- **Small User Base**: Polling is acceptable for initial implementation
- **Simplicity**: Minimize infrastructure complexity
- **Reliability**: Polling provides fallback if push notifications fail

### Components

1. **Gmail Push Notifications (Primary)**
   - Use Gmail API's `watch()` method with Google Cloud Pub/Sub
   - Receive real-time notifications when emails arrive
   - Webhook endpoint to handle notifications

2. **Scheduled Polling (Fallback)**
   - Vercel Cron Jobs (or external cron service)
   - Poll Gmail API every 5-15 minutes for new emails
   - Ensures no emails are missed if push fails

3. **Filter Configuration**
   - Per-connection filter rules stored in database
   - Support sender, subject, label-based filters
   - Gmail query syntax for flexibility

4. **Sync Queue**
   - Use existing `fb_jobs` table for async processing
   - Deduplication to prevent duplicate syncs
   - Retry logic for failed syncs

---

## Database Schema Changes

### 1. New Table: `fb_sync_filters`

Stores email filter configurations per Gmail connection.

```sql
CREATE TABLE fb_sync_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES fb_gmail_connections(id) ON DELETE CASCADE,
  
  -- Filter configuration
  filter_name TEXT NOT NULL,
  filter_type TEXT NOT NULL CHECK (filter_type IN ('sender', 'subject', 'label', 'query')),
  filter_value TEXT NOT NULL,
  
  -- Gmail query representation (computed from filter_type + filter_value)
  gmail_query TEXT NOT NULL,
  
  -- Status
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(connection_id, filter_name)
);

CREATE INDEX idx_sync_filters_connection ON fb_sync_filters(connection_id) WHERE enabled = true;
CREATE INDEX idx_sync_filters_user ON fb_sync_filters(user_id);
```

### 2. New Table: `fb_gmail_watch_subscriptions`

Tracks Gmail push notification subscriptions.

```sql
CREATE TABLE fb_gmail_watch_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES fb_gmail_connections(id) ON DELETE CASCADE,
  
  -- Gmail watch details
  history_id TEXT NOT NULL,
  expiration TIMESTAMPTZ NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'failed')),
  last_renewed_at TIMESTAMPTZ,
  last_error TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(connection_id)
);

CREATE INDEX idx_watch_subscriptions_expiration ON fb_gmail_watch_subscriptions(expiration) WHERE status = 'active';
```

### 3. Extend `fb_jobs` Table

Add new job type for auto-sync.

```sql
-- No schema change needed, just add new job type: 'auto_sync'
-- Payload structure:
-- {
--   "connection_id": "uuid",
--   "filter_id": "uuid",
--   "trigger": "push" | "poll",
--   "history_id": "string" (for push notifications)
-- }
```

### 4. Extend `fb_gmail_connections` Table

Add auto-sync configuration.

```sql
ALTER TABLE fb_gmail_connections
ADD COLUMN auto_sync_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN auto_sync_interval_minutes INTEGER DEFAULT 15 CHECK (auto_sync_interval_minutes >= 5),
ADD COLUMN last_auto_sync_at TIMESTAMPTZ;

CREATE INDEX idx_gmail_connections_auto_sync ON fb_gmail_connections(auto_sync_enabled, last_auto_sync_at);
```

---

## API Endpoints

### 1. Filter Management

#### `POST /api/gmail/sync-filters`
Create a new sync filter.

**Request:**
```json
{
  "connection_id": "uuid",
  "filter_name": "Bank Statements",
  "filter_type": "sender",
  "filter_value": "statements@bank.com"
}
```

**Response:**
```json
{
  "id": "uuid",
  "filter_name": "Bank Statements",
  "gmail_query": "from:statements@bank.com",
  "enabled": true
}
```

#### `GET /api/gmail/sync-filters?connection_id=uuid`
List all filters for a connection.

#### `PATCH /api/gmail/sync-filters/:id`
Update a filter (enable/disable, modify values).

#### `DELETE /api/gmail/sync-filters/:id`
Delete a filter.

### 2. Auto-Sync Control

#### `POST /api/gmail/auto-sync/enable`
Enable auto-sync for a connection.

**Request:**
```json
{
  "connection_id": "uuid",
  "interval_minutes": 15,
  "enable_push_notifications": true
}
```

#### `POST /api/gmail/auto-sync/disable`
Disable auto-sync for a connection.

### 3. Webhook Endpoint

#### `POST /api/gmail/webhook`
Receive Gmail push notifications from Google Cloud Pub/Sub.

**Request (from Google):**
```json
{
  "message": {
    "data": "base64-encoded-payload",
    "messageId": "string",
    "publishTime": "timestamp"
  },
  "subscription": "string"
}
```

### 4. Cron Endpoint

#### `GET /api/cron/gmail-sync`
Triggered by Vercel Cron or external scheduler.

**Functionality:**
- Find all connections with `auto_sync_enabled = true`
- Check if `last_auto_sync_at` + `auto_sync_interval_minutes` < now
- Create sync jobs for eligible connections

---

## Implementation Phases

### Phase 1: Database & Filter Management (Week 1)
- [ ] Create migration for new tables
- [ ] Implement filter CRUD API endpoints
- [ ] Add filter validation and Gmail query builder
- [ ] Unit tests for filter logic

### Phase 2: Polling-Based Auto-Sync (Week 2)
- [ ] Implement cron endpoint for scheduled polling
- [ ] Create sync job processor
- [ ] Add deduplication logic
- [ ] Test with Vercel Cron Jobs

### Phase 3: Gmail Push Notifications (Week 3)
- [ ] Set up Google Cloud Pub/Sub topic
- [ ] Implement webhook endpoint
- [ ] Add Gmail watch subscription management
- [ ] Implement renewal logic (subscriptions expire after 7 days)

### Phase 4: Job Processing & Error Handling (Week 4)
- [ ] Implement job queue processor
- [ ] Add retry logic with exponential backoff
- [ ] Error logging and monitoring
- [ ] Rate limiting for Gmail API calls

### Phase 5: Testing & Documentation (Week 5)
- [ ] Integration tests
- [ ] Load testing with multiple users
- [ ] User documentation
- [ ] Deployment guide

---

## Technical Considerations

### 1. Gmail API Rate Limits
- **Quota**: 1 billion quota units/day (default)
- **Per-user limit**: 250 quota units/second
- **Strategy**: Implement rate limiting and exponential backoff

### 2. Vercel Serverless Constraints
- **Execution time**: 10 seconds (Hobby), 60 seconds (Pro)
- **Strategy**: Process emails in batches, use job queue for long operations

### 3. Google Cloud Pub/Sub Setup
- **Topic**: Create a Pub/Sub topic for Gmail notifications
- **Subscription**: Create a push subscription pointing to webhook endpoint
- **Authentication**: Verify requests using JWT tokens

### 4. Security
- **Webhook verification**: Validate Pub/Sub messages using JWT
- **Filter validation**: Sanitize user input to prevent injection
- **Rate limiting**: Prevent abuse of sync endpoints

### 5. Deduplication
- **Strategy**: Check `fb_emails` table before fetching from Gmail
- **Unique constraint**: `(user_id, google_user_id, message_id)`

---

## Configuration Example

### User Flow:
1. User connects Gmail account (existing flow)
2. User navigates to "Auto-Sync Settings"
3. User creates filters:
   - Filter 1: "Bank Statements" → `from:statements@bank.com`
   - Filter 2: "Credit Card Alerts" → `from:alerts@creditcard.com`
4. User enables auto-sync with 15-minute polling interval
5. System automatically syncs matching emails

### Filter Types:

| Type | Example Value | Gmail Query |
|------|---------------|-------------|
| sender | `user@example.com` | `from:user@example.com` |
| subject | `Invoice` | `subject:Invoice` |
| label | `IMPORTANT` | `label:IMPORTANT` |
| query | `from:bank.com has:attachment` | `from:bank.com has:attachment` |

---

## Monitoring & Observability

### Metrics to Track:
- Number of active auto-sync connections
- Sync job success/failure rate
- Average sync latency
- Gmail API quota usage
- Push notification delivery rate

### Logging:
- All sync operations with timestamps
- Filter match results
- API errors and retries
- Webhook events

---

## Migration Path

### For Existing Users:
1. Auto-sync is **disabled by default**
2. Users must explicitly enable and configure filters
3. Existing manual sync functionality remains unchanged
4. Gradual rollout to monitor performance

---

## Alternative Approaches Considered

### 1. Pure Polling (Rejected)
- **Pros**: Simple, no external dependencies
- **Cons**: Higher latency, more API calls, less real-time

### 2. Pure Push Notifications (Rejected)
- **Pros**: Real-time, efficient
- **Cons**: Complex setup, single point of failure, requires Pub/Sub infrastructure

### 3. IMAP Idle (Rejected)
- **Pros**: Real-time, standard protocol
- **Cons**: Requires long-running connections, not suitable for serverless

---

## Next Steps

1. **Review and approve** this design document
2. **Set up Google Cloud Pub/Sub** (if using push notifications)
3. **Create database migration** for new tables
4. **Implement Phase 1** (Filter Management)
5. **Test with a small group** of users before full rollout

---

## Questions for Stakeholders

1. Should auto-sync be opt-in or opt-out?
2. What is the acceptable sync latency (5 min, 15 min, 30 min)?
3. Do we need to support complex filter combinations (AND/OR logic)?
4. Should we limit the number of filters per user?
5. What is the budget for Google Cloud Pub/Sub (if using push)?

---

## Appendix: Gmail Push Notification Setup

### Prerequisites:
1. Google Cloud Project with Gmail API enabled
2. Pub/Sub API enabled
3. Service account with appropriate permissions

### Setup Steps:
1. Create Pub/Sub topic: `projects/PROJECT_ID/topics/gmail-notifications`
2. Create push subscription pointing to: `https://your-domain.com/api/gmail/webhook`
3. Grant Gmail service account publish permissions to topic
4. Implement webhook endpoint to handle notifications
5. Call `gmail.users.watch()` to start receiving notifications

### Webhook Payload Example:
```json
{
  "emailAddress": "user@gmail.com",
  "historyId": "1234567"
}
```

### Renewal:
- Subscriptions expire after 7 days
- Implement cron job to renew subscriptions before expiration
- Store `expiration` timestamp in `fb_gmail_watch_subscriptions`

