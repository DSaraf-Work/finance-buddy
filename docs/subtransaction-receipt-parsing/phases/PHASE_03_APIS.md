# Phase 3: Sub-Transaction APIs

## Objective
Create API endpoints for sub-transaction CRUD operations.

---

## API Endpoints

### 1. Create Sub-Transactions
`POST /api/transactions/[id]/sub-transactions`

### 2. Get Sub-Transactions
`GET /api/transactions/[id]/sub-transactions`

### 3. Update Sub-Transaction
`PATCH /api/transactions/[id]/sub-transactions/[subId]`

### 4. Delete Sub-Transaction
`DELETE /api/transactions/[id]/sub-transactions/[subId]`

### 5. Delete All Sub-Transactions
`DELETE /api/transactions/[id]/sub-transactions`

---

## File Structure

```
src/pages/api/transactions/[id]/
├── index.ts                    # Existing (modify GET to include subs)
└── sub-transactions/
    ├── index.ts                # POST, GET, DELETE (all)
    └── [subId].ts              # PATCH, DELETE (single)
```

---

## Implementation

### `src/pages/api/transactions/[id]/sub-transactions/index.ts`

```typescript
// Sub-transactions API - Create, List, Delete All

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { TABLE_EMAILS_PROCESSED } from '@/lib/constants/database';
import {
  validateSubTransactionAmounts,
  prepareSubTransactionsForInsert,
  canHaveSubTransactions,
  MIN_SUB_TRANSACTIONS,
  MAX_SUB_TRANSACTIONS,
} from '@/lib/validation/sub-transactions';
import type { CreateSubTransactionsRequest } from '@/types/sub-transactions';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }

  // Verify parent transaction exists and belongs to user
  const { data: parent, error: parentError } = await supabaseAdmin
    .from(TABLE_EMAILS_PROCESSED)
    .select('id, amount, is_sub_transaction, splitwise_expense_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (parentError || !parent) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  // POST: Create sub-transactions
  if (req.method === 'POST') {
    try {
      // Check if parent can have sub-transactions
      const canHave = canHaveSubTransactions(parent);
      if (!canHave.allowed) {
        return res.status(400).json({ error: canHave.reason });
      }

      // Check if sub-transactions already exist
      const { count: existingCount } = await supabaseAdmin
        .from(TABLE_EMAILS_PROCESSED)
        .select('id', { count: 'exact', head: true })
        .eq('parent_transaction_id', id);

      if (existingCount && existingCount > 0) {
        return res.status(400).json({
          error: 'Sub-transactions already exist. Delete them first to recreate.',
        });
      }

      const body: CreateSubTransactionsRequest = req.body;

      if (!body.items || !Array.isArray(body.items)) {
        return res.status(400).json({ error: 'items array required' });
      }

      // Validate
      const validation = validateSubTransactionAmounts(body.items, parent.amount);
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.errors,
        });
      }

      // Prepare and insert
      const records = prepareSubTransactionsForInsert(id, body.items);

      const { data: subTransactions, error: insertError } = await supabaseAdmin
        .from(TABLE_EMAILS_PROCESSED)
        .insert(records)
        .select();

      if (insertError) {
        return res.status(500).json({
          error: 'Failed to create sub-transactions',
          details: insertError.message,
        });
      }

      return res.status(201).json({
        success: true,
        subTransactions,
        parent: {
          id: parent.id,
          amount: parent.amount,
          remainingAmount: validation.difference,
        },
      });
    } catch (error: any) {
      console.error('Failed to create sub-transactions:', error);
      return res.status(500).json({
        error: 'Failed to create sub-transactions',
        details: error.message,
      });
    }
  }

  // GET: List sub-transactions
  if (req.method === 'GET') {
    try {
      const { data: subTransactions, error: listError } = await supabaseAdmin
        .from(TABLE_EMAILS_PROCESSED)
        .select('*')
        .eq('parent_transaction_id', id)
        .eq('user_id', user.id)
        .order('sub_transaction_order', { ascending: true });

      if (listError) {
        return res.status(500).json({
          error: 'Failed to fetch sub-transactions',
          details: listError.message,
        });
      }

      const totalAmount = subTransactions?.reduce(
        (sum, sub) => sum + (sub.amount || 0),
        0
      ) || 0;

      return res.status(200).json({
        subTransactions: subTransactions || [],
        summary: {
          count: subTransactions?.length || 0,
          totalAmount,
          remainingAmount: parent.amount - totalAmount,
          categories: [...new Set(subTransactions?.map(s => s.category).filter(Boolean))],
        },
      });
    } catch (error: any) {
      console.error('Failed to fetch sub-transactions:', error);
      return res.status(500).json({
        error: 'Failed to fetch sub-transactions',
        details: error.message,
      });
    }
  }

  // DELETE: Remove all sub-transactions
  if (req.method === 'DELETE') {
    try {
      const { error: deleteError } = await supabaseAdmin
        .from(TABLE_EMAILS_PROCESSED)
        .delete()
        .eq('parent_transaction_id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        return res.status(500).json({
          error: 'Failed to delete sub-transactions',
          details: deleteError.message,
        });
      }

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Failed to delete sub-transactions:', error);
      return res.status(500).json({
        error: 'Failed to delete sub-transactions',
        details: error.message,
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
```

---

### `src/pages/api/transactions/[id]/sub-transactions/[subId].ts`

