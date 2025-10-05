# Gmail Auto-Sync Quick Start Guide

## Overview

This guide provides step-by-step instructions to implement the Gmail auto-sync with AI processing and notifications feature.

---

## Prerequisites

- ✅ Existing Finance Buddy application running
- ✅ Supabase database access
- ✅ Vercel deployment (for cron jobs)
- ✅ Gmail API credentials configured
- ✅ Existing email processing pipeline working

---

## Step-by-Step Implementation

### Step 1: Database Migration (30 minutes)

1. **Create migration file**:
   ```bash
   cd infra/migrations
   touch 0002_notifications_and_auto_sync.sql
   ```

2. **Copy migration SQL** from `docs/AUTO_SYNC_WITH_NOTIFICATIONS_PLAN.md` (Phase 1 section)

3. **Run migration**:
   ```bash
   # Using Supabase CLI
   supabase db push

   # Or manually in Supabase dashboard
   # Go to SQL Editor and paste the migration
   ```

4. **Verify tables created**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('fb_sync_filters', 'fb_notifications');
   ```

5. **Verify RLS policies**:
   ```sql
   SELECT tablename, policyname FROM pg_policies 
   WHERE tablename IN ('fb_sync_filters', 'fb_notifications');
   ```

---

### Step 2: Notification Module (2 hours)

1. **Create directory structure**:
   ```bash
   mkdir -p src/lib/notifications
   cd src/lib/notifications
   ```

2. **Create files**:
   ```bash
   touch types.ts
   touch notification-builder.ts
   touch notification-manager.ts
   touch index.ts
   ```

3. **Copy code** from `docs/AUTO_SYNC_WITH_NOTIFICATIONS_PLAN.md` (Phase 2 section)

4. **Test notification creation**:
   ```typescript
   // Create a test file: src/lib/notifications/__tests__/test.ts
   import { NotificationManager, NotificationBuilder } from '../index';

   const manager = new NotificationManager();
   const notification = await manager.create(
     NotificationBuilder.forSystemAlert(
       'user-id-here',
       'Test Notification',
       'This is a test message'
     )
   );
   console.log('Created notification:', notification);
   ```

---

### Step 3: Notification API Endpoints (1 hour)

1. **Create API directory**:
   ```bash
   mkdir -p src/pages/api/notifications
   ```

2. **Create endpoint files**:
   ```bash
   cd src/pages/api/notifications
   touch index.ts
   touch unread-count.ts
   touch mark-all-read.ts
   mkdir [id]
   touch [id]/index.ts
   touch [id]/mark-read.ts
   ```

3. **Copy code** from `docs/AUTO_SYNC_API_ENDPOINTS.md`

4. **Test endpoints**:
   ```bash
   # Start dev server
   npm run dev

   # Test in browser or with curl
   curl http://localhost:3000/api/notifications/unread-count \
     -H "Cookie: fb_session=YOUR_SESSION_COOKIE"
   ```

---

### Step 4: Notification UI Components (3 hours)

1. **Create NotificationBell component**:
   ```bash
   touch src/components/NotificationBell.tsx
   ```

2. **Copy code** from `docs/AUTO_SYNC_UI_COMPONENTS.md`

3. **Update Layout component**:
   ```typescript
   // In src/components/Layout.tsx
   import NotificationBell from './NotificationBell';

   // Add to header:
   <div className="flex items-center space-x-4">
     <NotificationBell />
     {/* Other header items */}
   </div>
   ```

4. **Create notifications page**:
   ```bash
   touch src/pages/notifications.tsx
   ```

5. **Copy code** from `docs/AUTO_SYNC_UI_COMPONENTS.md`

6. **Test UI**:
   - Visit `http://localhost:3000`
   - Check notification bell appears in header
   - Create a test notification via API
   - Verify bell shows unread count
   - Click bell to see dropdown
   - Visit `/notifications` page

---

