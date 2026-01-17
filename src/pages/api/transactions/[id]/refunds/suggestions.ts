/**
 * Refunds API - Get Refund Suggestions
 *
 * GET - Get AI-powered suggestions for potential original transactions
 *
 * This endpoint takes a REFUND (credit) transaction and finds potential
 * original (debit) transactions that match based on:
 * - Merchant name similarity (40% weight)
 * - Amount matching (30% weight)
 * - Time window proximity (20% weight)
 * - Reference/transaction ID match (10% weight)
 *
 * @route /api/transactions/[id]/refunds/suggestions
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isSmartRefundsEnabled } from '@/lib/features/flags';
import { findRefundMatches } from '@/lib/refunds/matching';
import { TABLE_EMAILS_PROCESSED } from '@/lib/constants/database';
import type { GetRefundSuggestionsResponse } from '@/types/refunds';

// Type for transaction query result
interface TransactionRow {
  id: string;
  user_id: string;
  amount: number | null;
  merchant_name: string | null;
  txn_time: string | null;
  direction: string | null;
}

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  // Check feature flag
  if (!isSmartRefundsEnabled()) {
    return res.status(404).json({ error: 'Feature not enabled' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id: transactionId } = req.query;
  const {
    limit = '10',
    min_confidence = '30',
    time_window_days = '90',
  } = req.query;

  if (!transactionId || typeof transactionId !== 'string') {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }

  // Verify transaction exists, belongs to user, and is a CREDIT (refund)
  const { data: transactionData, error: txnError } = await supabaseAdmin
    .from(TABLE_EMAILS_PROCESSED)
    .select('id, user_id, amount, merchant_name, txn_time, direction')
    .eq('id', transactionId)
    .eq('user_id', user.id)
    .single();

  if (txnError || !transactionData) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const transaction = transactionData as TransactionRow;

  // Refunds are typically credits (money coming back)
  if (transaction.direction !== 'credit') {
    return res.status(400).json({
      error: 'Transaction must be a credit (refund) to find matching originals',
      code: 'NOT_REFUND',
    });
  }

  try {
    // Find matching original transactions
    const suggestions = await findRefundMatches(user.id, transactionId, {
      limit: Math.min(parseInt(limit as string, 10) || 10, 20),
      minConfidence: parseInt(min_confidence as string, 10) || 30,
      timeWindowDays: Math.min(parseInt(time_window_days as string, 10) || 90, 365),
      includeSubTransactions: true,
    });

    const response: GetRefundSuggestionsResponse = {
      suggestions,
      refund_transaction: {
        id: transaction.id,
        amount: Math.abs(Number(transaction.amount) || 0),
        merchant_name: transaction.merchant_name,
        txn_time: transaction.txn_time,
      },
    };

    return res.status(200).json({ success: true, data: response });
  } catch (error: any) {
    console.error('[Refunds] Suggestions error:', error);
    return res.status(500).json({
      error: 'Failed to get refund suggestions',
      details: error.message,
    });
  }
});