```typescript
// Single sub-transaction API - Update, Delete

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { TABLE_EMAILS_PROCESSED } from '@/lib/constants/database';
import type { UpdateSubTransactionInput } from '@/types/sub-transactions';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  const { id, subId } = req.query;

  if (!id || typeof id !== 'string' || !subId || typeof subId !== 'string') {
    return res.status(400).json({ error: 'Invalid transaction or sub-transaction ID' });
  }

  // Verify sub-transaction exists and belongs to user
  const { data: subTransaction, error: subError } = await supabaseAdmin
    .from(TABLE_EMAILS_PROCESSED)
    .select('*')
    .eq('id', subId)
    .eq('parent_transaction_id', id)
    .eq('user_id', user.id)
    .single();

  if (subError || !subTransaction) {
    return res.status(404).json({ error: 'Sub-transaction not found' });
  }

  // PATCH: Update sub-transaction
  if (req.method === 'PATCH') {
    try {
      const body: UpdateSubTransactionInput = req.body;

      const allowedFields = ['amount', 'merchant_name', 'category', 'user_notes'];
      const updates: any = {};

      for (const field of allowedFields) {
        if (body[field as keyof UpdateSubTransactionInput] !== undefined) {
          updates[field] = body[field as keyof UpdateSubTransactionInput];
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      updates.updated_at = new Date().toISOString();

      // Amount validation will be handled by database trigger
      const { data: updated, error: updateError } = await supabaseAdmin
        .from(TABLE_EMAILS_PROCESSED)
        .update(updates)
        .eq('id', subId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        // Check for amount validation error
        if (updateError.message.includes('exceed parent')) {
          return res.status(400).json({
            error: 'Amount exceeds available parent amount',
            details: updateError.message,
          });
        }
        return res.status(500).json({
          error: 'Failed to update sub-transaction',
          details: updateError.message,
        });
      }

      return res.status(200).json({ subTransaction: updated });
    } catch (error: any) {
      console.error('Failed to update sub-transaction:', error);
      return res.status(500).json({
        error: 'Failed to update sub-transaction',
        details: error.message,
      });
    }
  }

  // DELETE: Remove single sub-transaction
  if (req.method === 'DELETE') {
    try {
      // Check minimum count
      const { count } = await supabaseAdmin
        .from(TABLE_EMAILS_PROCESSED)
        .select('id', { count: 'exact', head: true })
        .eq('parent_transaction_id', id);

      if (count && count <= 2) {
        return res.status(400).json({
          error: 'Cannot delete. Minimum 2 sub-transactions required. Delete all instead.',
        });
      }

      const { error: deleteError } = await supabaseAdmin
        .from(TABLE_EMAILS_PROCESSED)
        .delete()
        .eq('id', subId)
        .eq('user_id', user.id);

      if (deleteError) {
        return res.status(500).json({
          error: 'Failed to delete sub-transaction',
          details: deleteError.message,
        });
      }

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Failed to delete sub-transaction:', error);
      return res.status(500).json({
        error: 'Failed to delete sub-transaction',
        details: error.message,
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
```

---

## Modify Existing Transaction API

### Update `src/pages/api/transactions/[id]/index.ts`

In GET handler, include sub-transactions:

```typescript
// In GET handler, after fetching transaction:
const { data: subTransactions } = await supabaseAdmin
  .from(TABLE_EMAILS_PROCESSED)
  .select('*')
  .eq('parent_transaction_id', id)
  .eq('user_id', user.id)
  .order('sub_transaction_order', { ascending: true });

return res.status(200).json({
  transaction: {
    ...transaction,
    subTransactions: subTransactions || [],
    hasSubTransactions: (subTransactions?.length || 0) > 0,
  },
});
```

---

## Validation Steps

1. **Create sub-transactions**
   ```bash
   curl -X POST /api/transactions/{id}/sub-transactions \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"items":[{"amount":50,"category":"Food"},{"amount":30,"category":"Household"}]}'
   ```

2. **List sub-transactions**
   ```bash
   curl /api/transactions/{id}/sub-transactions \
     -H "Authorization: Bearer $TOKEN"
   ```

3. **Update sub-transaction**
   ```bash
   curl -X PATCH /api/transactions/{id}/sub-transactions/{subId} \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"category":"Personal Care"}'
   ```

4. **Delete sub-transaction**
   ```bash
   curl -X DELETE /api/transactions/{id}/sub-transactions/{subId} \
     -H "Authorization: Bearer $TOKEN"
   ```

5. **Delete all sub-transactions**
   ```bash
   curl -X DELETE /api/transactions/{id}/sub-transactions \
     -H "Authorization: Bearer $TOKEN"
   ```

---

## Error Handling

| Error | Status | Message |
|-------|--------|---------|
| Invalid parent ID | 400 | Invalid transaction ID |
| Parent not found | 404 | Transaction not found |
| Is sub-transaction | 400 | Sub-transactions cannot have children |
| Already has subs | 400 | Sub-transactions already exist |
| Amount exceeds | 400 | Amount exceeds available parent amount |
| Min count | 400 | Minimum 2 sub-transactions required |
| Max count | 400 | Maximum 10 sub-transactions allowed |

---

## Success Criteria

- [ ] POST creates batch of sub-transactions atomically
- [ ] GET returns sub-transactions with summary
- [ ] PATCH updates single sub-transaction
- [ ] DELETE single respects minimum count
- [ ] DELETE all removes all sub-transactions
- [ ] Triggers validate amounts correctly
- [ ] RLS enforced on all operations
- [ ] Splitwise ID inherited correctly
