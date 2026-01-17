/**
 * Refunds API - Delete Refund Link
 *
 * DELETE - Remove a refund link (unlink)
 *
 * @route /api/transactions/[id]/refunds/[linkId]
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isSmartRefundsEnabled } from '@/lib/features/flags';
import { TABLE_REFUND_LINKS } from '@/lib/constants/database';

// Type for refund link query result
interface RefundLinkRow {
  id: string;
  original_transaction_id: string | null;
  original_sub_transaction_id: string | null;
}

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  // Check feature flag
  if (!isSmartRefundsEnabled()) {
    return res.status(404).json({ error: 'Feature not enabled' });
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id: transactionId, linkId } = req.query;

  if (!transactionId || typeof transactionId !== 'string') {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }

  if (!linkId || typeof linkId !== 'string') {
    return res.status(400).json({ error: 'Invalid link ID' });
  }

  try {
    // Verify the link exists and belongs to this user
    // Also verify it's associated with the transaction in the URL
    const { data: linkData, error: fetchError } = await supabaseAdmin
      .from(TABLE_REFUND_LINKS)
      .select('id, original_transaction_id, original_sub_transaction_id')
      .eq('id', linkId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !linkData) {
      return res.status(404).json({ error: 'Refund link not found' });
    }

    const link = linkData as RefundLinkRow;

    // Verify the link is associated with the transaction in the URL
    // (either as original_transaction_id or original_sub_transaction_id)
    const isLinkedToTransaction =
      link.original_transaction_id === transactionId ||
      link.original_sub_transaction_id === transactionId;

    if (!isLinkedToTransaction) {
      return res.status(400).json({
        error: 'Link does not belong to this transaction',
        code: 'WRONG_TRANSACTION',
      });
    }

    // Delete the link
    const { error: deleteError } = await supabaseAdmin
      .from(TABLE_REFUND_LINKS)
      .delete()
      .eq('id', linkId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[Refunds] Delete error:', deleteError);
      return res.status(500).json({
        error: 'Failed to delete refund link',
        details: deleteError.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        deleted_link_id: linkId,
        message: 'Refund link deleted successfully',
      },
    });
  } catch (error: any) {
    console.error('[Refunds] Delete error:', error);
    return res.status(500).json({
      error: 'Failed to delete refund link',
      details: error.message,
    });
  }
});
