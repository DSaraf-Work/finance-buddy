/**
 * Create Sub-Transactions from Receipt API
 *
 * POST - Convert receipt items to sub-transactions
 *
 * @route /api/transactions/[id]/receipts/[receiptId]/create-sub-transactions
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  TABLE_EMAILS_PROCESSED,
  TABLE_RECEIPTS,
  TABLE_RECEIPT_ITEMS,
  TABLE_RECEIPT_ITEM_LINKS,
  TABLE_SUB_TRANSACTIONS,
} from '@/lib/constants/database';
import { isReceiptParsingEnabled, isSubTransactionsEnabled } from '@/lib/features/flags';
import type {
  CreateSubTransactionsFromReceiptRequest,
  CreateSubTransactionsFromReceiptResponse,
} from '@/types/receipts';
import { SUB_TRANSACTION_LIMITS } from '@/types/sub-transactions';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check feature flags
  if (!isReceiptParsingEnabled()) {
    return res.status(404).json({ error: 'Receipt parsing feature not enabled' });
  }

  if (!isSubTransactionsEnabled()) {
    return res.status(404).json({ error: 'Sub-transactions feature not enabled' });
  }

  const { id: transactionId, receiptId } = req.query;

  if (!transactionId || typeof transactionId !== 'string') {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }

  if (!receiptId || typeof receiptId !== 'string') {
    return res.status(400).json({ error: 'Invalid receipt ID' });
  }

  const {
    excluded_item_ids = [],
    category_overrides = {},
  } = (req.body || {}) as CreateSubTransactionsFromReceiptRequest;

  try {
    // Verify transaction exists and belongs to user
    const { data: transaction, error: txnError } = await supabaseAdmin
      .from(TABLE_EMAILS_PROCESSED)
      .select('id, user_id, email_row_id, currency, direction, amount, txn_time, splitwise_expense_id')
      .eq('id', transactionId)
      .eq('user_id', user.id)
      .single();

    if (txnError || !transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Check if parent has required fields
    if (!transaction.currency || !transaction.direction) {
      return res.status(400).json({
        error: 'Parent transaction missing currency or direction',
        code: 'PARENT_INCOMPLETE',
      });
    }

    // Get receipt
    const { data: receipt, error: receiptError } = await supabaseAdmin
      .from(TABLE_RECEIPTS)
      .select('*')
      .eq('id', receiptId)
      .eq('user_id', user.id)
      .single();

    if (receiptError || !receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    // Verify receipt belongs to this transaction
    if (receipt.transaction_id !== transactionId) {
      return res.status(400).json({
        error: 'Receipt does not belong to this transaction',
        code: 'TRANSACTION_MISMATCH',
      });
    }

    // Verify receipt is parsed
    if (receipt.parsing_status !== 'completed' && receipt.parsing_status !== 'manual_review') {
      return res.status(400).json({
        error: 'Receipt must be parsed first',
        code: 'NOT_PARSED',
      });
    }

    // Check if sub-transactions already exist for this parent
    const { count: existingSubCount } = await supabaseAdmin
      .from(TABLE_SUB_TRANSACTIONS)
      .select('*', { count: 'exact', head: true })
      .eq('parent_transaction_id', transactionId)
      .eq('user_id', user.id);

    if (existingSubCount && existingSubCount > 0) {
      return res.status(409).json({
        error: 'Sub-transactions already exist for this transaction. Delete them first.',
        code: 'SUBS_EXIST',
      });
    }

    // Get receipt items
    const { data: items, error: itemsError } = await supabaseAdmin
      .from(TABLE_RECEIPT_ITEMS)
      .select('*')
      .eq('receipt_id', receiptId)
      .eq('user_id', user.id)
      .order('line_number', { ascending: true });

    if (itemsError || !items || items.length === 0) {
      return res.status(400).json({
        error: 'No receipt items found',
        code: 'NO_ITEMS',
      });
    }

    // Filter items
    const excludedSet = new Set(excluded_item_ids);
    const filteredItems = items.filter((item) => {
      // Skip if explicitly excluded
      if (excludedSet.has(item.id)) return false;
      // Skip if user marked as excluded
      if (item.is_excluded) return false;
      // Skip taxes, discounts, tips, service charges (they're part of total)
      if (item.is_tax || item.is_discount || item.is_tip || item.is_service_charge) return false;
      return true;
    });

    // Validate item count
    if (filteredItems.length < SUB_TRANSACTION_LIMITS.MIN_COUNT) {
      return res.status(400).json({
        error: `Need at least ${SUB_TRANSACTION_LIMITS.MIN_COUNT} items (found ${filteredItems.length})`,
        code: 'TOO_FEW_ITEMS',
      });
    }

    if (filteredItems.length > SUB_TRANSACTION_LIMITS.MAX_COUNT) {
      return res.status(400).json({
        error: `Maximum ${SUB_TRANSACTION_LIMITS.MAX_COUNT} items allowed (found ${filteredItems.length})`,
        code: 'TOO_MANY_ITEMS',
      });
    }

    // Calculate total
    const itemsTotal = filteredItems.reduce((sum, item) => sum + Number(item.total_price), 0);

    // Validate total doesn't exceed parent (allow partial)
    if (transaction.amount !== null && itemsTotal > transaction.amount) {
      return res.status(400).json({
        error: `Items total (${itemsTotal}) exceeds parent amount (${transaction.amount})`,
        code: 'AMOUNT_EXCEEDED',
      });
    }

    // Create sub-transactions
    const subTransactionsToInsert = filteredItems.map((item, index) => ({
      parent_transaction_id: transactionId,
      user_id: user.id,
      email_row_id: transaction.email_row_id,
      currency: transaction.currency,
      direction: transaction.direction,
      txn_time: transaction.txn_time,
      amount: Number(item.total_price),
      category: category_overrides[item.id] || item.category || null,
      merchant_name: item.item_name,
      user_notes: item.item_description || null,
      sub_transaction_order: index,
      splitwise_expense_id: transaction.splitwise_expense_id,
    }));

    const { data: createdSubs, error: subError } = await supabaseAdmin
      .from(TABLE_SUB_TRANSACTIONS)
      .insert(subTransactionsToInsert)
      .select();

    if (subError) {
      console.error('[Receipt] Sub-transaction creation error:', subError);
      return res.status(500).json({
        error: 'Failed to create sub-transactions',
        details: subError.message,
      });
    }

    // Create links between receipt items and sub-transactions
    const linksToInsert = filteredItems.map((item, index) => ({
      receipt_item_id: item.id,
      sub_transaction_id: createdSubs![index].id,
      user_id: user.id,
      link_method: 'auto',
    }));

    const { data: createdLinks, error: linkError } = await supabaseAdmin
      .from(TABLE_RECEIPT_ITEM_LINKS)
      .insert(linksToInsert)
      .select();

    if (linkError) {
      console.error('[Receipt] Link creation error:', linkError);
      // Don't fail - sub-transactions were created successfully
      // Links are for traceability only
    }

    const skippedItems = items.length - filteredItems.length;

    const response: CreateSubTransactionsFromReceiptResponse = {
      sub_transactions_created: createdSubs?.length || 0,
      links_created: createdLinks?.length || 0,
      skipped_items: skippedItems,
    };

    return res.status(201).json({ success: true, data: response });
  } catch (error: any) {
    console.error('[Receipt] Create sub-transactions error:', error);
    return res.status(500).json({
      error: 'Failed to create sub-transactions from receipt',
      details: error.message,
    });
  }
});
