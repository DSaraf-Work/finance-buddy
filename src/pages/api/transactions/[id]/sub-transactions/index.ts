/**
 * Sub-Transactions API - Bulk Operations
 *
 * POST   - Create sub-transactions (bulk, 2-20 items)
 * GET    - List all sub-transactions for a parent
 * DELETE - Delete all sub-transactions for a parent
 *
 * @route /api/transactions/[id]/sub-transactions
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { TABLE_EMAILS_PROCESSED, TABLE_SUB_TRANSACTIONS, VIEW_ALL_TRANSACTIONS } from '@/lib/constants/database';
import { isSubTransactionsEnabled } from '@/lib/features/flags';
import {
  validateBulkCreateRequest,
  SubTransactionValidationError,
  buildValidationResult,
} from '@/lib/sub-transactions/validation';
import { mapSubTransactionToPublic } from '@/lib/sub-transactions/mappers';
import type {
  CreateSubTransactionsRequest,
  SubTransactionListResponse,
  CreateSubTransactionsResponse,
} from '@/types/sub-transactions';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  // Check feature flag
  if (!isSubTransactionsEnabled()) {
    return res.status(404).json({ error: 'Feature not enabled' });
  }

  const { id: parentId } = req.query;

  if (!parentId || typeof parentId !== 'string') {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }

  // Verify parent transaction exists and belongs to user
  const { data: parentData, error: parentError } = await (supabaseAdmin as any)
    .from(TABLE_EMAILS_PROCESSED)
    .select('id, user_id, email_row_id, currency, direction, amount, txn_time, splitwise_expense_id')
    .eq('id', parentId)
    .eq('user_id', user.id)
    .single();

  if (parentError || !parentData) {
    return res.status(404).json({ error: 'Parent transaction not found' });
  }

  // Type assertion for Supabase response
  const parent = parentData as Record<string, any>;

  // ============================================================================
  // GET - List sub-transactions
  // ============================================================================
  if (req.method === 'GET') {
    try {
      // Get sub-transactions
      const { data: items, error: listError } = await supabaseAdmin
        .from(VIEW_ALL_TRANSACTIONS)
        .select('id, email_row_id, txn_time, amount, currency, direction, merchant_name, category, parent_transaction_id, created_at, updated_at, splitwise_expense_id, user_notes')
        .eq('parent_transaction_id', parentId)
        .eq('user_id', user.id)
        .eq('record_type', 'sub')
        .order('created_at', { ascending: true });

      if (listError) {
        console.error('[SubTransactions] List error:', listError);
        return res.status(500).json({
          error: 'Failed to list sub-transactions',
          details: listError.message,
        });
      }

      // Calculate validation
      const itemsArray = (items || []) as Array<Record<string, any>>;
      const subTotal = itemsArray.reduce((sum, item) => sum + Number(item.amount), 0);
      // Convert parent.amount to number (may come as string from DB)
      const parentAmount = parent.amount !== null && parent.amount !== undefined
        ? Number(parent.amount)
        : null;
      const validation = buildValidationResult(
        parentAmount,
        subTotal,
        itemsArray.length
      );

      const response: SubTransactionListResponse = {
        items: itemsArray.map((item) => mapSubTransactionToPublic(item as any)),
        count: itemsArray.length,
        validation,
      };

      return res.status(200).json({ success: true, data: response });
    } catch (error: any) {
      console.error('[SubTransactions] List error:', error);
      return res.status(500).json({
        error: 'Failed to list sub-transactions',
        details: error.message,
      });
    }
  }

  // ============================================================================
  // POST - Create sub-transactions (bulk)
  // ============================================================================
  if (req.method === 'POST') {
    try {
      const request = req.body as CreateSubTransactionsRequest;

      // Validate request
      try {
        validateBulkCreateRequest(request.items);
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

      // Check if parent has required fields
      if (!parent.currency || !parent.direction) {
        return res.status(400).json({
          error: 'Parent transaction missing currency or direction',
          code: 'PARENT_INCOMPLETE',
        });
      }

      // Check existing count - prevent adding if sub-transactions already exist
      const { count: existingCount } = await supabaseAdmin
        .from(VIEW_ALL_TRANSACTIONS)
        .select('id', { count: 'exact', head: true })
        .eq('parent_transaction_id', parentId)
        .eq('user_id', user.id)
        .eq('record_type', 'sub');

      if (existingCount && existingCount > 0) {
        return res.status(409).json({
          error: 'Sub-transactions already exist. Delete existing ones first.',
          code: 'ALREADY_EXISTS',
        });
      }

      // Calculate total amount of new items
      const totalAmount = request.items.reduce((sum, item) => sum + item.amount, 0);

      // Convert parent.amount to number (may come as string from DB)
      const parentAmountNum = parent.amount !== null && parent.amount !== undefined
        ? Number(parent.amount)
        : null;

      // Validate total doesn't exceed parent (allow partial splits)
      if (parentAmountNum !== null && totalAmount > parentAmountNum) {
        return res.status(400).json({
          error: `Total sub-transaction amount (${totalAmount}) exceeds parent amount (${parentAmountNum})`,
          code: 'AMOUNT_EXCEEDED',
        });
      }

      // Insert sub-transactions via SECURITY DEFINER RPC (bypasses missing table GRANT)
      const { data: created, error: insertError } = await (supabaseAdmin as any)
        .rpc('create_sub_transactions', {
          p_parent_id: parentId,
          p_items: request.items.map((item) => ({
            amount: item.amount,
            category: item.category ?? null,
            merchant_name: item.merchant_name ?? null,
            user_notes: item.user_notes ?? null,
          })),
        });

      if (insertError) {
        console.error('[SubTransactions] Insert error:', insertError);
        return res.status(500).json({
          error: 'Failed to create sub-transactions',
          details: insertError.message,
        });
      }

      // Calculate validation after creation
      const createdArray = (created || []) as Array<Record<string, any>>;
      const subTotal = createdArray.reduce((sum, item) => sum + Number(item.amount), 0);
      const validation = buildValidationResult(
        parentAmountNum,
        subTotal,
        createdArray.length
      );

      const response: CreateSubTransactionsResponse = {
        items: createdArray.map((item) => mapSubTransactionToPublic(item as any)),
        count: createdArray.length,
        validation,
      };

      return res.status(201).json({ success: true, data: response });
    } catch (error: any) {
      console.error('[SubTransactions] Create error:', error);
      return res.status(500).json({
        error: 'Failed to create sub-transactions',
        details: error.message,
      });
    }
  }

  // ============================================================================
  // DELETE - Delete all sub-transactions
  // ============================================================================
  if (req.method === 'DELETE') {
    try {
      const { data, error: deleteError } = await supabaseAdmin
        .from(TABLE_SUB_TRANSACTIONS)
        .delete()
        .eq('parent_transaction_id', parentId)
        .eq('user_id', user.id)
        .select('id');

      if (deleteError) {
        console.error('[SubTransactions] Delete error:', deleteError);
        return res.status(500).json({
          error: 'Failed to delete sub-transactions',
          details: deleteError.message,
        });
      }

      return res.status(200).json({
        success: true,
        data: { deletedCount: (data || []).length },
      });
    } catch (error: any) {
      console.error('[SubTransactions] Delete error:', error);
      return res.status(500).json({
        error: 'Failed to delete sub-transactions',
        details: error.message,
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
