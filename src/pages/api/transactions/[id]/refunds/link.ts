/**
 * Refunds API - Create Refund Link
 *
 * POST - Link a refund (credit) to an original (debit) transaction
 *
 * Supports M:N relationships:
 * - One original can have multiple partial refunds
 * - One combined refund can link to multiple originals
 *
 * @route /api/transactions/[id]/refunds/link
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isSmartRefundsEnabled } from '@/lib/features/flags';
import {
  mapRefundLinkToPublic,
  buildRefundStatus,
  buildEmptyRefundStatus,
} from '@/lib/refunds/mappers';
import {
  TABLE_EMAILS_PROCESSED,
  TABLE_SUB_TRANSACTIONS,
  TABLE_REFUND_LINKS,
  VIEW_REFUND_AGGREGATES,
} from '@/lib/constants/database';
import type {
  CreateRefundLinkRequest,
  CreateRefundLinkResponse,
  RefundLinkAggregate,
} from '@/types/refunds';

// Type for sub-transaction query result
interface SubTransactionRow {
  id: string;
  user_id: string;
  amount: number | null;
}

// Type for transaction query result
interface TransactionRow {
  id: string;
  user_id: string;
  amount: number | null;
  direction: string | null;
}

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  // Check feature flag
  if (!isSmartRefundsEnabled()) {
    return res.status(404).json({ error: 'Feature not enabled' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id: originalId } = req.query;
  const body = req.body as CreateRefundLinkRequest & {
    is_sub_transaction?: boolean;
  };

  if (!originalId || typeof originalId !== 'string') {
    return res.status(400).json({ error: 'Invalid original transaction ID' });
  }

  // Validate request body
  const {
    refund_transaction_id,
    allocated_amount,
    refund_type = 'full',
    match_method = 'manual',
    match_confidence_score,
    match_reasons = [],
    is_sub_transaction = false,
  } = body;

  if (!refund_transaction_id) {
    return res.status(400).json({ error: 'refund_transaction_id is required' });
  }

  if (!allocated_amount || allocated_amount <= 0) {
    return res.status(400).json({ error: 'allocated_amount must be positive' });
  }

  let originalAmount: number;
  let originalUserId: string;

  // ============================================================================
  // Verify original transaction/sub-transaction
  // ============================================================================
  if (is_sub_transaction) {
    const { data: subTxnData, error: subError } = await supabaseAdmin
      .from(TABLE_SUB_TRANSACTIONS)
      .select('id, user_id, amount')
      .eq('id', originalId)
      .eq('user_id', user.id)
      .single();

    if (subError || !subTxnData) {
      return res.status(404).json({ error: 'Sub-transaction not found' });
    }

    const subTxn = subTxnData as SubTransactionRow;
    originalAmount = Math.abs(Number(subTxn.amount) || 0);
    originalUserId = subTxn.user_id;
  } else {
    const { data: transactionData, error: txnError } = await supabaseAdmin
      .from(TABLE_EMAILS_PROCESSED)
      .select('id, user_id, amount, direction')
      .eq('id', originalId)
      .eq('user_id', user.id)
      .single();

    if (txnError || !transactionData) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = transactionData as TransactionRow;

    // Original should be a debit (purchase)
    if (transaction.direction !== 'debit') {
      return res.status(400).json({
        error: 'Original transaction must be a debit (purchase)',
        code: 'NOT_DEBIT',
      });
    }

    originalAmount = Math.abs(Number(transaction.amount) || 0);
    originalUserId = transaction.user_id;
  }

  // ============================================================================
  // Verify refund transaction
  // ============================================================================
  const { data: refundTxnData, error: refundError } = await supabaseAdmin
    .from(TABLE_EMAILS_PROCESSED)
    .select('id, user_id, amount, direction')
    .eq('id', refund_transaction_id)
    .eq('user_id', user.id)
    .single();

  if (refundError || !refundTxnData) {
    return res.status(404).json({ error: 'Refund transaction not found' });
  }

  const refundTxn = refundTxnData as TransactionRow;

  // Refund should be a credit
  if (refundTxn.direction !== 'credit') {
    return res.status(400).json({
      error: 'Refund transaction must be a credit',
      code: 'NOT_CREDIT',
    });
  }

  const refundAmount = Math.abs(Number(refundTxn.amount) || 0);

  // ============================================================================
  // Validation: Check if link already exists
  // ============================================================================
  const existingQuery = supabaseAdmin
    .from(TABLE_REFUND_LINKS)
    .select('id')
    .eq('refund_transaction_id', refund_transaction_id)
    .eq('user_id', user.id);

  if (is_sub_transaction) {
    existingQuery.eq('original_sub_transaction_id', originalId);
  } else {
    existingQuery.eq('original_transaction_id', originalId);
  }

  const { data: existing } = await existingQuery.single();

  if (existing) {
    return res.status(409).json({
      error: 'Link already exists between these transactions',
      code: 'DUPLICATE_LINK',
    });
  }

  // ============================================================================
  // Create the refund link
  // ============================================================================
  try {
    const linkData: Record<string, any> = {
      user_id: user.id,
      refund_transaction_id,
      allocated_amount,
      refund_type,
      match_method,
      match_confidence_score: match_confidence_score ?? null,
      match_reasons: match_reasons,
    };

    // Set the appropriate original ID (XOR constraint in database)
    if (is_sub_transaction) {
      linkData.original_sub_transaction_id = originalId;
      linkData.original_transaction_id = null;
    } else {
      linkData.original_transaction_id = originalId;
      linkData.original_sub_transaction_id = null;
    }

    const { data: link, error: insertError } = await (supabaseAdmin as any)
      .from(TABLE_REFUND_LINKS)
      .insert(linkData)
      .select()
      .single();

    if (insertError) {
      console.error('[Refunds] Insert error:', insertError);

      // Check for trigger violation (exceeded refund amount)
      if (insertError.message.includes('would exceed')) {
        return res.status(400).json({
          error: 'Total allocated amount would exceed refund transaction amount',
          code: 'EXCEEDED_REFUND_AMOUNT',
        });
      }

      return res.status(500).json({
        error: 'Failed to create refund link',
        details: insertError.message,
      });
    }

    // Get updated aggregate for response
    const aggregateQuery = supabaseAdmin
      .from(VIEW_REFUND_AGGREGATES)
      .select('*')
      .eq('user_id', user.id);

    if (is_sub_transaction) {
      aggregateQuery.eq('original_sub_transaction_id', originalId);
    } else {
      aggregateQuery.eq('original_transaction_id', originalId);
    }

    const { data: aggregate } = await aggregateQuery.single();

    const status = aggregate
      ? buildRefundStatus(aggregate as RefundLinkAggregate, originalAmount)
      : buildEmptyRefundStatus(originalAmount);

    const response: CreateRefundLinkResponse = {
      link: mapRefundLinkToPublic(link),
      original_status: status,
    };

    return res.status(201).json({ success: true, data: response });
  } catch (error: any) {
    console.error('[Refunds] Link creation error:', error);
    return res.status(500).json({
      error: 'Failed to create refund link',
      details: error.message,
    });
  }
});
