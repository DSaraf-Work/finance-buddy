Phase 1: Setup Infrastructure
Configure Google Cloud Pub/Sub topic

Set up push subscription pointing to Vercel

Add environment variables

Phase 2: Create Webhook Endpoint
Create /api/webhooks/gmail-push/route.ts

Implement Pub/Sub message parsing

Add authentication/validation

Phase 3: Integrate with Existing Flow
Extract historyId and fetch new messages

Filter by sender (reuse auto-sync settings)

Call existing sync-executor functions

Trigger AI extraction pipeline

Phase 4: Maintenance & Renewal
Create watch initialization endpoint

Set up Supabase Cron for 3-day renewal

Handle watch expiration gracefully

Phase 5: Testing & Monitoring
Test with real emails

Verify idempotency

Monitor Vercel function logs

Validate sender filtering