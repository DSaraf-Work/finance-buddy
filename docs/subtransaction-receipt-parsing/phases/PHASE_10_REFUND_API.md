# Phase 10: Refund APIs

## Objective
Create API endpoints for refund linking, suggestions, and status.

---

## API Endpoints

### 1. Get Refund Suggestions
`GET /api/transactions/[id]/refund-suggestions`

### 2. Link Refund
`POST /api/transactions/[id]/link-refund`

### 3. Unlink Refund
`DELETE /api/transactions/[id]/link-refund`

### 4. Get Refund Status
`GET /api/transactions/[id]/refund-status`

---

## File Structure

```
src/pages/api/transactions/[id]/
├── refund-suggestions.ts    # GET
├── link-refund.ts           # POST, DELETE
└── refund-status.ts         # GET
```

---

## Types

### `src/types/refunds.ts`

```typescript
/**
 * Refund-related types
 */

export interface RefundSuggestion {
  transaction_id: string;
  merchant_name: string;
  merchant_normalized: string;
  amount: number;
  txn_time: string;
  splitwise_expense_id: string | null;
  match_score: number;
  match_reasons: string[];
  has_sub_transactions: boolean;
}

export interface RefundStatus {
  total_refunded: number;
  refund_count: number;
  original_amount: number;
  remaining_amount: number;
  is_fully_refunded: boolean;
}

export interface LinkRefundRequest {
  original_transaction_id: string;
  refund_type?: 'full' | 'partial' | 'item';
  refund_reason?: string;
}

export interface RefundLinkage {
  refund_id: string;
  original_id: string;
  refund_type: 'full' | 'partial' | 'item';
  refund_reason?: string;
  amount: number;
}
```

---

## Implementation

### `src/pages/api/transactions/[id]/refund-suggestions.ts`

```typescript
// Get refund match suggestions for a credit transaction

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { TABLE_EMAILS_PROCESSED } from '@/lib/constants/database';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }

  // Verify transaction is a credit and belongs to user
  const { data: transaction, error: txnError } = await supabaseAdmin
    .from(TABLE_EMAILS_PROCESSED)
    .select('id, direction, amount, merchant_normalized, txn_time, refund_of_transaction_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (txnError || !transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  if (transaction.direction !== 'credit') {
    return res.status(400).json({ error: 'Only credit transactions can be linked as refunds' });
  }

  if (transaction.refund_of_transaction_id) {
    return res.status(400).json({
      error: 'This transaction is already linked as a refund',
      linked_to: transaction.refund_of_transaction_id,
    });
  }

  try {
    // Call database function for suggestions
    const { data: suggestions, error: suggestError } = await supabaseAdmin
      .rpc('suggest_refund_matches', {
        p_user_id: user.id,
        p_credit_id: id,
        p_limit: 10,
      });

    if (suggestError) {
      console.error('Suggestion error:', suggestError);
      return res.status(500).json({ error: suggestError.message });
    }

    return res.status(200).json({
      suggestions: suggestions || [],
      credit: {
        id: transaction.id,
        amount: transaction.amount,
        merchant_normalized: transaction.merchant_normalized,
      },
    });
  } catch (error: any) {
    console.error('Failed to get refund suggestions:', error);
    return res.status(500).json({ error: error.message });
  }
});
```

---

### `src/pages/api/transactions/[id]/link-refund.ts`

