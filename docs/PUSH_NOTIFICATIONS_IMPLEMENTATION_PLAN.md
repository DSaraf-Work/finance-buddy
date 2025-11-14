# 🏗️ Self-Hosted Web Push Architecture & Implementation Plan

## 📐 Architecture Diagrams

### **1. System Architecture Overview**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FINANCE BUDDY PWA                                │
│                     Self-Hosted Web Push System                          │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│   User Triggers      │         │  Server Triggers     │
│   Notification       │         │  (External API)      │
│   (e.g., manual sync)│         │  (e.g., auto-sync,   │
│                      │         │   cron jobs, webhooks)│
└──────────┬───────────┘         └──────────┬───────────┘
           │                                 │
           └─────────────┬───────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        SERVER SIDE (Next.js API)                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ 1. Create In-App Notification                                  │    │
│  │    POST /api/notifications (existing)                          │    │
│  │    ↓                                                            │    │
│  │    Store in fb_notifications (if table exists)                 │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ 2. Trigger Push Notification                                   │    │
│  │    Internal: sendPushNotification(userId, payload)             │    │
│  │    ↓                                                            │    │
│  │    Query fb_push_subscriptions WHERE user_id = userId          │    │
│  │    ↓                                                            │    │
│  │    For each subscription:                                      │    │
│  │      web-push.sendNotification(subscription, payload)          │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────┬───────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    BROWSER PUSH SERVICES                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │   Chrome     │  │   Firefox    │  │   Safari     │                 │
│  │   FCM        │  │   Mozilla    │  │   APNs       │                 │
│  │   Push       │  │   Push       │  │   (iOS 16.4+)│                 │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                 │
│         │                  │                  │                         │
└─────────┼──────────────────┼──────────────────┼─────────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      CLIENT SIDE (PWA)                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ Service Worker (sw.js)                                         │    │
│  │                                                                 │    │
│  │  addEventListener('push', (event) => {                         │    │
│  │    const data = event.data.json();                             │    │
│  │    self.registration.showNotification(data.title, {            │    │
│  │      body: data.body,                                          │    │
│  │      icon: '/icons/icon-192x192.png',                          │    │
│  │      badge: '/icons/icon-72x72.png',                           │    │
│  │      data: { url: data.url }                                   │    │
│  │    });                                                          │    │
│  │  });                                                            │    │
│  │                                                                 │    │
│  │  addEventListener('notificationclick', (event) => {             │    │
│  │    event.notification.close();                                 │    │
│  │    clients.openWindow(event.notification.data.url);            │    │
│  │  });                                                            │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ Client App (React)                                             │    │
│  │                                                                 │    │
│  │  1. Request Permission                                         │    │
│  │     Notification.requestPermission()                           │    │
│  │                                                                 │    │
│  │  2. Subscribe to Push                                          │    │
│  │     registration.pushManager.subscribe({                       │    │
│  │       userVisibleOnly: true,                                   │    │
│  │       applicationServerKey: VAPID_PUBLIC_KEY                   │    │
│  │     })                                                          │    │
│  │                                                                 │    │
│  │  3. Send Subscription to Server                                │    │
│  │     POST /api/push/subscribe                                   │    │
│  │     { endpoint, keys: { p256dh, auth } }                       │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### **2. Database Schema**

```
┌─────────────────────────────────────────────────────────────────┐
│                    fb_push_subscriptions                        │
├─────────────────────────────────────────────────────────────────┤
│ id                UUID PRIMARY KEY                              │
│ user_id           UUID NOT NULL → auth.users(id)               │
│ endpoint          TEXT NOT NULL (unique push endpoint)          │
│ keys              JSONB NOT NULL { p256dh, auth }               │
│ expiration_time   BIGINT (optional, from browser)               │
│ created_at        TIMESTAMPTZ NOT NULL                          │
│ updated_at        TIMESTAMPTZ NOT NULL                          │
│                                                                  │
│ UNIQUE(endpoint)  -- One subscription per device                │
│ INDEX(user_id)    -- Fast lookup by user                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              fb_notifications (if exists)                       │
├─────────────────────────────────────────────────────────────────┤
│ id                UUID PRIMARY KEY                              │
│ user_id           UUID NOT NULL                                 │
│ type              TEXT NOT NULL                                 │
│ title             TEXT NOT NULL                                 │
│ message           TEXT NOT NULL                                 │
│ transaction_id    UUID (optional)                               │
│ email_id          UUID (optional)                               │
│ action_url        TEXT (optional)                               │
│ action_label      TEXT (optional)                               │
│ read              BOOLEAN DEFAULT false                         │
│ read_at           TIMESTAMPTZ                                   │
│ created_at        TIMESTAMPTZ NOT NULL                          │
│ updated_at        TIMESTAMPTZ NOT NULL                          │
└─────────────────────────────────────────────────────────────────┘

Relationship:
- One user can have multiple push subscriptions (multi-device)
- One notification can trigger multiple push messages (one per device)
```

---

### **3. API Flow Diagram**

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SUBSCRIPTION FLOW                              │
└─────────────────────────────────────────────────────────────────────┘

