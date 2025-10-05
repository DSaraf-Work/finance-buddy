# Gmail Auto-Sync - Quick Start Checklist

## 🚀 5-Minute Setup

### 1. Run Database Migration (2 minutes)

```bash
# Go to Supabase Dashboard → SQL Editor
# Copy contents of: infra/migrations/0002_notifications_and_auto_sync.sql
# Paste and click "Run"
```

**Verify:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('fb_notifications', 'fb_sync_filters');
```

---

### 2. Set Environment Variable (1 minute)

**Generate Secret:**
```bash
openssl rand -hex 32
```

**Add to `.env.local`:**
```
CRON_SECRET=<paste-generated-secret-here>
```

**Add to Vercel:**
- Go to Vercel Dashboard → Settings → Environment Variables
- Add `CRON_SECRET` with the same value
- Select all environments (Production, Preview, Development)

---

### 3. Deploy to Vercel (1 minute)

```bash
git add .
git commit -m "Add Gmail auto-sync with notifications"
git push origin main
```

---

### 4. Add Notification Bell to Layout (1 minute)

Find your `Layout.tsx` or main layout component and add:

```typescript
import NotificationBell from './NotificationBell';

// In your header:
<div className="flex items-center space-x-4">
  <NotificationBell />
  {/* other items */}
</div>
```

---

### 5. Enable Auto-Sync (30 seconds)

**Via Database (quickest for testing):**
```sql
UPDATE fb_gmail_connections
SET auto_sync_enabled = true,
    auto_sync_interval_minutes = 15
WHERE user_id = 'YOUR_USER_ID';
```

**Or via API:**
```bash
curl -X POST https://your-app.vercel.app/api/gmail/auto-sync/toggle \
  -H "Content-Type: application/json" \
  -d '{"connection_id": "YOUR_CONNECTION_ID", "enabled": true}'
```

---

## ✅ Verification Steps

### 1. Check Cron Job
- Vercel Dashboard → Cron Jobs
- Should see: `/api/cron/gmail-auto-sync` running every 15 minutes

### 2. Trigger Manual Test
```bash
curl https://your-app.vercel.app/api/cron/gmail-auto-sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 3. Check Logs
- Vercel Dashboard → Deployments → Functions → `gmail-auto-sync`
- Look for: "Auto-sync cron job started"

### 4. Verify Notifications
```sql
SELECT * FROM fb_notifications ORDER BY created_at DESC LIMIT 5;
```

### 5. Check UI
- Visit your app
- Look for notification bell in header
- Click to see dropdown
- Visit `/notifications` page

---

## 🎯 What Happens Next

1. **Every 15 minutes**, the cron job runs
2. **Checks** all connections with `auto_sync_enabled = true`
3. **Syncs** new emails from Gmail
4. **Processes** emails with AI to extract transactions
5. **Creates** notifications for each transaction
6. **Updates** notification bell badge count
7. **Users** see notifications and can click to view transaction details

---

## 🔧 Quick Commands

### Check Auto-Sync Status
```sql
SELECT email_address, auto_sync_enabled, last_auto_sync_at
FROM fb_gmail_connections
WHERE auto_sync_enabled = true;
```

### View Recent Notifications
```sql
SELECT type, title, message, read, created_at
FROM fb_notifications
ORDER BY created_at DESC
LIMIT 10;
```

### View Recent Transactions
```sql
SELECT merchant_name, amount, status, created_at
FROM fb_extracted_transactions
ORDER BY created_at DESC
LIMIT 10;
```

### Manually Trigger Sync
```bash
curl https://your-app.vercel.app/api/cron/gmail-auto-sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 🐛 Common Issues & Fixes

### Cron not running
- **Fix**: Redeploy app, check `vercel.json` has cron config

### No notifications appearing
- **Fix**: Check RLS policies, verify API endpoints work

### AI processing fails
- **Fix**: Check AI API keys, test email processor manually

### Notification bell not showing
- **Fix**: Verify NotificationBell component is in Layout

---

## 📊 Success Metrics

After setup, you should see:
- ✅ Cron job running every 15 minutes
- ✅ Emails synced automatically
- ✅ Transactions extracted with AI
- ✅ Notifications created
- ✅ Notification bell showing unread count
- ✅ Users can view and edit transactions

---

## 🎉 You're Done!

The system is now:
- ✅ Automatically syncing emails every 15 minutes
- ✅ Processing emails with AI
- ✅ Creating notifications for new transactions
- ✅ Showing notifications in the UI
- ✅ Allowing users to view and edit transactions

**Next Steps:**
1. Monitor logs for first few runs
2. Test with real users
3. Gather feedback
4. Optimize as needed

---

## 📞 Need Help?

Check these files for detailed information:
- `SETUP_AUTO_SYNC.md` - Full setup guide
- `docs/AUTO_SYNC_IMPLEMENTATION_SUMMARY.md` - Architecture overview
- `docs/AUTO_SYNC_QUICK_START.md` - Detailed implementation guide

---

**Happy Auto-Syncing! 🚀**

