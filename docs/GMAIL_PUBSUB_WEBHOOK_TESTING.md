# Gmail Pub/Sub Webhook Testing Guide

## 📋 Overview

The Gmail Pub/Sub webhook endpoint (`/api/webhooks/gmail-pubsub`) receives push notifications from Google Cloud Pub/Sub when new emails arrive in connected Gmail accounts.

**Endpoint**: `https://finance-buddy-sand.vercel.app/api/webhooks/gmail-pubsub`

---

## ✅ Test Results Summary

All tests passed successfully! The webhook endpoint is working correctly with comprehensive logging.

### Test Scenarios

| Test | Scenario | Status | HTTP Code | Result |
|------|----------|--------|-----------|--------|
| 1 | Valid message (dheerajsaraf1996@gmail.com) | ✅ PASS | 200 | Connection found, sync triggered |
| 2 | Valid message (ashoksaraf1965@gmail.com) | ✅ PASS | 200 | Connection found, sync triggered |
| 3 | Non-existent email address | ✅ PASS | 200 | No connection found (acknowledged) |
| 4 | Invalid Pub/Sub message (missing data) | ✅ PASS | 400 | Error returned with details |
| 5 | Wrong HTTP method (GET) | ✅ PASS | 405 | Method not allowed |

---

## 📨 Request/Response Examples

### Test 1: Valid Pub/Sub Message (Existing Connection)

**Request**:
```json
{
  "message": {
    "data": "eyJlbWFpbEFkZHJlc3MiOiJkaGVlcmFqc2FyYWYxOTk2QGdtYWlsLmNvbSIsImhpc3RvcnlJZCI6IjEyMzQ1Njc4OSJ9",
    "messageId": "test-msg-001",
    "publishTime": "2025-11-14T22:29:24Z"
  },
  "subscription": "projects/test-project/subscriptions/gmail-notifications"
}
```

**Decoded Payload**:
```json
{
  "emailAddress": "dheerajsaraf1996@gmail.com",
  "historyId": "123456789"
}
```

**Response**:
```json
{
  "success": true,
  "requestId": "req_1763159365746_s7kknzuy4",
  "message": "Webhook processed successfully",
  "data": {
    "emailAddress": "dheerajsaraf1996@gmail.com",
    "historyId": "123456789",
    "connectionId": "4aee0f4d-33ba-4632-864f-85ac30e91fe5"
  }
}
```

### Test 3: Non-Existent Email Address

**Response**:
```json
{
  "success": true,
  "message": "No connection found for this email address",
  "requestId": "req_1763159369451_708ii06bq",
  "emailAddress": "nonexistent@example.com"
}
```

### Test 4: Invalid Pub/Sub Message

**Response**:
```json
{
  "error": "Invalid Pub/Sub message format",
  "requestId": "req_1763159370386_oxs1excqs",
  "received": {
    "message": {
      "messageId": "test-msg-004",
      "publishTime": "2025-11-14T22:29:29Z"
    },
    "subscription": "projects/test-project/subscriptions/gmail-notifications"
  }
}
```

### Test 5: Wrong HTTP Method

**Response**:
```json
{
  "error": "Method not allowed",
  "requestId": "req_1763159370795_xobjkk1gg",
  "allowedMethods": ["POST"]
}
```

---

## 🔍 Logging Details

The webhook endpoint includes comprehensive logging for debugging:

### Log Levels

1. **📨 Request Received**: Full request details including headers, method, query params
2. **📦 Pub/Sub Message**: Message ID, publish time, subscription, data length
3. **🔓 Decoded Payload**: Base64-decoded Gmail notification data
4. **📧 Gmail Notification**: Email address and history ID
5. **✅ Connection Found**: Connection ID, user ID, auto-sync status
6. **🔄 Sync Triggered**: Placeholder for future sync implementation
7. **❌ Errors**: Full error details with stack traces

### Example Log Output

```
📨 [Gmail Pub/Sub Webhook] Request received: {
  requestId: 'req_1763159365746_s7kknzuy4',
  method: 'POST',
  timestamp: '2025-11-14T22:29:25.746Z',
  headers: { ... },
  bodyKeys: ['message', 'subscription']
}

📦 [req_1763159365746_s7kknzuy4] Pub/Sub message received: {
  messageId: 'test-msg-001',
  publishTime: '2025-11-14T22:29:24Z',
  subscription: 'projects/test-project/subscriptions/gmail-notifications',
  hasData: true,
  dataLength: 88
}

🔓 [req_1763159365746_s7kknzuy4] Decoded payload: {"emailAddress":"dheerajsaraf1996@gmail.com","historyId":"123456789"}

📧 [req_1763159365746_s7kknzuy4] Gmail notification payload: {
  emailAddress: 'dheerajsaraf1996@gmail.com',
  historyId: '123456789'
}

✅ [req_1763159365746_s7kknzuy4] Gmail connection found: {
  connectionId: '4aee0f4d-33ba-4632-864f-85ac30e91fe5',
  userId: '19ebbae0-475b-4043-85f9-438cd07c3677',
  emailAddress: 'dheerajsaraf1996@gmail.com',
  autoSyncEnabled: false
}

🔄 [req_1763159365746_s7kknzuy4] Email sync triggered (placeholder): {
  connectionId: '4aee0f4d-33ba-4632-864f-85ac30e91fe5',
  historyId: '123456789'
}
```

---

## 🧪 Running Tests

Use the provided test script to test the webhook endpoint:

```bash
chmod +x test-gmail-webhook.sh
./test-gmail-webhook.sh
```

The script tests:
- ✅ Valid Pub/Sub messages with existing connections
- ✅ Non-existent email addresses
- ✅ Invalid Pub/Sub message formats
- ✅ Wrong HTTP methods

---

## 📊 Viewing Logs

### Vercel Logs
View real-time logs in the Vercel dashboard:
- **URL**: https://vercel.com/dheerajs-projects-74ed43fb/finance-buddy
- **Filter**: Search for "Gmail Pub/Sub Webhook" or request IDs

### Supabase Logs
View database queries in Supabase:
- **URL**: https://supabase.com/dashboard/project/ewvzppahjocjpipaywlg/logs/api-logs
- **Filter**: Search for `fb_gmail_connections` queries

---

## 🔧 Next Steps

The webhook endpoint is ready for integration with Google Cloud Pub/Sub. Next steps:

1. **Set up Google Cloud Pub/Sub**:
   - Create Pub/Sub topic: `projects/PROJECT_ID/topics/gmail-notifications`
   - Create push subscription pointing to webhook URL
   - Grant Gmail service account publish permissions

2. **Implement Gmail Watch**:
   - Call `gmail.users.watch()` to start receiving notifications
   - Store watch subscription details in database
   - Handle watch expiration and renewal

3. **Implement Sync Logic**:
   - Replace placeholder sync trigger with actual sync implementation
   - Use `historyId` to fetch only new emails
   - Process emails and extract transactions

4. **Add Authentication** (if needed):
   - Verify Pub/Sub JWT tokens
   - Add webhook secret validation
   - Implement rate limiting

---

## 📚 Related Documentation

- [Gmail Auto-Sync Design](./GMAIL_AUTO_SYNC_DESIGN.md)
- [Gmail Auto-Sync Architecture](./GMAIL_AUTO_SYNC_ARCHITECTURE.md)
- [Push Notifications Setup](./PUSH_NOTIFICATIONS_SETUP_GUIDE.md)

---

**Last Updated**: 2025-11-14  
**Status**: ✅ Tested and Working  
**Deployment**: Production (https://finance-buddy-sand.vercel.app)

