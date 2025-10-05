# Gmail Auto-Sync with AI Processing and Notifications - Implementation Summary

## Overview

This document provides a comprehensive summary of the Gmail auto-sync enhancement with automatic AI processing and web notifications.

---

## What's Being Built

### 1. **Auto-Sync System** (15-minute polling)
- Automatically fetches new emails from Gmail every 15 minutes
- Uses smart sync window: `MAX(internal_date) - 10 minutes` from processed emails
- Configurable per-connection filters (sender, subject, label, custom query)

### 2. **Automatic AI Processing**
- Immediately processes each synced email with AI
- Extracts transaction details using existing `SchemaAwareTransactionExtractor`
- Stores extracted transactions in `fb_extracted_transactions`

### 3. **Web Notification System**
- Creates notifications for each successfully extracted transaction
- Notification bell in header with unread count
- Notification dropdown with recent alerts
- Full notifications page with filtering and pagination

### 4. **Transaction Detail Page**
- Sophisticated, modern UI for viewing transaction details
- Inline editing of transaction fields
- View source email information
- AI confidence score display
- Status management (pending/confirmed/rejected)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Vercel Cron (Every 15 minutes)                                  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Auto-Sync Executor                                              │
│ - Find connections with auto_sync_enabled = true               │
│ - Calculate sync window from last processed email              │
│ - Fetch new emails from Gmail API                              │
│ - Store in fb_emails                                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Email Processor (Immediate)                                     │
│ - Process each new email with AI                               │
│ - Extract transaction using SchemaAwareTransactionExtractor    │
│ - Store in fb_extracted_transactions                           │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Notification Manager                                            │
│ - Create notification for each successful extraction           │
│ - Store in fb_notifications                                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ User Interface                                                  │
│ - Notification bell with unread count (polls every 30s)        │
│ - Notification dropdown with recent 5 notifications            │
│ - Full notifications page with filtering                       │
│ - Transaction detail page with editing                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Changes

### New Tables

#### 1. `fb_sync_filters`
Stores email filter configurations for auto-sync.

