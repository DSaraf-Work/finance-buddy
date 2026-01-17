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
import { isSubTransactionsEnabled } from '@/lib/features/flags';
import {
  validateBulkCreateRequest,
  SubTransactionValidationError,
  buildValidationResult,
} from '@/lib/sub-transactions/validation';
import { mapSubTransactionToPublic } from '@/lib/sub-transactions/mappers';
import { TABLE_EMAILS_PROCESSED, TABLE_SUB_TRANSACTIONS } from '@/lib/constants/database';
import type {
  CreateSubTransactionsRequest,
  SubTransactionListResponse,
  CreateSubTransactionsResponse,
} from '@/types/sub-transactions';

// Type for parent transaction query result
interface ParentTransactionRow {
  id: string;
  user_id: string;
  email_row_id: string;
  currency: string | null;
  direction: string | null;
  amount: number | null;
  txn_time: string | null;
  splitwise_expense_id: string | null;
}

// Type for sub-transaction query result
interface SubTransactionRow {
  id: string;
  parent_transaction_id: string;
  user_id: string;
  email_row_id: string;
  currency: string;
  direction: string;
  txn_time: string | null;
  amount: string | number;
  category: string | null;
  merchant_name: string | null;
  user_notes: string | null;
  sub_transaction_order: number;
  splitwise_expense_id: string | null;
  created_at: string;
  updated_at: string;
}

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
  const { data: parentData, error: parentError } = await supabaseAdmin
    .from(TABLE_EMAILS_PROCESSED)
    .select('id, user_id, email_row_id, currency, direction, amount, txn_time, splitwise_expense_id')
    .eq('id', parentId)
    .eq('user_id', user.id)
    .single();

  if (parentError || !parentData) {
    return res.status(404).json({ error: 'Parent transaction not found' });
  }

  const parent = parentData as ParentTransactionRow;

  // ============================================================================
  // GET - List sub-transactions
  // ============================================================================
  if (req.method === 'GET') {
    try {
      // Get sub-transactions
      const { data: itemsData, error: listError } = await supabaseAdmin
        .from(TABLE_SUB_TRANSACTIONS)
        .select('*')
        .eq('parent_transaction_id', parentId)
        .eq('user_id', user.id)
        .order('sub_transaction_order', { ascending: true });

      if (listError) {
        console.error('[SubTransactions] List error:', listError);
        return res.status(500).json({
          error: 'Failed to list sub-transactions',
          details: listError.message,
        });
      }

      const items = (itemsData || []) as SubTransactionRow[];

      // Calculate validation
      const subTotal = items.reduce((sum: number, item) => sum + Number(item.amount), 0);
      const validation = buildValidationResult(
        parent.amount,
        subTotal,
        items.length
      );

      const response: SubTransactionListResponse = {
        items: items.map(mapSubTransactionToPublic),
        count: items.length,
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
        .from(TABLE_SUB_TRANSACTIONS)
        .select('*', { count: 'exact', head: true })
        .eq('parent_transaction_id', parentId)
        .eq('user_id', user.id);

      if (existingCount && existingCount > 0) {
        return res.status(409).json({
          error: 'Sub-transactions already exist. Delete existing ones first.',
          code: 'ALREADY_EXISTS',
        });
      }

      // Calculate total amount of new items
      const totalAmount = request.items.reduce((sum, item) => sum + item.amount, 0);

      // Validate total doesn't exceed parent (allow partial splits)
      if (parent.amount !== null && totalAmount > parent.amount) {
        return res.status(400).json({
          error: `Total sub-transaction amount (${totalAmount}) exceeds parent amount (${parent.amount})`,
          code: 'AMOUNT_EXCEEDED',
        });
      }

      // Insert sub-transactions
      const insertData = request.items.map((item, index) => ({
        parent_transaction_id: parentId,
        user_id: user.id,
        email_row_id: parent.email_row_id,
        currency: parent.currency,
        direction: parent.direction,
        txn_time: parent.txn_time,
        amount: item.amount,
        category: item.category ?? null,
        merchant_name: item.merchant_name ?? null,
        user_notes: item.user_notes ?? null,
        sub_transaction_order: index,
        splitwise_expense_id: parent.splitwise_expense_id,
      }));

      const { data: createdData, error: insertError } = await (supabaseAdmin as any)
        .from(TABLE_SUB_TRANSACTIONS)
        .insert(insertData)
        .select();

      if (insertError) {
        console.error('[SubTransactions] Insert error:', insertError);
        return res.status(500).json({
          error: 'Failed to create sub-transactions',
          details: insertError.message,
        });
      }

      const created = (createdData || []) as SubTransactionRow[];

      // Calculate validation after creation
      const subTotal = created.reduce((sum: number, item) => sum + Number(item.amount), 0);
      const validation = buildValidationResult(
        parent.amount,
        subTotal,
        created.length
      );

      const response: CreateSubTransactionsResponse = {
        items: created.map(mapSubTransactionToPublic),
        count: created.length,
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
