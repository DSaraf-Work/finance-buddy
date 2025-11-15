# Push Notification Flow - Complete Technical Documentation

## Overview
This document explains the complete end-to-end flow of how push notifications are triggered when an email is processed in Finance Buddy.

## Notification ID: 322867ab-cef0-4f03-8602-eff770d567d3

### Notification Details
- **Title**: 💸 Payment to BHARATH
- **Subtitle**: Debit of INR 303.00
- **Body**: Tap to view and edit transaction details
- **URL**: /transactions/edit/14b1d6c4-42e3-4155-8a18-9a971aef9652
- **Type**: transaction_created
- **Created**: 2025-11-15 08:01:53.302731+00
- **Read**: false
- **User ID**: 19ebbae0-475b-4043-85f9-438cd07c3677

### Transaction Details (from metadata)
- **Transaction ID**: 14b1d6c4-42e3-4155-8a18-9a971aef9652
- **Merchant**: BHARATH
- **Amount**: INR 303.00
- **Direction**: debit
- **Category**: other

---

## Complete Push Notification Flow

### Step 1: Email Processing
When an email is processed and a transaction is extracted:

```
User/System → POST /api/emails/process
              ↓
         Extract transaction data using AI
              ↓
         INSERT INTO fb_emails_processed
```

### Step 2: Database Trigger Fires
**Trigger**: `trigger_notify_transaction_created`
- **Event**: AFTER INSERT on `fb_emails_processed`
- **Timing**: Fires immediately after row is inserted
- **Function**: `notify_transaction_created()`

### Step 3: Notification Creation (Database Function)
The `notify_transaction_created()` function executes:

```sql
CREATE OR REPLACE FUNCTION public.notify_transaction_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  notification_title TEXT;
  notification_subtitle TEXT;
  notification_url TEXT;
  merchant_name TEXT;
  amount_text TEXT;
BEGIN
  -- Get merchant name and format amount
  merchant_name := COALESCE(NEW.merchant_name, 'Unknown Merchant');
  amount_text := COALESCE(NEW.currency, 'INR') || ' ' || COALESCE(NEW.amount::TEXT, '0');
  
  -- Create notification title based on direction
  IF NEW.direction = 'debit' THEN
    notification_title := '💸 Payment to ' || merchant_name;
    notification_subtitle := 'Debit of ' || amount_text;
  ELSIF NEW.direction = 'credit' THEN
    notification_title := '💰 Payment from ' || merchant_name;
    notification_subtitle := 'Credit of ' || amount_text;
  ELSE
    notification_title := '💳 New Transaction';
    notification_subtitle := amount_text || ' - ' || merchant_name;
  END IF;
  
  -- Create notification URL
  notification_url := '/transactions/edit/' || NEW.id::TEXT;
  
  -- Insert notification
  INSERT INTO fb_notifications (
    user_id,
    title,
    subtitle,
    body,
    url,
    type,
    metadata
  ) VALUES (
    NEW.user_id,
    notification_title,
    notification_subtitle,
    'Tap to view and edit transaction details',
    notification_url,
    'transaction_created',
    jsonb_build_object(
      'transaction_id', NEW.id,
      'merchant_name', merchant_name,
      'amount', NEW.amount,
      'currency', NEW.currency,
      'direction', NEW.direction,
      'category', NEW.category
    )
  );
  
  RETURN NEW;
END;
$function$
```

**What this does**:
1. Extracts merchant name and amount from the new `fb_emails_processed` row
2. Formats the notification title based on transaction direction (debit/credit)
3. Creates a notification subtitle with the amount
4. Generates a URL to edit the transaction
5. **Inserts a new row into `fb_notifications` table**
6. Stores transaction metadata in JSONB format

### Step 4: Notification Stored in Database
A new row is created in `fb_notifications`:
- ✅ Notification is persisted in the database
- ✅ `read` field is set to `false` by default
- ✅ `created_at` timestamp is recorded
- ✅ All metadata is stored for reference

---

## Frontend Push Notification Flow

### Step 5: Frontend Polling (useNotifications Hook)
The `useNotifications` hook runs in the browser:

```typescript
// Polls every 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    checkForNewNotifications();
  }, 30000); // 30 seconds
  
  return () => clearInterval(interval);
}, []);
```

