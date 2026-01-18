# Sub-Transactions Feature Requirements

> **Feature**: Sub-Transactions (Split Transaction Categorization)
> **Status**: Phase A - Requirements Gathering
> **Created**: 2026-01-11
> **Scope**: ONLY sub-transactions. Receipt parsing and refunds are OUT OF SCOPE.

---

## Problem Statement

Users currently cannot break down a single transaction into multiple categorized line items. For example, a ₹5,000 grocery purchase cannot be split into "Vegetables ₹1,500", "Dairy ₹800", "Snacks ₹2,700" for better expense tracking and budgeting.

This feature enables users to manually split any transaction into 2-10 sub-transactions, each with its own category, amount, and notes, while maintaining data integrity and preserving existing Splitwise integration.

---

## Target Users & Use Cases

### Primary Users
- Finance Buddy users who want granular expense categorization
- Users with mixed-category transactions (e.g., grocery stores, department stores)
- Users tracking budgets by category who need accurate breakdowns

### Key Use Cases

1. **Grocery Shopping**: Split ₹3,000 supermarket transaction into Food, Household, Personal Care
2. **Mixed Purchases**: Split ₹10,000 Amazon order into Electronics, Books, Home Decor
3. **Dining with Extras**: Split ₹2,500 restaurant bill into Food, Drinks, Tip
4. **Business Expenses**: Split ₹5,000 store purchase into Office Supplies, Snacks, Gifts
5. **Splitwise Integration**: Maintain split expense tracking when sub-transactions exist

---

## In-Scope

### Core Functionality
- ✅ Split a parent transaction into 2-10 sub-transactions
- ✅ Each sub-transaction has: amount, category, merchant_name (optional), user_notes (optional)
- ✅ Sub-transaction amounts must sum exactly to parent amount (tolerance: ±₹0.01)
- ✅ View sub-transactions in expandable/collapsible UI within transaction list
- ✅ Edit individual sub-transaction (category, notes, amount with re-validation)
- ✅ Delete individual sub-transaction (updates sum, shows warning if mismatch)
- ✅ Delete all sub-transactions at once
- ✅ Badge on TxnCard showing sub-transaction count (e.g., "3 items")

### Database & Architecture
- ✅ Self-referential FK on `fb_emails_processed` table (`parent_transaction_id`)
- ✅ Fields: `is_sub_transaction`, `sub_transaction_order`, `parent_transaction_id`
- ✅ Database trigger: Prevent nested sub-transactions (max 1 level)
- ✅ Database trigger: Cascade Splitwise expense ID from parent to children
- ✅ ON DELETE CASCADE for parent → children relationship

### Splitwise Integration
- ✅ When parent has Splitwise expense ID, automatically cascade to all sub-transactions
- ✅ Splitwise button DISABLED on sub-transactions (can only split at parent level)
- ✅ Display "Split with [friends]" indicator on parent transaction
- ✅ Sub-transactions inherit parent's `splitwise_expense_id` field

### Data Integrity
- ✅ Parent transaction amount LOCKED when sub-transactions exist
- ✅ Real-time validation: sum of sub-transaction amounts = parent amount (UI + API)
- ✅ Sub-transactions excluded from main transaction list by default (filterable)
- ✅ Parent transaction shows aggregated view of sub-transactions

---

## Out of Scope (Explicitly NOT in this feature)

- ❌ Receipt image upload and parsing (separate feature)
- ❌ AI-powered receipt OCR (separate feature)
- ❌ Refund/return transaction linking (separate feature)
- ❌ Automatic categorization of sub-transactions via AI
- ❌ Receipt storage in Supabase Storage
- ❌ Receipt line item to sub-transaction conversion
- ❌ Smart suggestions for splitting (manual entry only)
- ❌ Templates for common split patterns
- ❌ Bulk operations across multiple transactions

---

## Constraints

