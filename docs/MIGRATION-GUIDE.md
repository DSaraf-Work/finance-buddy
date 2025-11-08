# Gmail Pub/Sub Migration Guide

This guide explains how to migrate from polling-based email sync to real-time Pub/Sub notifications.

## Overview

The migration process transitions Gmail connections from:
- **Before**: Periodic polling (15-minute intervals)
- **After**: Real-time push notifications via Gmail Pub/Sub

## Prerequisites

✅ Phase 1-4 completed (Database, Watch Manager, Webhook Handler, Optimization)
✅ Phase 5 completed (GCP Pub/Sub configured)
✅ Environment variables set:
- `GCP_PROJECT_ID`
- `PUBSUB_WEBHOOK_TOKEN` (optional)
- `ADMIN_SECRET`

## Migration Steps

### Step 1: Check Migration Status

```bash
curl -X POST https://your-domain.vercel.app/api/admin/migrate-to-pubsub \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: YOUR_ADMIN_SECRET" \
  -d '{"action": "status"}'
```

Response:
```json
{
  "success": true,
  "totalConnections": 10,
  "watchEnabled": 0,
  "watchDisabled": 10,
  "percentageMigrated": 0
}
```

### Step 2: Test Migration (Single Connection)

Migrate one connection first to test:

```bash
curl -X POST https://your-domain.vercel.app/api/admin/migrate-to-pubsub \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: YOUR_ADMIN_SECRET" \
  -d '{
    "action": "migrate",
    "connectionId": "CONNECTION_ID_HERE"
  }'
```

Response:
```json
{
  "success": true,
  "connectionId": "abc123",
  "error": null
}
```

### Step 3: Verify Test Connection

1. Check watch status:
```bash
curl https://your-domain.vercel.app/api/gmail/watch/status?connectionId=CONNECTION_ID
```

2. Send a test email to the Gmail account
3. Check webhook logs in database:
```sql
SELECT * FROM fb_webhook_logs 
WHERE email_address = 'test@gmail.com' 
ORDER BY created_at DESC 
LIMIT 5;
```

### Step 4: Migrate All Connections

Once test is successful, migrate all:

```bash
curl -X POST https://your-domain.vercel.app/api/admin/migrate-to-pubsub \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: YOUR_ADMIN_SECRET" \
  -d '{"action": "migrate"}'
```

Response:
```json
{
  "success": true,
  "totalConnections": 10,
  "watchesSetup": 10,
  "failed": 0,
  "errors": []
}
```

### Step 5: Monitor Migration

Check metrics endpoint:
```bash
curl https://your-domain.vercel.app/api/gmail/watch/metrics
```

### Step 6: Disable Auto-Sync Cron (Optional)

Once all connections are migrated, you can disable the polling cron:

1. Update `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/gmail-watch-renewal",
      "schedule": "0 */6 * * *"
    }
    // Remove or comment out gmail-auto-sync cron
  ]
}
```

2. Redeploy to Vercel

## Rollback Plan

If issues occur, rollback to polling:

```bash
curl -X POST https://your-domain.vercel.app/api/admin/migrate-to-pubsub \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: YOUR_ADMIN_SECRET" \
  -d '{"action": "rollback"}'
```

This will:
1. Stop all Gmail watches
2. Set `watch_enabled = false` for all connections
3. Re-enable auto-sync cron if needed

## Monitoring

### Watch Subscriptions
```sql
SELECT status, COUNT(*) 
FROM fb_gmail_watch_subscriptions 
GROUP BY status;
```

### Webhook Activity (Last 24h)
```sql
SELECT 
  success,
  COUNT(*) as count,
  SUM(new_messages) as total_messages
FROM fb_webhook_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY success;
```

### Failed Watches
```sql
SELECT 
  c.email_address,
  s.last_error,
  s.renewal_attempts
FROM fb_gmail_watch_subscriptions s
JOIN fb_gmail_connections c ON c.id = s.connection_id
WHERE s.status = 'failed';
```

## Troubleshooting

### Watch Setup Fails
- Check GCP_PROJECT_ID is set correctly
- Verify Pub/Sub topic exists
- Check OAuth scopes include gmail.readonly
- Review connection's last_watch_error

### No Webhooks Received
- Verify Pub/Sub push subscription is configured
- Check webhook endpoint is publicly accessible
- Review GCP Pub/Sub logs
- Test with Gmail's "Send Test Message" feature

### History Gaps
- System automatically falls back to full sync
- Check fb_webhook_logs for error_message
- Monitor performance metrics

## Best Practices

1. **Gradual Migration**: Migrate in batches (10-20% at a time)
2. **Monitor Closely**: Watch metrics for first 24 hours
3. **Keep Polling**: Keep auto-sync as backup for 1 week
4. **Test Thoroughly**: Test with various email types
5. **Document Issues**: Track any problems for future reference

## Success Criteria

✅ All connections have `watch_enabled = true`
✅ Webhook logs show successful processing
✅ No failed watch subscriptions
✅ Real-time email sync working (< 1 minute delay)
✅ No increase in error rates

## Support

For issues, check:
1. Performance metrics: `/api/gmail/watch/metrics`
2. Database logs: `fb_webhook_logs`, `fb_gmail_watch_subscriptions`
3. Vercel logs: Function logs for webhook endpoint
4. GCP logs: Pub/Sub delivery logs

