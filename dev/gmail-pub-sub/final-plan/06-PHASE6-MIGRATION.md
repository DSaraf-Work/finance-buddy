# Phase 6: Migration & Testing

## 🎯 Objective
Migrate existing connections to Gmail watch, test thoroughly, and ensure smooth transition.

---

## 📋 Migration Strategy

### **Approach: Gradual Rollout**
1. Keep existing cron-based sync as fallback
2. Enable watch for test users first
3. Monitor for issues
4. Gradually enable for all users
5. Deprecate cron sync after validation

---

## 🔧 Step 1: Create Migration API

**File**: `src/pages/api/gmail/watch/migrate.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { WatchManager } from '@/lib/gmail-watch/watch-manager';
import { supabaseAdmin } from '@/lib/supabase';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { connection_id, enable_watch } = req.body;

    if (!connection_id) {
      return res.status(400).json({ error: 'connection_id required' });
    }

    // Verify connection belongs to user
    const { data: connection } = await supabaseAdmin
      .from('fb_gmail_connections')
      .select('*')
      .eq('id', connection_id)
      .eq('user_id', user.id)
      .single();

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const watchManager = new WatchManager();

    if (enable_watch) {
      // Enable watch
      const result = await watchManager.setupWatch(connection_id);
      
      if (!result.success) {
        return res.status(500).json({ 
          error: 'Failed to setup watch',
          details: result.error 
        });
      }

      // Disable auto-sync cron for this connection
      await supabaseAdmin
        .from('fb_gmail_connections')
        .update({ auto_sync_enabled: false })
        .eq('id', connection_id);

      return res.status(200).json({
        success: true,
        message: 'Watch enabled successfully',
        historyId: result.historyId,
        expiration: result.expiration,
      });
    } else {
      // Disable watch
      await watchManager.stopWatch(connection_id);

      // Re-enable auto-sync cron
      await supabaseAdmin
        .from('fb_gmail_connections')
        .update({ auto_sync_enabled: true })
        .eq('id', connection_id);

      return res.status(200).json({
        success: true,
        message: 'Watch disabled, reverted to cron sync',
      });
    }
  } catch (error: any) {
    console.error('Migration error:', error);
    return res.status(500).json({ error: error.message });
  }
});
```

---

## 🔧 Step 2: Create Batch Migration Script

**File**: `scripts/migrate-to-watch.ts`

```typescript
import { supabaseAdmin } from '../src/lib/supabase';
import { WatchManager } from '../src/lib/gmail-watch/watch-manager';

async function migrateToWatch(options: {
  dryRun?: boolean;
  userIds?: string[];
  limit?: number;
}) {
  const { dryRun = true, userIds, limit = 10 } = options;

  console.log('🚀 Starting migration to Gmail watch...');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);

  // Get connections to migrate
  let query = supabaseAdmin
    .from('fb_gmail_connections')
    .select('*')
    .eq('auto_sync_enabled', true)
    .eq('watch_enabled', false)
    .limit(limit);

  if (userIds && userIds.length > 0) {
    query = query.in('user_id', userIds);
  }

  const { data: connections, error } = await query;

  if (error) {
    console.error('❌ Failed to fetch connections:', error);
    return;
  }

  console.log(`📋 Found ${connections?.length || 0} connections to migrate`);

  if (dryRun) {
    console.log('🔍 DRY RUN - No changes will be made');
    connections?.forEach(conn => {
      console.log(`  - ${conn.email_address} (${conn.id})`);
    });
    return;
  }

  const watchManager = new WatchManager();
  const results = {
    success: 0,
    failed: 0,
    errors: [] as any[],
  };

  for (const connection of connections || []) {
    try {
      console.log(`\n🔄 Migrating ${connection.email_address}...`);

      // Setup watch
      const result = await watchManager.setupWatch(connection.id);

      if (result.success) {
        // Disable cron sync
        await supabaseAdmin
          .from('fb_gmail_connections')
          .update({ auto_sync_enabled: false })
          .eq('id', connection.id);

        console.log(`✅ Success: ${connection.email_address}`);
        results.success++;
      } else {
        console.error(`❌ Failed: ${connection.email_address}`, result.error);
        results.failed++;
        results.errors.push({
          connection_id: connection.id,
          email: connection.email_address,
          error: result.error,
        });
      }

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error(`❌ Error migrating ${connection.email_address}:`, error);
      results.failed++;
      results.errors.push({
        connection_id: connection.id,
        email: connection.email_address,
        error: error.message,
      });
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`  ✅ Success: ${results.success}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(err => {
      console.log(`  - ${err.email}: ${err.error}`);
    });
  }
}

