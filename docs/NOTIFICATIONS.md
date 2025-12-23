# 🔔 Notifications Guide

Finance Buddy uses a two-tier notification system to keep you updated on your finances: In-App Notifications and Self-Hosted Web Push Notifications.

## Table of Contents
1. [Overview](#overview)
2. [Notification Types](#notification-types)
3. [Push Notification Setup](#push-notification-setup)
4. [Testing & Verification](#testing--verification)
5. [Architecture](#architecture)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)

---

## Overview

- **In-App Notifications**: Displayed within the application UI. Best for immediate feedback while the app is open.
- **Push Notifications**: Delivered to your device via the browser even when the app is closed. Requires user permission and PWA installation (on iOS).

---

## Notification Types

| Type | Trigger | Channels |
| :--- | :--- | :--- |
| **Transaction Detected** | New transaction extracted from email. | In-App, Push |
| **Sync Complete** | Background email sync finished. | In-App, Push |
| **Connection Error** | Gmail token expired or account disconnected. | In-App, Push |
| **Budget Alert** | Spending exceeds a defined threshold (Coming Soon). | Push |

---

## Push Notification Setup

To enable push notifications, several environment variables must be configured in Vercel.

### Required Environment Variables
| Variable | Description | Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public key for browser subscription. | `BCcx7G...L8` |
| `VAPID_PRIVATE_KEY` | Private key for server signing. | `pgiVr3...5U` |
| `VAPID_SUBJECT` | Contact email for push services. | `mailto:user@example.com` |
| `PUSH_INTERNAL_SECRET` | Secret for server-to-server API calls. | `tiMaMH...ig=` |

### Enabling in the App
1. Login to Finance Buddy.
2. Navigate to **Settings**.
3. Scroll to the **Push Notifications** section.
4. Click **Enable Notifications** and allow the browser permission.

---

## Testing & Verification

### 1. Manual Test via Console
You can trigger a test notification from the browser console (F12):
```javascript
fetch('/api/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    payload: {
      title: 'Hello Finance Buddy!',
      body: 'If you see this, push is working!',
      url: '/transactions'
    }
  })
});
```

### 2. cURL Example (Server-to-Server)
```bash
curl -X POST https://your-app.vercel.app/api/push/send \
  -H "Authorization: Bearer YOUR_INTERNAL_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "TARGET_USER_UUID",
    "payload": {
      "title": "Alert",
      "body": "Server-side trigger successful."
    }
  }'
```

---

## Architecture

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Server
    participant DB
    participant PushService as Browser Push Service (FCM/Apple)

    User->>Browser: Enable Notifications
    Browser->>Server: POST /api/push/subscribe
    Server->>DB: Store Subscription
    
    Server->>DB: Activity (e.g. New Transaction)
    Server->>Server: Trigger Notification
    Server->>PushService: Send Push (VAPID Signed)
    PushService->>Browser: Deliver Notification
    Browser->>User: Show Alert
```

---

## API Reference

### `POST /api/push/subscribe`
Registers a new device subscription.
- **Body**: `PushSubscription` object from the browser.

### `POST /api/push/send`
Sends a notification to a specific user.
- **Auth**: Bearer Token (`PUSH_INTERNAL_SECRET`) or Session.
- **Body**: `{ userId: string, payload: PushPayload }`.

---

## Troubleshooting

- **"Permission Denied"**: Reset site permissions in your browser settings.
- **Notifications not showing on iOS?**: You must "Add to Home Screen" first; push only works on PWAs for iOS.
- **401 Unauthorized**: Double check your `PUSH_INTERNAL_SECRET` matches on both sides.
