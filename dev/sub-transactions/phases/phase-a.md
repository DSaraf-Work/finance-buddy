# Phase A: Requirements Gathering & Documentation

> **Phase**: A - Requirements Gathering
> **Date**: 2026-01-11
> **Status**: Complete - Awaiting Approval

---

## What I Learned

### 1. Existing Database Architecture

**Key Finding**: The `fb_emails_processed` table is the core transaction storage.

```typescript
// From src/types/database.ts
fb_emails_processed: {
  Row: {
    id: string;
    user_id: string;
    google_user_id: string;
    email_row_id: string;
    amount: number | null;
    currency: string | null;
    direction: string | null;  // 'debit' | 'credit'
    merchant_name: string | null;
    merchant_normalized: string | null;
    category: string | null;
    account_type: string | null;
    txn_time: string | null;
    splitwise_expense_id: string | null;  // ← CRITICAL for cascade
    user_notes: string | null;
    ai_notes: string | null;
    status: string;
    // ... other fields
  }
}
```

**Implication**: Sub-transactions will use self-referential FK on this same table (no new table needed).

---

### 2. Splitwise Integration Pattern

**Key Finding**: Existing Splitwise integration is well-structured.

From `src/components/TransactionModal.tsx`:
- Line 128: `handleSplitwiseExpenseCreated` function updates transaction with expense ID
- Line 131: API call to `/api/transactions/${id}` with PATCH updates `splitwise_expense_id`
- Line 687-710: Shows "Split with [friends]" banner when expense exists
- Lines 716-736: SplitwiseDropdown component integration

From `src/components/transactions/TxnCard.tsx`:
- Lines 78-88: Displays Splitwise indicator icon when `splitwise_expense_id` exists

**Implication**:
- We need DB trigger to cascade `splitwise_expense_id` from parent to children
- Sub-transactions should show inherited Splitwise indicator
- SplitwiseDropdown must be DISABLED on sub-transaction rows

---

### 3. Transaction API Patterns

**Key Finding**: Clean REST API structure using Next.js API routes.

From `src/pages/api/transactions/[id]/index.ts`:
- Uses `withAuth` middleware (line 10)
- GET: Fetches single transaction with joins (lines 17-54)
- PATCH: Updates allowed fields with validation (lines 57-113)
- DELETE: Removes transaction (lines 115-138)
- Allowed fields list at lines 62-78

**Implication**:
- New endpoints should follow same pattern
- Need to add sub-transaction endpoints at `/api/transactions/[id]/sub-transactions`
- Will reuse `withAuth` middleware
- Should expand allowed fields in PATCH to include `parent_transaction_id`, `is_sub_transaction`, `sub_transaction_order`

---

### 4. UI Component Patterns

**Key Finding**: Transaction UI uses inline styles + design system tokens.

From `src/components/transactions/TxnCard.tsx`:
- Memo-ized component for performance (line 28)
- Inline styles for precise control (lines 36-126)
- No nested interactive elements (onClick on entire card)
- 48x48px icon, 14px gaps, specific font sizes
- Separator between cards (lines 130-134)

From `src/components/TransactionModal.tsx`:
- Shadcn Dialog component (lines 279-788)
- Collapsible sections (email body at 584-631, notes at 634-683)
- Toast notifications for Splitwise (lines 294-323)
- Re-extract AI button pattern (lines 737-754)

**Implication**:
- Sub-transactions should render as expandable/collapsible list within parent
- Need new badge on TxnCard showing count (e.g., "3 items")
- Sub-transaction editor likely as modal or collapsible section in TransactionModal
- Follow existing notification pattern for validation errors

---

### 5. Design System Rules

**Key Finding**: Strict design system with CSS variables only.

From `docs/DESIGN_SYSTEM.md`:
- Dark-only theme (no light mode)
- All colors via CSS variables: `bg-primary`, `text-foreground`, `border-border`
- Never hardcode colors
- Lucide React for icons
- Mobile-first: 430px minimum width
- Semantic colors: `text-green-400` for income, `text-red-400` for expense

From `.claude/rules/design-system.md`:
- MANDATORY: Use design tokens
- Components must have loading states
- Hover effects required
- React.memo for performance
- Numbers use `font-mono`