Client (PWA)                    Server (Next.js API)              Database
     │                                  │                              │
     │ 1. GET /api/push/vapid-public-key│                              │
     ├─────────────────────────────────>│                              │
     │                                  │                              │
     │<─────────────────────────────────┤                              │
     │  { publicKey: "BN..." }          │                              │
     │                                  │                              │
     │ 2. Request Permission            │                              │
     │    Notification.requestPermission()                             │
     │                                  │                              │
     │ 3. Subscribe to Push             │                              │
     │    pushManager.subscribe()       │                              │
     │                                  │                              │
     │ 4. POST /api/push/subscribe      │                              │
     │    { endpoint, keys }            │                              │
     ├─────────────────────────────────>│                              │
     │                                  │ 5. Validate subscription     │
     │                                  │                              │
     │                                  │ 6. INSERT INTO               │
     │                                  │    fb_push_subscriptions     │
     │                                  ├─────────────────────────────>│
     │                                  │                              │
     │                                  │<─────────────────────────────┤
     │<─────────────────────────────────┤                              │
     │  { success: true }               │                              │
     │                                  │                              │


┌─────────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION TRIGGER FLOW                        │
│                  (User-Triggered & Server-Triggered)                │
└─────────────────────────────────────────────────────────────────────┘

OPTION A: User-Triggered (e.g., Manual Sync)
─────────────────────────────────────────────

User Action                Server (Next.js API)              Database
     │                            │                              │
     │ 1. User clicks "Sync"      │                              │
     │    POST /api/gmail/sync    │                              │
     ├───────────────────────────>│                              │
     │                            │ 2. Fetch emails from Gmail   │
     │                            │                              │
     │                            │ 3. Extract transactions      │
     │                            │                              │
     │                            │ 4. Create in-app notification│
     │                            ├─────────────────────────────>│
     │                            │                              │
     │                            │ 5. Trigger push notification │
     │                            │    PushManager.sendToUser()  │
     │                            │                              │
     │                            │ 6. Query push subscriptions  │
     │                            ├─────────────────────────────>│
     │                            │<─────────────────────────────┤
     │                            │  [subscription1, subscription2]
     │                            │                              │
     │                            │ 7. Send to browser services  │
     │                            ├──────────────────────────────────>
     │                            │        Browser Push Service  │
     │                            │<──────────────────────────────────
     │<───────────────────────────┤                              │
     │  { success: true }         │                              │
     │                            │                              │


OPTION B: Server-Triggered (e.g., Auto-Sync, Cron, Webhooks)
──────────────────────────────────────────────────────────────

External Trigger           Server (Next.js API)              Database
     │                            │                              │
     │ 1. Cron job triggers       │                              │
     │    POST /api/cron/auto-sync│                              │
     ├───────────────────────────>│                              │
     │    OR                      │                              │
     │ 1. Webhook from external   │                              │
     │    service (e.g., Gmail)   │                              │
     ├───────────────────────────>│                              │
     │                            │ 2. Authenticate request      │
     │                            │    (verify cron secret)      │
     │                            │                              │
     │                            │ 3. Get all active users      │
     │                            ├─────────────────────────────>│
     │                            │<─────────────────────────────┤
     │                            │  [user1, user2, ...]         │
     │                            │                              │
     │                            │ 4. For each user:            │
     │                            │    - Fetch new emails        │
     │                            │    - Extract transactions    │
     │                            │    - Create notification     │
     │                            ├─────────────────────────────>│
     │                            │                              │
     │                            │ 5. For each user with new txn:│
     │                            │    PushManager.sendToUser()  │
     │                            │                              │
     │                            │ 6. Query push subscriptions  │
     │                            ├─────────────────────────────>│
     │                            │<─────────────────────────────┤
     │                            │  [subscriptions per user]    │
     │                            │                              │
     │                            │ 7. Send to browser services  │
     │                            ├──────────────────────────────────>
     │                            │        Browser Push Service  │
     │                            │<──────────────────────────────────
     │<───────────────────────────┤                              │
     │  { success: true,          │                              │
     │    notified: 3 users }     │                              │
     │                            │                              │


┌─────────────────────────────────────────────────────────────────────┐
│                    PUSH DELIVERY FLOW                               │
└─────────────────────────────────────────────────────────────────────┘

Browser Push Service    Service Worker (sw.js)      Client App
         │                      │                        │
         │ 1. Push Event        │                        │
         ├─────────────────────>│                        │
         │                      │ 2. Extract payload     │
         │                      │                        │
         │                      │ 3. Show Notification   │
         │                      │    self.registration   │
         │                      │    .showNotification() │
         │                      │                        │
         │                      │ ┌──────────────────┐  │
         │                      │ │  Notification    │  │
         │                      │ │  "New Transaction"  │
         │                      │ │  ₹500 at Starbucks │
         │                      │ └──────────────────┘  │
         │                      │                        │
         │                      │ 4. User clicks         │
         │                      │<───────────────────────┤
         │                      │                        │
         │                      │ 5. Open URL            │
         │                      │    clients.openWindow()│
         │                      ├───────────────────────>│
         │                      │                        │
         │                      │                        │ App opens
         │                      │                        │ /transactions/123
```

---

### **4. Component Architecture**

```
┌─────────────────────────────────────────────────────────────────────┐
│                      FILE STRUCTURE                                 │
└─────────────────────────────────────────────────────────────────────┘

