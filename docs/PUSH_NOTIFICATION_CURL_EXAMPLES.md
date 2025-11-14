# Push Notification cURL Examples

## 📋 **Overview**

This document provides ready-to-use cURL commands for sending push notifications to Finance Buddy users.

---

## 🔑 **Authentication**

All push notification endpoints require authentication. You can authenticate using:

1. **Session Cookie** (for logged-in users)
2. **Authorization Header** (for external services)

---

## 🧪 **Test Notification (Logged-in Users)**

### Endpoint
```
POST /api/push/send-test
```

### Description
Sends a test notification to the currently logged-in user.

### cURL Command
```bash
curl -X POST https://finance-buddy-sand.vercel.app/api/push/send-test \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-ewvzppahjocjpipaywlg-auth-token=YOUR_AUTH_TOKEN'
```

### Response
```json
{
  "success": true,
  "message": "Test notification sent to 1 device(s)",
  "result": {
    "successCount": 1,
    "failureCount": 0,
    "results": [...]
  }
}
```

---

## 📤 **Send Custom Notification (External Services)**

### Endpoint
```
POST /api/push/send
```

### Description
Sends a custom push notification to a specific user. Requires authentication.

### cURL Command (with Session Cookie)
```bash
curl -X POST https://finance-buddy-sand.vercel.app/api/push/send \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-ewvzppahjocjpipaywlg-auth-token=YOUR_AUTH_TOKEN' \
  -d '{
    "title": "New Transaction Detected",
    "body": "A new transaction of $50.00 was detected from your email",
    "url": "/transactions",
    "icon": "/icon-192x192.png",
    "badge": "/icon-72x72.png",
    "actions": [
      {
        "action": "view",
        "title": "View Transaction"
      },
      {
        "action": "dismiss",
        "title": "Dismiss"
      }
    ]
  }'
```

### cURL Command (with Authorization Header)
```bash
curl -X POST https://finance-buddy-sand.vercel.app/api/push/send \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_INTERNAL_SECRET' \
  -d '{
    "userId": "19ebbae0-475b-4043-85f9-438cd07c3677",
    "payload": {
      "title": "Email Sync Complete",
      "body": "Successfully synced 10 new emails",
      "icon": "/icon-192x192.png",
      "badge": "/icon-72x72.png",
      "data": {
        "url": "/emails",
        "emailCount": 10
      }
    }
  }'
```

### Request Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | No | User ID (defaults to authenticated user) |
| `title` | string | Yes | Notification title |
| `body` | string | Yes | Notification body text |
| `icon` | string | No | Icon URL (default: `/icon-192x192.png`) |
| `badge` | string | No | Badge URL (default: `/icon-72x72.png`) |
| `url` | string | No | URL to open when clicked (default: `/`) |
| `data` | object | No | Custom data to include |
| `actions` | array | No | Notification actions |

### Response
```json
{
  "success": true,
  "message": "Notification sent to 1 device(s)",
  "result": {
    "successCount": 1,
    "failureCount": 0,
    "results": [...]
  }
}
```

---

## 🔧 **How to Get Your Auth Token**

### Method 1: Browser DevTools
1. Open Finance Buddy in your browser
2. Log in with your credentials
3. Open DevTools (F12)
4. Go to **Application** → **Cookies**
5. Find `sb-ewvzppahjocjpipaywlg-auth-token`
6. Copy the value

### Method 2: Console
```javascript
document.cookie.split('; ').find(row => row.startsWith('sb-ewvzppahjocjpipaywlg-auth-token='))?.split('=')[1]
```

---

## 📝 **Common Use Cases**

### 1. Transaction Notification
```bash
curl -X POST https://finance-buddy-sand.vercel.app/api/push/send \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-ewvzppahjocjpipaywlg-auth-token=YOUR_AUTH_TOKEN' \
  -d '{
    "title": "💰 New Transaction",
    "body": "Spent $25.50 at Starbucks",
    "url": "/transactions"
  }'
```

### 2. Email Sync Notification
```bash
curl -X POST https://finance-buddy-sand.vercel.app/api/push/send \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-ewvzppahjocjpipaywlg-auth-token=YOUR_AUTH_TOKEN' \
  -d '{
    "title": "📧 Email Sync Complete",
    "body": "Synced 5 new financial emails",
    "url": "/emails"
  }'
```

### 3. Error Notification
```bash
curl -X POST https://finance-buddy-sand.vercel.app/api/push/send \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-ewvzppahjocjpipaywlg-auth-token=YOUR_AUTH_TOKEN' \
  -d '{
    "title": "⚠️ Sync Error",
    "body": "Failed to sync emails. Please check your connection.",
    "url": "/settings"
  }'
```

---

## ✅ **Testing Checklist**

- [ ] Enable push notifications in Finance Buddy settings
- [ ] Get your auth token from browser cookies
- [ ] Test with `/api/push/send-test` endpoint first
- [ ] Verify notification appears on your device
- [ ] Test custom notifications with `/api/push/send`
- [ ] Check notification actions work correctly

---

## 🚨 **Troubleshooting**

### "No active push subscriptions found"
- Enable push notifications in Finance Buddy settings first
- Click the "Enable Notifications" button
- Allow browser permission when prompted

### "Unauthorized" or "403 Forbidden"
- Check your auth token is correct
- Make sure you're logged in
- Token may have expired - log in again

### "Failed to send notification"
- Check the user has enabled push notifications
- Verify the user ID is correct
- Check Supabase logs for detailed errors

---

## 📚 **Related Documentation**

- [Push Notifications Setup Guide](./PUSH_NOTIFICATIONS_SETUP_GUIDE.md)
- [Push Notifications Quick Start](./PUSH_NOTIFICATIONS_QUICK_START.md)
- [Push Notifications API Reference](./PUSH_NOTIFICATIONS_API.md)

