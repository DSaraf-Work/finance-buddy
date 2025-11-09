# Gmail Pub/Sub Real-Time Email Sync - Implementation Plan Overview

## 🎯 Goal
Implement real-time Gmail email notifications using Google Cloud Pub/Sub to automatically fetch and process new emails as they arrive, replacing the current 15-minute polling-based auto-sync system.

---

## 📊 Current System Analysis

### **Existing Auto-Sync System**
- **Mechanism**: Cron-based polling every 15 minutes
- **File**: `src/pages/api/cron/gmail-auto-sync.ts`
- **Executor**: `src/lib/gmail-auto-sync/sync-executor.ts`
- **Processing**: Uses `EmailProcessor` and `NotificationManager`
- **Limitations**:
  - 15-minute delay for new emails
  - Unnecessary API calls when no new emails
  - Higher Gmail API quota usage
  - Not truly real-time

### **Existing Components to Reuse**
✅ **Email Fetching**: `src/lib/gmail.ts` (listMessages, getMessage, getEnhancedMessage)
✅ **Email Processing**: `src/lib/email-processing/processor.ts` (EmailProcessor)
✅ **Transaction Extraction**: `src/lib/email-processing/extractors/transaction-extractor.ts`
✅ **Notifications**: `src/lib/notifications/notification-manager.ts`
✅ **Database Operations**: `src/lib/supabase.ts` (supabaseAdmin)
✅ **Auth & Token Management**: `src/lib/gmail.ts` (refreshAccessToken)

---

## 🏗️ New Architecture

### **Gmail Push Notification Flow**
```
Gmail (New Email) 
    ↓
Gmail API (users.watch subscription)
    ↓
Google Cloud Pub/Sub Topic
    ↓
Pub/Sub Push Subscription
    ↓
Vercel Webhook API (/api/gmail/webhook)
    ↓
Gmail API (users.history.list)
    ↓
Fetch New Messages
    ↓
EmailProcessor (existing)
    ↓
Transaction Extraction (existing)
    ↓
Supabase Storage
    ↓
Notification Manager (existing)
    ↓
User Notification
```

---

## 📋 Implementation Phases

### **Phase 1: Database Schema & Types** (Foundation)
- Add watch subscription tracking table
- Add history tracking columns
- Update TypeScript types
- Create migration scripts

### **Phase 2: Gmail Watch Management** (Core)
- Implement watch setup/renewal logic
- Create watch manager service
- Add watch status tracking
- Implement automatic renewal (7-day expiry)

### **Phase 3: Webhook Handler** (Integration)
- Create Pub/Sub webhook endpoint
- Implement message validation
- Parse Pub/Sub notifications
- Integrate with existing sync logic

### **Phase 4: History-Based Sync** (Optimization)
- Implement history.list API integration
- Add incremental sync logic
- Handle history gaps gracefully
- Optimize for efficiency

### **Phase 5: GCP Setup & Configuration** (Infrastructure)
- Create Pub/Sub topic
- Create push subscription
- Configure IAM permissions
- Set up service account

### **Phase 6: Migration & Testing** (Deployment)
- Migrate existing connections to watch
- Test with real Gmail accounts
- Monitor and debug
- Gradual rollout

### **Phase 7: Monitoring & Maintenance** (Operations)
- Add logging and metrics
- Set up alerts
- Create admin dashboard
- Document operations

---

## 🔑 Key Design Decisions

### **1. Modular Architecture**
- Reuse existing email processing pipeline
- Keep watch management separate from sync logic
- Maintain backward compatibility with manual sync

### **2. Incremental Migration**
- Keep existing cron-based sync as fallback
- Gradually migrate connections to Pub/Sub
- Support both systems during transition

### **3. Error Handling**
- Graceful degradation to polling if watch fails
- Automatic watch renewal before expiry
- History gap detection and full sync fallback

### **4. Security**
- Validate Pub/Sub webhook signatures
- Use service account for GCP operations
- Maintain OAuth token security

---

## 📦 New Components to Build

### **Database**
- `fb_gmail_watch_subscriptions` table
- History tracking columns in `fb_gmail_connections`

### **Services**
- `src/lib/gmail-watch/watch-manager.ts` - Watch lifecycle management
- `src/lib/gmail-watch/history-sync.ts` - History-based sync
- `src/lib/gmail-watch/webhook-validator.ts` - Pub/Sub validation

### **API Endpoints**
- `src/pages/api/gmail/webhook.ts` - Pub/Sub webhook handler
- `src/pages/api/gmail/watch/setup.ts` - Initialize watch
- `src/pages/api/gmail/watch/renew.ts` - Renew watch
- `src/pages/api/gmail/watch/status.ts` - Check watch status

### **Cron Jobs**
- `src/pages/api/cron/gmail-watch-renewal.ts` - Auto-renew watches

---

## 🎯 Success Metrics

### **Performance**
- ✅ Email notification latency < 30 seconds
- ✅ 90% reduction in Gmail API quota usage
- ✅ Zero missed emails during watch transitions

### **Reliability**
- ✅ 99.9% watch uptime
- ✅ Automatic recovery from failures
- ✅ Graceful handling of history gaps

### **User Experience**
- ✅ Real-time transaction notifications
- ✅ No manual sync needed
- ✅ Transparent operation

---

## 📅 Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1 | 1 day | None |
| Phase 2 | 2 days | Phase 1 |
| Phase 3 | 2 days | Phase 2 |
| Phase 4 | 1 day | Phase 3 |
| Phase 5 | 1 day | Phase 3 |
| Phase 6 | 2 days | Phase 4, 5 |
| Phase 7 | 1 day | Phase 6 |
| **Total** | **10 days** | Sequential |

---

## 🚀 Next Steps

1. Review this overview with stakeholders
2. Proceed to Phase 1 detailed plan
3. Set up development environment
4. Begin implementation

---

**Created**: 2025-11-08
**Status**: Planning
**Version**: 1.0