finance-buddy/
│
├── src/
│   ├── lib/
│   │   └── push/
│   │       ├── push-manager.ts          # Core push logic
│   │       ├── push-types.ts            # TypeScript types
│   │       ├── notification-helpers.ts  # Helper functions (NEW)
│   │       └── vapid-keys.ts            # VAPID key utilities
│   │
│   ├── components/
│   │   └── PushNotificationPrompt.tsx   # UI for permission request
│   │
│   ├── hooks/
│   │   └── usePushNotifications.ts      # React hook for push
│   │
│   └── pages/
│       └── api/
│           ├── push/
│           │   ├── subscribe.ts          # POST - Save subscription
│           │   ├── unsubscribe.ts        # POST - Remove subscription
│           │   ├── vapid-public-key.ts   # GET - Get public key
│           │   ├── send.ts               # POST - Send push (with auth)
│           │   └── send-bulk.ts          # POST - Bulk send (NEW)
│           │
│           ├── cron/
│           │   └── gmail-auto-sync.ts    # Cron job example (NEW)
│           │
│           └── webhooks/
│               └── gmail-notification.ts # Webhook example (NEW)
│
├── public/
│   └── sw.js                             # Service Worker (updated)
│
└── .env.local
    ├── VAPID_PUBLIC_KEY=BN...
    ├── VAPID_PRIVATE_KEY=...
    ├── VAPID_SUBJECT=mailto:...
    └── PUSH_INTERNAL_SECRET=...          # For server-triggered (NEW)


┌─────────────────────────────────────────────────────────────────────┐
│                    MODULE DEPENDENCIES                              │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   PushManager        │  ← Core business logic
│   (src/lib/push/)    │
└──────────┬───────────┘
           │
           ├─────> web-push (npm package)
           ├─────> supabaseAdmin (database)
           └─────> VAPID keys (env vars)

┌──────────────────────┐
│   API Routes         │  ← HTTP endpoints
│   (src/pages/api/)   │
└──────────┬───────────┘
           │
           └─────> PushManager

┌──────────────────────┐
│   React Hook         │  ← Client-side logic
│   (usePushNotif...)  │
└──────────┬───────────┘
           │
           ├─────> Service Worker API
           ├─────> Fetch API (call endpoints)
           └─────> React state management

┌──────────────────────┐
│   Service Worker     │  ← Background worker
│   (public/sw.js)     │
└──────────┬───────────┘
           │
           ├─────> Push API (browser)
           └─────> Notification API (browser)
```


---

## 🎯 Notification Trigger Types

### **User-Triggered Notifications**
Notifications sent in response to direct user actions:

| Trigger | Example | When to Use |
|---------|---------|-------------|
| **Manual Sync** | User clicks "Sync Emails" | Immediate feedback on user action |
| **Transaction Creation** | User manually adds transaction | Confirmation of successful action |
| **Settings Update** | User changes preferences | Acknowledge setting changes |
| **Export Complete** | User exports data | Long-running task completion |
| **Connection Success** | User connects Gmail account | Confirm successful integration |

**Characteristics:**
- ✅ Immediate response expected
- ✅ User is actively using the app
- ✅ High engagement context
- ✅ Can show in-app + push notification

---

### **Server-Triggered Notifications**
Notifications sent by automated backend processes:

| Trigger | Example | When to Use |
|---------|---------|-------------|
| **Auto-Sync** | Cron job runs every 15 minutes | Background data synchronization |
| **Scheduled Reports** | Daily/weekly summary | Periodic updates |
| **Budget Alerts** | Spending threshold exceeded | Proactive monitoring |
| **Payment Reminders** | Bill due in 3 days | Time-based reminders |
| **Anomaly Detection** | Unusual transaction detected | Security/fraud alerts |
| **Webhooks** | External service triggers event | Real-time integrations |

**Characteristics:**
- ✅ User may not be using the app
- ✅ Asynchronous processing
- ✅ Batch operations possible
- ✅ Requires authentication/authorization

---

### **Notification Priority Levels**

Implement different urgency levels for notifications:

```typescript
export enum NotificationPriority {
  LOW = 'low',           // Daily summaries, tips
  NORMAL = 'normal',     // Transaction updates, sync complete
  HIGH = 'high',         // Budget alerts, payment reminders
  URGENT = 'urgent',     // Security alerts, fraud detection
}

// Usage in push payload
await PushManager.sendToUser(userId, {
  title: 'Security Alert',
  body: 'Unusual transaction detected',
  icon: '/icons/icon-192x192.png',
  badge: '/icons/icon-72x72.png',
  url: '/security',
  data: {
    priority: NotificationPriority.URGENT,
    requireInteraction: true, // Don't auto-dismiss
  },
});
```

---

### **Common Use Cases**

#### **1. Transaction Extraction (User-Triggered)**
```typescript
// User clicks "Sync" → Extract transactions → Notify
await NotificationHelpers.notifyTransaction(userId, {
  id: txnId,
  amount: 500,
  merchant: 'Starbucks',
  type: 'debit',
});
```

#### **2. Auto-Sync (Server-Triggered)**
```typescript
// Cron job runs every 15 min → Check all users → Notify if new data
// File: /api/cron/auto-sync
for (const user of activeUsers) {
  const newTxns = await syncUser(user.id);
  if (newTxns.length > 0) {
    await NotificationHelpers.notifySyncComplete(user.id, newTxns.length);
  }
}
```

#### **3. Budget Alert (Server-Triggered)**
```typescript
// Daily cron → Check budgets → Notify if exceeded
const usersOverBudget = await checkBudgets();
await NotificationHelpers.notifyMultipleUsers(
  usersOverBudget.map(u => ({
    userId: u.id,
    title: 'Budget Alert',
    body: `You've spent ₹${u.spent} of ₹${u.budget}`,
    url: '/budget',
  }))
);
```

#### **4. Payment Reminder (Server-Triggered)**
```typescript
// Daily cron → Check upcoming payments → Notify
const upcomingPayments = await getUpcomingPayments(3); // 3 days
for (const payment of upcomingPayments) {
  await PushManager.sendToUser(payment.userId, {
    title: 'Payment Reminder',
    body: `${payment.name} due in ${payment.daysUntil} days`,
    url: `/payments/${payment.id}`,
  });
}
```

#### **5. Real-Time Webhook (Server-Triggered)**
```typescript
// Gmail webhook → New email → Extract → Notify immediately
// File: /api/webhooks/gmail
const transaction = await extractFromEmail(emailId);
await PushManager.sendToUser(userId, {
  title: 'New Transaction',
  body: `${transaction.merchant} - ₹${transaction.amount}`,
  url: `/transactions/${transaction.id}`,
});
```

---

## 📋 Implementation Plan

### **Phase 1: Setup & Dependencies (15 minutes)**

#### **Step 1.1: Install Dependencies**
```bash
npm install web-push
npm install --save-dev @types/web-push
```

#### **Step 1.2: Generate VAPID Keys**
```bash
npx web-push generate-vapid-keys
```

Output:
```
=======================================
Public Key:
BNxxx...xxx