### Step 6: API Call to Fetch Notifications
```typescript
const res = await fetch(`/api/notifications?limit=10`);
const data: Notification[] = await res.json();
```

**API Endpoint**: `GET /api/notifications`
- Uses `supabaseAdmin` (service role) to bypass RLS
- Fetches last 10 notifications for the user
- Returns notifications ordered by `created_at DESC`

### Step 7: Detect New Notifications
```typescript
const newNotifications = data.filter(
  n => new Date(n.created_at) > lastChecked && !n.read
);
```

**Detection Logic**:
- Compares notification `created_at` with `lastChecked` timestamp
- Only shows notifications that are:
  - Created AFTER the last check
  - Not yet read (`read === false`)

### Step 8: Show Browser Push Notification
```typescript
for (const notification of newNotifications) {
  await showBrowserNotification(notification.title, {
    body: notification.subtitle || notification.body,
    tag: notification.id,
    data: {
      url: notification.url,
      notificationId: notification.id,
    },
    requireInteraction: true,
  });
}
```

### Step 9: Browser Notification API
```typescript
// Check permission
if (Notification.permission !== 'granted') {
  return; // Cannot show notification
}

// Try service worker first
const registration = await navigator.serviceWorker.register('/sw.js');
await registration.showNotification(title, options);

// Fallback to browser Notification API
new Notification(title, options);
```

---

## Why Push Notification May Not Show

### 1. ❌ Browser Permission Denied
- User hasn't granted notification permission
- Permission was previously denied
- **Fix**: User must manually grant permission in browser settings

### 2. ❌ Polling Timing Issue
- Notification created at 08:01:53
- Last poll at 08:01:30
- Next poll at 08:02:00
- **Result**: 7-second delay before notification shows

### 3. ❌ lastChecked Timestamp Issue
- `lastChecked` initialized when page loads
- If page loaded AFTER notification was created
- Notification won't be detected as "new"
- **Fix**: Refresh page or wait for next transaction

### 4. ❌ Service Worker Not Registered
- Service worker fails to register
- Falls back to browser Notification API
- May not work in all browsers
- **Fix**: Check browser console for service worker errors

### 5. ❌ Tab Not Active
- Some browsers suppress notifications for inactive tabs
- **Fix**: Keep tab active or use service worker

### 6. ❌ Browser Doesn't Support Notifications
- Old browsers may not support Notification API
- **Fix**: Use modern browser (Chrome, Firefox, Edge, Safari)

---

## Summary for Notification 322867ab-cef0-4f03-8602-eff770d567d3

✅ **Database Side**: WORKING
- Notification was successfully created in `fb_notifications`
- Trigger fired correctly
- All data is properly formatted

❓ **Frontend Side**: UNKNOWN (Need to check logs)
- Did the API successfully return the notification?
- Was the notification detected as "new"?
- Did browser permission allow the push?
- Did the service worker show the notification?

**Next Step**: Check browser console logs to see where the flow breaks.

---

## NEW: Server-Side Push Notifications (2025-11-15)

### Overview
Push notifications are now sent **directly from the server** when a transaction is created, eliminating the need for browser polling. This means users receive notifications **even when their browser is closed**.

### How It Works

#### Step 1: Email Processing
```
User/System → POST /api/emails/process
              ↓
         Extract transaction data using AI
              ↓
         INSERT INTO fb_emails_processed
```

#### Step 2: Database Trigger Creates Notification
```
TRIGGER: trigger_notify_transaction_created (AFTER INSERT)
              ↓
FUNCTION: notify_transaction_created()
              ↓
INSERT INTO fb_notifications
```

#### Step 3: Server Sends Push Notification (NEW!)
```
EmailProcessor.saveTransaction()
              ↓
Wait 500ms for trigger to complete
              ↓
Find notification by transaction_id
              ↓
Call sendPushInBackground(notificationId)
              ↓
POST /api/notifications/send-push-internal
              ↓
PushManager.sendToUser(userId, payload)
              ↓
Send Web Push to all user devices
              ↓
User receives push (even if browser closed!)
```

### Architecture

#### Components