```sql
CREATE TABLE fb_sync_filters (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  connection_id UUID REFERENCES fb_gmail_connections(id),
  filter_name TEXT NOT NULL,
  filter_type TEXT CHECK (filter_type IN ('sender', 'subject', 'label', 'query')),
  filter_value TEXT NOT NULL,
  gmail_query TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `fb_notifications`
Stores web notifications for users.

```sql
CREATE TABLE fb_notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type TEXT CHECK (type IN ('transaction_processed', 'sync_error', 'system_alert')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  transaction_id UUID REFERENCES fb_extracted_transactions(id),
  email_id UUID REFERENCES fb_emails(id),
  action_url TEXT,
  action_label TEXT,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Extended Tables

#### `fb_gmail_connections`
Add auto-sync configuration columns.

```sql
ALTER TABLE fb_gmail_connections
ADD COLUMN auto_sync_enabled BOOLEAN DEFAULT false,
ADD COLUMN auto_sync_interval_minutes INTEGER DEFAULT 15,
ADD COLUMN last_auto_sync_at TIMESTAMPTZ;
```

#### `fb_extracted_transactions`
Add missing columns for transaction management.

```sql
ALTER TABLE fb_extracted_transactions
ADD COLUMN account_type TEXT,
ADD COLUMN transaction_type TEXT CHECK (transaction_type IN ('Dr', 'Cr')),
ADD COLUMN ai_notes TEXT,
ADD COLUMN user_notes TEXT,
ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected'));
```

---

## Implementation Phases

### **Phase 1: Database & Notification Module** (Week 1)

**Days 1-2: Database Setup**
- [ ] Create migration file `0002_notifications_and_auto_sync.sql`
- [ ] Run migration on development database
- [ ] Verify RLS policies work correctly
- [ ] Test indexes for performance

**Days 3-5: Notification Module**
- [ ] Create `src/lib/notifications/` directory
- [ ] Implement `types.ts` with TypeScript interfaces
- [ ] Implement `notification-builder.ts` for creating notifications
- [ ] Implement `notification-manager.ts` for CRUD operations
- [ ] Write unit tests for notification module
- [ ] Create API endpoints for notifications

### **Phase 2: Auto-Sync Enhancement** (Week 2)

**Days 1-2: Sync Executor Enhancement**
- [ ] Modify `SyncExecutor` to trigger AI processing
- [ ] Implement sync window calculation logic
- [ ] Add notification creation after transaction extraction
- [ ] Handle errors gracefully with error notifications

**Day 3: Cron Endpoint**
- [ ] Create `/api/cron/gmail-auto-sync` endpoint
- [ ] Implement connection eligibility check
- [ ] Add sync result tracking and logging
- [ ] Configure Vercel Cron Job

**Days 4-5: Testing & Optimization**
- [ ] Test auto-sync with multiple connections
- [ ] Test AI processing pipeline
- [ ] Test notification creation
- [ ] Optimize for Vercel serverless constraints

### **Phase 3: UI Components** (Week 3)

**Days 1-2: Notification UI**
- [ ] Create `NotificationBell` component
- [ ] Integrate bell into `Layout` header
- [ ] Create notifications page (`/notifications`)
- [ ] Implement filtering and pagination
- [ ] Add mark as read/delete functionality

**Days 3-5: Transaction Detail Page**
- [ ] Create `/transactions/[id]` page
- [ ] Implement view mode with all transaction details
- [ ] Implement edit mode with inline editing
- [ ] Add save/cancel/delete actions
- [ ] Style with Tailwind CSS for modern look
- [ ] Test on mobile devices

### **Phase 4: Integration & Testing** (Week 4)

**Days 1-2: End-to-End Testing**
- [ ] Test complete flow: Sync → Process → Notify
- [ ] Test notification bell updates in real-time
- [ ] Test transaction detail page editing
- [ ] Test error scenarios

**Days 3-4: Performance & Security**
- [ ] Optimize database queries
- [ ] Add rate limiting to API endpoints
- [ ] Verify RLS policies prevent unauthorized access
- [ ] Test with multiple concurrent users

**Day 5: Documentation & Deployment**
- [ ] Update user documentation
- [ ] Create deployment checklist
- [ ] Deploy to staging environment
- [ ] User acceptance testing

---

## API Endpoints

### Notification Endpoints
- `GET /api/notifications` - List notifications (with filters)
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/[id]/mark-read` - Mark as read
- `PATCH /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/[id]` - Delete notification

### Transaction Endpoints
- `GET /api/transactions/[id]` - Get transaction details
- `PATCH /api/transactions/[id]` - Update transaction
- `DELETE /api/transactions/[id]` - Delete transaction

### Auto-Sync Endpoints
- `POST /api/gmail/auto-sync/toggle` - Enable/disable auto-sync
- `GET /api/gmail/auto-sync/status` - Get auto-sync status
- `GET /api/cron/gmail-auto-sync` - Cron endpoint (secured)

---

## Key Features

### 1. Smart Sync Window
```typescript
// Calculate sync window from last processed email
const { data: lastProcessedEmail } = await supabaseAdmin
  .from('fb_emails')
  .select('internal_date')
  .eq('user_id', userId)
  .eq('status', 'Processed')
  .order('internal_date', { ascending: false })
  .limit(1)
  .single();

const syncFrom = lastProcessedEmail
  ? new Date(new Date(lastProcessedEmail.internal_date).getTime() - 10 * 60 * 1000) // -10 minutes
  : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days if no processed emails
```

### 2. Automatic AI Processing
```typescript
// After syncing emails, immediately process with AI
for (const emailId of newEmailIds) {
  const result = await emailProcessor.processEmails({
    emailId,
    userId,
    batchSize: 1,
  });

  if (result.success) {
    // Create notification for successful extraction
    await notificationManager.create(
      NotificationBuilder.forTransaction(userId, transaction, email)
    );
  }
}
```

### 3. Real-Time Notification Updates
```typescript
// Poll for unread count every 30 seconds
useEffect(() => {
  fetchUnreadCount();
  const interval = setInterval(fetchUnreadCount, 30000);
  return () => clearInterval(interval);
}, []);
```

---

## Answers to Your Questions

### 1. **Should notifications be automatically marked as read when the user views the transaction detail page?**

**Recommendation**: **Yes, but with a delay.**

When a user clicks on a notification to view the transaction detail page:
1. Mark the notification as read immediately when they click the action link
2. This provides instant feedback and reduces clutter

**Implementation**:
```typescript
// In NotificationBell component
<Link
  href={notification.action_url}
  onClick={() => {
    markAsRead(notification.id);
    setIsOpen(false);
  }}
>
  {notification.action_label}
</Link>
```

### 2. **Should there be a limit on how many notifications to keep per user?**

**Recommendation**: **Yes, auto-delete read notifications older than 30 days.**

**Rationale**:
- Prevents database bloat
- Users rarely need old notifications
- Unread notifications are kept indefinitely (important alerts)

**Implementation**:
```sql
-- Add to cron job or run periodically
DELETE FROM fb_notifications
WHERE read = true 
AND created_at < NOW() - INTERVAL '30 days';
```

**Alternative**: Add a user setting to configure retention period (7, 30, 90 days, or never).

### 3. **Should users be able to configure notification preferences?**

**Recommendation**: **Yes, in a future phase (Phase 5).**

**For MVP (Current Implementation)**:
- All transaction notifications are enabled by default
- Users can manually delete unwanted notifications
- Users can mark all as read to clear clutter

**For Future Enhancement**:
Add a `fb_notification_preferences` table:
```sql
CREATE TABLE fb_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  transaction_processed_enabled BOOLEAN DEFAULT true,
  sync_error_enabled BOOLEAN DEFAULT true,
  system_alert_enabled BOOLEAN DEFAULT true,
  min_transaction_amount NUMERIC(18,2), -- Only notify for transactions above this amount
  excluded_categories TEXT[], -- Don't notify for these categories
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. **What should happen if AI extraction fails?**

**Recommendation**: **Create a notification for sync errors, but not for every failed extraction.**

**Strategy**:
1. **Individual Email Failure**: Log error, mark email as `status='Failed'`, do NOT create notification
2. **Batch Failure** (multiple emails fail): Create a single notification summarizing the issue
3. **Connection Failure** (OAuth expired, etc.): Create notification with action to reconnect

**Implementation**:
```typescript
// In SyncExecutor
if (failedCount > 5) {
  await notificationManager.create(
    NotificationBuilder.forSyncError(
      userId,
      connectionId,
      `Failed to process ${failedCount} emails. Please check your connection.`
    )
  );
}
```

### 5. **Should the transaction detail page support bulk editing?**

**Recommendation**: **No, not in the current implementation.**

**Rationale**:
- Adds significant complexity to UI and API
- Most users edit transactions individually
- Can be added in a future phase if needed

**Alternative**: Add bulk actions on the main transactions list page:
- Bulk delete
- Bulk status change (pending → confirmed)
- Bulk category assignment

---

## Success Metrics

### Technical Metrics
- ✅ Auto-sync runs every 15 minutes without failures
- ✅ Emails processed with AI within 30 seconds of sync
- ✅ Notifications created for 100% of successful extractions
- ✅ Transaction detail page loads in < 2 seconds
- ✅ Zero duplicate notifications for same transaction

### User Metrics
- % of users enabling auto-sync
- Average notifications per user per day
- Notification click-through rate
- Transaction edit rate
- User satisfaction score

---

## Deployment Checklist

### Pre-Deployment
- [ ] Run database migration on staging
- [ ] Test all API endpoints
- [ ] Test UI components on multiple browsers
- [ ] Test mobile responsiveness
- [ ] Verify RLS policies
- [ ] Set up Vercel Cron Job
- [ ] Add `CRON_SECRET` environment variable

### Deployment
- [ ] Deploy to production
- [ ] Run database migration on production
- [ ] Verify cron job is running
- [ ] Monitor logs for errors
- [ ] Test with a few beta users

### Post-Deployment
- [ ] Monitor notification creation rate
- [ ] Monitor AI processing success rate
- [ ] Monitor database performance
- [ ] Gather user feedback
- [ ] Iterate based on feedback

---

## Next Steps

1. **Review** this implementation plan
2. **Approve** the approach and answers to questions
3. **Create** database migration file
4. **Implement** Phase 1 (Notification Module)
5. **Test** thoroughly before moving to Phase 2
6. **Deploy** incrementally with monitoring

---

## Related Documents

- [Auto-Sync with Notifications Plan](./AUTO_SYNC_WITH_NOTIFICATIONS_PLAN.md)
- [API Endpoints](./AUTO_SYNC_API_ENDPOINTS.md)
- [UI Components](./AUTO_SYNC_UI_COMPONENTS.md)
- [Transaction Detail Page](./TRANSACTION_DETAIL_PAGE.md)
- [Gmail Auto-Sync Design](./GMAIL_AUTO_SYNC_DESIGN.md)
- [Gmail Auto-Sync Architecture](./GMAIL_AUTO_SYNC_ARCHITECTURE.md)

---

## Contact

For questions or clarifications, please reach out to the development team.

