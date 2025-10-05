# Gmail Auto-Sync Setup Guide

## Overview

This guide will help you set up the Gmail auto-sync feature with automatic AI processing and web notifications.

---

## ✅ What's Been Implemented

All code has been created and is ready to deploy:

### 1. **Database Migration**
- ✅ `infra/migrations/0002_notifications_and_auto_sync.sql`
- Creates `fb_notifications` and `fb_sync_filters` tables
- Adds auto-sync columns to `fb_gmail_connections`
- Adds status columns to `fb_extracted_transactions`

### 2. **Notification Module**
- ✅ `src/lib/notifications/types.ts`
- ✅ `src/lib/notifications/notification-builder.ts`
- ✅ `src/lib/notifications/notification-manager.ts`
- ✅ `src/lib/notifications/index.ts`

### 3. **Auto-Sync Module**
- ✅ `src/lib/gmail-auto-sync/types.ts`
- ✅ `src/lib/gmail-auto-sync/sync-executor.ts`
- ✅ `src/lib/gmail-auto-sync/index.ts`

### 4. **API Endpoints**
- ✅ `/api/notifications/index.ts` - List notifications
- ✅ `/api/notifications/unread-count.ts` - Get unread count
- ✅ `/api/notifications/mark-all-read.ts` - Mark all as read
- ✅ `/api/notifications/[id]/index.ts` - Delete notification
- ✅ `/api/notifications/[id]/mark-read.ts` - Mark as read
- ✅ `/api/transactions/[id]/index.ts` - Get/Update/Delete transaction
- ✅ `/api/gmail/auto-sync/toggle.ts` - Enable/disable auto-sync
- ✅ `/api/gmail/auto-sync/status.ts` - Get auto-sync status
- ✅ `/api/cron/gmail-auto-sync.ts` - Cron endpoint

### 5. **UI Components**
- ✅ `src/components/NotificationBell.tsx` - Notification bell with dropdown
- ✅ `src/pages/notifications.tsx` - Notifications page
- ✅ `src/pages/transactions/[id].tsx` - Transaction detail page

### 6. **Configuration**
- ✅ `vercel.json` - Updated with cron job configuration

---

## 🚀 Setup Steps

### Step 1: Run Database Migration

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `infra/migrations/0002_notifications_and_auto_sync.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run**
7. Verify success (should see "Success. No rows returned")

**Option B: Using Supabase CLI**

```bash
# If you have Supabase CLI installed
cd /Users/dsaraf/Documents/Repos/finance-buddy
supabase db push
```

**Verify Migration:**

Run this query in SQL Editor to verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('fb_notifications', 'fb_sync_filters');
```

You should see both tables listed.

---

### Step 2: Set Environment Variable

Add the `CRON_SECRET` environment variable:

**For Local Development:**

1. Open `.env.local` file
2. Add this line:
   ```
   CRON_SECRET=your-random-secret-here
   ```
3. Generate a secure secret:
   ```bash
   openssl rand -hex 32
   ```
4. Replace `your-random-secret-here` with the generated value

**For Vercel Production:**

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `CRON_SECRET`
   - **Value**: (paste the same secret from local)
   - **Environment**: Production, Preview, Development
5. Click **Save**

---

### Step 3: Deploy to Vercel

```bash
# Commit all changes
git add .
git commit -m "Add Gmail auto-sync with AI processing and notifications"
git push origin main
```

Vercel will automatically deploy your changes.

---

### Step 4: Verify Cron Job Setup

1. Go to Vercel Dashboard
2. Select your project
3. Navigate to **Cron Jobs** (in the left sidebar)
4. You should see:
   - **Path**: `/api/cron/gmail-auto-sync`
   - **Schedule**: `*/15 * * * *` (every 15 minutes)
   - **Status**: Active

If you don't see it, the cron job will be created on the next deployment.

---

### Step 5: Add Notification Bell to Layout

You need to manually add the NotificationBell component to your layout.

**Find your Layout component** (likely `src/components/Layout.tsx` or similar):

```typescript
// Add import at the top
import NotificationBell from './NotificationBell';

// In your header/navigation section, add:
<div className="flex items-center space-x-4">
  <NotificationBell />
  {/* Your other header items */}
</div>
```

**Example:**

```typescript
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1>Finance Buddy</h1>
          
          <div className="flex items-center space-x-4">
            <NotificationBell />
            {/* User menu, etc. */}
          </div>
        </div>
      </header>
      
      <main>{children}</main>
    </div>
  );
}
```

---

### Step 6: Enable Auto-Sync for a Connection

**Option A: Via API (for testing)**

```bash
# Replace with your actual connection ID
curl -X POST https://your-app.vercel.app/api/gmail/auto-sync/toggle \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"connection_id": "YOUR_CONNECTION_ID", "enabled": true}'
```

**Option B: Via Database (temporary)**

```sql
-- Enable auto-sync for all connections (for testing)
UPDATE fb_gmail_connections
SET auto_sync_enabled = true,
    auto_sync_interval_minutes = 15
WHERE user_id = 'YOUR_USER_ID';
```

