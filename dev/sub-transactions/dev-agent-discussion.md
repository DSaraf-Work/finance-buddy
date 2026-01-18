# Sub-Transactions Feature - Development Discussion Log

> **Feature**: Sub-Transactions (Manual Transaction Splitting)
> **Started**: 2026-01-11
> **Agent**: Claude Code (Sonnet 4.5)

---

## Phase Progress

- [x] **Phase A**: Requirements Gathering & Documentation - COMPLETE
- [ ] **Phase B**: Requirements Review & Refinement
- [ ] **Phase C**: Requirements Validation & Clarification
- [ ] **Phase D**: Technical Design Document Creation
- [ ] **Phase E**: Design Review & Finalization
- [ ] **Phase F**: Implementation Execution

---

## Decision Log

### Phase A Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-11 | Scope limited to sub-transactions only (no receipts, no refunds) | User explicitly requested sub-transactions as separate feature |
| 2026-01-11 | Use self-referential FK on existing `fb_emails_processed` table | Design doc already specified this approach; no new tables needed |
| 2026-01-11 | Minimum 2, maximum 10 sub-transactions | Balances utility with UI/UX complexity |
| 2026-01-11 | Amount validation tolerance: ±₹0.01 | Handles floating-point precision issues |
| 2026-01-11 | Single-level nesting only | Prevents complexity; DB trigger enforces |
| 2026-01-11 | Splitwise ID cascades via DB trigger | Automatic, no manual code needed |
| 2026-01-11 | Sub-transactions excluded from main list by default | Avoids duplicate counting in summaries |
| 2026-01-11 | Parent amount locked when sub-transactions exist | Maintains data integrity |

---

## Assumptions Log

### Database Assumptions
- RLS policies on `fb_emails_processed` automatically cover sub-transactions (same table, same user_id)
- Migration file will be numbered `0005_sub_transactions.sql`
- `receipt_item_id` field exists in schema but will be NULL for manual splits
- ON DELETE CASCADE handles parent → children cleanup

### API Assumptions
- Bulk creation endpoint: Create all sub-transactions in single POST call
- Validation happens server-side + client-side (belt and suspenders)
- Atomic operations: Wrap in database transaction
- Use existing `withAuth` middleware pattern

### UI Assumptions
- **Inline edit for sub-transactions** (default assumption if no decision)
- **Error and block** when trying to split already-split transaction (safest)
- **Disable parent amount input with tooltip** when subs exist
- **Pill badge with icon** showing count (e.g., "3 items")
- **Show parent in filtered list** if ANY child matches category filter
- **Confirm delete only if sum breaks** (smart UX)

### Integration Assumptions
- Currency must match parent (no mixed currencies in MVP)
- Status inherited from parent on creation (can edit independently later)
- Minimum sub-transaction amount: ₹0.01 (no zero amounts)
- No negative sub-transactions in MVP (discount line items later)

**NOTE**: All assumptions marked "ASSUMPTION" in requirements.md need confirmation in Phase B.

---

## Open Questions (Awaiting User Input)

### Critical for Phase D (Design)

1. **Sub-Transaction Edit UI Pattern**
   - Option A: Inline edit with save/cancel buttons
   - Option B: Open same TransactionModal component
   - Option C: Quick-edit popover with minimal fields
   - **Status**: OPEN

2. **Already-Split Transaction Behavior**
   - Option A: Show error "Already split"
   - Option B: Replace existing sub-transactions
   - Option C: Allow adding to existing sub-transactions
   - **Status**: OPEN

3. **Parent Amount Lock Indicator**
   - Option A: Disable input + tooltip
   - Option B: Read-only with lock icon
   - Option C: Hide amount field entirely
   - **Status**: OPEN

4. **Badge Design on TxnCard**
   - Option A: Pill badge "3 items"
   - Option B: Icon with number badge
   - Option C: Subtle text indicator
   - **Status**: OPEN

5. **Delete Confirmation Strategy**
   - Option A: No confirm (instant delete)
   - Option B: Confirm only if sum breaks
   - Option C: Always confirm
   - **Status**: OPEN

6. **Category Filtering Behavior**
   - Scenario: User filters by "Food" category
   - Option A: Show parent transaction if ANY child is "Food"
   - Option B: Show matching sub-transactions directly (not parent)
   - **Status**: OPEN

### Nice-to-Have for Phase E (Final Design)

7. Sub-transaction display limit if > 10 (should never happen, but defensive)
8. Undo/redo support for delete operations (future enhancement)
9. Keyboard shortcuts for sub-transaction management
10. Bulk operations across sub-transactions (e.g., set all categories at once)

---

## Constraints Identified

### Cannot Change (Hard Constraints)
- ✓ Must use `fb_emails_processed` table (no new tables)
- ✓ Must maintain backward compatibility
- ✓ Must preserve Splitwise integration
- ✓ Must follow dark-only design system
- ✓ Must use existing auth patterns