**Implication**:
- Sub-transaction UI must follow design system exactly
- Badge should use semantic colors (e.g., `bg-primary/10 text-primary`)
- Loading states required during save/delete operations
- Real-time validation feedback with color coding

---

### 6. Existing Migration Pattern

**Key Finding**: Migrations are in `infra/migrations/` with sequential numbering.

Files found:
- `0001_init.sql` - Initial schema
- `0002_notifications_and_auto_sync.sql`
- `0002_transaction_keywords.sql` (duplicate 0002!)
- `0004_remove_pubsub.sql`

**Implication**:
- New migration should be `0005_sub_transactions.sql`
- Must include RLS policies
- Must include database triggers for validation
- Must include comments on new columns

---

### 7. Design Document Analysis

**Key Finding**: Comprehensive design doc exists at `docs/SUB_TRANSACTIONS_DESIGN.md`.

Relevant sections extracted:
- Section 4.1: Database schema with `parent_transaction_id`, `is_sub_transaction`, `sub_transaction_order`
- Section 4.2: Includes receipt schema (OUT OF SCOPE for this feature)
- Section 4.1b: Includes refund schema (OUT OF SCOPE for this feature)
- Database triggers defined (lines 440-458): Cascade Splitwise ID to children
- Validation rules comprehensive (lines 3310-3400+)
- API specifications detailed (lines 2470-2520)

**Implication**:
- We can reuse database schema from design doc (Section 4.1 only)
- Triggers are well-defined and ready to implement
- API patterns are already specified
- Types are defined (can extract relevant portions)

---

## Codebase Exploration Summary

### Files Read
1. ✅ `docs/SUB_TRANSACTIONS_DESIGN.md` (partial - focused on sub-transactions only)
2. ✅ `src/types/database.ts` - Database type definitions
3. ✅ `src/components/TransactionModal.tsx` - Transaction editing UI
4. ✅ `src/components/transactions/TxnCard.tsx` - Transaction card component
5. ✅ `src/pages/api/transactions/[id]/index.ts` - Transaction API pattern
6. ✅ `docs/DESIGN_SYSTEM.md` - Design system rules (partial)
7. ✅ `.claude/rules/design-system.md` - Design system constraints

### Files Searched
- Migration files in `infra/migrations/`
- Transaction-related TypeScript files
- API route files
- Splitwise integration files

### Key Directories
- `src/components/` - React components
- `src/pages/api/` - Next.js API routes
- `src/types/` - TypeScript type definitions
- `src/lib/` - Utility libraries
- `infra/migrations/` - Database migrations
- `docs/` - Documentation

---

## Assumptions Made

### Database Assumptions
1. **No new tables needed**: Sub-transactions live in `fb_emails_processed` table
2. **RLS already enforced**: Existing policies on `fb_emails_processed` cover sub-transactions
3. **No receipt_item_id**: Field exists in design doc but set to NULL for manual splits
4. **ON DELETE CASCADE**: Parent deletion automatically removes all children

### API Assumptions
1. **Bulk creation**: POST endpoint creates multiple sub-transactions in one call
2. **Validation server-side**: Amount sum validation happens on API, not just client
3. **Atomic operations**: Creating subs wrapped in transaction for all-or-nothing
4. **User ownership**: `withAuth` middleware enforces user_id matching

### UI Assumptions
1. **Expandable list**: Sub-transactions show/hide inline, not separate page
2. **Badge placement**: On TxnCard next to category or as pill badge
3. **Real-time validation**: Sum calculation updates as user types amounts
4. **Inline edit**: Edit sub-transaction inline rather than full modal (faster UX)

### Integration Assumptions
1. **Splitwise cascade automatic**: DB trigger handles this, no manual code needed
2. **Currency inheritance**: Sub-transactions always use parent currency
3. **Status inheritance**: Sub-transactions inherit parent status on creation
4. **No nested splits**: DB trigger prevents sub-transactions from having children

---

## Decisions Deferred to User

The following questions are documented in `requirements.md` under "Open Questions & Assumptions". These need user input before Phase D (Technical Design):

1. Sub-transaction edit UI: inline vs. modal vs. popover?
2. Replace vs. error when splitting already-split transaction?
3. Parent amount lock visual indicator style?
4. Badge design specifics (pill, icon, text)?
5. Delete confirmation: always vs. only when sum breaks?
6. Transaction list filtering: show parent or show matching children?

