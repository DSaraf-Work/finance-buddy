# 🔔 Push Notifications Setup & Testing Guide

## 📋 Table of Contents
1. [Environment Variables Setup](#environment-variables-setup)
2. [Testing Guide](#testing-guide)
3. [Troubleshooting](#troubleshooting)
4. [API Reference](#api-reference)

---

## 🔧 Environment Variables Setup

### Step 1: Add Variables to Vercel

You need to add 4 environment variables to your Vercel project:

#### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Project Settings**
   - URL: https://vercel.com/dheerajs-projects-74ed43fb/finance-buddy/settings/environment-variables
   - Or: Vercel Dashboard → finance-buddy → Settings → Environment Variables

2. **Add Each Variable**

   Click "Add New" and enter each variable:

   **Variable 1:**
   ```
   Name: NEXT_PUBLIC_VAPID_PUBLIC_KEY
   Value: BCcx7G-GNmwQ_QheBTwZamrbgZ1MKpMF-4sXbcsDsipszYpHEQfDkPfUH9oqh8EkbzdVYnHzoj5uMpYnHWLa_M8
   Environment: Production, Preview, Development (select all)
   ```

   **Variable 2:**
   ```
   Name: VAPID_PRIVATE_KEY
   Value: pgiVr3V1r7BLtf9wu0OaBbTaNCCFVK_BnNxpIUtERzU
   Environment: Production, Preview, Development (select all)
   ```

   **Variable 3:**
   ```
   Name: VAPID_SUBJECT
   Value: mailto:dsaraf.adobe@gmail.com
   Environment: Production, Preview, Development (select all)
   ```

   **Variable 4:**
   ```
   Name: PUSH_INTERNAL_SECRET
   Value: tiMaMHn8vlBfxzoI7wt5LFzDmryK2+07akf+5Hh2pig=
   Environment: Production, Preview, Development (select all)
   ```

3. **Save All Variables**
   - Click "Save" for each variable
   - Verify all 4 variables are listed

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production
# Paste: BCcx7G-GNmwQ_QheBTwZamrbgZ1MKpMF-4sXbcsDsipszYpHEQfDkPfUH9oqh8EkbzdVYnHzoj5uMpYnHWLa_M8

vercel env add VAPID_PRIVATE_KEY production
# Paste: pgiVr3V1r7BLtf9wu0OaBbTaNCCFVK_BnNxpIUtERzU

vercel env add VAPID_SUBJECT production
# Paste: mailto:dsaraf.adobe@gmail.com

vercel env add PUSH_INTERNAL_SECRET production
# Paste: tiMaMHn8vlBfxzoI7wt5LFzDmryK2+07akf+5Hh2pig=
```

### Step 2: Redeploy

After adding environment variables, you need to redeploy:

#### Option A: Via Vercel Dashboard
1. Go to: https://vercel.com/dheerajs-projects-74ed43fb/finance-buddy
2. Click on the latest deployment
3. Click "Redeploy" button
4. Wait for deployment to complete (~60 seconds)

#### Option B: Via Git Push
```bash
# Make a small change and push
git commit --allow-empty -m "Trigger redeploy with env vars"
git push origin main
```

#### Option C: Via Vercel CLI
```bash
vercel --prod
```

### Step 3: Verify Environment Variables

After redeployment, verify the variables are accessible:

```bash
# Test the VAPID public key endpoint
curl https://finance-buddy-sand.vercel.app/api/push/vapid-public-key

# Expected response:
# {"publicKey":"BCcx7G-GNmwQ_QheBTwZamrbgZ1MKpMF-4sXbcsDsipszYpHEQfDkPfUH9oqh8EkbzdVYnHzoj5uMpYnHWLa_M8"}
```

---

## 🧪 Testing Guide

### Test 1: Browser Support Check

1. **Open Production App**
   - URL: https://finance-buddy-sand.vercel.app
   - Use a modern browser (Chrome, Firefox, Edge, Safari 16.4+)

2. **Check Console**
   - Open DevTools (F12)
   - Look for: `✅ Service Worker registered`
   - This confirms the service worker is active

### Test 2: Enable Push Notifications (User Flow)

1. **Login to the App**
   - Email: `dheerajsaraf1996@gmail.com`
   - Password: `Abcd1234`

2. **Navigate to Settings**
   - Click on "Settings" in the navigation
   - Or go to: https://finance-buddy-sand.vercel.app/settings

3. **Find Push Notifications Section**
   - Scroll down to "Push Notifications" section
   - You should see a blue prompt with "Enable Notifications" button

4. **Enable Notifications**
   - Click "Enable Notifications"
   - Browser will show permission prompt
   - Click "Allow" in the browser prompt

5. **Verify Subscription**
   - After allowing, the UI should change to green
   - Should show: "✓ Push notifications enabled"
   - Should have a "Disable" button

### Test 3: Send Test Notification (Manual)

Now let's send a test notification to verify everything works.

#### Method A: Using Browser Console

1. **Open DevTools Console** (F12 → Console tab)

2. **Get Your User ID**
   ```javascript
   // Run this in console
   document.cookie.split('; ').find(c => c.startsWith('sb-'))
   ```
   - Copy the auth token value

3. **Send Test Notification**
   ```javascript
   fetch('/api/push/send', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       userId: 'YOUR_USER_ID_HERE', // Replace with your user ID
       payload: {
         title: 'Test Notification',
         body: 'This is a test push notification!',
         icon: '/icons/icon-192x192.png',
         url: '/transactions'
       }
     })
   }).then(r => r.json()).then(console.log)
   ```

#### Method B: Using cURL

First, get your user ID from the database or from the browser.

```bash
# Replace YOUR_USER_ID with actual user ID
curl -X POST https://finance-buddy-sand.vercel.app/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "payload": {
      "title": "Test Notification",
      "body": "Hello from Finance Buddy!",
      "icon": "/icons/icon-192x192.png",
      "url": "/transactions"
    }
  }'