### Preferably Maintain (Soft Constraints)
- ✓ Mobile-first (430px minimum)
- ✓ Performance: < 500ms query time
- ✓ Real-time validation
- ✓ Atomic database operations

### Business Rules
- ✓ 2-10 sub-transactions per parent
- ✓ 2 decimal places max (₹0.01 precision)
- ✓ ±₹0.01 sum tolerance
- ✓ Single-level nesting only

---

## Technical Discoveries

### Splitwise Integration
- SplitwiseDropdown component handles expense creation
- `splitwise_expense_id` stored in transaction record
- Existing API: `/api/splitwise/expense/[id]` checks if expense exists
- DB trigger needed to cascade ID from parent to children

### Transaction API Patterns
- REST endpoints: GET, PATCH, DELETE at `/api/transactions/[id]`
- Allowed fields list in PATCH handler
- Uses Supabase Admin client
- Returns full transaction object after updates

### UI Component Architecture
- TxnCard is memo-ized for performance
- TransactionModal uses shadcn/ui Dialog
- Collapsible sections pattern: email body, notes
- Toast notifications for async operations

### Design System
- All colors via CSS variables (e.g., `--primary`, `--foreground`)
- No hardcoded colors allowed
- Lucide React for icons
- Font: Outfit for text, JetBrains Mono for amounts

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| DB cascade trigger fails | HIGH | Integration tests + error logging |
| Performance with many subs | MEDIUM | Index on parent_id + query optimization |
| Race conditions on updates | MEDIUM | Use DB transactions + optimistic locking |
| User confusion with locked amount | LOW | Clear tooltips + visual indicators |
| Sub-transaction sum mismatch | HIGH | Real-time validation + server-side checks |

---

## Files Created

### Phase A
- ✅ `dev/sub-transactions/requirements.md` - Complete requirements document
- ✅ `dev/sub-transactions/phases/phase-a.md` - Phase A summary and learnings
- ✅ `dev/sub-transactions/dev-agent-discussion.md` - This file

---

## Next Actions

**Awaiting User Review of Phase A**

User needs to:
1. Review `requirements.md`
2. Answer open questions (or accept assumptions)
3. Provide feedback on acceptance criteria
4. Approve to proceed to Phase B

Once approved, agent will:
1. Proceed to Phase B: Refine requirements based on feedback
2. Tighten acceptance criteria
3. Resolve open questions
4. Update requirements.md
5. Request Phase C approval

---

## Notes for Implementation (Phase F)

### Database Migration
- File: `infra/migrations/0005_sub_transactions.sql`
- Add columns: `parent_transaction_id`, `is_sub_transaction`, `sub_transaction_order`
- Add trigger: Prevent nested sub-transactions
- Add trigger: Cascade `splitwise_expense_id` to children
- Add index: `idx_parent_transaction_id`
- Add comments: Document new columns

### API Endpoints to Create
1. POST `/api/transactions/[id]/sub-transactions` - Bulk create
2. GET `/api/transactions/[id]/sub-transactions` - List subs
3. DELETE `/api/transactions/[id]/sub-transactions` - Delete all subs
4. PATCH `/api/transactions/[id]/sub-transactions/[subId]` - Update sub
5. DELETE `/api/transactions/[id]/sub-transactions/[subId]` - Delete sub

### UI Components to Create/Modify
1. Create `SubTransactionEditor.tsx` - Modal or inline editor
2. Modify `TxnCard.tsx` - Add badge, expand/collapse
3. Modify `TransactionModal.tsx` - Integrate sub-transaction UI
4. Create `SubTransactionList.tsx` - Display subs under parent

### Types to Define
1. `src/types/sub-transactions.ts` - SubTransaction interface, limits constants
2. Update `src/types/database.ts` - Add new columns to fb_emails_processed type

### Validation to Implement
1. `src/lib/validation/sub-transactions.ts` - Zod schemas
2. Client-side: Real-time sum validation
3. Server-side: Amount precision, count limits, sum equality

---

## References

### Design Documents
- Main design doc: `docs/SUB_TRANSACTIONS_DESIGN.md` (46k tokens, filtered to sub-transactions only)
- Design system: `docs/DESIGN_SYSTEM.md`
- Design rules: `.claude/rules/design-system.md`

### Existing Code
- Transaction modal: `src/components/TransactionModal.tsx`
- Transaction card: `src/components/transactions/TxnCard.tsx`
- Transaction API: `src/pages/api/transactions/[id]/index.ts`
- Database types: `src/types/database.ts`
- Splitwise dropdown: `src/components/SplitwiseDropdown.tsx`

### Database
- Migrations: `infra/migrations/`
- Main table: `fb_emails_processed`
- RLS enabled on all tables