```typescript
// Link or unlink a credit transaction as refund

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { TABLE_EMAILS_PROCESSED } from '@/lib/constants/database';
import type { LinkRefundRequest } from '@/types/refunds';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }

  // POST: Link refund
  if (req.method === 'POST') {
    const body: LinkRefundRequest = req.body;

    if (!body.original_transaction_id) {
      return res.status(400).json({ error: 'original_transaction_id required' });
    }

    // Verify credit transaction belongs to user
    const { data: credit, error: creditError } = await supabaseAdmin
      .from(TABLE_EMAILS_PROCESSED)
      .select('id, direction, amount, refund_of_transaction_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (creditError || !credit) {
      return res.status(404).json({ error: 'Credit transaction not found' });
    }

    if (credit.direction !== 'credit') {
      return res.status(400).json({ error: 'Transaction must be a credit' });
    }

    if (credit.refund_of_transaction_id) {
      return res.status(400).json({ error: 'Already linked to another transaction' });
    }

    // Verify original transaction belongs to user
    const { data: original, error: origError } = await supabaseAdmin
      .from(TABLE_EMAILS_PROCESSED)
      .select('id, direction, amount, splitwise_expense_id')
      .eq('id', body.original_transaction_id)
      .eq('user_id', user.id)
      .single();

    if (origError || !original) {
      return res.status(404).json({ error: 'Original transaction not found' });
    }

    if (original.direction !== 'debit') {
      return res.status(400).json({ error: 'Original must be a debit transaction' });
    }

    try {
      // Link refund (trigger handles validation)
      const { data: updated, error: updateError } = await supabaseAdmin
        .from(TABLE_EMAILS_PROCESSED)
        .update({
          refund_of_transaction_id: body.original_transaction_id,
          refund_type: body.refund_type,
          refund_reason: body.refund_reason,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        // Handle trigger errors
        if (updateError.message.includes('exceed')) {
          return res.status(400).json({ error: 'Refund amount exceeds remaining original amount' });
        }
        return res.status(500).json({ error: updateError.message });
      }

      // Get refund status for original
      const { data: status } = await supabaseAdmin
        .rpc('get_refund_status', { txn_id: body.original_transaction_id });

      return res.status(200).json({
        success: true,
        refund: updated,
        original_status: status?.[0] || null,
        splitwise_warning: original.splitwise_expense_id
          ? 'Original transaction is linked to Splitwise. You may need to update it manually.'
          : null,
      });
    } catch (error: any) {
      console.error('Failed to link refund:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // DELETE: Unlink refund
  if (req.method === 'DELETE') {
    // Verify transaction belongs to user
    const { data: transaction, error: txnError } = await supabaseAdmin
      .from(TABLE_EMAILS_PROCESSED)
      .select('id, refund_of_transaction_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (txnError || !transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (!transaction.refund_of_transaction_id) {
      return res.status(400).json({ error: 'Transaction is not linked as a refund' });
    }

    try {
      const { error: updateError } = await supabaseAdmin
        .from(TABLE_EMAILS_PROCESSED)
        .update({
          refund_of_transaction_id: null,
          refund_of_sub_transaction_id: null,
          is_refund: false,
          refund_type: null,
          refund_reason: null,
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) {
        return res.status(500).json({ error: updateError.message });
      }

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Failed to unlink refund:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
```

---

### `src/pages/api/transactions/[id]/refund-status.ts`

```typescript
// Get refund status for a debit transaction

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { TABLE_EMAILS_PROCESSED } from '@/lib/constants/database';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }

  // Verify transaction belongs to user
  const { data: transaction, error: txnError } = await supabaseAdmin
    .from(TABLE_EMAILS_PROCESSED)
    .select('id, direction, amount')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (txnError || !transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  try {
    // Get refund status
    const { data: status, error: statusError } = await supabaseAdmin
      .rpc('get_refund_status', { txn_id: id });

    if (statusError) {
      return res.status(500).json({ error: statusError.message });
    }

    // Get linked refunds
    const { data: refunds } = await supabaseAdmin
      .from(TABLE_EMAILS_PROCESSED)
      .select('id, amount, txn_time, refund_type, refund_reason')
      .eq('refund_of_transaction_id', id)
      .order('txn_time', { ascending: false });

    return res.status(200).json({
      status: status?.[0] || {
        total_refunded: 0,
        refund_count: 0,
        original_amount: transaction.amount,
        remaining_amount: transaction.amount,
        is_fully_refunded: false,
      },
      refunds: refunds || [],
    });
  } catch (error: any) {
    console.error('Failed to get refund status:', error);
    return res.status(500).json({ error: error.message });
  }
});
```

---

## Validation Steps

1. **Get suggestions**
   ```bash
   curl /api/transactions/{credit_id}/refund-suggestions \
     -H "Authorization: Bearer $TOKEN"
   ```

2. **Link refund**
   ```bash
   curl -X POST /api/transactions/{credit_id}/link-refund \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"original_transaction_id":"<debit_id>"}'
   ```

3. **Get refund status**
   ```bash
   curl /api/transactions/{debit_id}/refund-status \
     -H "Authorization: Bearer $TOKEN"
   ```

4. **Unlink refund**
   ```bash
   curl -X DELETE /api/transactions/{credit_id}/link-refund \
     -H "Authorization: Bearer $TOKEN"
   ```

---

## Error Handling

| Error | Status | Message |
|-------|--------|---------|
| Not a credit | 400 | Only credit transactions can be linked |
| Already linked | 400 | Already linked to another transaction |
| Original not debit | 400 | Original must be a debit transaction |
| Amount exceeds | 400 | Refund amount exceeds remaining |
| Not linked | 400 | Transaction is not linked as a refund |

---

## Success Criteria

- [ ] Suggestions ranked by score
- [ ] Link updates is_refund and refund_type
- [ ] Unlink clears all refund fields
- [ ] Status returns accurate totals
- [ ] Splitwise warning shown when applicable
- [ ] RLS enforced on all operations
