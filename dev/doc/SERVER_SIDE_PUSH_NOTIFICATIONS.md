# Server-Side Push Notifications

## Overview
Finance Buddy now sends push notifications **directly from the server** when transactions are created. This means users receive notifications **even when their browser is closed**.

## Key Changes

### ✅ What Was Removed
- ❌ 30-second polling for `/api/notifications`
- ❌ 30-second polling for `/api/notifications/unread-count`
- ❌ Client-side notification detection logic
- ❌ Unnecessary API calls and server load

### ✅ What Was Added
- ✅ Server-side push notification sending
- ✅ Internal API endpoint for push notifications
- ✅ Helper functions for background push sending
- ✅ Automatic push after transaction creation
- ✅ Web Push API integration

## Architecture

```
Email Processed
    ↓
Transaction Created (fb_emails_processed INSERT)
    ↓
Database Trigger (notify_transaction_created)
    ↓
Notification Created (fb_notifications INSERT)
    ↓
EmailProcessor.sendPushNotificationForTransaction()
    ↓
Wait 500ms for trigger to complete
    ↓
Find notification by transaction_id
    ↓
sendPushInBackground(notificationId)
    ↓
POST /api/notifications/send-push-internal
    ↓
PushManager.sendToUser(userId, payload)
    ↓
Web Push sent to all user devices
    ↓
User receives push notification (even if browser closed!)
```

## Components

### 1. EmailProcessor (`src/lib/email-processing/processor.ts`)
**Modified**: Added `sendPushNotificationForTransaction()` method
- Called after transaction is saved
- Waits 500ms for database trigger to create notification
- Finds notification by transaction_id
- Sends push in background (fire and forget)

### 2. Send Push Helper (`src/lib/notifications/send-push-helper.ts`)
**New**: Helper functions for sending push notifications
- `sendPushForNotification(notificationId)` - Send push for a notification
- `sendPushDirect(userId, title, options)` - Send push with direct data
- `sendPushInBackground(notificationId)` - Fire and forget

### 3. Internal API (`src/pages/api/notifications/send-push-internal.ts`)
**New**: Server-side API for sending push notifications
- Authenticated with `PUSH_INTERNAL_SECRET`
- Supports two modes:
  1. Pass `notificationId` - fetches from database
  2. Pass `userId + title + ...` - uses direct data
- Uses `PushManager` to send Web Push

### 4. PushManager (`src/lib/push/push-manager.ts`)
**Existing**: Manages push subscriptions and sending
- Stores push subscriptions in `fb_push_subscriptions` table
- Sends Web Push using VAPID keys
- Handles multiple devices per user

## Configuration

### Environment Variables Required

```bash
# Internal API secret (generate a random string)
PUSH_INTERNAL_SECRET=your-secret-key-here

# VAPID keys for Web Push (already configured)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:your-email@example.com

# App URL for internal API calls
NEXT_PUBLIC_APP_URL=https://finance-buddy.vercel.app
```

### Generate PUSH_INTERNAL_SECRET

```bash
# Generate a random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## How to Use

### For Users

1. **Grant Permission**
   - Open the app in browser
   - Click "Allow" when prompted for notifications

2. **Subscribe to Push**
   - Happens automatically when permission is granted
   - Service worker registers push subscription

3. **Receive Notifications**
   - Process an email → Transaction created
   - Push notification appears immediately
   - Works even if browser is closed!

### For Developers

#### Send Push for a Notification
```typescript
import { sendPushForNotification } from '@/lib/notifications/send-push-helper';

// Send push for a notification ID
await sendPushForNotification('notification-id-here');
```

#### Send Push Directly
```typescript
import { sendPushDirect } from '@/lib/notifications/send-push-helper';

// Send push with direct data
await sendPushDirect(
  'user-id-here',
  '💸 Payment to BHARATH',
  {
    subtitle: 'Debit of INR 303.00',
    url: '/transactions/edit/123',
  }
);
```

#### Send Push in Background
```typescript
import { sendPushInBackground } from '@/lib/notifications/send-push-helper';

// Fire and forget (doesn't wait for response)
sendPushInBackground('notification-id-here');
```

## Testing

### 1. Subscribe to Push Notifications
```javascript
// In browser console
navigator.serviceWorker.ready.then(async (registration) => {
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: 'your-vapid-public-key'
  });
  console.log('Subscribed:', subscription);
});
```

### 2. Process an Email
- Go to Admin → Emails
- Click "Process" on an unprocessed email
- Check server logs for push notification sending

### 3. Verify Push Received
- Push notification should appear immediately
- Check browser notification center
- Check service worker logs

## Troubleshooting

### Push Not Received

1. **Check Subscription**
   ```javascript
   navigator.serviceWorker.ready.then(reg => {
     reg.pushManager.getSubscription().then(sub => {
       console.log('Subscription:', sub ? 'Active' : 'Not subscribed');
     });
   });
   ```

2. **Check Environment Variables**
   - Verify `PUSH_INTERNAL_SECRET` is set in Vercel
   - Verify VAPID keys are configured
   - Verify `NEXT_PUBLIC_APP_URL` matches your domain

3. **Check Server Logs**
   - Look for `[sendPushNotificationForTransaction]` logs
   - Look for `[send-push-internal]` logs
   - Check for errors in PushManager

4. **Check Browser Support**
   - Chrome/Edge: ✅ Full support
   - Firefox: ✅ Full support
   - Safari macOS: ⚠️ Limited support
   - Safari iOS: ❌ No support

## Benefits

✅ **No Polling** - Eliminates constant API calls  
✅ **Instant** - Push sent immediately after transaction  
✅ **Works Offline** - Notifications delivered even when browser closed  
✅ **Multi-Device** - Push sent to all subscribed devices  
✅ **Scalable** - Server-side sending is more efficient  
✅ **Reliable** - Web Push API is battle-tested  

## Limitations

❌ **Safari iOS** - No Web Push support (yet)  
❌ **HTTPS Required** - Web Push only works on HTTPS  
❌ **User Must Subscribe** - Can't send without subscription  
❌ **Service Worker Required** - Must have `/sw.js` registered  

## Next Steps

- [ ] Add `PUSH_INTERNAL_SECRET` to Vercel environment variables
- [ ] Test push notifications on production
- [ ] Monitor server logs for push sending
- [ ] Add push notification analytics
- [ ] Add user preferences for notification types

