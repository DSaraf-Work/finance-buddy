# 🚀 Push Notifications - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Add Environment Variables to Vercel (2 minutes)

1. **Go to Vercel Dashboard**
   - URL: https://vercel.com/dheerajs-projects-74ed43fb/finance-buddy/settings/environment-variables

2. **Add These 4 Variables** (click "Add New" for each):

   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY
   BCcx7G-GNmwQ_QheBTwZamrbgZ1MKpMF-4sXbcsDsipszYpHEQfDkPfUH9oqh8EkbzdVYnHzoj5uMpYnHWLa_M8
   ```

   ```
   VAPID_PRIVATE_KEY
   pgiVr3V1r7BLtf9wu0OaBbTaNCCFVK_BnNxpIUtERzU
   ```

   ```
   VAPID_SUBJECT
   mailto:dsaraf.adobe@gmail.com
   ```

   ```
   PUSH_INTERNAL_SECRET
   tiMaMHn8vlBfxzoI7wt5LFzDmryK2+07akf+5Hh2pig=
   ```

   **Important**: Select all environments (Production, Preview, Development) for each variable.

### Step 2: Redeploy (1 minute)

**Option A: Via Dashboard**
- Go to: https://vercel.com/dheerajs-projects-74ed43fb/finance-buddy
- Click latest deployment → "Redeploy"

**Option B: Via Git**
```bash
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

### Step 3: Test (2 minutes)

1. **Open App**: https://finance-buddy-sand.vercel.app/settings
2. **Login**: `dheerajsaraf1996@gmail.com` / `Abcd1234`
3. **Enable Notifications**: Click "Enable Notifications" button
4. **Allow Permission**: Click "Allow" in browser prompt
5. **Verify**: Should show "✓ Push notifications enabled"

---

## 🧪 Send Test Notification

### Method 1: Browser Console (Easiest)

1. Open DevTools (F12) → Console
2. Run this code:

```javascript
// Get your user ID from Supabase Auth
const userId = 'YOUR_USER_ID'; // Replace with actual user ID

// Send test notification
fetch('/api/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: userId,
    payload: {
      title: '🎉 Test Notification',
      body: 'Your push notifications are working!',
      icon: '/icons/icon-192x192.png',
      url: '/transactions'
    }
  })
}).then(r => r.json()).then(console.log);
```

### Method 2: cURL (For Server Testing)

```bash
# Replace YOUR_USER_ID with actual user ID
curl -X POST https://finance-buddy-sand.vercel.app/api/push/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tiMaMHn8vlBfxzoI7wt5LFzDmryK2+07akf+5Hh2pig=" \
  -d '{
    "userId": "YOUR_USER_ID",
    "payload": {
      "title": "Test from Server",
      "body": "This works!",
      "icon": "/icons/icon-192x192.png",
      "url": "/"
    }
  }'
```

---

## 🔍 How to Get Your User ID

### Method 1: From Database

```sql
-- Run in Supabase SQL Editor
SELECT id, email FROM auth.users WHERE email = 'dheerajsaraf1996@gmail.com';
```

### Method 2: From Browser Console

```javascript
// Run in browser console after logging in
document.cookie.split('; ')
  .find(c => c.startsWith('sb-'))
  ?.split('=')[1]
  ?.split('.')[1]
  ?.let(s => JSON.parse(atob(s)))
  ?.sub
```

### Method 3: From Network Tab

1. Open DevTools → Network tab
2. Refresh the page
3. Look for any API call
4. Check the request headers for `Authorization: Bearer ...`
5. Decode the JWT token to get `sub` (user ID)

---

## ✅ Verification Checklist

After setup, verify these:

- [ ] All 4 environment variables added to Vercel
- [ ] Application redeployed successfully
- [ ] Can access: https://finance-buddy-sand.vercel.app
- [ ] Service worker registered (check console)
- [ ] "Enable Notifications" button appears on /settings
- [ ] Browser permission prompt shows
- [ ] UI changes to "enabled" state
- [ ] Test notification received
- [ ] Clicking notification opens app

---

## 🐛 Common Issues

### "Enable Notifications" button doesn't appear
- **Fix**: Check browser console for errors
- **Fix**: Try Chrome/Firefox (Safari 16.4+ required)
- **Fix**: Make sure you're on HTTPS

### Permission prompt doesn't show
- **Fix**: Check if already denied in browser settings
- **Fix**: Reset site permissions and try again

### Notification not received
- **Fix**: Check database: `SELECT * FROM fb_push_subscriptions;`
- **Fix**: Verify VAPID keys match in Vercel
- **Fix**: Check browser console for errors

### "Internal secret not configured"
- **Fix**: Add `PUSH_INTERNAL_SECRET` to Vercel
- **Fix**: Redeploy the application

---

## 📚 Full Documentation

For detailed documentation, see:
- [PUSH_NOTIFICATIONS_SETUP_GUIDE.md](./PUSH_NOTIFICATIONS_SETUP_GUIDE.md)
- [PUSH_NOTIFICATIONS_IMPLEMENTATION_PLAN.md](./PUSH_NOTIFICATIONS_IMPLEMENTATION_PLAN.md)

---

**Quick Start Version**: 1.0  
**Last Updated**: 2025-11-14

