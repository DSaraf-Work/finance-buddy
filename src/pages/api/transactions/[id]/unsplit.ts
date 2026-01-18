/**
 * Unsplit Transaction API
 *
 * POST - Delete all sub-transactions and restore parent to original status
 *
 * This endpoint "unsplits" a transaction by:
 * 1. Deleting all sub-transactions for the parent
 * 2. The database trigger automatically restores the parent's status
 *
 * @route POST /api/transactions/[id]/unsplit
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { TABLE_EMAILS_PROCESSED, TABLE_SUB_TRANSACTIONS } from '@/lib/constants/database';
import { isSubTransactionsEnabled } from '@/lib/features/flags';
import type { UnsplitResponse } from '@/types/sub-transactions';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  // Only POST method allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check feature flag
  if (!isSubTransactionsEnabled()) {
    return res.status(404).json({ error: 'Feature not enabled' });
  }

  const { id: parentId } = req.query;

  if (!parentId || typeof parentId !== 'string') {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }

  try {
    // Verify parent transaction exists, belongs to user, and is split
    const { data: parentData, error: parentError } = await supabaseAdmin
      .from(TABLE_EMAILS_PROCESSED)
      .select('id, user_id, status, status_before_split')
      .eq('id', parentId)
      .eq('user_id', user.id)
      .single();

    if (parentError || !parentData) {
      return res.status(404).json({ error: 'Parent transaction not found' });
    }

    const parent = parentData as Record<string, any>;

    // Check if parent is actually split
    if (parent.status !== 'split') {
      return res.status(400).json({
        error: 'Transaction is not split',
        code: 'NOT_SPLIT',
        current_status: parent.status,
      });
    }

    // Get count of sub-transactions before deleting
    const { count: subCount } = await supabaseAdmin
      .from(TABLE_SUB_TRANSACTIONS)
      .select('id', { count: 'exact', head: true })
      .eq('parent_transaction_id', parentId)
      .eq('user_id', user.id);

    if (!subCount || subCount === 0) {
      // No sub-transactions to delete, but parent is in split status
      // This shouldn't happen normally, but handle it gracefully
      console.warn(`[Unsplit] Parent ${parentId} is split but has no sub-transactions`);
    }

    // Delete all sub-transactions for this parent
    // The database trigger (restore_parent_on_all_subs_deleted) will automatically:
    // 1. Restore parent.status to status_before_split
    // 2. Clear status_before_split
    const { error: deleteError } = await supabaseAdmin
      .from(TABLE_SUB_TRANSACTIONS)
      .delete()
      .eq('parent_transaction_id', parentId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[Unsplit] Delete error:', deleteError);
      return res.status(500).json({
        error: 'Failed to delete sub-transactions',
        details: deleteError.message,
      });
    }

    // Get the restored parent status
    const { data: restoredParent } = await supabaseAdmin
      .from(TABLE_EMAILS_PROCESSED)
      .select('status')
      .eq('id', parentId)
      .single();

    const restoredStatus = (restoredParent as any)?.status || parent.status_before_split || 'REVIEW';

    const response: UnsplitResponse = {
      success: true,
      parent_id: parentId,
      deleted_count: subCount || 0,
      parent_restored: true,
      restored_status: restoredStatus,
    };

    console.log(`[Unsplit] Successfully unsplit transaction ${parentId}:`, {
      deleted_count: subCount,
      restored_status: restoredStatus,
    });

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('[Unsplit] Error:', error);
    return res.status(500).json({
      error: 'Failed to unsplit transaction',
      details: error.message,
    });
  }
});