Private Key:
xxx...xxx
=======================================
```

#### **Step 1.3: Add Environment Variables**
Add to `.env.local`:
```bash
# Web Push VAPID Keys
VAPID_PUBLIC_KEY=BNxxx...xxx
VAPID_PRIVATE_KEY=xxx...xxx
VAPID_SUBJECT=mailto:your-email@example.com

# Push Notification Internal Secret (for server-triggered notifications)
# Generate with: openssl rand -base64 32
PUSH_INTERNAL_SECRET=your-random-secret-here
```

Add to Vercel:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add all four variables:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`
   - `PUSH_INTERNAL_SECRET`
3. Select: Production, Preview, Development

---

### **Phase 2: Database Setup (5 minutes)**

#### **Step 2.1: Verify Table Exists**
```sql
-- Already exists: fb_push_subscriptions
SELECT * FROM fb_push_subscriptions LIMIT 1;
```

#### **Step 2.2: Add RLS Policies (if not exists)**
```sql
-- Enable RLS
ALTER TABLE fb_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON fb_push_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions"
  ON fb_push_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions"
  ON fb_push_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
  ON fb_push_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);
```

#### **Step 2.3: Add Index for Performance**
```sql
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON fb_push_subscriptions(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint
  ON fb_push_subscriptions(endpoint);
```

---

### **Phase 3: Core Library Implementation (1 hour)**

#### **File: `src/lib/push/push-types.ts`**
```typescript
export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expiration_time: number | null;
  created_at: string;
  updated_at: string;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: Record<string, any>;
}

export interface SendPushResult {
  success: boolean;
  sentTo: number;
  failed: number;
  errors: Array<{ endpoint: string; error: string }>;
}
```

#### **File: `src/lib/push/push-manager.ts`**
```typescript
import webpush from 'web-push';
import { supabaseAdmin } from '../supabase';
import { PushSubscription, PushPayload, SendPushResult } from './push-types';

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export class PushManager {
  /**
   * Save a push subscription to the database
   */
  static async saveSubscription(
    userId: string,
    subscription: PushSubscriptionJSON
  ): Promise<void> {
    const { endpoint, keys } = subscription;

    if (!endpoint || !keys) {
      throw new Error('Invalid subscription object');
    }

    // Upsert subscription (update if exists, insert if not)
    const { error } = await supabaseAdmin
      .from('fb_push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
        expiration_time: subscription.expirationTime || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'endpoint',
      });

    if (error) {
      console.error('Failed to save push subscription:', error);
      throw error;
    }

    console.log('✅ Push subscription saved:', { userId, endpoint });
  }

  /**
   * Remove a push subscription from the database
   */
  static async removeSubscription(endpoint: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('fb_push_subscriptions')
      .delete()
      .eq('endpoint', endpoint);

    if (error) {
      console.error('Failed to remove push subscription:', error);
      throw error;
    }

    console.log('✅ Push subscription removed:', { endpoint });
  }

  /**
   * Get all push subscriptions for a user
   */
  static async getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
    const { data, error } = await supabaseAdmin
      .from('fb_push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to get user subscriptions:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Send push notification to all user's devices
   */
  static async sendToUser(
    userId: string,
    payload: PushPayload
  ): Promise<SendPushResult> {
    const subscriptions = await this.getUserSubscriptions(userId);

    if (subscriptions.length === 0) {
      console.log('⚠️ No push subscriptions found for user:', userId);
      return { success: true, sentTo: 0, failed: 0, errors: [] };
    }

    const results = await Promise.allSettled(
      subscriptions.map((sub) => this.sendToSubscription(sub, payload))
    );

    const sentTo = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    const errors = results
      .filter((r) => r.status === 'rejected')
      .map((r, i) => ({
        endpoint: subscriptions[i].endpoint,
        error: (r as PromiseRejectedResult).reason.message,
      }));

    console.log(`📤 Push sent to ${sentTo}/${subscriptions.length} devices`);

    return { success: true, sentTo, failed, errors };
  }

  /**
   * Send push notification to a single subscription
   */
  private static async sendToSubscription(
    subscription: PushSubscription,
    payload: PushPayload
  ): Promise<void> {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    };

    try {
      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify(payload)
      );
      console.log('✅ Push sent to:', subscription.endpoint.substring(0, 50));
    } catch (error: any) {
      // Handle expired/invalid subscriptions
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log('🗑️ Removing expired subscription:', subscription.endpoint);
        await this.removeSubscription(subscription.endpoint);
      }
      throw error;
    }
  }

  /**
   * Get VAPID public key for client-side subscription
   */
  static getPublicKey(): string {
    return process.env.VAPID_PUBLIC_KEY!;
  }
}
```

