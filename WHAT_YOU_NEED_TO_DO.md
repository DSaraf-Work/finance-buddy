# What You Need To Do - Minimal Setup Steps

## ✅ What I've Already Done

1. **✅ Database Migration Complete**
   - Created `fb_notifications` table
   - Created `fb_sync_filters` table
   - Added auto-sync columns to `fb_gmail_connections`
   - Added status columns to `fb_extracted_transactions`
   - Set up all RLS policies
   - Created test notification

2. **✅ All Code Implemented**
   - Notification module (`src/lib/notifications/`)
   - Auto-sync module (`src/lib/gmail-auto-sync/`)
   - All API endpoints
   - UI components (NotificationBell, notifications page, transaction detail page)
   - Auto-sync settings page (`src/pages/settings/auto-sync.tsx`)
   - Updated `vercel.json` with cron configuration

---

## 🚀 What You Need To Do (3 Steps - 5 Minutes)

### Step 1: Set Environment Variable (2 minutes)

**Generate a secret:**
```bash
openssl rand -hex 32
```

**Add to `.env.local`:**
```bash
echo "CRON_SECRET=<paste-your-generated-secret>" >> .env.local
```

**Add to Vercel:**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Name: `CRON_SECRET`
6. Value: (paste the same secret)
7. Select: Production, Preview, Development
8. Click **Save**

---

### Step 2: Add Notification Bell to Layout (2 minutes)

Find your main layout component (probably `src/components/Layout.tsx` or `src/app/layout.tsx`):

**Add import:**
```typescript
import NotificationBell from '@/components/NotificationBell';
```

**Add to header:**
```typescript
<div className="flex items-center space-x-4">
  <NotificationBell />
  {/* your other header items like user menu */}
</div>
```

**Example:**
```typescript
export default function Layout({ children }) {
  return (
    <div>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1>Finance Buddy</h1>
          
          <div className="flex items-center space-x-4">
            <NotificationBell />  {/* ← Add this */}
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

### Step 3: Deploy to Vercel (1 minute)

```bash
git add .
git commit -m "Add Gmail auto-sync with AI processing and notifications"
git push origin main
```

Vercel will automatically deploy.

---

## ✅ Verification (After Deployment)

### 1. Check Cron Job in Vercel Dashboard

1. Go to Vercel Dashboard
2. Select your project
3. Click **Cron Jobs** in sidebar
4. You should see:
   - Path: `/api/cron/gmail-auto-sync`
   - Schedule: `*/15 * * * *`
   - Status: Active

### 2. Enable Auto-Sync for Your Account

**Option A: Via UI (Recommended)**
1. Visit: `https://your-app.vercel.app/settings/auto-sync`
2. Click "Enable Auto-Sync" for your Gmail account
3. Done!

**Option B: Via Database**
```sql
UPDATE fb_gmail_connections
SET auto_sync_enabled = true
WHERE email_address = 'your-email@gmail.com';
```

### 3. Test the System

**Visit the auto-sync settings page:**
```
https://your-app.vercel.app/settings/auto-sync
```

**Click "🧪 Test Cron Job Manually"**
- Enter your `CRON_SECRET` when prompted
- Should see success message with sync results

**Check for notifications:**
- Look for notification bell in header (should show badge if notifications exist)
- Click bell to see dropdown
- Visit `/notifications` page

---

## 🎯 How to Manage Auto-Sync

### Via UI (Easy Way)

**Auto-Sync Settings Page:**
```
https://your-app.vercel.app/settings/auto-sync
```

**Features:**
- ✅ Enable/disable auto-sync per Gmail account
- ✅ See last sync time
- ✅ Test cron job manually
- ✅ View cron schedule info

### Via Database (Advanced)

**Enable auto-sync:**
```sql
UPDATE fb_gmail_connections
SET auto_sync_enabled = true
WHERE email_address = 'your-email@gmail.com';
```

**Disable auto-sync:**
```sql
UPDATE fb_gmail_connections
SET auto_sync_enabled = false
WHERE email_address = 'your-email@gmail.com';
```

