# Gmail Pub/Sub Implementation Checklist

## 📋 Complete Implementation Checklist

Use this checklist to track your implementation progress.

---

## Phase 1: Database Schema & Types ✅

### Database Migration
- [ ] Create migration file: `infra/migrations/0003_gmail_watch_subscriptions.sql`
- [ ] Add `fb_gmail_watch_subscriptions` table
- [ ] Add columns to `fb_gmail_connections` table
- [ ] Add `fb_webhook_logs` table
- [ ] Create indexes
- [ ] Add RLS policies
- [ ] Add comments
- [ ] Test migration locally
- [ ] Apply migration to production

### TypeScript Types
- [ ] Update `src/types/database.ts`
- [ ] Add `fb_gmail_watch_subscriptions` types
- [ ] Update `fb_gmail_connections` types
- [ ] Add `fb_webhook_logs` types
- [ ] Verify types compile

### Verification
- [ ] Tables created successfully
- [ ] Indexes created
- [ ] RLS policies active
- [ ] Types match database schema
- [ ] No breaking changes

---

## Phase 2: Gmail Watch Management ✅

### Watch Manager Service
- [ ] Create `src/lib/gmail-watch/watch-manager.ts`
- [ ] Implement `setupWatch()` method
- [ ] Implement `renewWatch()` method
- [ ] Implement `stopWatch()` method
- [ ] Implement `getWatchStatus()` method
- [ ] Implement `findExpiringSoon()` method
- [ ] Add error handling
- [ ] Add logging

### Watch Renewal Cron
- [ ] Create `src/pages/api/cron/gmail-watch-renewal.ts`
- [ ] Implement renewal logic
- [ ] Add cron secret verification
- [ ] Test locally
- [ ] Add to `vercel.json` cron config

### Testing
- [ ] Unit tests for WatchManager
- [ ] Test watch setup
- [ ] Test watch renewal
- [ ] Test watch stop
- [ ] Test error scenarios

---

## Phase 3: Webhook Handler ✅

### Webhook Validator
- [ ] Create `src/lib/gmail-watch/webhook-validator.ts`
- [ ] Implement `validateMessage()`
- [ ] Implement `parseMessage()`
- [ ] Implement `verifyToken()`
- [ ] Add error handling

### History Sync Service
- [ ] Create `src/lib/gmail-watch/history-sync.ts`
- [ ] Implement `syncFromHistory()`
- [ ] Implement `processNewMessages()`
- [ ] Add deduplication logic
- [ ] Add error handling

### Webhook Endpoint
- [ ] Create `src/pages/api/gmail/webhook.ts`
- [ ] Implement message validation
- [ ] Implement notification parsing
- [ ] Integrate with HistorySync
- [ ] Add logging
- [ ] Test with mock Pub/Sub messages

### Testing
- [ ] Test webhook validation
- [ ] Test message parsing
- [ ] Test history sync
- [ ] Test with real Gmail account
- [ ] Verify email processing

---

## Phase 4: Optimization ✅

### History Gap Detection
- [ ] Implement `detectHistoryGap()`
- [ ] Implement `performFullSync()`
- [ ] Test gap detection
- [ ] Test fallback to full sync

### Batch Processing
- [ ] Implement `batchProcessHistory()`
- [ ] Test with large history
- [ ] Optimize batch size

### Rate Limiting
- [ ] Implement `RateLimiter` class
- [ ] Add throttling to API calls
- [ ] Test rate limiting

### Deduplication
- [ ] Implement `filterDuplicates()`
- [ ] Test duplicate detection
- [ ] Verify no duplicate processing

### Testing
- [ ] Test all optimizations
- [ ] Performance benchmarks
- [ ] Load testing

---

## Phase 5: GCP Setup & Configuration ✅

### Pub/Sub Topic
- [ ] Create topic: `gmail-notifications`
- [ ] Grant Gmail API publish permissions
- [ ] Verify topic created
- [ ] Test topic permissions

