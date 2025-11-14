# Vercel Authentication Setup for Webhooks

## 🚨 Problem

The Gmail Pub/Sub webhook endpoint (`/api/webhooks/gmail-pubsub`) is being blocked by Vercel Authentication, returning HTML instead of processing the webhook request.

**Error**:
```
Exception: Request failed for https://finance-buddy-sand.vercel.app returned code 500. 
Truncated server response: {"error":"Internal server error","requestId":"req_1763159537723_g5m034843",
"message":"Unexpected token 'Y', \" YBL HTML M\"... is not valid JSON"}
```

**Root Cause**: Vercel Authentication is protecting all routes, including API webhooks that need to be publicly accessible for external services (like Google Cloud Pub/Sub).

---

## ✅ Solution: Disable Vercel Auth for Webhook Routes

### Option 1: Disable Vercel Auth for Specific Routes (Recommended)

1. **Go to Vercel Dashboard**:
   - Navigate to: https://vercel.com/dheerajs-projects-74ed43fb/finance-buddy/settings/deployment-protection

2. **Configure Deployment Protection**:
   - Click on "Deployment Protection" in the left sidebar
   - Scroll to "Protection Bypass for Automation"

3. **Add Bypass Rule**:
   - Click "Add Bypass"
   - **Path Pattern**: `/api/webhooks/*`
   - **Description**: "Allow Google Cloud Pub/Sub webhooks"
   - Click "Save"

4. **Verify**:
   - Test the webhook endpoint again
   - Should now return JSON instead of HTML

### Option 2: Disable Vercel Auth Completely (Not Recommended)

1. **Go to Vercel Dashboard**:
   - Navigate to: https://vercel.com/dheerajs-projects-74ed43fb/finance-buddy/settings/deployment-protection

2. **Disable Protection**:
   - Toggle "Vercel Authentication" to OFF
   - Click "Save"

**⚠️ Warning**: This disables authentication for the entire app, including the UI. Only use this for testing.

### Option 3: Use Vercel Share Token (Temporary Testing)

For temporary testing, you can use a share token:

```bash
# Get share token (expires in 24 hours)
curl -X POST https://finance-buddy-sand.vercel.app/api/webhooks/gmail-pubsub?_vercel_share=YOUR_SHARE_TOKEN \
  -H "Content-Type: application/json" \
  -d '{"message":{"data":"..."}}'
```

To get a share token:
1. Go to: https://vercel.com/dheerajs-projects-74ed43fb/finance-buddy
2. Click "Share" button
3. Copy the share URL
4. Extract the `_vercel_share` parameter

---

## 🔒 Security Considerations

### Why Webhooks Need Public Access

Webhooks are called by external services (Google Cloud Pub/Sub) that don't have user credentials. They need to be publicly accessible but should have their own authentication mechanism.

### Recommended Security Measures

1. **Verify Pub/Sub JWT Tokens**:
   - Google Cloud Pub/Sub sends JWT tokens in the `Authorization` header
   - Verify the token signature using Google's public keys
   - Check the token claims (audience, issuer, expiration)

2. **Use Webhook Secrets**:
   - Add a secret token to the Pub/Sub subscription configuration
   - Verify the secret in the webhook endpoint
   - Reject requests without valid secrets

3. **IP Whitelisting** (if possible):
   - Restrict webhook access to Google Cloud IP ranges
   - Configure in Vercel firewall settings

4. **Rate Limiting**:
   - Implement rate limiting to prevent abuse
   - Use Vercel Edge Config or Redis for tracking

---

## 🧪 Testing After Configuration

### Test 1: Verify Webhook is Accessible

```bash
curl -X POST https://finance-buddy-sand.vercel.app/api/webhooks/gmail-pubsub \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "data": "eyJlbWFpbEFkZHJlc3MiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaGlzdG9yeUlkIjoiMTIzIn0=",
      "messageId": "test-001",
      "publishTime": "2025-11-14T22:00:00Z"
    },
    "subscription": "projects/test/subscriptions/gmail"
  }'
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "requestId": "req_...",
  "message": "Webhook processed successfully",
  "data": {
    "emailAddress": "test@example.com",
    "historyId": "123",
    "connectionId": "..."
  }
}
```

**OR** (if no connection found):
```json
{
  "success": true,
  "message": "No connection found for this email address",
  "requestId": "req_...",
  "emailAddress": "test@example.com"
}
```

### Test 2: Verify Error Detection

If Vercel Auth is still blocking:

**Response** (403 Forbidden):
```json
{
  "error": "Vercel Authentication is blocking this endpoint",
  "requestId": "req_...",
  "message": "Please disable Vercel Authentication for /api/webhooks/* routes or configure webhook authentication",
  "documentation": "https://vercel.com/docs/security/deployment-protection"
}
```

---

## 📚 Related Documentation

- [Vercel Deployment Protection](https://vercel.com/docs/security/deployment-protection)
- [Gmail Pub/Sub Webhook Testing](./GMAIL_PUBSUB_WEBHOOK_TESTING.md)
- [Gmail Auto-Sync Design](./GMAIL_AUTO_SYNC_DESIGN.md)

---

## 🔧 Next Steps

After disabling Vercel Auth for webhooks:

1. ✅ Test the webhook endpoint (should return JSON)
2. ✅ Implement webhook authentication (JWT verification or secrets)
3. ✅ Set up Google Cloud Pub/Sub subscription
4. ✅ Configure Gmail watch notifications
5. ✅ Test end-to-end with real Gmail notifications

---

**Last Updated**: 2025-11-14  
**Status**: ⚠️ Requires Vercel Auth Configuration  
**Priority**: High (blocks webhook functionality)

