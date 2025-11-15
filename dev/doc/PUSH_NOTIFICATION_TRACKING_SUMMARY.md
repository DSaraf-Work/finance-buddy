# Push Notification Tracking Implementation Summary

## Overview

Added comprehensive tracking for push notification delivery status in the `fb_notifications` table. This provides visibility into which notifications had push notifications sent, delivery success rates, and helps debug push notification failures.

## Database Changes

### New Columns in `fb_notifications`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `push_sent` | boolean | false | Whether a push notification was attempted |
| `push_sent_at` | timestamptz | null | Timestamp when push was sent |
| `push_success_count` | integer | 0 | Number of devices that successfully received the push |
| `push_failure_count` | integer | 0 | Number of devices that failed to receive the push |
| `push_error` | text | null | Error message if push notification failed |

### Indexes

```sql
-- Query notifications by push status
CREATE INDEX idx_fb_notifications_push_sent 
ON fb_notifications(push_sent, created_at DESC);

-- Query failed pushes for a user
CREATE INDEX idx_fb_notifications_push_failed 
ON fb_notifications(user_id, push_sent, push_failure_count) 
WHERE push_failure_count > 0;
```

## Code Changes

### `src/lib/email-processing/processor.ts`

Updated `sendPushNotificationForTransaction()` to track push delivery:

```typescript
// After sending push notification
await supabaseAdmin
  .from('fb_notifications')
  .update({
    push_sent: true,
    push_sent_at: new Date().toISOString(),
    push_success_count: result.successCount,
    push_failure_count: result.failureCount,
    push_error: result.failureCount > 0 ? 'Some devices failed to receive push' : null,
  })
  .eq('id', notification.id);
```

**Error Handling**:
- If push sending fails, the notification is still updated with error details
- Prevents silent failures
- Allows debugging of push issues

### `src/types/database.ts`

Regenerated TypeScript types to include new fields:

```typescript
fb_notifications: {
  Row: {
    // ... existing fields
    push_sent: boolean | null
    push_sent_at: string | null
    push_success_count: number | null
    push_failure_count: number | null
    push_error: string | null
  }
}
```

## Benefits

### 1. Visibility
- ✅ See which notifications had push sent
- ✅ Track delivery success rates
- ✅ Identify patterns in failures

### 2. Debugging
- ✅ Query notifications with failed pushes
- ✅ See error messages for failures
- ✅ Identify users with push issues

### 3. Monitoring
- ✅ Monitor push notification health
- ✅ Alert on high failure rates
- ✅ Track delivery over time

### 4. Analytics
- ✅ Calculate push delivery rates
- ✅ Compare iOS vs Android delivery
- ✅ Identify problematic devices

## Usage Examples

### Query Notifications with Push Status

```sql
-- Get all notifications with push sent
SELECT * FROM fb_notifications
WHERE push_sent = true
ORDER BY push_sent_at DESC;

-- Get failed pushes
SELECT * FROM fb_notifications
WHERE push_failure_count > 0
ORDER BY push_sent_at DESC;

-- Get push delivery rate
SELECT 
  COUNT(*) as total_notifications,
  SUM(CASE WHEN push_sent THEN 1 ELSE 0 END) as push_sent_count,
  SUM(push_success_count) as total_successes,
  SUM(push_failure_count) as total_failures,
  ROUND(100.0 * SUM(push_success_count) / NULLIF(SUM(push_success_count + push_failure_count), 0), 2) as success_rate
FROM fb_notifications
WHERE created_at >= NOW() - INTERVAL '7 days';
```

### Query User's Push Notification History

```sql
SELECT 
  n.title,
  n.push_sent,
  n.push_sent_at,
  n.push_success_count,
  n.push_failure_count,
  n.push_error,
  n.created_at
FROM fb_notifications n
WHERE n.user_id = '<user_id>'
ORDER BY n.created_at DESC
LIMIT 20;
```

### Find Users with Push Issues

```sql
SELECT 
  user_id,
  COUNT(*) as total_notifications,
  SUM(push_failure_count) as total_failures,
  ROUND(100.0 * SUM(push_failure_count) / NULLIF(SUM(push_success_count + push_failure_count), 0), 2) as failure_rate
FROM fb_notifications
WHERE push_sent = true
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY user_id
HAVING SUM(push_failure_count) > 0
ORDER BY failure_rate DESC;
```

## Migration

**Migration File**: `infra/migrations/*_add_push_notification_tracking_to_fb_notifications.sql`

**Applied**: 2025-11-15

**Rollback** (if needed):
```sql
ALTER TABLE fb_notifications
DROP COLUMN IF EXISTS push_sent,
DROP COLUMN IF EXISTS push_sent_at,
DROP COLUMN IF EXISTS push_success_count,
DROP COLUMN IF EXISTS push_failure_count,
DROP COLUMN IF EXISTS push_error;

DROP INDEX IF EXISTS idx_fb_notifications_push_sent;
DROP INDEX IF EXISTS idx_fb_notifications_push_failed;
```

## Testing

### Verify Tracking Works

1. Trigger a transaction (via webhook or email sync)
2. Check notification was created with push tracking:

```sql
SELECT 
  id, title, push_sent, push_sent_at, 
  push_success_count, push_failure_count, push_error
FROM fb_notifications
ORDER BY created_at DESC
LIMIT 1;
```

Expected result:
- `push_sent = true`
- `push_sent_at` has timestamp
- `push_success_count >= 0`
- `push_failure_count >= 0`

## Related Files

- `infra/migrations/*_add_push_notification_tracking_to_fb_notifications.sql` - Migration
- `src/lib/email-processing/processor.ts` - Push tracking implementation
- `src/types/database.ts` - TypeScript types
- `dev/doc/IOS_PUSH_NOTIFICATION_ANALYSIS.md` - iOS push limitations
- `dev/doc/PUSH_NOTIFICATION_FIX_2025-11-15.md` - URL redirect fix

## Next Steps

1. **Monitor push delivery rates** in production
2. **Set up alerts** for high failure rates
3. **Analyze patterns** in failed pushes (iOS vs Android, time of day, etc.)
4. **Implement retry logic** for failed pushes (optional)
5. **Add dashboard** to visualize push notification health