```

### Test 4: Click Notification

1. **Wait for Notification**
   - After sending test notification, you should see a browser notification
   - It should appear in the top-right corner (or notification center)

2. **Click the Notification**
   - Click on the notification
   - Should open the app and navigate to the URL specified
   - Notification should close automatically

### Test 5: Multi-Device Testing

1. **Subscribe on Multiple Devices**
   - Open the app on your phone
   - Login with same credentials
   - Enable push notifications
   - Now you have 2 devices subscribed

2. **Send Notification**
   - Send a test notification (using Method A or B above)
   - Both devices should receive the notification

### Test 6: Server-Triggered Notification (Advanced)

Test sending notifications from external services (cron jobs, webhooks):

```bash
# Using the internal secret for authentication
curl -X POST https://finance-buddy-sand.vercel.app/api/push/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tiMaMHn8vlBfxzoI7wt5LFzDmryK2+07akf+5Hh2pig=" \
  -d '{
    "userId": "YOUR_USER_ID",
    "payload": {
      "title": "Server Notification",
      "body": "This was sent from a server!",
      "icon": "/icons/icon-192x192.png",
      "url": "/"
    }
  }'
```

### Test 7: Bulk Notifications

Test sending to multiple users at once:

```bash
curl -X POST https://finance-buddy-sand.vercel.app/api/push/send-bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tiMaMHn8vlBfxzoI7wt5LFzDmryK2+07akf+5Hh2pig=" \
  -d '{
    "notifications": [
      {
        "userId": "USER_ID_1",
        "payload": {
          "title": "Bulk Test 1",
          "body": "First user notification"
        }
      },
      {
        "userId": "USER_ID_2",
        "payload": {
          "title": "Bulk Test 2",
          "body": "Second user notification"
        }
      }
    ]
  }'