### Step 5: Transaction Detail Page (3 hours)

1. **Create transaction detail page**:
   ```bash
   mkdir -p src/pages/transactions
   touch src/pages/transactions/[id].tsx
   ```

2. **Copy code** from `docs/TRANSACTION_DETAIL_PAGE.md`

3. **Create transaction API endpoints**:
   ```bash
   mkdir -p src/pages/api/transactions/[id]
   touch src/pages/api/transactions/[id]/index.ts
   ```

4. **Copy code** from `docs/AUTO_SYNC_API_ENDPOINTS.md`

5. **Test page**:
   - Create a test transaction in database
   - Visit `http://localhost:3000/transactions/[transaction-id]`
   - Test view mode
   - Test edit mode
   - Test save/cancel/delete

---

### Step 6: Auto-Sync Enhancement (4 hours)

1. **Create auto-sync module** (if not exists):
   ```bash
   mkdir -p src/lib/gmail-auto-sync
   cd src/lib/gmail-auto-sync
   touch sync-executor.ts
   touch types.ts
   touch index.ts
   ```

2. **Enhance SyncExecutor** with AI processing:
   - Add `EmailProcessor` import
   - Add `NotificationManager` import
   - Add `processNewEmails()` method
   - Add `createNotificationsForTransactions()` method

3. **Copy enhanced code** from `docs/AUTO_SYNC_WITH_NOTIFICATIONS_PLAN.md` (Phase 3 section)

4. **Test sync executor**:
   ```typescript
   // Create test file
   const executor = new SyncExecutor();
   const result = await executor.executeAutoSync(connection);
   console.log('Sync result:', result);
   ```

---

### Step 7: Cron Endpoint (1 hour)

1. **Create cron endpoint**:
   ```bash
   mkdir -p src/pages/api/cron
   touch src/pages/api/cron/gmail-auto-sync.ts
   ```

2. **Copy code** from `docs/AUTO_SYNC_API_ENDPOINTS.md`

3. **Add environment variable**:
   ```bash
   # In .env.local
   CRON_SECRET=your-random-secret-here-generate-with-openssl-rand-hex-32
   ```

4. **Configure Vercel Cron**:
   ```json
   // In vercel.json
   {
     "crons": [
       {
         "path": "/api/cron/gmail-auto-sync",
         "schedule": "*/15 * * * *"
       }
     ]
   }
   ```

