# Deployment Checklist

## Overview

This document provides deployment checklists for each feature release.

---

## Pre-Deployment (All Phases)

### Code Quality
- [ ] TypeScript compiles without errors: `npx tsc --noEmit`
- [ ] No ESLint errors: `npm run lint`
- [ ] All tests pass: `npm test`
- [ ] No console.log in production code (except error handlers)

### Database
- [ ] Migration file reviewed
- [ ] Rollback script tested locally
- [ ] Indexes reviewed for performance
- [ ] RLS policies verified

### Environment
- [ ] Environment variables documented
- [ ] No secrets in code
- [ ] API keys valid

---

## Deploy 1: Sub-Transactions (After Phase 4)

### Database Migration

1. **Backup database**
   ```bash
   # Via Supabase Dashboard or CLI
   supabase db dump > backup_pre_sub_txn.sql
   ```

2. **Run migration**
   ```bash
   npx supabase db push
   ```

3. **Verify migration**
   ```sql
   -- Check columns
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'fb_emails_processed'
   AND column_name IN ('parent_transaction_id', 'is_sub_transaction', 'sub_transaction_order');

   -- Check triggers
   SELECT trigger_name FROM information_schema.triggers
   WHERE event_object_table = 'fb_emails_processed'
   AND trigger_name LIKE 'trg_%';

   -- Check indexes
   SELECT indexname FROM pg_indexes
   WHERE tablename = 'fb_emails_processed'
   AND indexname LIKE 'idx_fb_txn_%';
   ```

### Application Deployment

1. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

2. **Verify deployment**
   - [ ] App loads without errors
   - [ ] Transaction list loads
   - [ ] Can open transaction modal

### Functional Testing

1. **Create sub-transactions**
   - [ ] Open a debit transaction
   - [ ] Click "Split Transaction"
   - [ ] Add 2 items with amounts
   - [ ] Verify amounts don't exceed parent
   - [ ] Save and verify sub-transactions appear

2. **Edit sub-transaction**
   - [ ] Click edit on a sub-transaction
   - [ ] Change amount and category
   - [ ] Save and verify update

3. **Delete sub-transaction**
   - [ ] Try to delete when count = 2 (should fail)
   - [ ] Delete all sub-transactions
   - [ ] Verify parent shows "Split" button again

4. **Splitwise cascade**
   - [ ] Link parent to Splitwise
   - [ ] Verify sub-transactions inherit ID
   - [ ] Unlink parent
   - [ ] Verify sub-transactions cleared

### Rollback Plan

If issues occur:
```bash
# 1. Revert Vercel deployment
vercel rollback

# 2. Rollback database (use rollback script)
psql -f infra/migrations/rollback_0005.sql
```

---

## Deploy 2: Receipt Parsing (After Phase 8)

### Pre-requisites

- [ ] Anthropic API key has Vision API access
- [ ] Supabase Storage enabled

### Database Migration

1. **Backup database**
   ```bash
   supabase db dump > backup_pre_receipt.sql
   ```

2. **Run migration**
   ```bash
   npx supabase db push
   ```

3. **Verify migration**
   ```sql
   -- Check tables
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('fb_receipts', 'fb_receipt_items');

   -- Check storage bucket
   SELECT id, name FROM storage.buckets WHERE id = 'receipts';
   ```

4. **Verify storage RLS**
   - Upload test file as user A
   - Try to access as user B (should fail)
   - Delete test file

### Application Deployment

1. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

2. **Verify deployment**
   - [ ] App loads without errors
   - [ ] Sub-transactions still work
   - [ ] Receipt section visible in modal

### Functional Testing

1. **Upload receipt**
   - [ ] Open a debit transaction
   - [ ] Click "Upload Receipt"
   - [ ] Select JPEG/PNG file
   - [ ] Verify upload succeeds
   - [ ] Verify file in storage

