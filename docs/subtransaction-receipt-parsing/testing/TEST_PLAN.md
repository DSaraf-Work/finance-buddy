# Test Plan

## Overview

This document outlines testing strategy for Sub-Transactions, Receipt Parsing, and Smart Refunds features.

---

## Test Categories

### 1. Unit Tests
- Validation functions
- Type definitions
- Utility functions

### 2. Integration Tests
- API endpoints
- Database triggers
- AI parsing

### 3. E2E Tests
- User workflows
- UI interactions
- Cross-feature scenarios

---

## Feature 1: Sub-Transactions

### Database Tests

| Test Case | Expected | Priority |
|-----------|----------|----------|
| Create sub-transaction with valid parent | Success, fields inherited | High |
| Create sub-transaction without parent | Fail: constraint violation | High |
| Create nested sub-transaction | Fail: trigger blocks | High |
| Sum exceeds parent amount | Fail: trigger blocks | High |
| Modify parent amount with children | Fail: trigger blocks | Medium |
| Splitwise ID cascade on UPDATE | Children updated | High |
| Splitwise ID inherited on INSERT | Sub-txn has parent's ID | High |
| Delete parent cascades to children | Children deleted | High |

### API Tests

| Endpoint | Test Case | Expected |
|----------|-----------|----------|
| POST /sub-transactions | Valid 2 items | 201, items created |
| POST /sub-transactions | Less than 2 items | 400, min count error |
| POST /sub-transactions | More than 10 items | 400, max count error |
| POST /sub-transactions | Sum exceeds parent | 400, amount error |
| POST /sub-transactions | Already has subs | 400, exists error |
| GET /sub-transactions | Has children | 200, list + summary |
| GET /sub-transactions | No children | 200, empty list |
| PATCH /sub-transactions/[id] | Valid update | 200, updated |
| PATCH /sub-transactions/[id] | Amount exceeds | 400, amount error |
| DELETE /sub-transactions/[id] | Count > 2 | 200, deleted |
| DELETE /sub-transactions/[id] | Count = 2 | 400, min count error |
| DELETE /sub-transactions | Any count | 200, all deleted |

### UI Tests

| Component | Test Case | Expected |
|-----------|-----------|----------|
| SubTransactionEditor | Add item | New row appears |
| SubTransactionEditor | Remove item (>2) | Row removed |
| SubTransactionEditor | Remove item (=2) | Button disabled |
| SubTransactionEditor | Amount exceeds | Error shown, save disabled |
| SubTransactionEditor | Save valid | API called, list shown |
| SubTransactionList | Edit inline | Input fields shown |
| SubTransactionList | Save edit | API called, updated |
| SubTransactionList | Delete single | API called, removed |
| SubTransactionList | Delete all | Confirm, API called |
| SubTransactionBadge | Has subs | Badge shown with count |
| SubTransactionBadge | No subs | No badge |

---

## Feature 2: Receipt Parsing

### Storage Tests

| Test Case | Expected | Priority |
|-----------|----------|----------|
| Upload JPEG < 20MB | Success | High |
| Upload PNG < 20MB | Success | High |
| Upload PDF < 20MB | Success | High |
| Upload > 20MB | Fail: size error | High |
| Upload invalid type | Fail: type error | High |
| Download own receipt | Success | High |
| Download other's receipt | Fail: RLS block | High |
| Delete removes file | File removed from storage | Medium |

### Parsing Tests

| Test Case | Expected | Priority |
|-----------|----------|----------|
| Parse clear receipt | Items extracted | High |
| Parse blurry receipt | Low confidence or fail | Medium |
| Parse Indian receipt (INR) | Amounts in INR | High |
| Parse with GST breakdown | Tax items flagged | High |
| Parse multi-page PDF | All pages processed | Medium |
| Parse handwritten | Best effort extraction | Low |

### API Tests

| Endpoint | Test Case | Expected |
|----------|-----------|----------|
| POST /receipt | Valid image | 201, receipt created |
| POST /receipt | Already exists | 400, exists error |
| GET /receipt | Exists | 200, receipt + items |
| GET /receipt | Not exists | 200, null |
| POST /parse | Pending receipt | 200, items created |
| POST /parse | Already parsed | 400, already parsed |
| PATCH /items | Valid updates | 200, items updated |
| POST /create-sub-transactions | Parsed, >=2 items | 201, subs created |
| POST /create-sub-transactions | <2 eligible items | 400, count error |
| DELETE /receipt | Exists | 200, deleted |

