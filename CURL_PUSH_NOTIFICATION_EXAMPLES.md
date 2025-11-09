# cURL Examples for Push Notifications

## 🔔 Send Push Notification that Opens `/review_route`

### **Production URL**

```bash
curl -X POST https://finance-buddy-ajsr6xw8r-dheerajs-projects-74ed43fb.vercel.app/api/push/send \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-ewvzppahjocjpipaywlg-auth-token=YOUR_AUTH_TOKEN" \
  -d '{
    "title": "💳 New Transaction to Review",
    "body": "A new transaction requires your review",
    "icon": "/icons/icon-192x192.png",
    "badge": "/icons/icon-96x96.png",
    "tag": "review-notification",
    "url": "/review_route",
    "data": {
      "type": "review",
      "timestamp": '$(date +%s000)'
    }
  }'
```

### **Local Development**

```bash
curl -X POST http://localhost:3000/api/push/send \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-ewvzppahjocjpipaywlg-auth-token=YOUR_AUTH_TOKEN" \
  -d '{
    "title": "💳 New Transaction to Review",
    "body": "A new transaction requires your review",
    "icon": "/icons/icon-192x192.png",
    "badge": "/icons/icon-96x96.png",
    "tag": "review-notification",
    "url": "/review_route",
    "data": {
      "type": "review",
      "timestamp": '$(date +%s000)'
    }
  }'
```

---

## 📋 How to Get Your Supabase Auth Token

### **Method 1: Browser DevTools (Recommended)**

1. Open your browser and navigate to: https://finance-buddy-ajsr6xw8r-dheerajs-projects-74ed43fb.vercel.app
2. Log in with your credentials (`dheerajsaraf1996@gmail.com` / `Abcd1234`)
3. Open **DevTools** (F12 or Right-click → Inspect)
4. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
5. Click **Cookies** → Select your domain
6. Find the cookie named **`sb-ewvzppahjocjpipaywlg-auth-token`**
7. Copy the **Value** column (it's a long base64-encoded string)

**Example:**
```
Cookie Name: sb-ewvzppahjocjpipaywlg-auth-token
Cookie Value: base64-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNjg5...
```

### **Method 2: Network Tab**

1. Open **DevTools** → **Network** tab
2. Refresh the page
3. Click on any request
4. Look for **Request Headers** → **Cookie**
5. Find `sb-ewvzppahjocjpipaywlg-auth-token=...` and copy the value after the `=`

### **Method 3: Copy All Cookies (Easiest)**

You can also copy ALL cookies at once:

```bash
# In DevTools Console, run:
document.cookie

# Copy the entire output and use it in the Cookie header
```

Then use the entire cookie string in your cURL command:

```bash
curl -X POST https://finance-buddy-ajsr6xw8r-dheerajs-projects-74ed43fb.vercel.app/api/push/send \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-ewvzppahjocjpipaywlg-auth-token=YOUR_TOKEN; _vercel_jwt=YOUR_JWT" \
  -d '{"title": "Test", "body": "Hello", "url": "/review_route"}'
```

---

## 🎯 More Examples

### **1. Transaction Notification**

```bash
curl -X POST https://finance-buddy-ajsr6xw8r-dheerajs-projects-74ed43fb.vercel.app/api/push/send \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-ewvzppahjocjpipaywlg-auth-token=YOUR_AUTH_TOKEN" \
  -d '{
    "title": "💳 New Transaction Detected",
    "body": "₹1,250.00 from HDFC Bank",
    "url": "/transactions",
    "tag": "transaction-notification",
    "data": {
      "type": "transaction",
      "amount": 1250.00,
      "merchant": "HDFC Bank"
    }
  }'
```

### **2. Email Sync Notification**

```bash
curl -X POST https://finance-buddy-ajsr6xw8r-dheerajs-projects-74ed43fb.vercel.app/api/push/send \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-ewvzppahjocjpipaywlg-auth-token=YOUR_AUTH_TOKEN" \
  -d '{
    "title": "📧 Email Sync Complete",
    "body": "5 new financial emails synced",
    "url": "/emails",
    "tag": "email-sync",
    "data": {
      "type": "email-sync",
      "count": 5
    }
  }'
```

### **3. Error Notification**

```bash
curl -X POST https://finance-buddy-ajsr6xw8r-dheerajs-projects-74ed43fb.vercel.app/api/push/send \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-ewvzppahjocjpipaywlg-auth-token=YOUR_AUTH_TOKEN" \
  -d '{
    "title": "⚠️ Sync Error",
    "body": "Failed to sync emails. Please check your connection.",
    "url": "/settings",
    "tag": "sync-error",
    "data": {
      "type": "error",
      "errorCode": "SYNC_FAILED"
    }
  }'
```

---

## ✅ Expected Response

**Success (200 OK)**:
```json
{
  "success": true,
  "sent": 1,
  "failed": 0,
  "total": 1
}
```

**Error (401 Unauthorized)**:
```json
{
  "error": "Unauthorized"
}
```

**Error (404 Not Found)**:
```json
{
  "error": "No subscriptions found for user"
}
```

---

## 🔐 Important Notes

1. **Supabase Auth Token Required**: You must be logged in and have a valid `sb-ewvzppahjocjpipaywlg-auth-token` cookie
2. **Push Notifications Enabled**: User must have enabled push notifications in `/settings`
3. **HTTPS Required**: Production push notifications require HTTPS (Vercel provides this)
4. **URL Parameter**: The `url` parameter determines where the app opens when notification is clicked
5. **Cookie Format**: The auth token is a base64-encoded JWT token from Supabase Auth

---

## 🧪 Testing Workflow

1. **Login to the App**:
   - Visit: https://finance-buddy-ajsr6xw8r-dheerajs-projects-74ed43fb.vercel.app
   - Login with: `dheerajsaraf1996@gmail.com` / `Abcd1234`

2. **Enable Push Notifications**:
   - Go to: https://finance-buddy-ajsr6xw8r-dheerajs-projects-74ed43fb.vercel.app/settings
   - Click "Enable Push Notifications"
   - Grant permission when browser prompts

3. **Get Supabase Auth Token** (see methods above)
   - Open DevTools → Application → Cookies
   - Copy `sb-ewvzppahjocjpipaywlg-auth-token` value

4. **Send Test Notification**:
   ```bash
   curl -X POST https://finance-buddy-ajsr6xw8r-dheerajs-projects-74ed43fb.vercel.app/api/push/send \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-ewvzppahjocjpipaywlg-auth-token=YOUR_ACTUAL_TOKEN_VALUE" \
     -d '{
       "title": "Test Notification",
       "body": "Click to open review route",
       "url": "/review_route"
     }'
   ```

5. **Click the Notification**: Should open `/review_route` in the app

---

## 📚 Additional Resources

- **API Documentation**: `docs/PUSH_NOTIFICATIONS_API.md`
- **Integration Guide**: `docs/PUSH_NOTIFICATIONS_INTEGRATION.md`
- **Test Page**: https://finance-buddy-ajsr6xw8r-dheerajs-projects-74ed43fb.vercel.app/test-push

---

**Production URL**: https://finance-buddy-ajsr6xw8r-dheerajs-projects-74ed43fb.vercel.app

