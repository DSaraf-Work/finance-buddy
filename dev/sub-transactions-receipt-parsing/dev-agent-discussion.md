# Sub-Transactions, Receipt Parsing & Smart Refunds - Development Discussion

## Feature Overview
Implementation of three interconnected features for Finance Buddy:
1. **Sub-Transactions**: Split parent transactions into categorized line items
2. **Receipt Parsing**: AI-powered receipt image parsing with Claude Vision API
3. **Smart Refunds**: Intelligent credit-to-debit transaction linking

## Workflow Status

**Current Phase**: Phase 0 - Documentation Review (User-controlled)

### Phase History

#### Initial Work (2026-01-11)
- ✅ Created comprehensive documentation structure in `docs/subtransaction-receipt-parsing/`
  - Architecture docs (OVERVIEW.md, DATABASE_DESIGN.md, INTEGRATION_GAPS.md)
  - 11 phase implementation guides (PHASE_01 through PHASE_11)
  - Testing documentation (TEST_PLAN.md, DEPLOYMENT.md)
- ⏸️ Started Phase 1 implementation (database + types) - **REVERTED per user request**

#### Reverted Changes (for documentation review)
- Deleted: `infra/migrations/0005_sub_transactions.sql`
- Deleted: `src/types/sub-transactions.ts`
- Deleted: `src/lib/validation/sub-transactions.ts`
- Reverted: `src/types/dto.ts` (removed sub-transaction fields)
- Reverted: `src/types/index.ts` (removed sub-transactions export)

## Current Status

**Awaiting User Action**:
The user should now:
1. Review all documentation in `docs/subtransaction-receipt-parsing/`
2. Add `UserInput` comments in the markdown files where they have:
   - Questions
   - Concerns
   - Suggestions
   - Approval/disapproval
3. Request analysis when ready

## Documentation Files for Review

### Architecture Documentation
- `docs/subtransaction-receipt-parsing/README.md` - Overview and navigation
- `docs/subtransaction-receipt-parsing/architecture/OVERVIEW.md` - System architecture
- `docs/subtransaction-receipt-parsing/architecture/DATABASE_DESIGN.md` - Database schemas & triggers
- `docs/subtransaction-receipt-parsing/architecture/INTEGRATION_GAPS.md` - Identified gaps & solutions

### Phase Implementation Guides
- `docs/subtransaction-receipt-parsing/phases/PHASE_01_DATABASE.md` - Sub-transaction DB migration
- `docs/subtransaction-receipt-parsing/phases/PHASE_02_TYPES.md` - TypeScript types
- `docs/subtransaction-receipt-parsing/phases/PHASE_03_APIS.md` - Sub-transaction APIs
- `docs/subtransaction-receipt-parsing/phases/PHASE_04_UI.md` - Sub-transaction UI
- `docs/subtransaction-receipt-parsing/phases/PHASE_05_VISION_API.md` - Vision API extension
- `docs/subtransaction-receipt-parsing/phases/PHASE_06_RECEIPT_DB.md` - Receipt database
- `docs/subtransaction-receipt-parsing/phases/PHASE_07_RECEIPT_API.md` - Receipt APIs
- `docs/subtransaction-receipt-parsing/phases/PHASE_08_RECEIPT_UI.md` - Receipt UI
- `docs/subtransaction-receipt-parsing/phases/PHASE_09_REFUND_DB.md` - Refund database
- `docs/subtransaction-receipt-parsing/phases/PHASE_10_REFUND_API.md` - Refund APIs
- `docs/subtransaction-receipt-parsing/phases/PHASE_11_REFUND_UI.md` - Refund UI

### Testing & Deployment
- `docs/subtransaction-receipt-parsing/testing/TEST_PLAN.md` - Comprehensive test plan
- `docs/subtransaction-receipt-parsing/testing/DEPLOYMENT.md` - Deployment checklists

## Decision Log

### Decision 1: 11-Phase Implementation Strategy
**Date**: 2026-01-11
**Context**: Complex feature with 3 interconnected sub-features
**Decision**: Split into 11 phases with 3 deployment checkpoints
**Rationale**:
- Allows incremental testing and validation
- Deploy Feature 1 (sub-transactions) after Phase 4
- Deploy Feature 2 (receipts) after Phase 8
- Deploy Feature 3 (refunds) after Phase 11
- Minimizes risk by testing each feature independently before moving to next

### Decision 2: Self-Referential FK Architecture
**Date**: 2026-01-11
**Context**: Sub-transactions need parent-child relationship
**Decision**: Use self-referential FK on `fb_emails_processed` table
**Rationale**:
- Keeps data model simple (no new table)
- Inherits all parent transaction properties automatically
- Cascade deletes work naturally
- RLS policies apply uniformly

### Decision 3: Database Triggers for Validation
**Date**: 2026-01-11
**Context**: Need to ensure data integrity for sub-transactions
**Decision**: Implement 5 database triggers for field inheritance, validation, and cascading
**Rationale**:
- Prevents invalid states at database level
- Cannot be bypassed by API bugs
- Automatically handles Splitwise ID propagation
- Locks parent amounts when children exist

## Assumptions

### Assumption 1: Dark Mode Only
**Status**: Confirmed by design system rules
**Source**: `.claude/rules/design-system.md`
**Implication**: No light mode considerations needed

### Assumption 2: INR Currency Default
**Status**: Assumed based on Indian receipt parsing focus
**Note**: Awaiting user confirmation if multi-currency support needed

### Assumption 3: 2-10 Sub-Transaction Limit
**Status**: Design decision
**Rationale**:
- Minimum 2 ensures splitting makes sense
- Maximum 10 prevents UI clutter and performance issues

### Assumption 4: Splitwise Integration Existing
**Status**: Confirmed via codebase exploration
**Evidence**: `splitwise_expense_id` field exists in current schema
**Implication**: Must cascade to sub-transactions

## Open Questions

### For User Review
1. **Multi-currency support**: Should receipts support currencies beyond INR?
2. **Receipt file retention**: How long should receipt images be stored?
3. **Refund notification**: Should users be notified of potential refund matches?
4. **Splitwise sync**: Should sub-transactions sync individually to Splitwise or as grouped expenses?
5. **Access control**: Any special permissions needed for receipt upload?

## Next Steps

**After user reviews documentation and adds UserInput comments**:
1. Agent will analyze all UserInput comments
2. Address concerns and questions
3. Update documentation based on feedback
4. Iterate until user is satisfied
5. User says "proceed to phase 1" to begin implementation

## Notes

- Original design doc: `docs/SUB_TRANSACTIONS_DESIGN.md` (46k+ tokens)
- 8 critical integration gaps identified and documented
- Expert-level validation completed with "ultrathink" approach
- All triggers have rollback scripts
- Deployment strategy includes 3 checkpoints with Vercel deployments