### UI Tests

| Component | Test Case | Expected |
|-----------|-----------|----------|
| ReceiptUploader | Select file | Preview shown |
| ReceiptUploader | Upload | Progress, then success |
| ReceiptViewer | Pending | Parse button shown |
| ReceiptViewer | Processing | Spinner shown |
| ReceiptViewer | Failed | Error + retry button |
| ReceiptViewer | Completed | Items + totals shown |
| ReceiptItemsEditor | Toggle exclude | Item dimmed |
| ReceiptItemsEditor | Edit item | Inline edit works |
| ReceiptItemsEditor | Create subs | API called, subs created |

---

## Feature 3: Smart Refunds

### Database Tests

| Test Case | Expected | Priority |
|-----------|----------|----------|
| Link credit to debit | Success, is_refund set | High |
| Link credit to credit | Fail: direction error | High |
| Link debit to anything | Fail: must be credit | High |
| Link exceeds remaining | Fail: amount error | High |
| Link chain (refund of refund) | Fail: chain error | High |
| Unlink resets all fields | Fields nulled | High |
| Suggestion returns matches | Ranked by score | High |
| Suggestion excludes linked | Only unlinked shown | Medium |

### API Tests

| Endpoint | Test Case | Expected |
|----------|-----------|----------|
| GET /refund-suggestions | Credit, has matches | 200, ranked list |
| GET /refund-suggestions | Credit, no matches | 200, empty list |
| GET /refund-suggestions | Debit | 400, wrong direction |
| GET /refund-suggestions | Already linked | 400, already linked |
| POST /link-refund | Valid | 200, linked |
| POST /link-refund | Amount exceeds | 400, amount error |
| POST /link-refund | Already linked | 400, already linked |
| DELETE /link-refund | Is linked | 200, unlinked |
| DELETE /link-refund | Not linked | 400, not linked |
| GET /refund-status | Has refunds | 200, status + refunds |
| GET /refund-status | No refunds | 200, zero counts |

### UI Tests

| Component | Test Case | Expected |
|-----------|-----------|----------|
| RefundLinkModal | Open | Suggestions loaded |
| RefundLinkModal | Select | Link API called |
| RefundLinkModal | No matches | Empty state shown |
| RefundIndicator | Credit linked | Shows original info |
| RefundIndicator | Debit partial | Shows remaining |
| RefundIndicator | Debit full | Shows "Fully Refunded" |
| RefundStatusBadge | Credit refund | Shows "Refund" badge |
| RefundStatusBadge | Debit refunded | Shows "Refunded" badge |

---

## Cross-Feature Tests

| Scenario | Expected |
|----------|----------|
| Sub-txn inherits Splitwise from parent | Sub-txn has same ID |
| Receipt creates sub-txns with parent Splitwise | Sub-txns have ID |
| Refund original with sub-txns | Warning shown |
| Parent with sub-txns shows badge + subs | Both indicators |
| Delete parent deletes subs | Cascade works |
| Unlink Splitwise cascades to subs | All IDs cleared |

---

## Performance Tests

| Test | Target | Priority |
|------|--------|----------|
| Load 100 sub-transactions | < 500ms | Medium |
| Parse receipt image | < 10s | Medium |
| Get refund suggestions | < 1s | Medium |
| Create 10 sub-transactions | < 2s | Medium |

---

## Security Tests

| Test | Expected | Priority |
|------|----------|----------|
| Access other user's sub-transaction | 404 | High |
| Access other user's receipt | 404 | High |
| Link to other user's transaction | 404 | High |
| Download other user's receipt file | Denied | High |
| Bypass trigger with raw SQL | RLS blocks | High |

---

## Regression Tests

| Area | Test | Expected |
|------|------|----------|
| Transaction list | Load with subs | Badges shown |
| Transaction modal | Open parent | Subs section shown |
| Transaction modal | Open sub-txn | No split button |
| Splitwise sync | Parent with subs | Still works |
| Transaction edit | Save parent | Triggers intact |
| Transaction delete | Delete parent | Subs cascade |

---

## Test Environment

### Local
```bash
# Run unit tests
npm test

# Run specific test file
npm test -- --grep "sub-transaction"
```

### Staging (Vercel Preview)
- Test with preview deployment
- Use test user account
- Verify RLS with different users

### Production
- Smoke test after deploy
- Monitor error rates
- Check Sentry for issues
