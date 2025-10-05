# Cron Job Management Guide

## 📅 Current Cron Configuration

### Schedule
- **Frequency:** Every 15 minutes
- **Cron Expression:** `*/15 * * * *`
- **Timezone:** UTC
- **Endpoint:** `/api/cron/gmail-auto-sync`
- **Authentication:** Bearer token (CRON_SECRET)

### What It Does
1. Finds all Gmail connections with `auto_sync_enabled = true`
2. Checks if sync is due (based on `last_auto_sync_at` + interval)
3. For each eligible connection:
   - Fetches new emails from Gmail
   - Processes emails with AI to extract transactions
   - Creates notifications for each transaction
   - Updates `last_auto_sync_at` timestamp

---

## 🎛️ Managing Cron via UI

### Auto-Sync Settings Page

**URL:** `/settings/auto-sync`

**Features:**

1. **View All Connections**
   - See which Gmail accounts are connected
   - Check auto-sync status (enabled/disabled)
   - View last sync time

2. **Enable/Disable Auto-Sync**
   - Click "Enable Auto-Sync" button for any connection
   - Click "Disable Auto-Sync" to turn off
   - Changes take effect on next cron run

3. **Test Cron Manually**
   - Click "🧪 Test Cron Job Manually" button
   - Enter your `CRON_SECRET` when prompted
   - See immediate results (emails synced, transactions processed, notifications created)

4. **View Cron Schedule**
   - See current schedule (every 15 minutes)
   - View cron expression
   - Check timezone (UTC)

---

## 🧪 Testing the Cron Job

### Method 1: Via UI (Recommended)

1. Go to `/settings/auto-sync`
2. Click "🧪 Test Cron Job Manually"
3. Enter `CRON_SECRET` when prompted
4. View results in alert popup

**Example Result:**
```json
{
  "success": true,
  "results": [
    {
      "connection_id": "...",
      "email_address": "user@gmail.com",
      "success": true,
      "emails_found": 5,
      "emails_synced": 3,
      "transactions_processed": 3,
      "notifications_created": 3
    }
  ]
}
```

### Method 2: Via API/cURL

```bash
# Replace with your actual values
CRON_SECRET="your-secret-here"
APP_URL="https://your-app.vercel.app"

curl "${APP_URL}/api/cron/gmail-auto-sync" \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

### Method 3: Via Vercel Dashboard

1. Go to Vercel Dashboard
2. Select your project
3. Click **Cron Jobs** in sidebar
4. Find `gmail-auto-sync`
5. Click **Trigger** button (if available)

---

## 📊 Monitoring Cron Execution

### Via Vercel Logs

1. **Go to Vercel Dashboard**
2. **Deployments** → Select latest deployment
3. **Functions** → Find `gmail-auto-sync`
4. **View Logs**

**What to look for:**
```
🕐 Auto-sync cron job started: 2025-10-05T12:00:00.000Z
📧 Found 2 connections with auto-sync enabled
🔄 Syncing connection abc123 (user@gmail.com)...
📅 Sync window: from 2025-10-05T11:45:00.000Z
📧 Fetching emails with query: after:1728129900
📬 Found 5 emails
🆕 3 new emails to sync
🤖 Processing 3 emails with AI...
✅ Processed 3 transactions
🔔 Creating notifications...
✅ Created 3 notifications
✅ Sync completed for user@gmail.com
✅ Auto-sync cron job completed
```

### Via Database Queries

**Check last sync times:**
```sql
SELECT 
  email_address,
  auto_sync_enabled,
  last_auto_sync_at,
  EXTRACT(EPOCH FROM (NOW() - last_auto_sync_at))/60 as minutes_since_sync
FROM fb_gmail_connections
WHERE auto_sync_enabled = true
ORDER BY last_auto_sync_at DESC;
```

**Check recent notifications:**
```sql
SELECT 
  type,
  title,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_ago
FROM fb_notifications
WHERE type = 'transaction_processed'
ORDER BY created_at DESC
LIMIT 10;
```

**Check sync activity over time:**
```sql
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as notifications_created
FROM fb_notifications
WHERE type = 'transaction_processed'
AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

---

## ⚙️ Changing Cron Schedule

### Edit vercel.json

```json
{
  "crons": [
    {
      "path": "/api/cron/gmail-auto-sync",
      "schedule": "*/15 * * * *"  // ← Change this line
    }
  ]
}
```

### Common Schedules

| Frequency | Cron Expression | Description |
|-----------|----------------|-------------|
| Every 5 minutes | `*/5 * * * *` | Very frequent (may hit rate limits) |
| Every 10 minutes | `*/10 * * * *` | Frequent |
| Every 15 minutes | `*/15 * * * *` | **Current (recommended)** |
| Every 30 minutes | `*/30 * * * *` | Moderate |
| Every hour | `0 * * * *` | Hourly |
| Every 2 hours | `0 */2 * * *` | Less frequent |
| Every 6 hours | `0 */6 * * *` | 4 times per day |
| Daily at 9am UTC | `0 9 * * *` | Once per day |
| Every weekday at 9am | `0 9 * * 1-5` | Business days only |

