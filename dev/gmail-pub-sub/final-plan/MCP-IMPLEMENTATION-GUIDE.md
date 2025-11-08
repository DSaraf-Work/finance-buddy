# Gmail Pub/Sub Implementation with MCP Servers

## 🤖 Automated Implementation Guide

This guide shows how to implement Gmail Pub/Sub using Supabase, Vercel, and Playwright MCP servers for automated implementation, testing, and deployment.

---

## 🎯 MCP Server Capabilities

### **Supabase MCP**
✅ Apply database migrations automatically
✅ Configure RLS policies
✅ Update database settings
✅ Run SQL queries
✅ List tables and extensions

### **Vercel MCP**
✅ Deploy to production
✅ List deployments
✅ Get deployment status
✅ Check deployment logs
✅ Get project details

### **Playwright MCP**
✅ Test web application flows
✅ Verify UI functionality
✅ Test OAuth flows
✅ Validate email sync
✅ Check notifications

---

## 📋 Implementation Workflow with MCP

### **Phase 1: Database Setup (Automated)**

#### **Step 1.1: Create Migration File**
```bash
# AI Agent will create the migration file
# File: infra/migrations/0003_gmail_watch_subscriptions.sql
```

#### **Step 1.2: Apply Migration via Supabase MCP**
```typescript
// AI Agent will use Supabase MCP to apply migration
await supabase_mcp.apply_migration({
  name: "gmail_watch_subscriptions",
  query: `
    -- Create watch subscriptions table
    CREATE TABLE IF NOT EXISTS fb_gmail_watch_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      connection_id UUID NOT NULL REFERENCES fb_gmail_connections(id) ON DELETE CASCADE,
      history_id TEXT NOT NULL,
      expiration TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      last_renewed_at TIMESTAMPTZ,
      renewal_attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(connection_id)
    );
    
    -- Add indexes
    CREATE INDEX idx_watch_subscriptions_user ON fb_gmail_watch_subscriptions(user_id);
    CREATE INDEX idx_watch_subscriptions_status ON fb_gmail_watch_subscriptions(status, expiration);
    
    -- Update fb_gmail_connections
    ALTER TABLE fb_gmail_connections
      ADD COLUMN IF NOT EXISTS last_history_id TEXT,
      ADD COLUMN IF NOT EXISTS watch_enabled BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS watch_setup_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS last_watch_error TEXT;
    
    -- Create webhook logs table
    CREATE TABLE IF NOT EXISTS fb_webhook_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email_address TEXT NOT NULL,
      history_id TEXT NOT NULL,
      received_at TIMESTAMPTZ NOT NULL,
      processed_at TIMESTAMPTZ,
      success BOOLEAN NOT NULL,
      new_messages INTEGER DEFAULT 0,
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `
});
```

#### **Step 1.3: Configure RLS Policies via Supabase MCP**
```typescript
// AI Agent will configure RLS policies
await supabase_mcp.execute_sql({
  query: `
    -- Enable RLS
    ALTER TABLE fb_gmail_watch_subscriptions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE fb_webhook_logs ENABLE ROW LEVEL SECURITY;
    
    -- RLS Policies for watch subscriptions
    CREATE POLICY "Users can view their own watch subscriptions"
      ON fb_gmail_watch_subscriptions FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own watch subscriptions"
      ON fb_gmail_watch_subscriptions FOR UPDATE
      USING (auth.uid() = user_id);
    
    -- RLS Policies for webhook logs
    CREATE POLICY "Users can view their own webhook logs"
      ON fb_webhook_logs FOR SELECT
      USING (email_address IN (
        SELECT email_address FROM fb_gmail_connections WHERE user_id = auth.uid()
      ));
  `
});
```

#### **Step 1.4: Verify Migration**
```typescript
// AI Agent will verify tables created
await supabase_mcp.list_tables({
  schemas: ['public']
});
// Expected: fb_gmail_watch_subscriptions, fb_webhook_logs visible
```

---

### **Phase 2-4: Code Implementation (Manual + AI)**

