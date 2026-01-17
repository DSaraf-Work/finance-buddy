/**
 * Receipt API - Single Receipt Operations
 *
 * GET    - Get receipt details with items
 * DELETE - Delete receipt and all items
 *
 * @route /api/transactions/[id]/receipts/[receiptId]
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isReceiptParsingEnabled } from '@/lib/features/flags';
import { deleteReceipt as deleteReceiptFile } from '@/lib/receipts/storage';
import {
  mapReceiptToPublic,
  mapReceiptItemsToPublic,
  createLinksMap,
} from '@/lib/receipts/mappers';
import {
  TABLE_EMAILS_PROCESSED,
  TABLE_RECEIPTS,
  TABLE_RECEIPT_ITEMS,
  TABLE_RECEIPT_ITEM_LINKS,
} from '@/lib/constants/database';
import type { GetReceiptResponse, ReceiptItemLink } from '@/types/receipts';

// Type for receipt query result
interface ReceiptRow {
  id: string;
  user_id: string;
  transaction_id: string;
  file_path: string;
  parsing_status: string;
  [key: string]: any;
}

// Type for receipt item query result
interface ReceiptItemRow {
  id: string;
  receipt_id: string;
  user_id: string;
  total_price: number;
  [key: string]: any;
}

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  // Check feature flag
  if (!isReceiptParsingEnabled()) {
    return res.status(404).json({ error: 'Feature not enabled' });
  }

  const { id: transactionId, receiptId } = req.query;

  if (!transactionId || typeof transactionId !== 'string') {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }

  if (!receiptId || typeof receiptId !== 'string') {
    return res.status(400).json({ error: 'Invalid receipt ID' });
  }

  // Verify transaction exists and belongs to user
  const { data: transactionData, error: txnError } = await supabaseAdmin
    .from(TABLE_EMAILS_PROCESSED)
    .select('id, user_id')
    .eq('id', transactionId)
    .eq('user_id', user.id)
    .single();

  if (txnError || !transactionData) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  // Get receipt
  const { data: receiptData, error: receiptError } = await supabaseAdmin
    .from(TABLE_RECEIPTS)
    .select('*')
    .eq('id', receiptId)
    .eq('user_id', user.id)
    .single();

  if (receiptError || !receiptData) {
    return res.status(404).json({ error: 'Receipt not found' });
  }

  const receipt = receiptData as ReceiptRow;

  // Verify receipt belongs to this transaction
  if (receipt.transaction_id !== transactionId) {
    return res.status(400).json({
      error: 'Receipt does not belong to this transaction',
      code: 'TRANSACTION_MISMATCH',
    });
  }

  // ============================================================================
  // GET - Get receipt with items
  // ============================================================================
  if (req.method === 'GET') {
    try {
      // Get receipt items
      const { data: itemsData, error: itemsError } = await supabaseAdmin
        .from(TABLE_RECEIPT_ITEMS)
        .select('*')
        .eq('receipt_id', receiptId)
        .eq('user_id', user.id)
        .order('line_number', { ascending: true });

      if (itemsError) {
        console.error('[Receipt] Get items error:', itemsError);
        return res.status(500).json({
          error: 'Failed to get receipt items',
          details: itemsError.message,
        });
      }

      const items = (itemsData || []) as ReceiptItemRow[];

      // Get links for items
      const itemIds = items.map((item) => item.id);
      let linksMap = new Map<string, ReceiptItemLink>();

      if (itemIds.length > 0) {
        const { data: links } = await supabaseAdmin
          .from(TABLE_RECEIPT_ITEM_LINKS)
          .select('*')
          .in('receipt_item_id', itemIds)
          .eq('user_id', user.id);

        if (links && links.length > 0) {
          linksMap = createLinksMap(links as ReceiptItemLink[]);
        }
      }

      const response: GetReceiptResponse = {
        receipt: mapReceiptToPublic(
          receipt,
          items.length,
          linksMap.size,
          items.reduce((sum, item) => sum + Number(item.total_price), 0)
        ),
        items: mapReceiptItemsToPublic(items, linksMap),
      };

      return res.status(200).json({ success: true, data: response });
    } catch (error: any) {
      console.error('[Receipt] Get error:', error);
      return res.status(500).json({
        error: 'Failed to get receipt',
        details: error.message,
      });
    }
  }

  // ============================================================================
  // DELETE - Delete receipt and items
  // ============================================================================
  if (req.method === 'DELETE') {
    try {
      // Delete file from storage first
      try {
        await deleteReceiptFile(receipt.file_path);
      } catch (storageError) {
        console.warn('[Receipt] Storage delete warning:', storageError);
        // Continue with database deletion even if storage fails
      }

      // Delete receipt (cascades to items and links due to FK constraints)
      const { error: deleteError } = await supabaseAdmin
        .from(TABLE_RECEIPTS)
        .delete()
        .eq('id', receiptId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('[Receipt] Delete error:', deleteError);
        return res.status(500).json({
          error: 'Failed to delete receipt',
          details: deleteError.message,
        });
      }

      return res.status(200).json({
        success: true,
        data: { deleted: true },
      });
    } catch (error: any) {
      console.error('[Receipt] Delete error:', error);
      return res.status(500).json({
        error: 'Failed to delete receipt',
        details: error.message,
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