1. **EmailProcessor** (`src/lib/email-processing/processor.ts`)
   - Saves transaction to `fb_emails_processed`
   - Waits 500ms for database trigger to create notification
   - Calls `sendPushNotificationForTransaction()`

2. **Send Push Helper** (`src/lib/notifications/send-push-helper.ts`)
   - `sendPushForNotification()` - Send push for a notification ID
   - `sendPushDirect()` - Send push with direct data
   - `sendPushInBackground()` - Fire and forget push sending

3. **Internal API** (`src/pages/api/notifications/send-push-internal.ts`)
   - Authenticated with `PUSH_INTERNAL_SECRET`
   - Fetches notification from database
   - Uses `PushManager` to send Web Push

4. **PushManager** (`src/lib/push/push-manager.ts`)
   - Manages push subscriptions
   - Sends Web Push notifications using VAPID
   - Handles multiple devices per user

### Configuration Required

#### Environment Variables
```bash
# Internal API secret for server-to-server calls
PUSH_INTERNAL_SECRET=your-secret-key-here

# VAPID keys for Web Push (already configured)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:your-email@example.com

# App URL for internal API calls
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

#### User Requirements
1. User must grant notification permission in browser
2. User must subscribe to push notifications (handled automatically)
3. Service worker must be registered (`/sw.js`)

### Code Flow

```typescript
// 1. EmailProcessor saves transaction
const transactionId = await this.saveTransaction(email, transactionData);

// 2. Wait for database trigger to create notification
await new Promise(resolve => setTimeout(resolve, 500));

// 3. Find the notification
const { data: notification } = await supabaseAdmin
  .from('fb_notifications')
  .select('id')
  .eq('metadata->>transaction_id', transactionId)
  .single();

// 4. Send push in background
sendPushInBackground(notification.id);

// 5. Internal API sends Web Push
const result = await PushManager.sendToUser(userId, {
  title: '💸 Payment to BHARATH',
  body: 'Debit of INR 303.00',
  icon: '/icon-192x192.png',
  data: { url: '/transactions/edit/...' }
});
```

### Benefits

✅ **No Polling Required** - Eliminates 30-second polling interval
✅ **Instant Notifications** - Push sent immediately after transaction creation
✅ **Works When Browser Closed** - Web Push API delivers to all devices
✅ **Reduced Server Load** - No constant API polling
✅ **Better User Experience** - Real-time notifications
✅ **Multi-Device Support** - Push sent to all subscribed devices

### Testing

1. **Subscribe to Push Notifications**
   - Open app in browser
   - Grant notification permission
   - Service worker automatically subscribes

2. **Process an Email**
   - Go to Admin → Emails
   - Click "Process" on an unprocessed email
   - Transaction is created

3. **Receive Push Notification**
   - Push notification appears immediately
   - Works even if browser tab is closed
   - Works even if browser is closed (on supported platforms)

### Troubleshooting

#### Push Not Received

1. **Check Subscription**
   ```javascript
   // In browser console
   navigator.serviceWorker.ready.then(reg => {
     reg.pushManager.getSubscription().then(sub => {
       console.log('Subscription:', sub);
     });
   });
   ```

2. **Check Environment Variables**
   - Verify `PUSH_INTERNAL_SECRET` is set
   - Verify VAPID keys are configured
   - Verify `NEXT_PUBLIC_APP_URL` is correct

3. **Check Server Logs**
   - Look for `[sendPushNotificationForTransaction]` logs
   - Look for `[send-push-internal]` logs
   - Check for errors in PushManager

4. **Check Browser Support**
   - Chrome/Edge: Full support
   - Firefox: Full support
   - Safari: Limited support (macOS only)
   - Mobile browsers: Varies by platform

### Limitations

❌ **Safari iOS** - No Web Push support (yet)
❌ **Requires HTTPS** - Web Push only works on HTTPS
❌ **User Must Subscribe** - Can't send push without subscription
❌ **Service Worker Required** - Must have `/sw.js` registered

### Future Improvements

- [ ] Add retry logic for failed push sends
- [ ] Add push notification analytics
- [ ] Add push notification preferences (per category)
- [ ] Add push notification scheduling
- [ ] Add push notification batching
- [ ] Add fallback to email notifications if push fails