### After Changing

1. Commit changes: `git commit -am "Update cron schedule"`
2. Push to Vercel: `git push origin main`
3. Verify in Vercel Dashboard → Cron Jobs

---

## 🔐 Security

### CRON_SECRET

**Purpose:** Prevents unauthorized access to the cron endpoint

**How it works:**
- Cron endpoint requires `Authorization: Bearer CRON_SECRET` header
- Without correct secret, request is rejected with 401 Unauthorized

**Best practices:**
- Use a strong, random secret (32+ characters)
- Never commit to git
- Store in `.env.local` (local) and Vercel environment variables (production)
- Rotate periodically for security

**Generate new secret:**
```bash
openssl rand -hex 32
```

---

## 🚨 Troubleshooting

### Cron not running at all

**Symptoms:**
- No logs in Vercel
- `last_auto_sync_at` never updates
- No notifications created

**Checks:**
1. Vercel Dashboard → Cron Jobs → Is it listed?
2. `vercel.json` has cron configuration?
3. Latest deployment includes `vercel.json` changes?

**Fix:**
```bash
git add vercel.json
git commit -m "Add cron configuration"
git push origin main
```

### Cron running but failing

**Symptoms:**
- Logs show errors
- `last_auto_sync_at` not updating
- Error notifications created

**Checks:**
1. Check Vercel function logs for error messages
2. Verify `CRON_SECRET` is set correctly
3. Check Gmail OAuth tokens are valid
4. Verify database connection works

**Common errors:**
- `401 Unauthorized` → Wrong CRON_SECRET
- `Failed to refresh token` → OAuth token expired, need to reconnect Gmail
- `Timeout` → Too many emails, reduce batch size

### Cron running but no notifications

**Symptoms:**
- Logs show success
- `last_auto_sync_at` updates
- But no notifications appear

**Checks:**
1. Are there actually new emails to sync?
2. Check if emails are being processed with AI
3. Verify notification creation logic

**Debug queries:**
```sql
-- Check if emails were synced
SELECT COUNT(*) FROM fb_emails 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Check if transactions were extracted
SELECT COUNT(*) FROM fb_extracted_transactions 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Check if notifications were created
SELECT COUNT(*) FROM fb_notifications 
WHERE created_at > NOW() - INTERVAL '1 hour';
```

---

## 📈 Performance Optimization

### Batch Size

Current: 50 emails per sync

**To change:** Edit `src/lib/gmail-auto-sync/sync-executor.ts`
```typescript
const gmailResponse = await listMessages(accessToken, {
  q: fullQuery,
  maxResults: 50, // ← Change this
});
```

**Recommendations:**
- 50 emails: Good for most users
- 100 emails: If you have fast AI processing
- 25 emails: If hitting timeouts

### Sync Window

Current: `MAX(internal_date) - 10 minutes`

**Purpose:** 10-minute buffer prevents missing emails

**To change:** Edit `src/lib/gmail-auto-sync/sync-executor.ts`
```typescript
return new Date(lastDate.getTime() - 10 * 60 * 1000); // ← Change 10 to desired minutes
```

---

## 📊 Metrics to Track

### Success Rate
```sql
SELECT 
  COUNT(*) FILTER (WHERE type = 'transaction_processed') as successful,
  COUNT(*) FILTER (WHERE type = 'sync_error') as failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE type = 'transaction_processed') / NULLIF(COUNT(*), 0), 2) as success_rate
FROM fb_notifications
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### Average Sync Time
Check Vercel function logs for execution time

### Emails Processed
```sql
SELECT 
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) as emails_processed
FROM fb_emails
WHERE status = 'Processed'
GROUP BY day
ORDER BY day DESC
LIMIT 7;
```

---

## 🎯 Best Practices

1. **Start with 15-minute interval** - Good balance of freshness and resource usage
2. **Monitor logs regularly** - Catch issues early
3. **Test manually first** - Before enabling for all users
4. **Enable gradually** - Start with one account, then expand
5. **Set up alerts** - For repeated failures
6. **Review metrics weekly** - Optimize based on usage patterns

---

## 🆘 Emergency Actions

### Disable All Auto-Sync

```sql
UPDATE fb_gmail_connections
SET auto_sync_enabled = false;
```

### Pause Cron Temporarily

Remove from `vercel.json`:
```json
{
  "crons": []  // ← Empty array
}
```

Then redeploy.

### Clear Old Notifications

```sql
DELETE FROM fb_notifications
WHERE read = true 
AND created_at < NOW() - INTERVAL '30 days';
```

---

**That's everything you need to know about managing the cron job! 🎉**

