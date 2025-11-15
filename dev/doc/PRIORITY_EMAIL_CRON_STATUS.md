# Priority Email Cron Job - Current Status

## Summary

Attempted to add Vercel cron job for priority email checking, but encountered deployment issues due to TypeScript errors in unrelated code.

## What Was Done

### 1. Vercel Cron Configuration ✅
- Added cron job to `vercel.json`:
  ```json
  {
    "path": "/api/cron/priority-email-check",
    "schedule": "*/1 * * * *"
  }
  ```
- Schedule: Every 1 minute

### 2. Documentation ✅
- Created `dev/doc/PRIORITY_EMAIL_CRON_SETUP.md` - Comprehensive setup guide
- Created `dev/doc/PRIORITY_EMAIL_CRON_SUMMARY.md` - Implementation summary

### 3. Database Configuration ✅
- Priority email checking already enabled in `fb_config` table
- `priority_email_check_enabled` = `true`
- `priority_email_check_interval` = `1` minute

## Current Issue

### TypeScript Build Error ❌

**Error**: Type 'string' is not assignable to type 'Urgency | undefined'

**Location**: `src/lib/push/push-manager.ts:141`

**Code**:
```typescript
const options = {
  TTL: 86400,
  urgency: 'high', // ❌ TypeScript error
  topic: 'finance-buddy-transactions',
};
```

**Fix Applied**:
```typescript
const options = {
  TTL: 86400,
  urgency: 'high' as const, // ✅ Fixed
  topic: 'finance-buddy-transactions',
};
```

**Commit**: `a9cde6ce` - "fix: TypeScript error in push-manager urgency type"

### Deployment Status

**Problem**: Vercel hasn't triggered a new deployment for the fix yet

**Affected Deployments**: All deployments since `5d7d615a` are failing with the same error

**Last Successful Deployment**: `dpl_7d775QoiAPgMu7VgmheN8iyscm4Q` (commit `0700bcf6`)

## Vercel Plan Limitation

**Important**: Vercel Hobby plan only supports **daily** cron jobs!

**Current Schedule**: `*/1 * * * *` (every minute) - **NOT SUPPORTED** on Hobby plan

**Error**: Vercel will reject this cron schedule on Hobby plan

**Solutions**:
1. **Upgrade to Vercel Pro** - Supports minute-level cron jobs
2. **Use Daily Cron** - Change schedule to `0 0 * * *` (once per day)
3. **Use Webhook** - Gmail Pub/Sub webhook already implemented (real-time)
4. **Manual Trigger** - Use homepage button for on-demand processing

## Recommended Approach

### Option 1: Remove Cron (Use Webhook Only)

**Pros**:
- ✅ Real-time processing via Gmail Pub/Sub webhook
- ✅ No Vercel plan upgrade needed
- ✅ Already implemented and working

**Cons**:
- ❌ Depends on Gmail webhook reliability
- ❌ No fallback if webhook fails

**Action**:
```bash
# Remove cron from vercel.json
git revert <cron-commit>
```

### Option 2: Daily Cron + Webhook

**Pros**:
- ✅ Works on Hobby plan
- ✅ Webhook for real-time, cron as fallback
- ✅ Catches any missed emails once per day

**Cons**:
- ❌ Not as frequent as every minute
- ❌ Emails might be delayed up to 24 hours

**Action**:
```json
{
  "path": "/api/cron/priority-email-check",
  "schedule": "0 0 * * *"
}
```

### Option 3: Upgrade to Vercel Pro

**Pros**:
- ✅ Supports minute-level cron jobs
- ✅ Can run every minute as intended
- ✅ More reliable than Hobby plan

**Cons**:
- ❌ Costs $20/month per user
- ❌ May be overkill for this feature

**Action**:
1. Upgrade Vercel plan to Pro
2. Deploy with current cron configuration

## Next Steps

1. **Wait for Deployment** - Vercel should trigger deployment for TypeScript fix
2. **Choose Approach** - Decide on cron strategy (remove, daily, or upgrade)
3. **Update Configuration** - Modify `vercel.json` based on chosen approach
4. **Test** - Verify cron job works as expected
5. **Monitor** - Check Vercel logs for execution

## Files Changed

- `vercel.json` - Added priority email cron
- `src/lib/push/push-manager.ts` - Fixed TypeScript error
- `dev/doc/PRIORITY_EMAIL_CRON_SETUP.md` - Setup documentation
- `dev/doc/PRIORITY_EMAIL_CRON_SUMMARY.md` - Implementation summary
- `dev/doc/PRIORITY_EMAIL_CRON_STATUS.md` - This file

## Commits

- `47406eba` - feat: Add priority email cron job
- `8a8fe335` - docs: Add implementation summary
- `a9cde6ce` - fix: TypeScript error in push-manager

## Current State

- ✅ Cron configuration added to `vercel.json`
- ✅ Documentation created
- ✅ Database configuration enabled
- ✅ TypeScript fix committed
- ⏳ Waiting for deployment
- ❌ Vercel Hobby plan limitation (minute-level cron not supported)

## Recommendation

**Use Gmail Pub/Sub webhook only** (remove cron):
- Already implemented and working
- Real-time processing
- No Vercel plan upgrade needed
- Simpler architecture

If fallback is needed, use **daily cron** instead of every minute.