### Technical Constraints
1. **Database**: Use existing `fb_emails_processed` table with new columns (no new tables)
2. **Backward Compatibility**: Existing transactions without sub-transactions must work unchanged
3. **RLS Policies**: Sub-transactions inherit parent's user_id, RLS enforced at parent level
4. **Performance**: Query optimization required for transactions with sub-transactions
5. **Data Model**: No receipt_item_id field in initial implementation (leave NULL for future)

### Business Constraints
1. **Minimum Count**: At least 2 sub-transactions required (no point splitting into 1)
2. **Maximum Count**: No more than 10 sub-transactions (UI/UX complexity limit)
3. **Amount Precision**: Maximum 2 decimal places (₹0.01 precision)
4. **Amount Validation**: Sum must equal parent within ₹0.01 tolerance
5. **Nesting Limit**: Only 1 level deep (no sub-sub-transactions)

### Integration Constraints
1. **Splitwise**: Parent transaction must be the source of truth for Splitwise expense ID
2. **Email Processing**: Existing email extraction pipeline unchanged
3. **Transaction Status**: Sub-transactions inherit parent status by default
4. **Currency**: Sub-transactions inherit parent currency (no mixed currencies)

### Rollout Constraints
1. **Rollout**: Feature flag controlled (optional, can release immediately)
2. **Migration**: No data migration needed for existing transactions
3. **Testing**: Must test with existing Splitwise-linked transactions
4. **Documentation**: Update user guide with sub-transaction workflows

---

## Success Metrics / Acceptance Criteria

### Functional Acceptance Criteria

| ID | Criterion | Test Method |
|----|-----------|-------------|
| AC-1 | User can split a transaction into 2-10 sub-transactions via UI | Manual test |
| AC-2 | Sub-transaction amounts sum exactly to parent amount (±₹0.01) | Unit test + UI validation |
| AC-3 | Attempting to create nested sub-transactions is blocked | DB trigger test |
| AC-4 | Splitwise expense ID cascades from parent to all children | DB trigger test |
| AC-5 | Parent transaction amount cannot be edited when sub-transactions exist | UI + API test |
| AC-6 | Sub-transactions display in expandable list under parent | UI test |
| AC-7 | TxnCard shows badge with count (e.g., "3 items") when sub-transactions exist | UI test |
| AC-8 | Deleting parent transaction cascades delete to all sub-transactions | DB cascade test |
| AC-9 | User can edit individual sub-transaction category and notes | API + UI test |
| AC-10 | User can delete individual sub-transaction (sum may become invalid) | API + UI test |
| AC-11 | Main transaction list excludes sub-transactions by default | Query test |
| AC-12 | Splitwise button is disabled on sub-transaction rows | UI test |

### Non-Functional Acceptance Criteria

| ID | Criterion | Target |
|----|-----------|--------|
| NF-1 | API response time for creating 10 sub-transactions | < 2 seconds |
| NF-2 | UI re-renders within acceptable time when expanding parent | < 500ms |
| NF-3 | Database query with sub-transactions join performs adequately | < 500ms for 1000 transactions |
| NF-4 | Mobile UI displays sub-transactions without horizontal scroll | 430px width |
| NF-5 | Sub-transaction validation errors display clearly | User-friendly messages |

### Edge Cases to Handle