// Run migration
const args = process.argv.slice(2);
const dryRun = !args.includes('--live');
const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '10');

migrateToWatch({ dryRun, limit });
```

**Usage:**
```bash
# Dry run (default)
npm run migrate-watch

# Live migration (10 connections)
npm run migrate-watch -- --live

# Live migration (50 connections)
npm run migrate-watch -- --live --limit=50
```

---

## 🧪 Step 3: Testing Plan

### **Phase 1: Local Testing**
- [ ] Test watch setup with test Gmail account
- [ ] Send test email and verify webhook triggered
- [ ] Verify email fetched and processed
- [ ] Verify transaction extracted
- [ ] Verify notification created
- [ ] Test watch renewal
- [ ] Test watch stop

### **Phase 2: Staging Testing**
- [ ] Deploy to Vercel preview environment
- [ ] Test with 2-3 real Gmail accounts
- [ ] Monitor webhook logs
- [ ] Monitor Gmail API quota usage
- [ ] Test error scenarios (expired token, invalid history)
- [ ] Test history gap handling
- [ ] Verify fallback to full sync

### **Phase 3: Production Pilot**
- [ ] Enable watch for 5 test users
- [ ] Monitor for 48 hours
- [ ] Check for missed emails
- [ ] Verify notification latency < 30 seconds
- [ ] Monitor error rates
- [ ] Collect user feedback

### **Phase 4: Gradual Rollout**
- [ ] Enable for 10% of users (week 1)
- [ ] Enable for 25% of users (week 2)
- [ ] Enable for 50% of users (week 3)
- [ ] Enable for 100% of users (week 4)
- [ ] Monitor metrics at each stage

---

## 📊 Monitoring Dashboard

Create admin dashboard to monitor migration:

**File**: `src/pages/admin/watch-status.tsx`

```typescript
// Display watch status for all connections
// Show metrics:
// - Total connections
// - Watch enabled count
// - Cron sync count
// - Watch expiring soon
// - Failed watches
// - Recent webhook activity
```

---

## 🔄 Rollback Plan

If issues arise, rollback with:

```typescript
// Disable all watches
async function rollbackToC ronSync() {
  const { data: watches } = await supabaseAdmin
    .from('fb_gmail_watch_subscriptions')
    .select('connection_id')
    .eq('status', 'active');

  const watchManager = new WatchManager();

  for (const watch of watches || []) {
    await watchManager.stopWatch(watch.connection_id);
    
    await supabaseAdmin
      .from('fb_gmail_connections')
      .update({ auto_sync_enabled: true })
      .eq('id', watch.connection_id);
  }
}
```

---

## ✅ Migration Checklist

### **Pre-Migration**
- [ ] All code deployed to production
- [ ] GCP Pub/Sub configured
- [ ] Webhook endpoint tested
- [ ] Environment variables set
- [ ] Monitoring dashboard ready
- [ ] Rollback plan documented

### **During Migration**
- [ ] Start with test users
- [ ] Monitor webhook logs
- [ ] Monitor Gmail API quotas
- [ ] Check for errors
- [ ] Verify email processing
- [ ] Collect metrics

### **Post-Migration**
- [ ] All users migrated
- [ ] Cron sync disabled
- [ ] Monitoring active
- [ ] Documentation updated
- [ ] User communication sent

---

## 📈 Success Criteria

- ✅ 99% of connections successfully migrated
- ✅ Email notification latency < 30 seconds
- ✅ Zero missed emails
- ✅ Gmail API quota usage reduced by 90%
- ✅ No increase in error rates
- ✅ Positive user feedback

---

**Next Phase**: Phase 7 - Monitoring & Maintenance