---

## Constraints Identified

### Hard Constraints (Cannot Change)
1. Must use existing `fb_emails_processed` table (no new transaction table)
2. Must maintain backward compatibility with existing transactions
3. Must preserve Splitwise integration without breaking changes
4. Must follow existing design system (dark-only, CSS variables)
5. Must use existing auth pattern (`withAuth` middleware)

### Soft Constraints (Preferably Maintain)
1. Mobile-first design (430px minimum)
2. Performance: < 500ms for query with sub-transactions
3. Real-time validation feedback in UI
4. Atomic database operations (transactions)

### Business Constraints
1. Min 2, max 10 sub-transactions (UI/UX limit)
2. Amount precision: 2 decimal places (₹0.01)
3. Sum tolerance: ±₹0.01 (floating-point safety)
4. Single-level nesting only (no sub-sub-transactions)

---

## Risks & Mitigations

### Technical Risks

**Risk**: Database cascade trigger fails silently
- **Likelihood**: Low
- **Impact**: High (Splitwise ID not propagated)
- **Mitigation**: Comprehensive integration tests; trigger logs errors

**Risk**: Performance degradation with many sub-transactions
- **Likelihood**: Medium
- **Impact**: Medium
- **Mitigation**: Index on `parent_transaction_id`; query optimization; limit to 10 subs

**Risk**: Race condition when updating parent and children simultaneously
- **Likelihood**: Low
- **Impact**: Medium
- **Mitigation**: Use database transactions (BEGIN/COMMIT); optimistic locking

### UX Risks

**Risk**: User confusion with locked parent amount
- **Likelihood**: Medium
- **Impact**: Low
- **Mitigation**: Clear tooltip + visual indicator; helper text

**Risk**: Accidental deletion of sub-transactions
- **Likelihood**: Medium
- **Impact**: Low
- **Mitigation**: Confirm only when sum breaks; undo option (future)

### Data Integrity Risks

**Risk**: Sub-transaction sum doesn't match parent
- **Likelihood**: Medium (user error)
- **Impact**: High (bad data)
- **Mitigation**: Real-time validation + server-side enforcement; warning banner

**Risk**: Orphaned sub-transactions after parent deletion
- **Likelihood**: Low
- **Impact**: High
- **Mitigation**: ON DELETE CASCADE; integration tests

---

## Next Steps

1. **User Review**: Review `requirements.md` and answer open questions
2. **Approval Gate**: Respond with "PROCEED TO PHASE B" if requirements are clear
3. **Phase B**: Refine requirements based on feedback
4. **Phase C**: Validate edge cases and clarify integration details
5. **Phase D**: Create technical design document
6. **Phase E**: Finalize design and get implementation approval
7. **Phase F**: Execute implementation autonomously

---

## Files Created

- ✅ `/Users/dsaraf/Documents/Repos/finance-buddy/dev/sub-transactions/requirements.md`
- ✅ `/Users/dsaraf/Documents/Repos/finance-buddy/dev/sub-transactions/phases/phase-a.md`

---

## Summary for User

I've completed Phase A by:

1. **Explored the codebase** to understand:
   - Existing `fb_emails_processed` table structure
   - Splitwise integration patterns
   - Transaction API architecture
   - UI component patterns (TxnCard, TransactionModal)
   - Design system rules (dark-only, CSS variables)

2. **Extracted sub-transaction requirements** from the 46k-token design doc, filtering out:
   - Receipt parsing feature (out of scope)
   - Refund system (out of scope)

3. **Created requirements document** covering:
   - Problem statement and use cases
   - In-scope: 2-10 manual sub-transactions, Splitwise cascade, amount validation
   - Out-of-scope: Receipts, refunds, AI suggestions
   - Constraints: DB, business, integration, rollout
   - 12 functional acceptance criteria
   - 5 non-functional acceptance criteria
   - User flows for create/edit/delete operations

4. **Documented 12 open questions** requiring your decisions (e.g., inline edit vs. modal, badge design, delete confirmation)

5. **Identified constraints and risks** with mitigations

The requirements are **crisp, testable, and scoped tightly** to sub-transactions only.

**Ready for your review.**
