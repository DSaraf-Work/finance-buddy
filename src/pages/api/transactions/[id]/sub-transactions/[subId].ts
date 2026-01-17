/**
 * Sub-Transaction API - Single Item Operations
 *
 * PATCH  - Update a single sub-transaction
 * DELETE - Delete a single sub-transaction
 *
 * @route /api/transactions/[id]/sub-transactions/[subId]
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { TABLE_EMAILS_PROCESSED, TABLE_SUB_TRANSACTIONS } from '@/lib/constants/database';
import { isSubTransactionsEnabled } from '@/lib/features/flags';
import {
  validateUpdateInput,
  SubTransactionValidationError,
} from '@/lib/sub-transactions/validation';
import { mapSubTransactionToPublic } from '@/lib/sub-transactions/mappers';
import type { UpdateSubTransactionInput } from '@/types/sub-transactions';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  // Check feature flag
  if (!isSubTransactionsEnabled()) {
    return res.status(404).json({ error: 'Feature not enabled' });
  }

  const { id: parentId, subId } = req.query;

  if (!parentId || typeof parentId !== 'string') {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }

  if (!subId || typeof subId !== 'string') {
    return res.status(400).json({ error: 'Invalid sub-transaction ID' });
  }

  // Verify parent transaction exists and belongs to user
  const { data: parent, error: parentError } = await supabaseAdmin
    .from(TABLE_EMAILS_PROCESSED)
    .select('id, user_id, amount')
    .eq('id', parentId)
    .eq('user_id', user.id)
    .single();

  if (parentError || !parent) {
    return res.status(404).json({ error: 'Parent transaction not found' });
  }

  // Get the sub-transaction
  const { data: existing, error: getError } = await supabaseAdmin
    .from(TABLE_SUB_TRANSACTIONS)
    .select('*')
    .eq('id', subId)
    .eq('user_id', user.id)
    .single();

  if (getError || !existing) {
    return res.status(404).json({ error: 'Sub-transaction not found' });
  }

  // Verify sub-transaction belongs to the specified parent
  if (existing.parent_transaction_id !== parentId) {
    return res.status(400).json({
      error: 'Sub-transaction does not belong to this parent',
      code: 'PARENT_MISMATCH',
    });
  }

  // ============================================================================
  // PATCH - Update sub-transaction
  // ============================================================================
  if (req.method === 'PATCH') {
    try {
      const input = req.body as UpdateSubTransactionInput;

      // Validate input
      try {
        validateUpdateInput(input);
      } catch (error) {
        if (error instanceof SubTransactionValidationError) {
          return res.status(400).json({
            error: error.message,
            code: error.code,
            field: error.field,
          });
        }
        throw error;
      }

      // If updating amount, validate total doesn't exceed parent
      if (input.amount !== undefined && parent.amount !== null) {
        // Get all other sub-transactions for this parent
        const { data: siblings } = await supabaseAdmin
          .from(TABLE_SUB_TRANSACTIONS)
          .select('amount')
          .eq('parent_transaction_id', parentId)
          .eq('user_id', user.id)
          .neq('id', subId);

        const siblingsTotal = (siblings || []).reduce(
          (sum, s) => sum + Number(s.amount),
          0
        );
        const newTotal = siblingsTotal + input.amount;

        if (newTotal > parent.amount) {
          return res.status(400).json({
            error: `Updated total (${newTotal}) would exceed parent amount (${parent.amount})`,
            code: 'AMOUNT_EXCEEDED',
          });
        }
      }

      // Build update object
      const updateData: Record<string, any> = {};
      if (input.amount !== undefined) {
        updateData.amount = input.amount;
      }
      if (input.category !== undefined) {
        updateData.category = input.category;
      }
      if (input.merchant_name !== undefined) {
        updateData.merchant_name = input.merchant_name;
      }
      if (input.user_notes !== undefined) {
        updateData.user_notes = input.user_notes;
      }

      // Update
      const { data: updated, error: updateError } = await supabaseAdmin
        .from(TABLE_SUB_TRANSACTIONS)
        .update(updateData)
        .eq('id', subId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('[SubTransactions] Update error:', updateError);
        return res.status(500).json({
          error: 'Failed to update sub-transaction',
          details: updateError.message,
        });
      }

      return res.status(200).json({
        success: true,
        data: mapSubTransactionToPublic(updated),
      });
    } catch (error: any) {
      console.error('[SubTransactions] Update error:', error);
      return res.status(500).json({
        error: 'Failed to update sub-transaction',
        details: error.message,
      });
    }
  }

  // ============================================================================
  // DELETE - Delete single sub-transaction
  // ============================================================================
  if (req.method === 'DELETE') {
    try {
      const { error: deleteError } = await supabaseAdmin
        .from(TABLE_SUB_TRANSACTIONS)
        .delete()
        .eq('id', subId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('[SubTransactions] Delete error:', deleteError);
        return res.status(500).json({
          error: 'Failed to delete sub-transaction',
          details: deleteError.message,
        });
      }

      return res.status(200).json({
        success: true,
        data: { deleted: true },
      });
    } catch (error: any) {
      console.error('[SubTransactions] Delete error:', error);
      return res.status(500).json({
        error: 'Failed to delete sub-transaction',
        details: error.message,
      });
    }
  }

  // ============================================================================
  // GET - Get single sub-transaction (optional convenience endpoint)
  // ============================================================================
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      data: mapSubTransactionToPublic(existing),
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
