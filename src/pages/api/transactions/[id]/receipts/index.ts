/**
 * Receipts API - Collection Operations
 *
 * POST - Upload a new receipt image
 * GET  - List all receipts for a transaction
 *
 * @route /api/transactions/[id]/receipts
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  TABLE_EMAILS_PROCESSED,
  TABLE_RECEIPTS,
  VIEW_RECEIPT_SUMMARY,
} from '@/lib/constants/database';
import { isReceiptParsingEnabled } from '@/lib/features/flags';
import { uploadReceipt } from '@/lib/receipts/storage';
import { mapReceiptToPublic, mapReceiptSummaryToPublic } from '@/lib/receipts/mappers';
import { isValidReceiptFileType, RECEIPT_LIMITS } from '@/types/receipts';
import type { ReceiptFileType, ListReceiptsResponse } from '@/types/receipts';
import formidable from 'formidable';
import fs from 'fs';

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  // Check feature flag
  if (!isReceiptParsingEnabled()) {
    return res.status(404).json({ error: 'Feature not enabled' });
  }

  const { id: transactionId } = req.query;

  if (!transactionId || typeof transactionId !== 'string') {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }

  // Verify transaction exists and belongs to user
  const { data: transaction, error: txnError } = await supabaseAdmin
    .from(TABLE_EMAILS_PROCESSED)
    .select('id, user_id')
    .eq('id', transactionId)
    .eq('user_id', user.id)
    .single();

  if (txnError || !transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  // ============================================================================
  // GET - List receipts for transaction
  // ============================================================================
  if (req.method === 'GET') {
    try {
      const { data: receipts, error: listError } = await supabaseAdmin
        .from(VIEW_RECEIPT_SUMMARY)
        .select('*')
        .eq('transaction_id', transactionId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (listError) {
        console.error('[Receipts] List error:', listError);
        return res.status(500).json({
          error: 'Failed to list receipts',
          details: listError.message,
        });
      }

      const response: ListReceiptsResponse = {
        receipts: (receipts || []).map(mapReceiptSummaryToPublic),
        count: (receipts || []).length,
      };

      return res.status(200).json({ success: true, data: response });
    } catch (error: any) {
      console.error('[Receipts] List error:', error);
      return res.status(500).json({
        error: 'Failed to list receipts',
        details: error.message,
      });
    }
  }

  // ============================================================================
  // POST - Upload a new receipt
  // ============================================================================
  if (req.method === 'POST') {
    try {
      // Check if receipt already exists for this transaction
      const { data: existing } = await supabaseAdmin
        .from(TABLE_RECEIPTS)
        .select('id')
        .eq('transaction_id', transactionId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        return res.status(409).json({
          error: 'Receipt already exists for this transaction. Delete existing receipt first.',
          code: 'ALREADY_EXISTS',
        });
      }

      // Parse multipart form data
      const form = formidable({
        maxFileSize: RECEIPT_LIMITS.MAX_FILE_SIZE,
        filter: ({ mimetype }) => isValidReceiptFileType(mimetype || ''),
      });

      const [, files] = await form.parse(req);
      const fileArray = files.file;

      if (!fileArray || fileArray.length === 0) {
        return res.status(400).json({
          error: 'No file uploaded',
          code: 'NO_FILE',
        });
      }

      const uploadedFile = fileArray[0];
      const mimeType = uploadedFile.mimetype || 'application/octet-stream';

      if (!isValidReceiptFileType(mimeType)) {
        return res.status(400).json({
          error: `Invalid file type: ${mimeType}`,
          code: 'INVALID_FILE_TYPE',
        });
      }

      // Read file content
      const fileContent = await fs.promises.readFile(uploadedFile.filepath);

      // Upload to Supabase Storage
      const uploadResult = await uploadReceipt(
        user.id,
        transactionId,
        fileContent,
        uploadedFile.originalFilename || 'receipt',
        mimeType
      );

      // Create receipt record in database
      const { data: receipt, error: insertError } = await supabaseAdmin
        .from(TABLE_RECEIPTS)
        .insert({
          user_id: user.id,
          transaction_id: transactionId,
          file_path: uploadResult.path,
          file_name: uploadedFile.originalFilename || 'receipt',
          file_type: mimeType as ReceiptFileType,
          file_size_bytes: uploadedFile.size,
          parsing_status: 'pending',
          currency: 'INR',
        })
        .select()
        .single();

      // Clean up temp file
      await fs.promises.unlink(uploadedFile.filepath).catch(() => {});

      if (insertError) {
        console.error('[Receipts] Insert error:', insertError);
        return res.status(500).json({
          error: 'Failed to create receipt record',
          details: insertError.message,
        });
      }

      return res.status(201).json({
        success: true,
        data: {
          receipt: mapReceiptToPublic(receipt),
        },
      });
    } catch (error: any) {
      console.error('[Receipts] Upload error:', error);
      return res.status(500).json({
        error: 'Failed to upload receipt',
        details: error.message,
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