5. **Test cron endpoint locally**:
   ```bash
   curl http://localhost:3000/api/cron/gmail-auto-sync \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

---

### Step 8: Auto-Sync Control Endpoints (1 hour)

1. **Create auto-sync control endpoints**:
   ```bash
   mkdir -p src/pages/api/gmail/auto-sync
   touch src/pages/api/gmail/auto-sync/toggle.ts
   touch src/pages/api/gmail/auto-sync/status.ts
   ```

2. **Copy code** from `docs/AUTO_SYNC_API_ENDPOINTS.md`

3. **Test endpoints**:
   ```bash
   # Enable auto-sync
   curl -X POST http://localhost:3000/api/gmail/auto-sync/toggle \
     -H "Content-Type: application/json" \
     -H "Cookie: fb_session=YOUR_SESSION" \
     -d '{"connection_id": "YOUR_CONNECTION_ID", "enabled": true}'

   # Check status
   curl http://localhost:3000/api/gmail/auto-sync/status?connection_id=YOUR_CONNECTION_ID \
     -H "Cookie: fb_session=YOUR_SESSION"
   ```

---

### Step 9: Testing (4 hours)

1. **End-to-End Test**:
   - Enable auto-sync for a Gmail connection
   - Wait for cron to run (or trigger manually)
   - Verify emails are synced
   - Verify AI processing runs
   - Verify transactions are created
   - Verify notifications are created
   - Check notification bell updates
   - Click notification to view transaction
   - Edit transaction and save

2. **Error Scenarios**:
   - Test with expired OAuth token
   - Test with invalid email content
   - Test with AI extraction failure
   - Verify error notifications are created

3. **Performance Test**:
   - Test with multiple connections
   - Test with large number of emails
   - Monitor database query performance
   - Check Vercel function execution time

---

### Step 10: Deployment (2 hours)

1. **Deploy to Vercel**:
   ```bash
   git add .
   git commit -m "Add auto-sync with notifications"
   git push origin main
   ```

2. **Configure environment variables in Vercel**:
   - Go to Vercel dashboard
   - Add `CRON_SECRET` environment variable
   - Redeploy if needed

3. **Run migration on production**:
   - Go to Supabase dashboard (production)
   - Run migration SQL in SQL Editor
   - Verify tables and policies created

4. **Verify cron job**:
   - Check Vercel dashboard → Cron Jobs
   - Verify job is scheduled
   - Check logs after first run

5. **Monitor**:
   - Check Vercel logs for errors
   - Monitor database for new notifications
   - Check with beta users

---

## Troubleshooting

### Issue: Notifications not appearing

**Check**:
1. Verify `fb_notifications` table has data
2. Check RLS policies allow user to read notifications
3. Check API endpoint returns data
4. Check browser console for errors
5. Verify NotificationBell component is mounted

### Issue: Cron job not running

**Check**:
1. Verify `vercel.json` has cron configuration
2. Check Vercel dashboard → Cron Jobs
3. Verify `CRON_SECRET` environment variable is set
4. Check Vercel function logs
5. Test endpoint manually with correct auth header

### Issue: AI processing fails

**Check**:
1. Verify AI API keys are configured
2. Check email content is valid
3. Check `EmailProcessor` logs
4. Verify `SchemaAwareTransactionExtractor` is working
5. Test with a known good email

### Issue: Transaction detail page not loading

**Check**:
1. Verify transaction exists in database
2. Check transaction ID in URL is valid
3. Verify API endpoint returns data
4. Check browser console for errors
5. Verify RLS policies allow user to read transaction

---

## Estimated Timeline

| Phase | Task | Time |
|-------|------|------|
| 1 | Database Migration | 30 min |
| 2 | Notification Module | 2 hours |
| 3 | Notification API | 1 hour |
| 4 | Notification UI | 3 hours |
| 5 | Transaction Detail Page | 3 hours |
| 6 | Auto-Sync Enhancement | 4 hours |
| 7 | Cron Endpoint | 1 hour |
| 8 | Auto-Sync Control | 1 hour |
| 9 | Testing | 4 hours |
| 10 | Deployment | 2 hours |
| **Total** | | **~21 hours** |

**Recommended Schedule**: 3-4 weeks with 1 developer working part-time

---

## Success Checklist

- [ ] Database migration completed successfully
- [ ] Notification module created and tested
- [ ] Notification API endpoints working
- [ ] Notification bell shows in header
- [ ] Notifications page displays correctly
- [ ] Transaction detail page loads and edits work
- [ ] Auto-sync executor processes emails with AI
- [ ] Cron job runs every 15 minutes
- [ ] Notifications created for new transactions
- [ ] All tests passing
- [ ] Deployed to production
- [ ] Monitoring in place

---

## Next Steps After Implementation

1. **Monitor** system performance and errors
2. **Gather** user feedback
3. **Iterate** based on feedback
4. **Add** notification preferences (Phase 5)
5. **Implement** Gmail push notifications (Phase 2 of original plan)
6. **Optimize** AI processing for speed
7. **Add** bulk transaction editing
8. **Enhance** transaction categorization

---

## Support

For questions or issues during implementation:
1. Check the detailed documentation in `docs/` folder
2. Review existing codebase for similar patterns
3. Test each component independently before integration
4. Use console.log extensively for debugging
5. Check Vercel and Supabase logs for errors

Good luck with the implementation! 🚀

