# Integration Gaps & Solutions

## Overview

This document identifies gaps between the design specification and the current codebase, along with solutions implemented.

---

## Gap 1: Vision API Not Implemented

### Problem
`AnthropicModel` in `src/lib/ai/models/anthropic.ts` only supports text content:

```typescript
messages: [
  {
    role: 'user',
    content: request.prompt,  // Text only
  },
],
```

### Impact
Cannot parse receipt images without Vision API support.

### Solution
Extend `AnthropicModel` to handle image content in Phase 5:

```typescript
interface VisionRequest extends AIRequest {
  images?: Array<{
    type: 'base64' | 'url';
    media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    data: string;
  }>;
}
```

### Phase
Phase 5: Vision API Extension

---

## Gap 2: email_row_id NOT NULL Constraint

### Problem
`fb_emails_processed.email_row_id` has NOT NULL constraint. Sub-transactions don't originate from emails.

### Impact
Cannot INSERT sub-transactions without a valid `email_row_id`.

### Solution
Database trigger inherits `email_row_id` from parent transaction:

```sql
NEW.email_row_id := parent.email_row_id;  -- Inherit from parent
```

### Phase
Phase 1: Database Migration

---

## Gap 3: No Atomic Batch Insert

### Problem
Current transaction APIs insert single records. Sub-transactions require atomic batch insert (all-or-nothing).

### Impact
Partial failures could leave inconsistent data.

### Solution
Use Supabase batch insert with transaction:

```typescript
const { data, error } = await supabaseAdmin
  .from(TABLE_EMAILS_PROCESSED)
  .insert(subTransactions)  // Array of records
  .select();
```

PostgreSQL's default behavior ensures atomicity for batch inserts.

### Phase
Phase 3: Sub-transaction APIs

---

## Gap 4: Splitwise ID Not Cascaded on INSERT

### Problem
Design requires sub-transactions inherit parent's `splitwise_expense_id`, but UPDATE trigger only handles changes.

### Impact
Sub-transactions created after Splitwise linking would miss the ID.

### Solution
Inherit trigger also copies `splitwise_expense_id` on INSERT:

```sql
NEW.splitwise_expense_id := parent.splitwise_expense_id;  -- CASCADE
```

### Phase
Phase 1: Database Migration

---

## Gap 5: Parent Amount Race Condition

### Problem
If user changes parent amount while sub-transactions are being created, validation fails unpredictably.

### Impact
Data integrity issues with amount validation.

### Solution
Lock trigger prevents parent amount modification when children exist:

```sql
CREATE OR REPLACE FUNCTION lock_parent_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.amount IS DISTINCT FROM NEW.amount THEN
    IF EXISTS (
      SELECT 1 FROM fb_emails_processed
      WHERE parent_transaction_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Cannot modify amount of transaction with sub-transactions';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Phase
Phase 1: Database Migration

---

## Gap 6: Type Location Inconsistency

### Problem
- `ExtractedTransaction` in `src/types/dto.ts`
- Other types scattered across files
- No clear pattern for new types

### Impact
Difficulty maintaining type consistency.

### Solution
1. Add sub-transaction fields to `dto.ts` for API compatibility
2. Create dedicated type files:
   - `src/types/sub-transactions.ts`
   - `src/types/receipts.ts`
   - `src/types/refunds.ts`
3. Re-export from `src/types/index.ts`

### Phase
Phase 2: TypeScript Types

---

## Gap 7: Field Inheritance Undocumented

### Problem
Design mentions inheriting fields but doesn't specify which ones or how.

### Impact
Inconsistent implementation could miss critical fields.

### Solution
Document explicit inheritance list in trigger:

```sql
-- Inherited fields (auto-copied from parent):
NEW.user_id := parent.user_id;
NEW.google_user_id := parent.google_user_id;
NEW.connection_id := parent.connection_id;
NEW.email_row_id := parent.email_row_id;
NEW.currency := COALESCE(NEW.currency, parent.currency);
NEW.direction := COALESCE(NEW.direction, parent.direction);
NEW.txn_time := COALESCE(NEW.txn_time, parent.txn_time);
NEW.splitwise_expense_id := parent.splitwise_expense_id;
NEW.account_type := COALESCE(NEW.account_type, parent.account_type);
NEW.status := COALESCE(NEW.status, parent.status);
```

### Phase
Phase 1: Database Migration

---

## Gap 8: Status Enum Mismatch (Deferred)

### Problem
`status` column uses TEXT with various values. No clear enum definition.

### Impact
Potential for invalid status values.

### Solution
Deferred to separate PR. Current implementation uses COALESCE to inherit parent status.

### Phase
Future enhancement

---

## Summary Table

| # | Gap | Severity | Solution | Phase |
|---|-----|----------|----------|-------|
| 1 | Vision API missing | High | Extend AnthropicModel | 5 |
| 2 | email_row_id NOT NULL | Critical | Inherit trigger | 1 |
| 3 | No atomic insert | Medium | Batch INSERT | 3 |
| 4 | Splitwise INSERT cascade | High | Inherit trigger | 1 |
| 5 | Parent amount race | Medium | Lock trigger | 1 |
| 6 | Type location | Low | Dedicated files | 2 |
| 7 | Field inheritance | Medium | Document in trigger | 1 |
| 8 | Status enum | Low | Deferred | - |

---

## Validation Checklist

After each phase, verify:

- [ ] No regressions in existing functionality
- [ ] New triggers execute without errors
- [ ] RLS policies work correctly
- [ ] API responses match expected schema
- [ ] UI displays data correctly
- [ ] Splitwise integration unchanged
