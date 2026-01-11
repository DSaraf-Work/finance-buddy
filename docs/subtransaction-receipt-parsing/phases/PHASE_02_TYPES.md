# Phase 2: TypeScript Types

## Objective
Create TypeScript type definitions for sub-transactions.

---

## New Files

### `src/types/sub-transactions.ts`

```typescript
/**
 * Sub-Transaction Types
 *
 * Sub-transactions are child transactions that split a parent transaction
 * into categorized line items while maintaining referential integrity.
 */

import type { Transaction } from './dto';

/**
 * Sub-transaction record as stored in database
 */
export interface SubTransaction {
  id: string;
  parent_transaction_id: string;
  is_sub_transaction: true;
  sub_transaction_order: number;
  receipt_item_id?: string | null;

  // Inherited fields (auto-populated by trigger)
  user_id: string;
  google_user_id: string;
  connection_id: string;
  email_row_id: string;
  currency: string;
  direction: 'debit' | 'credit';
  txn_time: string;
  splitwise_expense_id?: string | null;
  account_type?: string | null;
  status: string;

  // User-provided fields
  amount: number;
  merchant_name?: string | null;
  merchant_normalized?: string | null;
  category?: string | null;
  user_notes?: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Input for creating a single sub-transaction
 */
export interface CreateSubTransactionInput {
  amount: number;
  merchant_name?: string;
  category?: string;
  user_notes?: string;
}

/**
 * Input for batch creating sub-transactions
 */
export interface CreateSubTransactionsRequest {
  items: CreateSubTransactionInput[];
}

/**
 * Response from creating sub-transactions
 */
export interface CreateSubTransactionsResponse {
  success: boolean;
  subTransactions: SubTransaction[];
  parent: {
    id: string;
    amount: number;
    remainingAmount: number;
  };
}

/**
 * Input for updating a sub-transaction
 */
export interface UpdateSubTransactionInput {
  amount?: number;
  merchant_name?: string;
  category?: string;
  user_notes?: string;
}

/**
 * Parent transaction with sub-transactions loaded
 */
export interface TransactionWithSubTransactions extends Transaction {
  subTransactions?: SubTransaction[];
  hasSubTransactions?: boolean;
}

/**
 * Summary of sub-transactions for display
 */
export interface SubTransactionSummary {
  count: number;
  totalAmount: number;
  remainingAmount: number;
  categories: string[];
}

/**
 * Validation result for sub-transaction amounts
 */
export interface SubTransactionValidation {
  isValid: boolean;
  totalAmount: number;
  parentAmount: number;
  difference: number;
  errors: string[];
}
```

---

### Updates to `src/types/dto.ts`

Add to existing `Transaction` interface:

```typescript
// In Transaction interface, add:
parent_transaction_id?: string | null;
is_sub_transaction?: boolean;
sub_transaction_order?: number;
receipt_item_id?: string | null;
```

---

### `src/types/index.ts`

Update exports:

```typescript
export * from './dto';
export * from './sub-transactions';
// Future: export * from './receipts';
// Future: export * from './refunds';
```

---

## Validation Utilities

### `src/lib/validation/sub-transactions.ts`

```typescript
import type {
  CreateSubTransactionInput,
  SubTransactionValidation,
} from '@/types/sub-transactions';

/**
 * Minimum number of sub-transactions required
 */
export const MIN_SUB_TRANSACTIONS = 2;

/**
 * Maximum number of sub-transactions allowed
 */
export const MAX_SUB_TRANSACTIONS = 10;

/**
 * Validate sub-transaction amounts against parent
 */
export function validateSubTransactionAmounts(
  items: CreateSubTransactionInput[],
  parentAmount: number
): SubTransactionValidation {
  const errors: string[] = [];

  // Check count
  if (items.length < MIN_SUB_TRANSACTIONS) {
    errors.push(`Minimum ${MIN_SUB_TRANSACTIONS} sub-transactions required`);
  }
  if (items.length > MAX_SUB_TRANSACTIONS) {
    errors.push(`Maximum ${MAX_SUB_TRANSACTIONS} sub-transactions allowed`);
  }

  // Check individual amounts
  items.forEach((item, index) => {
    if (!item.amount || item.amount <= 0) {
      errors.push(`Item ${index + 1}: Amount must be positive`);
    }
  });

  // Calculate total
  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const difference = parentAmount - totalAmount;

  // Check total doesn't exceed parent
  if (totalAmount > parentAmount) {
    errors.push(`Total (${totalAmount}) exceeds parent amount (${parentAmount})`);
  }

  return {
    isValid: errors.length === 0,
    totalAmount,
    parentAmount,
    difference,
    errors,
  };
}

/**
 * Prepare sub-transaction records for database insert
 */
export function prepareSubTransactionsForInsert(
  parentId: string,
  items: CreateSubTransactionInput[]
): Array<{
  parent_transaction_id: string;
  is_sub_transaction: true;
  sub_transaction_order: number;
  amount: number;
  merchant_name?: string;
  category?: string;
  user_notes?: string;
}> {
  return items.map((item, index) => ({
    parent_transaction_id: parentId,
    is_sub_transaction: true as const,
    sub_transaction_order: index + 1,
    amount: item.amount,
    merchant_name: item.merchant_name,
    category: item.category,
    user_notes: item.user_notes,
  }));
}

/**
 * Check if transaction can have sub-transactions
 */
export function canHaveSubTransactions(transaction: {
  is_sub_transaction?: boolean;
  amount?: number;
}): { allowed: boolean; reason?: string } {
  if (transaction.is_sub_transaction) {
    return { allowed: false, reason: 'Sub-transactions cannot have children' };
  }
  if (!transaction.amount || transaction.amount <= 0) {
    return { allowed: false, reason: 'Transaction must have positive amount' };
  }
  return { allowed: true };
}
```

---

## Validation Steps

1. **Type check passes**
   ```bash
   npx tsc --noEmit
   ```

2. **Imports work**
   ```typescript
   import { SubTransaction, CreateSubTransactionInput } from '@/types/sub-transactions';
   import { validateSubTransactionAmounts } from '@/lib/validation/sub-transactions';
   ```

3. **Validation function works**
   ```typescript
   const result = validateSubTransactionAmounts(
     [{ amount: 50 }, { amount: 30 }],
     100
   );
   // result.isValid === true
   // result.difference === 20
   ```

---

## Success Criteria

- [ ] `src/types/sub-transactions.ts` created
- [ ] `src/types/dto.ts` updated
- [ ] `src/types/index.ts` exports all types
- [ ] `src/lib/validation/sub-transactions.ts` created
- [ ] TypeScript compilation passes
- [ ] All imports resolve correctly
