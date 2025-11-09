# Gmail Pub/Sub - MCP Step-by-Step Execution

## 🤖 AI Agent Execution Guide

This document provides exact commands for the AI agent to execute using MCP servers.

---

## 📋 Prerequisites

Before starting, ensure:
- [ ] Supabase MCP server connected
- [ ] Vercel MCP server connected
- [ ] Playwright MCP server connected
- [ ] GCP account ready (manual setup)
- [ ] Test credentials available

---

## 🚀 Phase 1: Database Setup (Automated)

### **Command 1: Create Migration File**

**AI Agent Action**: Create migration file

```bash
# File: infra/migrations/0003_gmail_watch_subscriptions.sql
```

**AI Agent**: Use `save-file` tool to create the migration with complete SQL from Phase 1.

---

### **Command 2: Apply Migration**

**AI Agent Action**: Apply migration using Supabase MCP

```
User: "Apply the Gmail watch subscriptions migration using Supabase MCP"

AI Agent will:
1. Read migration file content
2. Call supabase_mcp.apply_migration()
3. Verify success
4. Report results
```

**Expected Output**:
```
✅ Migration applied successfully
✅ Tables created: fb_gmail_watch_subscriptions, fb_webhook_logs
✅ Columns added to fb_gmail_connections
```

---

### **Command 3: Verify Database Schema**

**AI Agent Action**: List tables to verify

```
User: "List all tables in Supabase to verify migration"

AI Agent will:
1. Call supabase_mcp.list_tables()
2. Check for new tables
3. Confirm schema changes
```

**Expected Output**:
```
✅ fb_gmail_watch_subscriptions - exists
✅ fb_webhook_logs - exists
✅ fb_gmail_connections - updated with new columns
```

---

### **Command 4: Check RLS Policies**

**AI Agent Action**: Verify RLS policies

```
User: "Check RLS policies for watch subscriptions table"

AI Agent will:
1. Call supabase_mcp.execute_sql()
2. Query pg_policies
3. Verify policies exist
```

---

## 🔧 Phase 2: Watch Manager Implementation

### **Command 5: Create Watch Manager Service**

```
User: "Create the WatchManager service file from Phase 2 plan"

AI Agent will:
1. Read 02-PHASE2-WATCH-MANAGER.md
2. Extract WatchManager class code
3. Create src/lib/gmail-watch/watch-manager.ts
4. Add all methods (setupWatch, renewWatch, stopWatch)
```

---

### **Command 6: Create Watch Renewal Cron**

```
User: "Create the watch renewal cron job from Phase 2 plan"

AI Agent will:
1. Read 02-PHASE2-WATCH-MANAGER.md
2. Extract cron job code
3. Create src/pages/api/cron/gmail-watch-renewal.ts
4. Add cron secret verification
```

---

### **Command 7: Update vercel.json**

```
User: "Update vercel.json to add watch renewal cron job"

AI Agent will:
1. Read current vercel.json
2. Add cron configuration
3. Save updated file
```

**Expected Addition**:
```json
{
  "crons": [
    {
      "path": "/api/cron/gmail-watch-renewal",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

---

## 🌐 Phase 3: Webhook Handler

### **Command 8: Create Webhook Validator**

```
User: "Create the WebhookValidator service from Phase 3 plan"

AI Agent will:
1. Read 03-PHASE3-WEBHOOK-HANDLER.md
2. Create src/lib/gmail-watch/webhook-validator.ts
3. Implement validation methods
```

---

### **Command 9: Create History Sync Service**

```
User: "Create the HistorySync service from Phase 3 plan"

AI Agent will:
1. Read 03-PHASE3-WEBHOOK-HANDLER.md
2. Create src/lib/gmail-watch/history-sync.ts
3. Implement syncFromHistory method
```

---

### **Command 10: Create Webhook Endpoint**

```
User: "Create the webhook API endpoint from Phase 3 plan"

AI Agent will:
1. Read 03-PHASE3-WEBHOOK-HANDLER.md
2. Create src/pages/api/gmail/webhook.ts
3. Integrate validator and history sync
```

---

## ⚡ Phase 4: Optimizations

### **Command 11: Add Optimizations to History Sync**

```
User: "Add optimizations from Phase 4 to the HistorySync service"

AI Agent will:
1. Read 04-PHASE4-OPTIMIZATION.md
2. Update src/lib/gmail-watch/history-sync.ts
3. Add history gap detection
4. Add batch processing
5. Add rate limiting
6. Add deduplication
```

---

## 🚀 Phase 5: GCP Setup (Manual)

### **Command 12: Display GCP Setup Instructions**

```
User: "Show me the GCP setup instructions"

AI Agent will:
1. Read 05-PHASE5-GCP-SETUP.md
2. Display step-by-step instructions
3. Provide copy-paste commands
```

**User Action Required**:
- Create Pub/Sub topic manually
- Configure permissions manually
- Create push subscription manually
- Get GCP credentials

---

### **Command 13: Add GCP Environment Variables**

```
User: "I've completed GCP setup. Here are my credentials:
- GCP_PROJECT_ID: my-project-123
- PUBSUB_TOPIC_NAME: projects/my-project-123/topics/gmail-notifications
- PUBSUB_WEBHOOK_TOKEN: random-secure-token-here

