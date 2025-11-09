# 🚀 Push Notifications - Quick Start Guide

## ⚡ TL;DR - Send a Push Notification Right Now

### **Step 1: Get Your Auth Token**

1. Open: https://finance-buddy-ajsr6xw8r-dheerajs-projects-74ed43fb.vercel.app
2. Login: `dheerajsaraf1996@gmail.com` / `Abcd1234`
3. Press **F12** → **Application** → **Cookies**
4. Copy the value of: `sb-ewvzppahjocjpipaywlg-auth-token`

### **Step 2: Enable Push Notifications**

1. Go to: https://finance-buddy-ajsr6xw8r-dheerajs-projects-74ed43fb.vercel.app/settings
2. Click **"Enable Push Notifications"**
3. Click **"Allow"** when browser asks

### **Step 3: Send Notification**

```bash
curl -X POST https://finance-buddy-ajsr6xw8r-dheerajs-projects-74ed43fb.vercel.app/api/push/send \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-ewvzppahjocjpipaywlg-auth-token=PASTE_YOUR_TOKEN_HERE" \
  -d '{
    "title": "💳 New Transaction to Review",
    "body": "Click to open review route",
    "url": "/review_route"
  }'
```

**Expected Response:**
```json
{"success": true, "sent": 1, "failed": 0, "total": 1}
```

---

## 📋 Cookie Information

### **What Cookies Are Present?**

When you're logged in, you'll see these cookies:

1. **`sb-ewvzppahjocjpipaywlg-auth-token`** ← **USE THIS ONE** ✅
   - This is your Supabase authentication token
   - Required for API authentication
   - Format: Base64-encoded JWT token
   - Example: `base64-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

2. **`_vercel_jwt`** ❌
   - Vercel's internal JWT token
   - Not needed for push notifications
   - Don't use this one

### **How to Extract the Token**

**Option 1: DevTools (Easiest)**
```
F12 → Application → Cookies → sb-ewvzppahjocjpipaywlg-auth-token → Copy Value
```

**Option 2: Console**
```javascript
// Run in browser console:
document.cookie.split('; ').find(row => row.startsWith('sb-ewvzppahjocjpipaywlg-auth-token=')).split('=')[1]
```

**Option 3: Copy All Cookies**
```javascript
// Run in browser console:
document.cookie
// Then use the entire string in the Cookie header
```

---

## 🎯 Common Use Cases

### **1. Send to Current User (All Devices)**

```bash
curl -X POST https://finance-buddy-ajsr6xw8r-dheerajs-projects-74ed43fb.vercel.app/api/push/send \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-ewvzppahjocjpipaywlg-auth-token=YOUR_TOKEN" \
  -d '{"title": "Hello", "body": "Test", "url": "/"}'
```

### **2. Send to Specific User by ID**

```bash
curl -X POST https://finance-buddy-ajsr6xw8r-dheerajs-projects-74ed43fb.vercel.app/api/push/send \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-ewvzppahjocjpipaywlg-auth-token=YOUR_TOKEN" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Hello",
    "body": "Test",
    "url": "/"
  }'
```

### **3. Transaction Notification**

```bash
curl -X POST https://finance-buddy-ajsr6xw8r-dheerajs-projects-74ed43fb.vercel.app/api/push/send \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-ewvzppahjocjpipaywlg-auth-token=YOUR_TOKEN" \
  -d '{
    "title": "💳 New Transaction",
    "body": "₹1,250 from HDFC Bank",
    "url": "/transactions",
    "data": {"amount": 1250, "merchant": "HDFC Bank"}
  }'
```

---

## ❌ Troubleshooting

### **Error: "Unauthorized" (401)**
- ✅ Check that you copied the correct cookie: `sb-ewvzppahjocjpipaywlg-auth-token`
- ✅ Make sure you're logged in
- ✅ Token might have expired - login again and get a new token

### **Error: "No subscriptions found for user" (404)**
- ✅ Enable push notifications in `/settings` first
- ✅ Grant browser permission when prompted
- ✅ Check that notifications are enabled in browser settings

### **No Notification Appears**
- ✅ Check browser notification permissions
- ✅ Check that notifications aren't blocked for the site
- ✅ Try sending a test notification from `/test-push` page
- ✅ Check browser console for errors

### **Response: "sent": 0**
- ✅ User hasn't enabled push notifications
- ✅ All devices are offline or subscriptions expired
- ✅ Check the `failed` count in response

---

## 📊 Response Format

```json
{
  "success": true,
  "sent": 3,      // Successfully sent to 3 devices
  "failed": 0,    // 0 failures
  "total": 3      // Total devices attempted
}
```

---

## 🔗 Quick Links

- **Production App**: https://finance-buddy-ajsr6xw8r-dheerajs-projects-74ed43fb.vercel.app
- **Settings Page**: https://finance-buddy-ajsr6xw8r-dheerajs-projects-74ed43fb.vercel.app/settings
- **Test Page**: https://finance-buddy-ajsr6xw8r-dheerajs-projects-74ed43fb.vercel.app/test-push
- **Login**: `dheerajsaraf1996@gmail.com` / `Abcd1234`

---

## 📚 Full Documentation

- **cURL Examples**: `CURL_PUSH_NOTIFICATION_EXAMPLES.md`
- **API Reference**: `docs/PUSH_NOTIFICATIONS_API.md`
- **Integration Guide**: `docs/PUSH_NOTIFICATIONS_INTEGRATION.md`
- **Complete Summary**: `PUSH_NOTIFICATIONS_SUMMARY.md`

---

**Ready to test? Copy the cURL command above and replace `YOUR_TOKEN` with your actual auth token!** 🚀

