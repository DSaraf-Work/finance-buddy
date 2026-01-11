# Sub-Transactions, Receipt Parsing & Smart Refunds

> **Implementation Status**: Phase 0 - Documentation
> **Last Updated**: 2026-01-11

---

## Overview

This feature set adds three major capabilities to Finance Buddy:

1. **Sub-Transactions** - Split transactions into categorized line items
2. **Receipt Parsing** - AI-powered receipt image analysis with auto-split
3. **Smart Refunds** - Intelligent linking of credits to original purchases

---

## Quick Navigation

### Architecture
- [System Overview](./architecture/OVERVIEW.md)
- [Database Design](./architecture/DATABASE_DESIGN.md)
- [Integration Gaps & Solutions](./architecture/INTEGRATION_GAPS.md)

### Implementation Phases

| Phase | Feature | Documentation |
|-------|---------|---------------|
| 1 | Database Migration | [PHASE_01_DATABASE.md](./phases/PHASE_01_DATABASE.md) |
| 2 | TypeScript Types | [PHASE_02_TYPES.md](./phases/PHASE_02_TYPES.md) |
| 3 | Sub-transaction APIs | [PHASE_03_APIS.md](./phases/PHASE_03_APIS.md) |
| 4 | Sub-transaction UI | [PHASE_04_UI.md](./phases/PHASE_04_UI.md) |
| 5 | Vision API Extension | [PHASE_05_VISION_API.md](./phases/PHASE_05_VISION_API.md) |
| 6 | Receipt Database | [PHASE_06_RECEIPT_DB.md](./phases/PHASE_06_RECEIPT_DB.md) |
| 7 | Receipt APIs | [PHASE_07_RECEIPT_API.md](./phases/PHASE_07_RECEIPT_API.md) |
| 8 | Receipt UI | [PHASE_08_RECEIPT_UI.md](./phases/PHASE_08_RECEIPT_UI.md) |
| 9 | Refund Database | [PHASE_09_REFUND_DB.md](./phases/PHASE_09_REFUND_DB.md) |
| 10 | Refund APIs | [PHASE_10_REFUND_API.md](./phases/PHASE_10_REFUND_API.md) |
| 11 | Refund UI | [PHASE_11_REFUND_UI.md](./phases/PHASE_11_REFUND_UI.md) |

### Testing & Deployment
- [Test Plan](./testing/TEST_PLAN.md)
- [Deployment Checklist](./testing/DEPLOYMENT.md)

---

## Feature Summary

### Feature 1: Sub-Transactions (Phases 1-4)

**Problem**: Users can't categorize individual items within a transaction (e.g., groceries from Big Bazaar include food, household, personal items).

**Solution**: Allow splitting a parent transaction into 2-10 sub-transactions with:
- Individual categories and notes
- Amount validation (sum = parent)
- Splitwise ID inheritance
- Single-level nesting only

**Key Files**:
- Migration: `infra/migrations/0005_sub_transactions.sql`
- Types: `src/types/sub-transactions.ts`
- APIs: `src/pages/api/transactions/[id]/sub-transactions/`
- UI: `src/components/transactions/SubTransaction*.tsx`

### Feature 2: Receipt Parsing (Phases 5-8)

**Problem**: Manual entry of receipt line items is tedious.

**Solution**: AI-powered receipt parsing with:
- Upload image (JPG, PNG) or PDF
- Claude Vision API extracts items
- One-click conversion to sub-transactions
- Indian receipt support (INR, GST)

**Key Files**:
- Migration: `infra/migrations/0006_receipts.sql`
- Parser: `src/lib/receipt-parsing/parser.ts`
- APIs: `src/pages/api/receipts/`
- UI: `src/components/transactions/Receipt*.tsx`

### Feature 3: Smart Refunds (Phases 9-11)

**Problem**: Tracking refunds against original purchases is manual and error-prone.

**Solution**: Smart refund linking with:
- AI-powered matching suggestions
- Full, partial, and item-level refunds
- Splitwise integration warnings
- Refund status tracking

**Key Files**:
- Migration: `infra/migrations/0007_smart_refunds.sql`
- Matching: `src/lib/refunds/matching.ts`
- APIs: `src/pages/api/transactions/[id]/link-refund.ts`
- UI: `src/components/transactions/Refund*.tsx`

---

## Deployment Checkpoints

| Checkpoint | After Phase | Test Focus |
|------------|-------------|------------|
| Deploy 1 | 4 | Sub-transaction CRUD, Splitwise cascade |
| Deploy 2 | 8 | Receipt upload, parse, convert |
| Deploy 3 | 11 | Refund linking, smart matching |

---

## Commit Strategy

```bash
# After Phase 4
git commit -m "feat: add sub-transaction support"

# After Phase 8
git commit -m "feat: add receipt parsing with AI"

# After Phase 11
git commit -m "feat: add smart refund system"
```

---

## Prerequisites

Before starting implementation:

1. **Database Access**: Supabase project credentials
2. **AI API Key**: Anthropic API key with Claude Vision access
3. **Storage**: Supabase Storage bucket configuration
4. **Vercel**: Deployment access for testing

---

## Reference Documents

- Original Design: [SUB_TRANSACTIONS_DESIGN.md](../SUB_TRANSACTIONS_DESIGN.md)
- Design System: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)
