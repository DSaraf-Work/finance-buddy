/**
 * Refunds API - List Refund Links
 *
 * GET - List all refund links for a transaction (as original)
 *
 * @route /api/transactions/[id]/refunds
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  TABLE_EMAILS_PROCESSED,
  TABLE_REFUND_LINKS,
  VIEW_REFUND_AGGREGATES,
} from '@/lib/constants/database';
import { isSmartRefundsEnabled } from '@/lib/features/flags';
import {
  mapRefundLinksToPublic,
  buildRefundStatus,
  buildEmptyRefundStatus,
} from '@/lib/refunds/mappers';
import type { ListRefundLinksResponse, RefundLinkAggregate } from '@/types/refunds';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  // Check feature flag
  if (!isSmartRefundsEnabled()) {
    return res.status(404).json({ error: 'Feature not enabled' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id: transactionId } = req.query;

  if (!transactionId || typeof transactionId !== 'string') {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }

  // Verify transaction exists and belongs to user
  const { data: transaction, error: txnError } = await supabaseAdmin
    .from(TABLE_EMAILS_PROCESSED)
    .select('id, user_id, amount')
    .eq('id', transactionId)
    .eq('user_id', user.id)
    .single();

  if (txnError || !transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  try {
    // Get all refund links where this transaction is the original
    const { data: links, error: linksError } = await supabaseAdmin
      .from(TABLE_REFUND_LINKS)
      .select('*')
      .eq('original_transaction_id', transactionId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (linksError) {
      console.error('[Refunds] Links fetch error:', linksError);
      return res.status(500).json({
        error: 'Failed to fetch refund links',
        details: linksError.message,
      });
    }

    // Get aggregate from view
    const { data: aggregates } = await supabaseAdmin
      .from(VIEW_REFUND_AGGREGATES)
      .select('*')
      .eq('original_transaction_id', transactionId)
      .eq('user_id', user.id)
      .single();

    const originalAmount = Math.abs(Number(transaction.amount) || 0);
    const publicLinks = mapRefundLinksToPublic(links || []);

    const status = aggregates
      ? buildRefundStatus(aggregates as RefundLinkAggregate, originalAmount, publicLinks)
      : buildEmptyRefundStatus(originalAmount);

    const response: ListRefundLinksResponse = {
      links: publicLinks,
      count: publicLinks.length,
      status,
    };

    return res.status(200).json({ success: true, data: response });
  } catch (error: any) {
    console.error('[Refunds] List error:', error);
    return res.status(500).json({
      error: 'Failed to list refund links',
      details: error.message,
    });
  }
});
