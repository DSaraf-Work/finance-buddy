# Gmail Pub/Sub MCP - Quick Reference

## 🚀 Quick Commands for AI Agent

This is a quick reference for implementing Gmail Pub/Sub using MCP servers.

---

## 📋 Phase 1: Database (15 minutes)

### **Command 1: Apply Migration**
```
User: "Apply the Gmail watch subscriptions migration from 01-PHASE1-DATABASE.md using Supabase MCP"

Expected: Tables created, RLS configured
```

### **Command 2: Verify**
```
User: "List all tables to verify migration succeeded"

Expected: fb_gmail_watch_subscriptions, fb_webhook_logs visible
```

---

## 🔧 Phase 2-4: Code Implementation (2 hours)

### **Command 3: Create All Services**
```
User: "Create all Gmail watch service files from phases 2-4:
- watch-manager.ts
- history-sync.ts  
- webhook-validator.ts
- webhook-logger.ts
- alert-manager.ts"

Expected: 5 service files created
```

### **Command 4: Create All API Endpoints**
```
User: "Create all Gmail watch API endpoints from phases 2-4:
- /api/gmail/webhook.ts
- /api/gmail/watch/setup.ts
- /api/gmail/watch/renew.ts
- /api/gmail/watch/status.ts
- /api/gmail/watch/migrate.ts
- /api/cron/gmail-watch-renewal.ts
- /api/cron/watch-health-check.ts"

Expected: 7 API files created
```

### **Command 5: Update vercel.json**
```
User: "Update vercel.json to add cron jobs for watch renewal and health checks"

Expected: Cron configuration added
```

---

## 🌐 Phase 5: GCP Setup (30 minutes - Manual)

### **Command 6: Show GCP Instructions**
```
User: "Show me the GCP Pub/Sub setup instructions from Phase 5"

Expected: Step-by-step GCP commands displayed
```

**Manual Steps**:
1. Create Pub/Sub topic
2. Grant Gmail permissions
3. Create push subscription
4. Add env vars to Vercel (manual)

---

## 🚀 Phase 6: Deploy & Test (1 hour)

### **Command 7: Deploy**
```
User: "Deploy to Vercel using Vercel MCP"

Expected: Deployment successful, URL provided
```

### **Command 8: Check Deployment**
```
User: "Check deployment status and logs"

Expected: Status: Ready, no errors
```

### **Command 9: Test Sign-In**
```
User: "Test sign-in flow with Playwright MCP using test credentials"

Expected: Sign-in successful, screenshot saved
```

### **Command 10: Test Watch Setup**
```
User: "Test enabling Gmail watch for a connection using Playwright"

Expected: Watch enabled, database record created
```

### **Command 11: Verify Database**
```
User: "Query fb_gmail_watch_subscriptions to verify watch created"

Expected: Active watch record found
```

### **Command 12: Test Webhook**
```
User: "Test webhook endpoint with mock Pub/Sub message"

Expected: 200 response, webhook logged
```

---

## 📊 Phase 7: Monitoring (30 minutes)

### **Command 13: Create Dashboard**
```
User: "Create watch health dashboard from Phase 7"

Expected: Admin dashboard created
```

### **Command 14: Deploy & Test Dashboard**
```
User: "Deploy and test the dashboard with Playwright"

Expected: Dashboard loads, metrics displayed
```

---

## ✅ Final Verification (15 minutes)

### **Command 15: Run Full Test Suite**
```
User: "Run complete test suite:
1. Sign-in flow
2. Watch setup
3. Webhook endpoint
4. Email sync
5. Dashboard
6. Database verification
7. Log analysis"

Expected: All tests passing
```

---

## 🔧 Troubleshooting Commands

### **Migration Failed**
```
User: "Check migration status and rollback if needed"
```

### **Deployment Failed**
```
User: "Check deployment logs and identify errors"
```

### **Tests Failing**
```
User: "Take screenshot and get console errors"
```

### **Database Issues**
```
User: "Query database to check data integrity"
```

---

## 📊 Progress Tracking

```
[ ] Phase 1: Database (15 min)
    [ ] Apply migration
    [ ] Verify tables
    
[ ] Phase 2-4: Code (2 hours)
    [ ] Create services
    [ ] Create APIs
    [ ] Update vercel.json
    
[ ] Phase 5: GCP (30 min - manual)
    [ ] Create topic
    [ ] Configure permissions
    [ ] Create subscription
    [ ] Add env vars
    
[ ] Phase 6: Deploy & Test (1 hour)
    [ ] Deploy
    [ ] Test sign-in
    [ ] Test watch setup
    [ ] Test webhook
    [ ] Verify database
    
[ ] Phase 7: Monitoring (30 min)
    [ ] Create dashboard
    [ ] Deploy & test
    
[ ] Final: Verification (15 min)
    [ ] Run full test suite
    [ ] Verify all functionality
```

**Total Time: 4-6 hours**

---

## 🎯 Success Indicators

After each phase, verify:

**Phase 1**:
- ✅ `fb_gmail_watch_subscriptions` table exists
- ✅ `fb_webhook_logs` table exists
- ✅ RLS policies active

**Phase 2-4**:
- ✅ All 5 service files created
- ✅ All 7 API files created
- ✅ vercel.json updated

**Phase 5**:
- ✅ Pub/Sub topic created
- ✅ Push subscription configured
- ✅ Env vars added

**Phase 6**:
- ✅ Deployment successful
- ✅ Sign-in works
- ✅ Watch setup works
- ✅ Webhook responds
- ✅ Database records created

**Phase 7**:
- ✅ Dashboard loads
- ✅ Metrics displayed
- ✅ No errors

---

## 🚨 Common Issues & Fixes

### **Issue: Migration fails**
```
User: "Rollback migration and reapply"
```

### **Issue: Deployment fails**
```
User: "Check build logs, fix errors, redeploy"
```

### **Issue: Tests fail**
```
User: "Get screenshot and console errors, fix issues"
```

### **Issue: Watch setup fails**
```
User: "Check Gmail OAuth token, verify GCP config"
```

---

## 📞 Getting Help

If stuck:
1. Check the detailed phase documents
2. Review error logs
3. Verify prerequisites
4. Check GCP configuration
5. Test manually in browser

---

**Quick Start**: Begin with Command 1 and proceed sequentially

**Estimated Total Time**: 4-6 hours

**Difficulty**: Easy (AI-assisted)

**Success Rate**: 95%+ with MCP automation