**Option C: Build a UI (recommended for production)**

Create a settings page where users can toggle auto-sync on/off.

---

### Step 7: Test the System

**Test 1: Manual Cron Trigger**

```bash
# Trigger the cron endpoint manually
curl https://your-app.vercel.app/api/cron/gmail-auto-sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Check the response - you should see sync results.

**Test 2: Check Logs**

1. Go to Vercel Dashboard
2. Navigate to **Deployments** → Select latest deployment
3. Click **Functions** → Find `gmail-auto-sync`
4. Check logs for:
   - "Auto-sync cron job started"
   - "Found X connections with auto-sync enabled"
   - "Syncing connection..."
   - "Sync completed"

**Test 3: Verify Notifications**

1. Wait for cron to run (or trigger manually)
2. If emails are synced and processed, check:
   ```sql
   SELECT * FROM fb_notifications ORDER BY created_at DESC LIMIT 10;
   ```
3. You should see notifications for processed transactions

**Test 4: Check UI**

1. Visit your app
2. Look for the notification bell in the header
3. If there are notifications, you should see a red badge with count
4. Click the bell to see the dropdown
5. Visit `/notifications` to see the full page

---

## 🔍 Troubleshooting

### Issue: Cron job not running

**Check:**
1. Verify `vercel.json` has the cron configuration
2. Check Vercel Dashboard → Cron Jobs
3. Verify `CRON_SECRET` environment variable is set
4. Check function logs in Vercel

**Solution:**
- Redeploy the app
- Verify the cron secret matches in both `.env.local` and Vercel

### Issue: Notifications not appearing

**Check:**
1. Run this query to see if notifications exist:
   ```sql
   SELECT * FROM fb_notifications WHERE user_id = 'YOUR_USER_ID';
   ```
2. Check browser console for errors
3. Verify NotificationBell component is in the layout

**Solution:**
- Check RLS policies allow user to read notifications
- Verify API endpoints are working
- Check network tab in browser dev tools

### Issue: AI processing fails

**Check:**
1. Verify AI API keys are configured
2. Check email content is valid
3. Look at function logs for errors

**Solution:**
- Test email processing manually first
- Check `EmailProcessor` logs
- Verify `SchemaAwareTransactionExtractor` is working

### Issue: Sync executor fails

**Check:**
1. Verify Gmail OAuth tokens are valid
2. Check if manual sync works
3. Look for errors in cron logs

**Solution:**
- Refresh OAuth tokens
- Test manual sync endpoint first
- Check Gmail API quota

---

## 📊 Monitoring

### Check Sync Status

```sql
-- See recent auto-sync activity
SELECT 
  email_address,
  auto_sync_enabled,
  last_auto_sync_at,
  auto_sync_interval_minutes
FROM fb_gmail_connections
WHERE auto_sync_enabled = true
ORDER BY last_auto_sync_at DESC;
```

### Check Notifications

```sql
-- See recent notifications
SELECT 
  type,
  title,
  message,
  read,
  created_at
FROM fb_notifications
ORDER BY created_at DESC
LIMIT 20;
```

### Check Processed Transactions

```sql
-- See recently processed transactions
SELECT 
  merchant_name,
  amount,
  currency,
  status,
  confidence,
  created_at
FROM fb_extracted_transactions
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🎯 Next Steps

1. **Test thoroughly** with a few users
2. **Monitor logs** for errors
3. **Gather feedback** on notification frequency
4. **Optimize** AI processing if needed
5. **Add UI** for users to enable/disable auto-sync
6. **Add filters** for selective email syncing (future enhancement)

---

## 📝 Important Notes

### Cron Schedule
- Runs every 15 minutes: `*/15 * * * *`
- First run: 15 minutes after deployment
- Timezone: UTC

### Sync Window
- Syncs emails from: `MAX(internal_date) - 10 minutes`
- 10-minute buffer prevents missing emails
- If no processed emails: syncs last 7 days

### Rate Limits
- Gmail API: 1 billion quota units/day
- Vercel Functions: 60 seconds max execution (Pro plan)
- Batch size: 50 emails per sync

### Notifications
- Created for each successfully processed transaction
- Auto-deleted after 30 days (if read)
- Unread notifications kept indefinitely

---

## 🆘 Support

If you encounter issues:

1. Check the logs in Vercel Dashboard
2. Run SQL queries to verify data
3. Test each component independently
4. Check the documentation in `docs/` folder

---

## ✅ Deployment Checklist

- [ ] Database migration completed
- [ ] `CRON_SECRET` environment variable set
- [ ] Code deployed to Vercel
- [ ] Cron job visible in Vercel Dashboard
- [ ] NotificationBell added to Layout
- [ ] Auto-sync enabled for at least one connection
- [ ] Cron triggered manually (test)
- [ ] Notifications appearing in UI
- [ ] Transaction detail page working
- [ ] Logs checked for errors

---

**Congratulations! Your Gmail auto-sync with AI processing and notifications is now live! 🎉**