#### **AI Agent Creates Files**
The AI agent will create all necessary files:
- `src/lib/gmail-watch/watch-manager.ts`
- `src/lib/gmail-watch/history-sync.ts`
- `src/lib/gmail-watch/webhook-validator.ts`
- `src/lib/gmail-watch/webhook-logger.ts`
- `src/lib/gmail-watch/alert-manager.ts`
- `src/pages/api/gmail/webhook.ts`
- `src/pages/api/gmail/watch/*.ts`
- `src/pages/api/cron/*.ts`

#### **Update vercel.json for Cron Jobs**
```json
{
  "crons": [
    {
      "path": "/api/cron/gmail-watch-renewal",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/watch-health-check",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

---

### **Phase 5: GCP Setup (Manual)**

**Note**: GCP setup must be done manually as there's no GCP MCP server.

Follow instructions in `05-PHASE5-GCP-SETUP.md`:
1. Create Pub/Sub topic
2. Grant Gmail API permissions
3. Create push subscription
4. Get GCP credentials

---

### **Phase 6: Deployment & Testing (Automated)**

#### **Step 6.1: Deploy to Vercel via MCP**
```typescript
// AI Agent will deploy to Vercel
await vercel_mcp.deploy_to_vercel();

// Monitor deployment
const deployments = await vercel_mcp.list_deployments({
  projectId: "prj_y54FkZvewB8uj3HMjmhXYdJQsgwV",
  teamId: "team_AoaQe91LUNDEgHEzqgbQijo9"
});

// Check deployment status
const deployment = await vercel_mcp.get_deployment({
  idOrUrl: "finance-buddy-sand.vercel.app",
  teamId: "team_AoaQe91LUNDEgHEzqgbQijo9"
});
```

#### **Step 6.2: Test with Playwright MCP**
```typescript
// AI Agent will test the implementation

// 1. Start browser and navigate
await playwright_mcp.navigate({
  url: "https://finance-buddy-sand.vercel.app"
});

// 2. Sign in
await playwright_mcp.fill_form({
  fields: [
    {
      name: "Email",
      type: "textbox",
      ref: "input[type='email']",
      value: "dheerajsaraf1996@gmail.com"
    },
    {
      name: "Password",
      type: "textbox",
      ref: "input[type='password']",
      value: "Abcd1234"
    }
  ]
});

await playwright_mcp.click({
  element: "Sign In button",
  ref: "button[type='submit']"
});

// 3. Navigate to admin page
await playwright_mcp.navigate({
  url: "https://finance-buddy-sand.vercel.app/admin"
});

// 4. Enable watch for a connection
await playwright_mcp.click({
  element: "Enable Watch button",
  ref: "button[data-action='enable-watch']"
});

// 5. Verify watch enabled
await playwright_mcp.wait_for({
  text: "Watch enabled successfully"
});

// 6. Take screenshot
await playwright_mcp.take_screenshot({
  filename: "watch-enabled.png"
});
```

#### **Step 6.3: Test Webhook Endpoint**
```typescript
// Test webhook receives messages
await playwright_mcp.navigate({
  url: "https://finance-buddy-sand.vercel.app/api/gmail/webhook"
});

// Check response (should be 405 for GET)
const snapshot = await playwright_mcp.snapshot();
// Verify endpoint exists
```

#### **Step 6.4: Monitor Deployment Logs**
```typescript
// Check for errors in deployment
const logs = await vercel_mcp.get_deployment_build_logs({
  idOrUrl: "finance-buddy-sand.vercel.app",
  teamId: "team_AoaQe91LUNDEgHEzqgbQijo9",
  limit: 100
});

// AI Agent will analyze logs for errors
```

---

### **Phase 7: Monitoring Setup (Automated)**

#### **Step 7.1: Create Admin Dashboard**
AI Agent creates `src/pages/admin/watch-health.tsx`

#### **Step 7.2: Test Dashboard with Playwright**
```typescript
// Navigate to dashboard
await playwright_mcp.navigate({
  url: "https://finance-buddy-sand.vercel.app/admin/watch-health"
});

// Verify dashboard loads
await playwright_mcp.wait_for({
  text: "Watch Health Dashboard"
});

// Take screenshot
await playwright_mcp.take_screenshot({
  filename: "watch-health-dashboard.png",
  fullPage: true
});