2. **Parse receipt**
   - [ ] Click "Parse with AI"
   - [ ] Wait for processing
   - [ ] Verify items extracted
   - [ ] Check totals match

3. **Edit items**
   - [ ] Edit item name
   - [ ] Edit item price
   - [ ] Exclude an item
   - [ ] Verify changes persist

4. **Create sub-transactions**
   - [ ] Click "Create Sub-Transactions"
   - [ ] Verify sub-transactions created
   - [ ] Verify amounts match items
   - [ ] Verify links maintained

### Rollback Plan

If issues occur:
```bash
# 1. Revert Vercel deployment
vercel rollback

# 2. Delete storage bucket contents
# Via Supabase Dashboard

# 3. Rollback database
psql -f infra/migrations/rollback_0006.sql
```

---

## Deploy 3: Smart Refunds (After Phase 11)

### Database Migration

1. **Backup database**
   ```bash
   supabase db dump > backup_pre_refund.sql
   ```

2. **Run migration**
   ```bash
   npx supabase db push
   ```

3. **Verify migration**
   ```sql
   -- Check columns
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'fb_emails_processed'
   AND column_name LIKE 'refund%';

   -- Check functions
   SELECT routine_name FROM information_schema.routines
   WHERE routine_name IN ('get_refund_status', 'suggest_refund_matches');
   ```

### Application Deployment

1. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

2. **Verify deployment**
   - [ ] App loads without errors
   - [ ] Sub-transactions still work
   - [ ] Receipt parsing still works
   - [ ] Refund section visible for credits

### Functional Testing

1. **Get suggestions**
   - [ ] Open a credit transaction
   - [ ] Click "Find Original"
   - [ ] Verify suggestions load
   - [ ] Check ranking makes sense

2. **Link refund**
   - [ ] Select an original transaction
   - [ ] Verify link created
   - [ ] Verify is_refund = true
   - [ ] Verify refund_type set

3. **View refund status**
   - [ ] Open the original debit
   - [ ] Verify refund status shown
   - [ ] Check amounts accurate

4. **Unlink refund**
   - [ ] Open linked credit
   - [ ] Click "Unlink"
   - [ ] Verify fields cleared

5. **Full refund scenario**
   - [ ] Link refund equal to original
   - [ ] Verify "Fully Refunded" badge
   - [ ] Open original, verify status

### Rollback Plan

If issues occur:
```bash
# 1. Revert Vercel deployment
vercel rollback

# 2. Rollback database
psql -f infra/migrations/rollback_0007.sql
```

---

## Post-Deployment Monitoring

### Immediate (First Hour)

- [ ] Check Vercel logs for errors
- [ ] Monitor Sentry for new issues
- [ ] Check Supabase logs for query errors
- [ ] Verify no RLS violations

### Short-term (First Day)

- [ ] Monitor API response times
- [ ] Check database performance
- [ ] Review user feedback
- [ ] Verify storage usage normal

### Long-term (First Week)

- [ ] Analyze usage patterns
- [ ] Review AI parsing accuracy
- [ ] Check for edge cases
- [ ] Plan improvements

---

## Emergency Contacts

- **Vercel Issues**: Vercel Dashboard / Support
- **Supabase Issues**: Supabase Dashboard / Support
- **AI API Issues**: Anthropic Console

---

## Commit Messages

After each deploy:

```bash
# Deploy 1
git commit -m "feat: add sub-transaction support

- Self-referential FK for parent-child relationships
- 5 database triggers for validation
- CRUD APIs for sub-transactions
- UI components in TransactionModal

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

# Deploy 2
git commit -m "feat: add receipt parsing with AI

- Claude Vision API integration
- Supabase Storage for receipt files
- AI-powered item extraction
- One-click conversion to sub-transactions

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

# Deploy 3
git commit -m "feat: add smart refund system

- Credit-to-debit linking
- AI-powered match suggestions
- Refund status tracking
- Splitwise integration warnings

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```
