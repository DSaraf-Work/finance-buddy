# Gmail Pub/Sub - Quick Start Guide

## 🚀 Get Started in 30 Minutes

This guide helps you implement Gmail Pub/Sub real-time notifications quickly.

---

## 📋 Prerequisites

- [ ] Finance Buddy codebase
- [ ] Google Cloud Platform account
- [ ] Vercel account with production deployment
- [ ] Gmail OAuth already configured

---

## ⚡ Quick Implementation Steps

### **Step 1: Database Setup (5 minutes)**

```bash
# Apply migration
cd /path/to/finance-buddy
npm run supabase:migrate

# Or manually run SQL from:
# dev/gmail-pub-sub/final-plan/01-PHASE1-DATABASE.md
```

### **Step 2: GCP Setup (10 minutes)**

```bash
# Set your project ID
export GCP_PROJECT_ID="your-project-id"

# Create Pub/Sub topic
gcloud pubsub topics create gmail-notifications \
  --project=$GCP_PROJECT_ID

# Grant Gmail API permissions
gcloud pubsub topics add-iam-policy-binding gmail-notifications \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher \
  --project=$GCP_PROJECT_ID

# Create push subscription
gcloud pubsub subscriptions create gmail-notifications-push \
  --topic=gmail-notifications \
  --push-endpoint=https://finance-buddy-sand.vercel.app/api/gmail/webhook \
  --project=$GCP_PROJECT_ID
```

### **Step 3: Add Environment Variables (3 minutes)**

Go to: https://vercel.com/dheerajs-projects-74ed43fb/finance-buddy/settings/environment-variables

Add these variables:

```env
GCP_PROJECT_ID=your-project-id
PUBSUB_TOPIC_NAME=projects/your-project-id/topics/gmail-notifications
PUBSUB_WEBHOOK_TOKEN=generate-random-secure-token-here
```

### **Step 4: Deploy Code (5 minutes)**

Copy the implementation files from the plan:

```bash
# Create directories
mkdir -p src/lib/gmail-watch
mkdir -p src/pages/api/gmail/watch
mkdir -p src/pages/api/cron

# Copy files (you'll need to create these from the plan)
# - src/lib/gmail-watch/watch-manager.ts
# - src/lib/gmail-watch/history-sync.ts
# - src/lib/gmail-watch/webhook-validator.ts
# - src/pages/api/gmail/webhook.ts
# - src/pages/api/cron/gmail-watch-renewal.ts

# Deploy to Vercel
git add .
git commit -m "Add Gmail Pub/Sub support"
git push origin main
```

### **Step 5: Test (5 minutes)**

```bash
# Test webhook endpoint
curl -X POST https://finance-buddy-sand.vercel.app/api/gmail/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "data": "eyJlbWFpbEFkZHJlc3MiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaGlzdG9yeUlkIjoiMTIzNDUifQ==",
      "messageId": "test-123",
      "publishTime": "2025-11-08T10:00:00Z"
    }
  }'

# Expected response: {"received": true, ...}
```

### **Step 6: Enable Watch for Test User (2 minutes)**

```bash
# Via API or admin dashboard
curl -X POST https://finance-buddy-sand.vercel.app/api/gmail/watch/migrate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "connection_id": "your-connection-id",
    "enable_watch": true
  }'
```

---

## 📁 Files to Create

### **Priority 1: Core Functionality**

1. **`src/lib/gmail-watch/watch-manager.ts`**
   - Copy from: `02-PHASE2-WATCH-MANAGER.md`
   - Lines: ~200

2. **`src/lib/gmail-watch/history-sync.ts`**
   - Copy from: `03-PHASE3-WEBHOOK-HANDLER.md`
   - Lines: ~150

3. **`src/lib/gmail-watch/webhook-validator.ts`**
   - Copy from: `03-PHASE3-WEBHOOK-HANDLER.md`
   - Lines: ~50

4. **`src/pages/api/gmail/webhook.ts`**
   - Copy from: `03-PHASE3-WEBHOOK-HANDLER.md`
   - Lines: ~100

### **Priority 2: Maintenance**

5. **`src/pages/api/cron/gmail-watch-renewal.ts`**
   - Copy from: `02-PHASE2-WATCH-MANAGER.md`
   - Lines: ~50

6. **`src/pages/api/gmail/watch/migrate.ts`**
   - Copy from: `06-PHASE6-MIGRATION.md`
   - Lines: ~80

### **Priority 3: Monitoring (Optional)**

7. **`src/lib/gmail-watch/webhook-logger.ts`**
   - Copy from: `07-PHASE7-MONITORING.md`
   - Lines: ~80

8. **`src/pages/admin/watch-health.tsx`**
   - Create dashboard UI
   - Lines: ~200

---

## 🧪 Testing Checklist

- [ ] Database migration applied
- [ ] GCP Pub/Sub topic created
- [ ] Push subscription created
- [ ] Environment variables set
- [ ] Code deployed to Vercel
- [ ] Webhook endpoint responds
- [ ] Watch setup works for test user
- [ ] Send test email and verify notification

---

## 📊 Verification

### **Check Watch Status**
```sql
SELECT 
  c.email_address,
  w.status,
  w.expiration,
  w.last_renewed_at
FROM fb_gmail_watch_subscriptions w
JOIN fb_gmail_connections c ON c.id = w.connection_id
WHERE w.status = 'active';
```

### **Check Webhook Logs**
```bash
# Vercel dashboard
https://vercel.com/dheerajs-projects-74ed43fb/finance-buddy/logs

# Or via CLI
vercel logs finance-buddy --follow
```

### **Check GCP Metrics**
```bash
# Topic metrics
gcloud pubsub topics describe gmail-notifications

# Subscription metrics
gcloud pubsub subscriptions describe gmail-notifications-push
```

---

## 🚨 Troubleshooting

### **Webhook Not Receiving Messages**
1. Check GCP subscription status
2. Verify webhook URL is correct
3. Check Vercel deployment status
4. Test webhook manually with curl

### **Watch Setup Fails**
1. Check Gmail OAuth token is valid
2. Verify GCP_PROJECT_ID is correct
3. Check PUBSUB_TOPIC_NAME format
4. Review error logs in Vercel

### **No Emails Synced**
1. Check history_id is being updated
2. Verify manual sync API works
3. Check email processing logs
4. Test with known financial email

---

## 📚 Next Steps

After quick start:

1. **Read Full Documentation**
   - Review all 7 phase documents
   - Understand architecture
   - Learn monitoring procedures

2. **Implement Monitoring**
   - Add webhook logger
   - Create health dashboard
   - Set up alerts

3. **Gradual Migration**
   - Start with 5 test users
   - Monitor for 48 hours
   - Gradually increase to all users

4. **Optimize**
   - Review performance metrics
   - Tune batch sizes
   - Optimize API calls

---

## 🎯 Success Criteria

You're successful when:
- ✅ Webhook receives Pub/Sub messages
- ✅ New emails appear within 30 seconds
- ✅ Transactions extracted automatically
- ✅ Notifications created
- ✅ No errors in logs

---

## 📞 Need Help?

- **Documentation**: See all phase documents in `dev/gmail-pub-sub/final-plan/`
- **Architecture**: See `00-OVERVIEW.md`
- **Troubleshooting**: See each phase document
- **Summary**: See `IMPLEMENTATION-SUMMARY.md`

---

**Good luck! 🚀**

**Estimated Time**: 30 minutes for basic setup
**Estimated Time**: 2-3 days for full production deployment