```

---

## 🔍 Troubleshooting

### Issue 1: "Enable Notifications" button doesn't appear

**Possible Causes:**
- Browser doesn't support push notifications
- Service worker not registered

**Solutions:**
1. Check browser console for errors
2. Verify service worker: `navigator.serviceWorker.controller`
3. Try a different browser (Chrome, Firefox, Edge)
4. Make sure you're using HTTPS (localhost or production)

### Issue 2: Permission prompt doesn't show

**Possible Causes:**
- Permission already denied
- Browser blocked notifications

**Solutions:**
1. Check permission status: `Notification.permission`
2. If "denied", reset in browser settings:
   - Chrome: Settings → Privacy → Site Settings → Notifications
   - Firefox: Settings → Privacy → Permissions → Notifications
   - Safari: Preferences → Websites → Notifications
3. Remove the site and try again

### Issue 3: Notification not received

**Possible Causes:**
- Subscription not saved to database
- VAPID keys mismatch
- Service worker not active

**Solutions:**
1. Check database for subscription:
   ```sql
   SELECT * FROM fb_push_subscriptions WHERE user_id = 'YOUR_USER_ID';
   ```
2. Verify VAPID keys in Vercel match local `.env.local`
3. Check service worker status in DevTools → Application → Service Workers
4. Check browser console for errors

### Issue 4: "Internal secret not configured" error

**Possible Causes:**
- `PUSH_INTERNAL_SECRET` not set in Vercel
- Environment variables not redeployed

**Solutions:**
1. Verify environment variable in Vercel dashboard
2. Redeploy the application
3. Wait for deployment to complete
4. Test again

### Issue 5: Notification shows but click doesn't work

**Possible Causes:**
- Service worker notification click handler not working
- URL in payload is incorrect

**Solutions:**
1. Check service worker console for errors
2. Verify URL in notification payload
3. Check if URL is relative (e.g., `/transactions`) not absolute
4. Reload service worker: DevTools → Application → Service Workers → Update

---

## 📖 API Reference

### GET /api/push/vapid-public-key

Returns the VAPID public key for client-side subscription.

**Request:**
```bash
GET /api/push/vapid-public-key
```

**Response:**
```json
{
  "publicKey": "BCcx7G-GNmwQ_QheBTwZamrbgZ1MKpMF-4sXbcsDsipszYpHEQfDkPfUH9oqh8EkbzdVYnHzoj5uMpYnHWLa_M8"
}
```

### POST /api/push/subscribe

Saves a push subscription for the authenticated user.

**Request:**
```bash
POST /api/push/subscribe
Content-Type: application/json
Cookie: sb-access-token=...

{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

**Response:**
```json
{
  "success": true
}
```

### POST /api/push/unsubscribe

Removes a push subscription.

**Request:**
```bash
POST /api/push/unsubscribe
Content-Type: application/json
Cookie: sb-access-token=...

{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

**Response:**
```json
{
  "success": true
}
```

### POST /api/push/send

Sends a push notification to a single user.

**Request (Internal - No Auth):**
```bash
POST /api/push/send
Content-Type: application/json

{
  "userId": "uuid",
  "payload": {
    "title": "Notification Title",
    "body": "Notification body text",
    "icon": "/icons/icon-192x192.png",
    "badge": "/icons/icon-72x72.png",
    "url": "/transactions",
    "data": { "custom": "data" }
  }
}
```

**Request (External - With Auth):**
```bash
POST /api/push/send
Content-Type: application/json
Authorization: Bearer tiMaMHn8vlBfxzoI7wt5LFzDmryK2+07akf+5Hh2pig=

{
  "userId": "uuid",
  "payload": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "sentTo": 2,
  "failed": 0,
  "errors": []
}
```

### POST /api/push/send-bulk

Sends push notifications to multiple users in parallel.

**Request:**
```bash
POST /api/push/send-bulk
Content-Type: application/json
Authorization: Bearer tiMaMHn8vlBfxzoI7wt5LFzDmryK2+07akf+5Hh2pig=

{
  "notifications": [
    {
      "userId": "uuid-1",
      "payload": {
        "title": "Title 1",
        "body": "Body 1"
      }
    },
    {
      "userId": "uuid-2",
      "payload": {
        "title": "Title 2",
        "body": "Body 2"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "total": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "userId": "uuid-1",
      "status": "fulfilled",
      "data": { "success": true, "sentTo": 1, "failed": 0, "errors": [] }
    },
    {
      "userId": "uuid-2",
      "status": "fulfilled",
      "data": { "success": true, "sentTo": 1, "failed": 0, "errors": [] }
    }
  ]
}
```

---

## 🎯 Quick Testing Checklist

Use this checklist to verify everything works:

- [ ] Environment variables added to Vercel
- [ ] Application redeployed
- [ ] VAPID public key endpoint returns correct key
- [ ] Service worker registered successfully
- [ ] Push notification prompt appears on settings page
- [ ] Browser permission prompt shows when clicking "Enable"
- [ ] Subscription saved to database
- [ ] UI changes to "enabled" state after subscribing
- [ ] Test notification received
- [ ] Clicking notification opens correct URL
- [ ] Notification closes after clicking
- [ ] Multiple devices can subscribe
- [ ] Server-triggered notification works with auth
- [ ] Bulk send works for multiple users

---

## 📝 Notes

- **Browser Support**: Chrome 42+, Firefox 44+, Edge 17+, Safari 16.4+
- **HTTPS Required**: Push notifications only work on HTTPS (or localhost)
- **Service Worker**: Must be registered and active
- **Permissions**: User must grant notification permission
- **Multi-Device**: Each device gets its own subscription
- **Expiration**: Subscriptions may expire and need renewal

---

**Document Version**: 1.0
**Last Updated**: 2025-11-14
**Author**: AI Agent