// Check metrics displayed
const content = await playwright_mcp.get_web_content({
  textContent: true
});
// Verify metrics present
```

---

## 🔄 Complete Automated Workflow

### **AI Agent Execution Flow**

```
1. CREATE MIGRATION FILE
   ↓
2. APPLY MIGRATION (Supabase MCP)
   ↓
3. CONFIGURE RLS (Supabase MCP)
   ↓
4. VERIFY TABLES (Supabase MCP)
   ↓
5. CREATE CODE FILES (AI Agent)
   ↓
6. UPDATE vercel.json (AI Agent)
   ↓
7. DEPLOY TO VERCEL (Vercel MCP)
   ↓
8. WAIT FOR DEPLOYMENT (Vercel MCP)
   ↓
9. TEST WITH PLAYWRIGHT (Playwright MCP)
   ↓
10. VERIFY FUNCTIONALITY (Playwright MCP)
   ↓
11. CHECK LOGS (Vercel MCP)
   ↓
12. FIX ISSUES IF ANY (AI Agent + MCPs)
   ↓
13. REDEPLOY (Vercel MCP)
   ↓
14. FINAL VERIFICATION (Playwright MCP)
```

---

## 🧪 Testing Scenarios with Playwright MCP

### **Test 1: Watch Setup**
```typescript
// 1. Navigate to admin
// 2. Click "Enable Watch" for a connection
// 3. Verify success message
// 4. Check database for watch record
```

### **Test 2: Email Sync**
```typescript
// 1. Send test email to Gmail
// 2. Wait 30 seconds
// 3. Navigate to /emails page
// 4. Verify new email appears
// 5. Check transaction extracted
```

### **Test 3: Webhook Endpoint**
```typescript
// 1. Send POST to /api/gmail/webhook
// 2. Verify 200 response
// 3. Check webhook logs in database
// 4. Verify email synced
```

### **Test 4: Watch Renewal**
```typescript
// 1. Trigger renewal cron manually
// 2. Check logs for renewal activity
// 3. Verify watch expiration updated
```

---

## 🔧 Troubleshooting with MCP

### **Issue: Migration Failed**
```typescript
// Check migration status
await supabase_mcp.list_migrations();

// Rollback if needed
await supabase_mcp.execute_sql({
  query: "DROP TABLE IF EXISTS fb_gmail_watch_subscriptions CASCADE;"
});

// Reapply migration
await supabase_mcp.apply_migration({...});
```

### **Issue: Deployment Failed**
```typescript
// Check deployment logs
const logs = await vercel_mcp.get_deployment_build_logs({...});

// Fix issues in code
// Redeploy
await vercel_mcp.deploy_to_vercel();
```

### **Issue: Tests Failing**
```typescript
// Take screenshot to see error
await playwright_mcp.take_screenshot({
  filename: "error-state.png"
});

// Get console errors
await playwright_mcp.console_messages({
  onlyErrors: true
});

// Fix issues and retest
```

---

## ✅ MCP-Powered Implementation Checklist

- [ ] **Phase 1: Database**
  - [ ] Create migration file
  - [ ] Apply via Supabase MCP
  - [ ] Configure RLS via Supabase MCP
  - [ ] Verify tables via Supabase MCP

- [ ] **Phase 2-4: Code**
  - [ ] AI creates all service files
  - [ ] AI creates all API endpoints
  - [ ] AI updates vercel.json
  - [ ] Code review

- [ ] **Phase 5: GCP** (Manual)
  - [ ] Create Pub/Sub topic
  - [ ] Configure permissions
  - [ ] Create subscription
  - [ ] Add env vars to Vercel

- [ ] **Phase 6: Deploy & Test**
  - [ ] Deploy via Vercel MCP
  - [ ] Test with Playwright MCP
  - [ ] Verify functionality
  - [ ] Check logs via Vercel MCP

- [ ] **Phase 7: Monitor**
  - [ ] Create dashboard
  - [ ] Test dashboard with Playwright
  - [ ] Verify metrics
  - [ ] Set up alerts

---

**Next**: See `MCP-STEP-BY-STEP.md` for detailed execution steps