**Check status:**
```sql
SELECT 
  email_address,
  auto_sync_enabled,
  last_auto_sync_at,
  auto_sync_interval_minutes
FROM fb_gmail_connections
ORDER BY email_address;
```

---

## 🧪 How to Test the Cron Job

### Method 1: Via UI (Easiest)

1. Go to `/settings/auto-sync`
2. Click "🧪 Test Cron Job Manually"
3. Enter your `CRON_SECRET`
4. See results

### Method 2: Via API

```bash
curl https://your-app.vercel.app/api/cron/gmail-auto-sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Method 3: Wait for Automatic Run

- Cron runs every 15 minutes automatically
- Check Vercel logs to see when it runs
- First run: 15 minutes after deployment

---

## 📊 Monitoring

### Check Sync Activity

**Via Database:**
```sql
-- See recent auto-sync activity
SELECT 
  email_address,
  auto_sync_enabled,
  last_auto_sync_at
FROM fb_gmail_connections
WHERE auto_sync_enabled = true
ORDER BY last_auto_sync_at DESC;
```

### Check Notifications

**Via Database:**
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
LIMIT 10;
```

**Via UI:**
- Visit `/notifications`
- Click notification bell in header

### Check Vercel Logs

1. Vercel Dashboard → Deployments
2. Select latest deployment
3. Click **Functions**
4. Find `gmail-auto-sync`
5. View logs

**Look for:**
- "Auto-sync cron job started"
- "Found X connections with auto-sync enabled"
- "Syncing connection..."
- "Sync completed"

---

## 🎨 UI Pages Available

### 1. Auto-Sync Settings
**URL:** `/settings/auto-sync`
- Enable/disable auto-sync
- Test cron manually
- View sync status

### 2. Notifications
**URL:** `/notifications`
- View all notifications
- Filter by read/unread
- Mark as read/delete

### 3. Transaction Detail
**URL:** `/transactions/[id]`
- View transaction details
- Edit transaction
- See source email
- AI confidence score

---

## 🔧 Cron Configuration

### Current Setup

**Schedule:** Every 15 minutes
```
*/15 * * * *
```

**Endpoint:** `/api/cron/gmail-auto-sync`

**Authentication:** Bearer token (CRON_SECRET)

### How to Change Schedule

Edit `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/gmail-auto-sync",
      "schedule": "*/15 * * * *"  // ← Change this
    }
  ]
}
```

**Examples:**
- Every 5 minutes: `*/5 * * * *`
- Every 30 minutes: `*/30 * * * *`
- Every hour: `0 * * * *`
- Every day at 9am: `0 9 * * *`

After changing, redeploy to Vercel.

---

## 🐛 Troubleshooting

### Cron not running
**Check:**
- Vercel Dashboard → Cron Jobs (should be listed)
- `CRON_SECRET` is set in Vercel environment variables
- `vercel.json` has cron configuration

**Fix:** Redeploy the app

### No notifications appearing
**Check:**
- Auto-sync is enabled for at least one connection
- Cron has run at least once (check logs)
- NotificationBell component is in Layout

**Fix:** Enable auto-sync, wait 15 minutes, or trigger manually

### Notification bell not showing
**Check:**
- NotificationBell component added to Layout
- No JavaScript errors in browser console

**Fix:** Add NotificationBell to Layout component

---

## 📝 Summary

**You only need to do 3 things:**

1. ✅ Set `CRON_SECRET` environment variable (local + Vercel)
2. ✅ Add `<NotificationBell />` to your Layout component
3. ✅ Deploy to Vercel (`git push`)

**Then:**
- Visit `/settings/auto-sync` to enable auto-sync
- Test the cron job manually
- Wait for notifications to appear

**That's it! 🎉**

---

## 🆘 Need Help?

**Check these files:**
- `SETUP_AUTO_SYNC.md` - Detailed setup guide
- `QUICK_START_CHECKLIST.md` - Quick reference
- `docs/AUTO_SYNC_IMPLEMENTATION_SUMMARY.md` - Architecture overview

**Test notification created:**
- User: riya.chaudhary.2909@gmail.com
- Check `/notifications` page after deployment

**Database is ready:**
- All tables created ✅
- RLS policies set ✅
- Test data inserted ✅

