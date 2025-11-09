# Phase 5: GCP Setup & Configuration

## 🎯 Objective
Set up Google Cloud Platform infrastructure for Pub/Sub and configure permissions.

---

## 📋 Prerequisites

- Google Cloud Platform account with billing enabled
- GCP Project created (or use existing)
- gcloud CLI installed (optional, can use Console)
- Vercel production domain: `finance-buddy-sand.vercel.app`

---

## 🔧 Step 1: Create Pub/Sub Topic

### **Via Console**
1. Go to: https://console.cloud.google.com/cloudpubsub/topic/list
2. Click **"CREATE TOPIC"**
3. **Topic ID**: `gmail-notifications`
4. Leave other settings as default
5. Click **"CREATE"**

### **Via gcloud CLI**
```bash
gcloud pubsub topics create gmail-notifications \
  --project=YOUR_PROJECT_ID
```

### **Topic Name Format**
```
projects/YOUR_PROJECT_ID/topics/gmail-notifications
```

**Save this full topic name** - you'll need it for environment variables.

---

## 🔧 Step 2: Grant Gmail Publish Permissions

Gmail needs permission to publish to your topic.

### **Via Console**
1. Go to topic: https://console.cloud.google.com/cloudpubsub/topic/detail/gmail-notifications
2. Click **"PERMISSIONS"** tab
3. Click **"ADD PRINCIPAL"**
4. **New principals**: `gmail-api-push@system.gserviceaccount.com`
5. **Role**: `Pub/Sub Publisher`
6. Click **"SAVE"**

### **Via gcloud CLI**
```bash
gcloud pubsub topics add-iam-policy-binding gmail-notifications \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher \
  --project=YOUR_PROJECT_ID
```

---

## 🔧 Step 3: Create Push Subscription

### **Via Console**
1. Go to: https://console.cloud.google.com/cloudpubsub/subscription/list
2. Click **"CREATE SUBSCRIPTION"**
3. **Subscription ID**: `gmail-notifications-push`
4. **Select a Cloud Pub/Sub topic**: `gmail-notifications`
5. **Delivery type**: `Push`
6. **Endpoint URL**: `https://finance-buddy-sand.vercel.app/api/gmail/webhook`
7. **Acknowledgement deadline**: `10 seconds` (default)
8. **Message retention duration**: `7 days` (default)
9. **Retry policy**: `Exponential backoff` (default)
10. Click **"CREATE"**

### **Via gcloud CLI**
```bash
gcloud pubsub subscriptions create gmail-notifications-push \
  --topic=gmail-notifications \
  --push-endpoint=https://finance-buddy-sand.vercel.app/api/gmail/webhook \
  --ack-deadline=10 \
  --message-retention-duration=7d \
  --project=YOUR_PROJECT_ID
```

---

## 🔧 Step 4: Create Service Account (Optional)

For additional security and monitoring.

### **Via Console**
1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Click **"CREATE SERVICE ACCOUNT"**
3. **Service account name**: `finance-buddy-pubsub`
4. **Service account ID**: `finance-buddy-pubsub`
5. Click **"CREATE AND CONTINUE"**
6. **Role**: `Pub/Sub Subscriber`
7. Click **"CONTINUE"**
8. Click **"DONE"**

### **Create Key**
1. Click on the service account
2. Go to **"KEYS"** tab
3. Click **"ADD KEY"** → **"Create new key"**
4. **Key type**: `JSON`
5. Click **"CREATE"**
6. **Save the JSON file securely**

---

## 🔧 Step 5: Configure Vercel Environment Variables

Add these environment variables to Vercel:

### **Required Variables**

| Variable | Value | Description |
|----------|-------|-------------|
| `GCP_PROJECT_ID` | Your GCP project ID | e.g., `finance-buddy-123456` |
| `PUBSUB_TOPIC_NAME` | Full topic name | `projects/YOUR_PROJECT_ID/topics/gmail-notifications` |
| `PUBSUB_WEBHOOK_TOKEN` | Random secure token | Optional security token |

### **Optional Variables (if using service account)**

| Variable | Value | Description |
|----------|-------|-------------|
| `GCP_SERVICE_ACCOUNT_EMAIL` | Service account email | From JSON key file |
| `GCP_PRIVATE_KEY` | Private key | From JSON key file (base64 encoded) |