---

### **Phase 4: API Endpoints (1 hour)**

#### **File: `src/pages/api/push/vapid-public-key.ts`**
```typescript
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;

    if (!publicKey) {
      throw new Error('VAPID_PUBLIC_KEY not configured');
    }

    return res.status(200).json({ publicKey });
  } catch (error: any) {
    console.error('Failed to get VAPID public key:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

#### **File: `src/pages/api/push/subscribe.ts`**
```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { PushManager } from '@/lib/push/push-manager';

export default withAuth(
  async (req: NextApiRequest, res: NextApiResponse, user) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const subscription = req.body;

      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Invalid subscription' });
      }

      await PushManager.saveSubscription(user.id, subscription);

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Failed to save subscription:', error);
      return res.status(500).json({ error: error.message });
    }
  }
);
```

#### **File: `src/pages/api/push/unsubscribe.ts`**
```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { PushManager } from '@/lib/push/push-manager';

export default withAuth(
  async (req: NextApiRequest, res: NextApiResponse, user) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { endpoint } = req.body;

      if (!endpoint) {
        return res.status(400).json({ error: 'Endpoint required' });
      }

      await PushManager.removeSubscription(endpoint);

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Failed to unsubscribe:', error);
      return res.status(500).json({ error: error.message });
    }
  }
);
```

#### **File: `src/pages/api/push/send.ts`**
```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { PushManager } from '@/lib/push/push-manager';