### Push Subscription
- [ ] Create subscription: `gmail-notifications-push`
- [ ] Configure webhook endpoint
- [ ] Set acknowledgement deadline
- [ ] Verify subscription created

### Service Account (Optional)
- [ ] Create service account
- [ ] Assign Pub/Sub Subscriber role
- [ ] Create JSON key
- [ ] Store key securely

### Environment Variables
- [ ] Add `GCP_PROJECT_ID` to Vercel
- [ ] Add `PUBSUB_TOPIC_NAME` to Vercel
- [ ] Add `PUBSUB_WEBHOOK_TOKEN` to Vercel
- [ ] Add service account credentials (if using)
- [ ] Verify variables in production

### Testing
- [ ] Test topic publish
- [ ] Test subscription delivery
- [ ] Test webhook receives messages
- [ ] Monitor GCP metrics

---

## Phase 6: Migration & Testing ✅

### Migration API
- [ ] Create `src/pages/api/gmail/watch/migrate.ts`
- [ ] Implement enable watch logic
- [ ] Implement disable watch logic
- [ ] Add authentication
- [ ] Test migration endpoint

### Batch Migration Script
- [ ] Create `scripts/migrate-to-watch.ts`
- [ ] Implement dry run mode
- [ ] Implement live migration
- [ ] Add error handling
- [ ] Test with test users

### Testing Plan
- [ ] Local testing complete
- [ ] Staging testing complete
- [ ] Production pilot (5 users)
- [ ] Monitor for 48 hours
- [ ] Gradual rollout plan

### Rollback Plan
- [ ] Document rollback procedure
- [ ] Test rollback locally
- [ ] Prepare rollback script

---

## Phase 7: Monitoring & Maintenance ✅

### Webhook Logger
- [ ] Create `src/lib/gmail-watch/webhook-logger.ts`
- [ ] Implement `logWebhook()`
- [ ] Implement `getRecentActivity()`
- [ ] Implement `getSuccessRate()`
- [ ] Create `fb_webhook_logs` table

### Alert Manager
- [ ] Create `src/lib/gmail-watch/alert-manager.ts`
- [ ] Implement `checkExpiringWatches()`
- [ ] Implement `checkFailedWatches()`
- [ ] Implement `checkWebhookHealth()`
- [ ] Configure alert delivery

### Health Check Cron
- [ ] Create `src/pages/api/cron/watch-health-check.ts`
- [ ] Implement health checks
- [ ] Add to `vercel.json` cron config
- [ ] Test health checks

### Admin Dashboard
- [ ] Create `src/pages/admin/watch-health.tsx`
- [ ] Display watch metrics
- [ ] Show recent activity
- [ ] Show error logs
- [ ] Add refresh functionality

### Documentation
- [ ] Create operational runbook
- [ ] Document common issues
- [ ] Document escalation procedures
- [ ] Update API documentation

---

## Final Verification ✅

### Code Quality
- [ ] All files created
- [ ] Code reviewed
- [ ] Tests passing
- [ ] No TypeScript errors
- [ ] No linting errors

### Deployment
- [ ] Code deployed to production
- [ ] Environment variables set
- [ ] Cron jobs configured
- [ ] GCP resources created
- [ ] Monitoring active

### Functionality
- [ ] Watch setup works
- [ ] Webhook receives messages
- [ ] Emails sync automatically
- [ ] Transactions extracted
- [ ] Notifications created
- [ ] Watch renewal works
- [ ] Error handling works

### Performance
- [ ] Notification latency < 30s
- [ ] Gmail API quota reduced
- [ ] No missed emails
- [ ] Watch uptime > 99%
- [ ] Webhook success rate > 99%

### Documentation
- [ ] All phase docs complete
- [ ] README updated
- [ ] API docs updated
- [ ] Runbook created
- [ ] Team trained

---

## 🎉 Implementation Complete!

When all checkboxes are checked, your Gmail Pub/Sub implementation is complete and production-ready!

---

**Last Updated**: 2025-11-08
**Version**: 1.0