| Scenario | Expected Behavior |
|----------|-------------------|
| Delete middle sub-transaction | Remaining subs stay; sum recalculated; warning if mismatch |
| Edit sub-transaction amount to exceed parent | Validation error in real-time; cannot save |
| Create sub-transactions on already-split parent | Replace existing or error (TBD: need decision) |
| Splitwise expense created after sub-transactions exist | Cascade ID to all existing sub-transactions |
| Parent transaction has 0 or negative amount | Block sub-transaction creation (invalid use case) |
| Sub-transaction categories differ from parent | Allowed (that's the point of the feature) |
| User tries to split a sub-transaction | Blocked by DB trigger with clear error message |

---

## User Flow

### Main Happy Path: Create Sub-Transactions

1. User opens transaction details modal for ₹5,000 grocery purchase
2. User clicks "Split Transaction" button (new)
3. Modal displays "Sub-Transaction Editor" with:
   - Parent transaction amount shown at top (₹5,000)
   - Form to add sub-transactions (2 pre-filled rows)
   - Each row: Amount, Category (dropdown), Notes (optional)
   - Real-time sum display: "Total: ₹0 / ₹5,000 (₹5,000 remaining)"
4. User fills in:
   - Sub 1: ₹2,000, Category: Food, Notes: "Vegetables and fruits"
   - Sub 2: ₹1,500, Category: Household, Notes: "Cleaning supplies"
   - Sub 3: ₹1,500, Category: Personal Care, Notes: "Toiletries"
5. Real-time validation shows "Total: ₹5,000 / ₹5,000 ✓"
6. User clicks "Save Sub-Transactions"
7. API creates 3 sub-transactions with correct parent_transaction_id
8. UI updates: TxnCard now shows badge "3 items"
9. User can click to expand and see 3 sub-transactions inline

### Alternative Path: Edit Existing Sub-Transaction

1. User expands parent transaction to view sub-transactions
2. User clicks on sub-transaction row
3. Inline edit or modal opens (TBD: need decision)
4. User changes category from "Food" to "Snacks"
5. User clicks save
6. API updates sub-transaction record
7. UI reflects change immediately

### Alternative Path: Delete Sub-Transaction

1. User expands parent transaction
2. User clicks delete icon on sub-transaction #2
3. Confirmation: "Delete this sub-transaction? Sum will be ₹3,500 / ₹5,000."
4. User confirms
5. API deletes sub-transaction
6. UI shows warning: "Sub-transactions don't sum to parent (₹1,500 difference)"
7. Badge updates to "2 items"

---

## Technical Notes

### Database Schema Changes

```sql
-- Add to fb_emails_processed table
parent_transaction_id  UUID REFERENCES fb_emails_processed(id) ON DELETE CASCADE
is_sub_transaction     BOOLEAN DEFAULT FALSE
sub_transaction_order  INTEGER DEFAULT 0
```

### Key Relationships

```
Parent Transaction (fb_emails_processed)
├── id: primary key
├── amount: ₹5,000 (locked when subs exist)
├── splitwise_expense_id: "exp_abc123"
└── has_sub_transactions: true (computed)

Sub-Transaction 1 (fb_emails_processed)
├── id: new UUID
├── parent_transaction_id: → parent.id
├── is_sub_transaction: true
├── sub_transaction_order: 0
├── amount: ₹2,000
├── category: "Food"
├── splitwise_expense_id: "exp_abc123" (inherited)
└── user_id: (same as parent)

Sub-Transaction 2 (fb_emails_processed)
├── id: new UUID
├── parent_transaction_id: → parent.id
├── is_sub_transaction: true
├── sub_transaction_order: 1
├── amount: ₹1,500
├── category: "Household"
├── splitwise_expense_id: "exp_abc123" (inherited)
└── user_id: (same as parent)
```

### API Endpoints Required

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/transactions/[id]/sub-transactions` | POST | Create sub-transactions (bulk) |
| `/api/transactions/[id]/sub-transactions` | GET | List all sub-transactions for parent |
| `/api/transactions/[id]/sub-transactions` | DELETE | Delete all sub-transactions |
| `/api/transactions/[id]/sub-transactions/[subId]` | PATCH | Update single sub-transaction |
| `/api/transactions/[id]/sub-transactions/[subId]` | DELETE | Delete single sub-transaction |

---

## Open Questions & Assumptions

### Questions Requiring User Decisions

1. **Sub-Transaction UI Pattern**
   - Q: Should sub-transactions edit inline or open a modal?
   - Options: (a) Inline edit with save/cancel, (b) Open same TransactionModal, (c) Minimal quick-edit popover
   - Assumption: **Inline edit for speed** (if no decision made)

2. **Replace vs. Append**
   - Q: If user clicks "Split Transaction" on already-split transaction, should we replace or error?
   - Options: (a) Show error "Already split", (b) Replace existing subs, (c) Add to existing subs
   - Assumption: **Show error + option to delete existing first** (safest)

3. **Amount Lock UX**
   - Q: How should we indicate parent amount is locked?
   - Options: (a) Disable input + tooltip, (b) Show read-only with icon, (c) Hide amount field
   - Assumption: **Disable with tooltip "Amount locked while sub-transactions exist"**

4. **Badge Design**
   - Q: What should the badge look like on TxnCard?
   - Options: (a) Pill badge "3 items", (b) Icon with number, (c) Subtle text indicator
   - Assumption: **Pill badge with icon** (matches design system)

5. **Sub-Transaction Display Limit**
   - Q: Should we show all subs or paginate if > 10?
   - Assumption: **Show all (max 10 enforced)**, no pagination needed

6. **Delete Confirmation**
   - Q: Confirm before deleting individual sub-transaction?
   - Options: (a) No confirm (too frequent), (b) Confirm if sum breaks, (c) Always confirm
   - Assumption: **Confirm if sum breaks; otherwise instant delete** (smart UX)

7. **Parent Transaction Filtering**
   - Q: Should filtered transaction list show parent or children when filtering by category?
   - Example: Filter by "Food" category → Show parent or show matching sub-transactions?
   - Assumption: **Show parent if ANY child matches** (preserves context)

8. **Splitwise Cascade Timing**
   - Q: If user adds Splitwise AFTER creating subs, should cascade be automatic?
   - Assumption: **Yes, automatic via DB trigger** (already in design doc)

9. **Currency Inheritance**
   - Q: Can sub-transactions have different currency than parent?
   - Assumption: **No, inherit parent currency** (simpler MVP)

10. **Status Inheritance**
    - Q: Do sub-transactions inherit parent status field?
    - Assumption: **Yes, inherit on creation** but can be edited independently

11. **Zero-Amount Sub-Transactions**
    - Q: Allow ₹0.00 sub-transactions (e.g., for freebies)?
    - Assumption: **No, minimum ₹0.01** (cleaner data model)

12. **Negative Sub-Transactions**
    - Q: Allow negative sub-transactions (e.g., discount line items)?
    - Assumption: **No for MVP** (out of scope, revisit later)

### Technical Assumptions (Safe Defaults)

- TypeScript types will be co-located in `src/types/sub-transactions.ts`
- Validation logic will use Zod schemas in `src/lib/validation/sub-transactions.ts`
- UI components will follow existing design system patterns (see design-system.md)
- APIs will use existing `withAuth` middleware for authentication
- RLS policies on `fb_emails_processed` already cover sub-transactions (same table)
- Migration file will be `0005_sub_transactions.sql` (already drafted in design doc)
- Mobile-first responsive design: 430px minimum width
- No feature flag required for initial release (low risk)

---

## Dependencies & Prerequisites

### Existing Systems to Understand
- ✅ Current `fb_emails_processed` table schema
- ✅ Existing TransactionModal component
- ✅ TxnCard component rendering logic
- ✅ Splitwise integration flow (SplitwiseDropdown component)
- ✅ API authentication pattern (withAuth middleware)
- ✅ Design system (theme.css, Tailwind classes)

### Required Before Implementation
- Database migration file ready
- Types file defined
- Validation schemas written
- UI mockups/wireframes (can sketch during design phase)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Sub-transaction sum doesn't match parent | Medium | High | Real-time validation + server-side check |
| Nested sub-transactions created accidentally | Low | Medium | DB trigger blocks this |
| Splitwise cascade fails | Low | High | Wrap in transaction; add integration tests |
| Performance degradation with many subs | Medium | Medium | Index on parent_transaction_id; query optimization |
| User confusion with locked parent amount | Medium | Low | Clear UI messaging + tooltips |
| Data integrity issues on delete | Low | High | ON DELETE CASCADE + comprehensive tests |

---

## Next Steps (After Phase A Approval)

1. Proceed to **Phase B**: Requirements review and refinement based on user feedback
2. Answer open questions above
3. Create wireframes/mockups for sub-transaction UI
4. Define exact validation error messages
5. Document API request/response formats in detail