/**
 * Internal endpoint for sending push notifications
 * Can be called from:
 * 1. Server-side code (internal)
 * 2. External services (cron jobs, webhooks) with authentication
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify request authentication
    const authHeader = req.headers.authorization;
    const internalSecret = process.env.PUSH_INTERNAL_SECRET;

    // Check if request is from external source (requires auth)
    const isExternalRequest = authHeader !== undefined;

    if (isExternalRequest) {
      // Verify external request with secret token
      if (!internalSecret) {
        return res.status(500).json({ error: 'Internal secret not configured' });
      }

      const token = authHeader?.replace('Bearer ', '');
      if (token !== internalSecret) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const { userId, payload } = req.body;

    if (!userId || !payload) {
      return res.status(400).json({ error: 'userId and payload required' });
    }

    const result = await PushManager.sendToUser(userId, payload);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Failed to send push notification:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

#### **File: `src/pages/api/push/send-bulk.ts`** (NEW - For Server-Triggered Notifications)
```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { PushManager } from '@/lib/push/push-manager';

/**
 * Bulk push notification endpoint for server-triggered events
 * Used by cron jobs, auto-sync, and other automated processes
 * Requires authentication via secret token
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    const internalSecret = process.env.PUSH_INTERNAL_SECRET;

    if (!internalSecret) {
      return res.status(500).json({ error: 'Internal secret not configured' });
    }

    const token = authHeader?.replace('Bearer ', '');
    if (token !== internalSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { notifications } = req.body;

    if (!notifications || !Array.isArray(notifications)) {
      return res.status(400).json({
        error: 'notifications array required',
        example: {
          notifications: [
            { userId: 'uuid', payload: { title: '...', body: '...' } }
          ]
        }
      });
    }

    // Send notifications in parallel
    const results = await Promise.allSettled(
      notifications.map(({ userId, payload }) =>
        PushManager.sendToUser(userId, payload)
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return res.status(200).json({
      success: true,
      total: notifications.length,
      successful,
      failed,
      results: results.map((r, i) => ({
        userId: notifications[i].userId,
        status: r.status,
        ...(r.status === 'fulfilled' ? { data: r.value } : { error: r.reason.message })
      }))
    });
  } catch (error: any) {
    console.error('Failed to send bulk push notifications:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

---

### **Phase 5: Service Worker Updates (1 hour)**

#### **File: `public/sw.js`** (Add to existing file)
```javascript
// ... existing code ...

// ============================================================================
// PUSH NOTIFICATION HANDLERS
// ============================================================================

// Handle push events
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  let data = {
    title: 'Finance Buddy',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    url: '/',
  };

  // Parse push payload
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (error) {
      console.error('[SW] Failed to parse push data:', error);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [200, 100, 200],
    tag: 'finance-buddy-notification',
    requireInteraction: false,
    data: {
      url: data.url,
      dateOfArrival: Date.now(),
    },
    actions: data.url ? [
      {
        action: 'open',
        title: 'View',
      },
      {
        action: 'close',
        title: 'Dismiss',
      },
    ] : [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification);
  // Optional: Track notification dismissals
});
```

---

### **Phase 6: Client-Side Hook (1 hour)**

#### **File: `src/hooks/usePushNotifications.ts`**
```typescript
import { useState, useEffect, useCallback } from 'react';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  requestPermission: () => Promise<NotificationPermission>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if push notifications are supported
    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Failed to check subscription:', error);
    }
  };

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const subscribe = useCallback(async () => {
    try {
      // Request permission if not granted
      if (Notification.permission !== 'granted') {
        const result = await requestPermission();
        if (result !== 'granted') {
          throw new Error('Notification permission denied');
        }
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Get VAPID public key from server
        const response = await fetch('/api/push/vapid-public-key');
        const { publicKey } = await response.json();

        // Subscribe to push notifications
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      setIsSubscribed(true);
      console.log('✅ Subscribed to push notifications');
    } catch (error) {
      console.error('Failed to subscribe:', error);
      throw error;
    }
  }, [requestPermission]);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();

        // Remove from server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        setIsSubscribed(false);
        console.log('✅ Unsubscribed from push notifications');
      }
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      throw error;
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
    requestPermission,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
```

---

### **Phase 7: UI Component (1 hour)**

#### **File: `src/components/PushNotificationPrompt.tsx`**
```typescript
import { useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function PushNotificationPrompt() {
  const {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const [loading, setLoading] = useState(false);

  if (!isSupported) {
    return null; // Don't show if not supported
  }

  if (permission === 'denied') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          Push notifications are blocked. Please enable them in your browser settings.
        </p>
      </div>
    );
  }

  if (isSubscribed) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <p className="text-sm text-green-800">
              Push notifications enabled
            </p>
          </div>
          <button
            onClick={async () => {
              setLoading(true);
              try {
                await unsubscribe();
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="text-sm text-green-700 hover:text-green-900 underline"
          >
            Disable
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🔔</span>
        <div className="flex-1">
          <h3 className="font-medium text-blue-900 mb-1">
            Enable Push Notifications
          </h3>
          <p className="text-sm text-blue-700 mb-3">
            Get notified when new transactions are extracted from your emails.
          </p>
          <button
            onClick={async () => {
              setLoading(true);
              try {
                await subscribe();
              } catch (error) {
                console.error('Subscription failed:', error);
                alert('Failed to enable notifications. Please try again.');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Enabling...' : 'Enable Notifications'}
          </button>
        </div>
      </div>
    </div>
  );
}
```


---

### **Phase 8: Integration with Existing System (1 hour)**

#### **8.1: User-Triggered Push Notifications**

Integrate push notifications into user-initiated actions (e.g., manual sync, transaction extraction):

```typescript
// Example: In manual Gmail sync endpoint
// File: src/pages/api/gmail/sync.ts

import { PushManager } from '@/lib/push/push-manager';

export default withAuth(async (req, res, user) => {
  // ... existing sync logic ...

  // After extracting transactions
  const extractedCount = transactions.length;

  if (extractedCount > 0) {
    // Create in-app notification (if fb_notifications table exists)
    const notification = await createNotification({
      userId: user.id,
      type: 'sync_completed',
      title: 'Sync Complete',
      message: `${extractedCount} new transaction${extractedCount > 1 ? 's' : ''} extracted`,
      action_url: '/transactions',
    });

    // Trigger push notification
    await PushManager.sendToUser(user.id, {
      title: notification.title,
      body: notification.message,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      url: notification.action_url || '/',
      data: {
        notificationId: notification.id,
        type: 'sync_completed',
        count: extractedCount,
      },
    });
  }

  return res.status(200).json({ success: true, count: extractedCount });
});
```

**Alternative: Direct Push Without In-App Notification**
```typescript
// If no fb_notifications table, send push directly
import { PushManager } from '@/lib/push/push-manager';

await PushManager.sendToUser(user.id, {
  title: 'New Transaction Extracted',
  body: `₹${amount} ${type} at ${merchant}`,
  icon: '/icons/icon-192x192.png',
  badge: '/icons/icon-72x72.png',
  url: `/transactions/${transactionId}`,
  data: {
    transactionId,
    type: 'transaction_extracted',
  },
});
```

---

#### **8.2: Server-Triggered Push Notifications**

Integrate push notifications into automated server processes (cron jobs, auto-sync, webhooks):

**Example 1: Auto-Sync Cron Job**
```typescript
// File: src/pages/api/cron/gmail-auto-sync.ts

import { PushManager } from '@/lib/push/push-manager';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req, res) {
  // Verify cron secret
  const authHeader = req.headers.authorization;
  if (authHeader?.replace('Bearer ', '') !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get all users with auto-sync enabled
    const { data: users } = await supabaseAdmin
      .from('fb_gmail_connections')
      .select('user_id, email')
      .eq('auto_sync_enabled', true);

    const results = [];

    for (const user of users) {
      // Sync emails for this user
      const newTransactions = await syncUserEmails(user.user_id);

      if (newTransactions.length > 0) {
        // Send push notification
        const result = await PushManager.sendToUser(user.user_id, {
          title: 'Auto-Sync Complete',
          body: `${newTransactions.length} new transaction${newTransactions.length > 1 ? 's' : ''} found`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          url: '/transactions',
          data: {
            type: 'auto_sync',
            count: newTransactions.length,
            timestamp: new Date().toISOString(),
          },
        });

        results.push({
          userId: user.user_id,
          email: user.email,
          transactionsFound: newTransactions.length,
          pushSent: result.sentTo,
        });
      }
    }

    return res.status(200).json({
      success: true,
      usersProcessed: users.length,
      notificationsSent: results.length,
      results,
    });
  } catch (error) {
    console.error('Auto-sync failed:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

**Example 2: Bulk Push via External API**
```typescript
// External service calling your API
// (e.g., from a separate microservice, webhook handler, etc.)

const response = await fetch('https://your-app.vercel.app/api/push/send-bulk', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.PUSH_INTERNAL_SECRET}`,
  },
  body: JSON.stringify({
    notifications: [
      {
        userId: 'user-uuid-1',
        payload: {
          title: 'Payment Due',
          body: 'Your credit card payment is due in 3 days',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          url: '/payments',
          data: { type: 'payment_reminder' },
        },
      },
      {
        userId: 'user-uuid-2',
        payload: {
          title: 'Budget Alert',
          body: 'You have exceeded 80% of your monthly budget',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          url: '/budget',
          data: { type: 'budget_alert' },
        },
      },
    ],
  }),
});

const result = await response.json();
console.log(`Sent ${result.successful}/${result.total} notifications`);
```

**Example 3: Webhook-Triggered Push**
```typescript
// File: src/pages/api/webhooks/gmail-notification.ts
// Triggered by Gmail push notifications (if using Gmail Pub/Sub)

import { PushManager } from '@/lib/push/push-manager';

export default async function handler(req, res) {
  // Verify webhook signature
  // ... webhook verification logic ...

  const { userId, emailId } = req.body;

  // Process new email
  const transaction = await extractTransactionFromEmail(emailId);

  if (transaction) {
    // Send push notification
    await PushManager.sendToUser(userId, {
      title: 'New Transaction Detected',
      body: `${transaction.merchant} - ₹${transaction.amount}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      url: `/transactions/${transaction.id}`,
      data: {
        type: 'real_time_transaction',
        transactionId: transaction.id,
      },
    });
  }

  return res.status(200).json({ success: true });
}
```

---

#### **8.3: Helper Function for Common Use Cases**

Create a reusable helper for common notification scenarios:

```typescript
// File: src/lib/push/notification-helpers.ts

import { PushManager } from './push-manager';

export class NotificationHelpers {
  /**
   * Send transaction notification
   */
  static async notifyTransaction(
    userId: string,
    transaction: {
      id: string;
      amount: number;
      merchant: string;
      type: 'debit' | 'credit';
    }
  ) {
    return PushManager.sendToUser(userId, {
      title: `New ${transaction.type === 'debit' ? 'Expense' : 'Income'}`,
      body: `₹${transaction.amount} at ${transaction.merchant}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      url: `/transactions/${transaction.id}`,
      data: {
        type: 'transaction',
        transactionId: transaction.id,
      },
    });
  }

  /**
   * Send sync completion notification
   */
  static async notifySyncComplete(userId: string, count: number) {
    if (count === 0) return; // Don't notify if no new transactions

    return PushManager.sendToUser(userId, {
      title: 'Sync Complete',
      body: `${count} new transaction${count > 1 ? 's' : ''} extracted`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      url: '/transactions',
      data: {
        type: 'sync_complete',
        count,
      },
    });
  }

  /**
   * Send error notification
   */
  static async notifyError(userId: string, error: string) {
    return PushManager.sendToUser(userId, {
      title: 'Error',
      body: error,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      url: '/settings',
      data: {
        type: 'error',
      },
    });
  }

  /**
   * Send bulk notifications to multiple users
   */
  static async notifyMultipleUsers(
    notifications: Array<{ userId: string; title: string; body: string; url?: string }>
  ) {
    const results = await Promise.allSettled(
      notifications.map(({ userId, title, body, url }) =>
        PushManager.sendToUser(userId, {
          title,
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          url: url || '/',
          data: { type: 'bulk_notification' },
        })
      )
    );

    return {
      total: notifications.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
    };
  }
}
```

**Usage:**
```typescript
// User-triggered
await NotificationHelpers.notifyTransaction(userId, transaction);

// Server-triggered
await NotificationHelpers.notifySyncComplete(userId, 5);

// Bulk server-triggered
await NotificationHelpers.notifyMultipleUsers([
  { userId: 'user1', title: 'Alert', body: 'Budget exceeded' },
  { userId: 'user2', title: 'Reminder', body: 'Payment due' },
]);
```

---

### **Phase 9: Testing (1 hour)**

#### **Test Checklist**

**1. Subscription Flow**
- [ ] Request permission works
- [ ] Subscribe saves to database
- [ ] Subscription persists across page reloads
- [ ] Multiple devices can subscribe
- [ ] Unsubscribe removes subscription

**2. Push Delivery**
- [ ] Push notifications appear
- [ ] Notification shows correct title/body
- [ ] Icon and badge display correctly
- [ ] Click opens correct URL
- [ ] Actions (View/Dismiss) work

**3. Multi-Device**
- [ ] Same user on 2+ devices receives push
- [ ] Unsubscribe removes only that device
- [ ] All devices receive same notification

**4. Error Handling**
- [ ] Expired subscriptions are removed
- [ ] Invalid subscriptions don't crash
- [ ] Permission denied handled gracefully
- [ ] Network errors handled

**5. Browser Compatibility**
- [ ] Chrome (Desktop & Android)
- [ ] Firefox (Desktop & Android)
- [ ] Edge (Desktop)
- [ ] Safari (iOS 16.4+, requires add to home screen)

**6. Edge Cases**
- [ ] User with no subscriptions (no error)
- [ ] Offline delivery (queued by browser)
- [ ] App closed (notification still appears)
- [ ] Multiple rapid notifications

**7. Server-Triggered Notifications**
- [ ] Cron job authentication works
- [ ] Bulk send endpoint works
- [ ] External API calls authenticated correctly
- [ ] Multiple users notified in parallel
- [ ] Failed notifications don't crash bulk send
- [ ] Webhook triggers work correctly

---

## 📊 Implementation Timeline

| Phase | Task | Time | Dependencies |
|-------|------|------|--------------|
| 1 | Setup & Dependencies | 15 min | - |
| 2 | Database Setup | 5 min | Phase 1 |
| 3 | Core Library | 1 hour | Phase 1, 2 |
| 4 | API Endpoints (5 endpoints) | 1.5 hours | Phase 3 |
| 5 | Service Worker | 1 hour | - |
| 6 | Client Hook | 1 hour | Phase 4 |
| 7 | UI Component | 1 hour | Phase 6 |
| 8 | Integration (User + Server) | 1.5 hours | Phase 3, 4 |
| 9 | Testing (All scenarios) | 1.5 hours | All phases |
| **Total** | | **~7.5 hours** | |

---

## 🎯 Success Criteria

✅ **Functional Requirements:**
- Users can subscribe to push notifications
- Push notifications are delivered to all user devices
- Notifications appear even when app is closed
- Clicking notification opens the app to correct page
- Users can unsubscribe from notifications

✅ **Non-Functional Requirements:**
- Zero cost (self-hosted)
- Works for 5-10 users
- Supports multiple devices per user
- Handles expired subscriptions gracefully
- Privacy-focused (no third-party services)

---

## 📝 Next Steps After Implementation

1. **Add to Settings Page**
   - Add `<PushNotificationPrompt />` to `/settings`
   - Allow users to manage subscriptions

2. **Monitor & Maintain**
   - Track push delivery success rates
   - Clean up expired subscriptions periodically
   - Monitor database growth

3. **Future Enhancements**
   - Add notification preferences (which events to notify)
   - Add quiet hours (don't send at night)
   - Add notification history
   - Add rich notifications with images
   - Add notification grouping
   - Add notification priority levels

---

## 🔧 Troubleshooting Guide

### **Issue: Notifications not appearing**
**Possible Causes:**
- Permission not granted
- Service worker not registered
- Invalid VAPID keys
- Subscription not saved

**Solutions:**
1. Check browser console for errors
2. Verify service worker is active: `navigator.serviceWorker.controller`
3. Check notification permission: `Notification.permission`
4. Verify subscription in database

### **Issue: Server-triggered notifications failing**
**Possible Causes:**
- Missing or incorrect `PUSH_INTERNAL_SECRET`
- Authentication header not set
- Invalid user IDs
- Network/firewall blocking requests

**Solutions:**
1. Verify `PUSH_INTERNAL_SECRET` in environment variables
2. Check authorization header: `Authorization: Bearer <secret>`
3. Verify user IDs exist in database
4. Check Vercel function logs for errors
5. Test with curl:
```bash
curl -X POST https://your-app.vercel.app/api/push/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret" \
  -d '{"userId":"user-id","payload":{"title":"Test","body":"Test"}}'
```

### **Issue: Subscription fails**
**Possible Causes:**
- VAPID keys mismatch
- Service worker not ready
- Browser doesn't support push

**Solutions:**
1. Verify VAPID keys in `.env.local` and Vercel
2. Wait for service worker: `await navigator.serviceWorker.ready`
3. Check browser compatibility

### **Issue: Push sent but not received**
**Possible Causes:**
- Expired subscription
- Browser push service down
- Invalid endpoint

**Solutions:**
1. Check subscription expiration_time
2. Verify endpoint is valid
3. Check browser push service status
4. Remove and re-subscribe

### **Issue: iOS Safari not working**
**Possible Causes:**
- iOS version < 16.4
- PWA not added to home screen
- Permission not granted

**Solutions:**
1. Verify iOS version (Settings → General → About)
2. Add PWA to home screen first
3. Request permission after adding to home screen

---

## 📚 Additional Resources

- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/rfc8292)
- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [MDN: Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [web-push npm package](https://www.npmjs.com/package/web-push)
- [Service Worker Cookbook](https://serviceworke.rs/)

---

---

## 📝 Summary

This implementation plan provides a **complete, production-ready push notification system** for Finance Buddy PWA with:

### ✅ **Key Features**
- **Dual Trigger Support**: User-triggered AND server-triggered notifications
- **Multi-Device**: Each user can have multiple devices subscribed
- **Zero Cost**: Self-hosted with no third-party dependencies
- **Secure**: Authentication for server-triggered notifications
- **Scalable**: Handles 5-10 users efficiently, can scale further
- **Privacy-Focused**: All data stays on your infrastructure
- **Production-Ready**: Complete code, testing, and troubleshooting guides

### 📊 **Implementation Scope**
- **5 API Endpoints**: subscribe, unsubscribe, vapid-key, send, send-bulk
- **3 Core Libraries**: push-manager, push-types, notification-helpers
- **1 React Hook**: usePushNotifications
- **1 UI Component**: PushNotificationPrompt
- **Service Worker**: Push event handlers
- **Examples**: Cron jobs, webhooks, user actions

### ⏱️ **Time Estimate**
- **Total**: ~7.5 hours
- **Core Implementation**: 5 hours
- **Integration**: 1.5 hours
- **Testing**: 1 hour

### 🎯 **Use Cases Covered**
1. ✅ User-triggered: Manual sync, transaction creation
2. ✅ Server-triggered: Auto-sync, cron jobs, webhooks
3. ✅ Bulk notifications: Multiple users at once
4. ✅ Priority levels: Low, normal, high, urgent
5. ✅ Multi-device: Same user on multiple devices

---

**Document Version**: 2.0
**Last Updated**: 2025-11-14
**Author**: AI Agent
**Status**: Ready for Implementation
**Changes in v2.0**:
- Added server-triggered notification support
- Added bulk send endpoint
- Added notification helpers
- Added priority levels
- Added cron job and webhook examples
- Updated architecture diagrams
- Expanded integration examples






