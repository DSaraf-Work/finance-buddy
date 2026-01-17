/**
 * Sub-Transaction Validation API
 *
 * GET - Validate sub-transaction sum against parent amount
 *
 * @route /api/transactions/[id]/sub-transactions/validate
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isSubTransactionsEnabled } from '@/lib/features/flags';
import { buildValidationResult } from '@/lib/sub-transactions/validation';
import { TABLE_EMAILS_PROCESSED, TABLE_SUB_TRANSACTIONS } from '@/lib/constants/database';
import type { SubTransactionValidation } from '@/types/sub-transactions';

// Type for parent transaction query result
interface ParentTransactionRow {
  id: string;
  amount: number | null;
}

// Type for sub-transaction amount query result
interface SubTransactionAmountRow {
  amount: number | string;
}

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  // Check feature flag
  if (!isSubTransactionsEnabled()) {
    return res.status(404).json({ error: 'Feature not enabled' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id: parentId } = req.query;

  if (!parentId || typeof parentId !== 'string') {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }

  try {
    // Get parent transaction
    const { data: parentData, error: parentError } = await supabaseAdmin
      .from(TABLE_EMAILS_PROCESSED)
      .select('id, amount')
      .eq('id', parentId)
      .eq('user_id', user.id)
      .single();

    if (parentError || !parentData) {
      return res.status(404).json({ error: 'Parent transaction not found' });
    }

    const parent = parentData as ParentTransactionRow;

    // Get sub-transactions summary
    const { data: subsData, error: subsError } = await supabaseAdmin
      .from(TABLE_SUB_TRANSACTIONS)
      .select('amount')
      .eq('parent_transaction_id', parentId)
      .eq('user_id', user.id);

    if (subsError) {
      console.error('[SubTransactions] Validation error:', subsError);
      return res.status(500).json({
        error: 'Failed to validate sub-transactions',
        details: subsError.message,
      });
    }

    const subs = (subsData || []) as SubTransactionAmountRow[];

    // Calculate totals
    const subTotal = subs.reduce((sum: number, s) => sum + Number(s.amount), 0);
    const subCount = subs.length;

    // Build validation result
    const validation: SubTransactionValidation = buildValidationResult(
      parent.amount,
      subTotal,
      subCount
    );

    return res.status(200).json({
      success: true,
      data: validation,
    });
  } catch (error: any) {
    console.error('[SubTransactions] Validation error:', error);
    return res.status(500).json({
      error: 'Failed to validate sub-transactions',
      details: error.message,
    });
  }
});