Add these to Vercel"

AI Agent will:
1. Note: Vercel MCP doesn't support env var management
2. Provide manual instructions
3. Show Vercel dashboard URL
```

**Manual Action**: Add env vars via Vercel dashboard

---

## 🚀 Phase 6: Deployment & Testing

### **Command 14: Deploy to Vercel**

```
User: "Deploy the application to Vercel using Vercel MCP"

AI Agent will:
1. Call vercel_mcp.deploy_to_vercel()
2. Monitor deployment progress
3. Report deployment URL
```

**Expected Output**:
```
✅ Deployment started
✅ Building...
✅ Deployment complete
🌐 URL: https://finance-buddy-sand.vercel.app
```

---

### **Command 15: Check Deployment Status**

```
User: "Check the deployment status and logs"

AI Agent will:
1. Call vercel_mcp.get_deployment()
2. Call vercel_mcp.get_deployment_build_logs()
3. Analyze for errors
4. Report status
```

---

### **Command 16: Test with Playwright - Sign In**

```
User: "Test the application sign-in flow using Playwright MCP"

AI Agent will:
1. Call playwright_mcp.navigate() to production URL
2. Call playwright_mcp.fill_form() with test credentials
3. Call playwright_mcp.click() on sign-in button
4. Call playwright_mcp.wait_for() success indicator
5. Call playwright_mcp.take_screenshot()
6. Report results
```

---

### **Command 17: Test Watch Setup**

```
User: "Test enabling Gmail watch for a connection using Playwright"

AI Agent will:
1. Navigate to /admin page
2. Find connection in list
3. Click "Enable Watch" button
4. Wait for success message
5. Take screenshot
6. Verify in database using Supabase MCP
```

---

### **Command 18: Verify Database Records**

```
User: "Check if watch subscription was created in database"

AI Agent will:
1. Call supabase_mcp.execute_sql()
2. Query fb_gmail_watch_subscriptions
3. Verify record exists
4. Check status is 'active'
5. Report results
```

**Expected Query**:
```sql
SELECT 
  w.*,
  c.email_address
FROM fb_gmail_watch_subscriptions w
JOIN fb_gmail_connections c ON c.id = w.connection_id
WHERE w.status = 'active'
LIMIT 5;
```

---

### **Command 19: Test Webhook Endpoint**

```
User: "Test the webhook endpoint with a mock Pub/Sub message"

AI Agent will:
1. Use playwright_mcp.network_request() or curl
2. Send POST to /api/gmail/webhook
3. Include mock Pub/Sub message
4. Verify response
5. Check webhook logs in database
```

**Mock Message**:
```json
{
  "message": {
    "data": "eyJlbWFpbEFkZHJlc3MiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaGlzdG9yeUlkIjoiMTIzNDUifQ==",
    "messageId": "test-123",
    "publishTime": "2025-11-08T10:00:00Z"
  }
}
```

---

## 📊 Phase 7: Monitoring

### **Command 20: Create Webhook Logger**

```
User: "Create the WebhookLogger service from Phase 7 plan"

AI Agent will:
1. Read 07-PHASE7-MONITORING.md
2. Create src/lib/gmail-watch/webhook-logger.ts
3. Implement logging methods
```

---

### **Command 21: Create Alert Manager**

```
User: "Create the AlertManager service from Phase 7 plan"

AI Agent will:
1. Read 07-PHASE7-MONITORING.md
2. Create src/lib/gmail-watch/alert-manager.ts
3. Implement health check methods
```

---

### **Command 22: Create Health Check Cron**

```
User: "Create the health check cron job from Phase 7 plan"

AI Agent will:
1. Read 07-PHASE7-MONITORING.md
2. Create src/pages/api/cron/watch-health-check.ts
3. Update vercel.json with new cron
```

---

### **Command 23: Create Admin Dashboard**

```
User: "Create the watch health dashboard from Phase 7 plan"

AI Agent will:
1. Read 07-PHASE7-MONITORING.md
2. Create src/pages/admin/watch-health.tsx
3. Implement metrics display
4. Add refresh functionality
```

---

### **Command 24: Deploy and Test Dashboard**

```
User: "Deploy the monitoring updates and test the dashboard"

AI Agent will:
1. Deploy via Vercel MCP
2. Navigate to /admin/watch-health with Playwright
3. Verify dashboard loads
4. Check metrics displayed
5. Take screenshot
6. Report results
```

---

## ✅ Final Verification

### **Command 25: Run Complete Test Suite**

```
User: "Run the complete test suite to verify everything works"

AI Agent will:
1. Test sign-in flow
2. Test watch setup
3. Test webhook endpoint
4. Test email sync
5. Test dashboard
6. Verify database records
7. Check deployment logs
8. Generate test report
```

---

## 🎉 Success Criteria

Implementation is complete when:
- [ ] All database tables created
- [ ] All code files created
- [ ] Deployment successful
- [ ] Sign-in works
- [ ] Watch setup works
- [ ] Webhook receives messages
- [ ] Emails sync automatically
- [ ] Dashboard displays metrics
- [ ] No errors in logs
- [ ] All tests passing

---

**Estimated Time with MCP**: 4-6 hours (vs 10 days manual)

**Next**: Start with Command 1 and proceed sequentially

