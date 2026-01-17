/**
 * Receipt Parse API
 *
 * POST - Parse a receipt image using AI Vision
 *
 * @route /api/transactions/[id]/receipts/[receiptId]/parse
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isReceiptParsingEnabled } from '@/lib/features/flags';
import { getReceiptAsBase64 } from '@/lib/receipts/storage';
import { getReceiptParser } from '@/lib/receipts/parser';
import { mapReceiptToPublic, mapReceiptItemsToPublic } from '@/lib/receipts/mappers';
import {
  TABLE_EMAILS_PROCESSED,
  TABLE_RECEIPTS,
  TABLE_RECEIPT_ITEMS,
} from '@/lib/constants/database';
import type {
  ParseReceiptRequest,
  ParseReceiptResponse,
  ReceiptFileType,
} from '@/types/receipts';
import { RECEIPT_LIMITS } from '@/types/receipts';

// Type for receipt query result
interface ReceiptRow {
  id: string;
  user_id: string;
  transaction_id: string;
  file_path: string;
  file_type: string;
  parsing_status: string;
  [key: string]: any;
}

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

  const { force = false } = (req.body || {}) as ParseReceiptRequest;

  try {
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

    // Check if already parsed (unless force is true)
    if (receipt.parsing_status === 'completed' && !force) {
      // Return existing items
      const { data: existingItems } = await supabaseAdmin
        .from(TABLE_RECEIPT_ITEMS)
        .select('*')
        .eq('receipt_id', receiptId)
        .eq('user_id', user.id)
        .order('line_number', { ascending: true });

      const response: ParseReceiptResponse = {
        receipt: mapReceiptToPublic(receipt, existingItems?.length || 0),
        items: mapReceiptItemsToPublic(existingItems || []),
      };

      return res.status(200).json({
        success: true,
        data: response,
        cached: true,
      });
    }

    // Check if already processing
    if (receipt.parsing_status === 'processing') {
      return res.status(409).json({
        error: 'Receipt is already being processed',
        code: 'ALREADY_PROCESSING',
      });
    }

    const startTime = Date.now();

    // Update status to processing
    await (supabaseAdmin as any)
      .from(TABLE_RECEIPTS)
      .update({ parsing_status: 'processing' })
      .eq('id', receiptId)
      .eq('user_id', user.id);

    try {
      // Get receipt image as base64
      const imageBase64 = await getReceiptAsBase64(receipt.file_path);

      // Parse with AI
      const parser = getReceiptParser();
      const parsedData = await parser.parseReceipt(
        imageBase64,
        receipt.file_type as ReceiptFileType
      );

      // Delete existing items if force re-parsing
      if (force) {
        await supabaseAdmin
          .from(TABLE_RECEIPT_ITEMS)
          .delete()
          .eq('receipt_id', receiptId)
          .eq('user_id', user.id);
      }

      // Insert parsed items
      const itemsToInsert = parsedData.items.map((item, index) => ({
        receipt_id: receiptId,
        user_id: user.id,
        item_name: item.item_name,
        item_description: item.item_description || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        category: item.category || null,
        is_tax: item.is_tax || false,
        is_discount: item.is_discount || false,
        is_tip: item.is_tip || false,
        is_service_charge: item.is_service_charge || false,
        is_excluded: false,
        line_number: index,
        confidence: item.confidence,
        raw_text: item.raw_text || null,
      }));

      const { data: insertedItems, error: insertError } = await (supabaseAdmin as any)
        .from(TABLE_RECEIPT_ITEMS)
        .insert(itemsToInsert)
        .select();

      if (insertError) {
        throw new Error(`Failed to insert items: ${insertError.message}`);
      }

      // Determine final status based on confidence
      const parsingStatus =
        parsedData.confidence < RECEIPT_LIMITS.MANUAL_REVIEW_CONFIDENCE
          ? 'manual_review'
          : 'completed';

      // Update receipt with parsed data
      const { data: updatedReceipt, error: updateError } = await (supabaseAdmin as any)
        .from(TABLE_RECEIPTS)
        .update({
          store_name: parsedData.store_name,
          store_address: parsedData.store_address,
          receipt_date: parsedData.receipt_date,
          receipt_number: parsedData.receipt_number,
          receipt_total: parsedData.receipt_total,
          currency: parsedData.currency,
          parsing_status: parsingStatus,
          parsing_error: null,
          confidence: parsedData.confidence,
          ai_model_used: 'claude-3-sonnet', // TODO: Get from AI manager
          raw_ai_response: {
            raw_text: parsedData.raw_text,
            items_count: parsedData.items.length,
          },
        })
        .eq('id', receiptId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update receipt: ${updateError.message}`);
      }

      const processingTime = Date.now() - startTime;

      const response: ParseReceiptResponse = {
        receipt: mapReceiptToPublic(
          updatedReceipt,
          insertedItems?.length || 0,
          0, // No links yet
          insertedItems?.reduce((sum: number, item: any) => sum + Number(item.total_price), 0)
        ),
        items: mapReceiptItemsToPublic(insertedItems || []),
        parsing_duration_ms: processingTime,
      };

      return res.status(200).json({ success: true, data: response });
    } catch (parseError: any) {
      // Update receipt with error status
      await (supabaseAdmin as any)
        .from(TABLE_RECEIPTS)
        .update({
          parsing_status: 'failed',
          parsing_error: parseError.message,
        })
        .eq('id', receiptId)
        .eq('user_id', user.id);

      throw parseError;
    }
  } catch (error: any) {
    console.error('[Receipt] Parse error:', error);
    return res.status(500).json({
      error: 'Failed to parse receipt',
      details: error.message,
    });
  }
});