### **Add to Vercel**

**Direct URL:**
```
https://vercel.com/dheerajs-projects-74ed43fb/finance-buddy/settings/environment-variables
```

**Steps:**
1. Click **"Add New"**
2. Enter variable name and value
3. Select environments: Production, Preview, Development
4. Click **"Save"**
5. Repeat for all variables

---

## 🔧 Step 6: Verify Domain (Recommended)

### **Via Google Search Console**
1. Go to: https://search.google.com/search-console
2. Click **"Add property"**
3. Enter: `https://finance-buddy-sand.vercel.app`
4. Choose verification method:
   - **HTML file upload** (easiest for Vercel)
   - **DNS record** (if you control DNS)
5. Follow verification steps
6. Click **"VERIFY"**

### **Why Verify?**
- Enhanced security
- Better monitoring
- Required for some Gmail API features

---

## 🔧 Step 7: Test Pub/Sub Setup

### **Test Message Publishing**

```bash
# Publish test message
gcloud pubsub topics publish gmail-notifications \
  --message='{"emailAddress":"test@example.com","historyId":"12345"}' \
  --project=YOUR_PROJECT_ID
```

### **Check Webhook Logs**

1. Go to Vercel deployment logs
2. Look for webhook POST requests
3. Verify message received and parsed

---

## 📝 Configuration Summary

### **GCP Resources Created**
- ✅ Pub/Sub Topic: `gmail-notifications`
- ✅ Push Subscription: `gmail-notifications-push`
- ✅ IAM Binding: Gmail API → Pub/Sub Publisher
- ✅ Service Account: `finance-buddy-pubsub` (optional)

### **Vercel Environment Variables**
```env
GCP_PROJECT_ID=your-project-id
PUBSUB_TOPIC_NAME=projects/your-project-id/topics/gmail-notifications
PUBSUB_WEBHOOK_TOKEN=your-secure-random-token
```

### **Webhook Endpoint**
```
https://finance-buddy-sand.vercel.app/api/gmail/webhook
```

---

## 🔒 Security Checklist

- [ ] Webhook token configured
- [ ] HTTPS endpoint only
- [ ] Service account permissions minimal
- [ ] Domain verified
- [ ] IAM policies reviewed
- [ ] Webhook validates messages
- [ ] Rate limiting configured

---

## 🧪 Testing Commands

### **Test Topic Exists**
```bash
gcloud pubsub topics describe gmail-notifications \
  --project=YOUR_PROJECT_ID
```

### **Test Subscription Exists**
```bash
gcloud pubsub subscriptions describe gmail-notifications-push \
  --project=YOUR_PROJECT_ID
```

### **Test IAM Permissions**
```bash
gcloud pubsub topics get-iam-policy gmail-notifications \
  --project=YOUR_PROJECT_ID
```

### **Monitor Subscription**
```bash
gcloud pubsub subscriptions pull gmail-notifications-push \
  --limit=10 \
  --project=YOUR_PROJECT_ID
```

---

## 📊 Monitoring

### **GCP Console Monitoring**
- Topic metrics: https://console.cloud.google.com/cloudpubsub/topic/detail/gmail-notifications
- Subscription metrics: https://console.cloud.google.com/cloudpubsub/subscription/detail/gmail-notifications-push
- Logs: https://console.cloud.google.com/logs

### **Key Metrics to Monitor**
- Message publish rate
- Message delivery rate
- Delivery latency
- Error rate
- Undelivered messages

---

## 💰 Cost Estimation

### **Free Tier (Monthly)**
- First 10 GB of messages: **FREE**
- First 10 GB of egress: **FREE**

### **Expected Usage**
- Average message size: ~500 bytes
- Messages per user per day: ~10
- 100 users: ~1,000 messages/day = ~15 MB/month
- **Cost**: $0 (well within free tier)

---

## ✅ Verification Checklist

- [ ] Pub/Sub topic created
- [ ] Gmail publish permissions granted
- [ ] Push subscription created
- [ ] Webhook endpoint configured
- [ ] Environment variables set in Vercel
- [ ] Domain verified (optional)
- [ ] Test message published successfully
- [ ] Webhook received test message
- [ ] Monitoring configured

---

**Next Phase**: Phase 6 - Migration & Testing

