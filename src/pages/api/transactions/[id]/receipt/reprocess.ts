/**
 * POST /api/transactions/[id]/receipt/reprocess
 *
 * Re-runs OCR on the stored receipt image for this transaction.
 * Returns fresh parsed items without modifying any DB records.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { TABLE_EMAILS_PROCESSED, TABLE_RECEIPTS } from '@/lib/constants/database';
import { parseReceiptWithOpenRouter, ReceiptParseError } from '@/lib/receipt/parser';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id: transactionId } = req.query;
  if (!transactionId || typeof transactionId !== 'string') {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }

  // Verify the transaction belongs to the user
  const { data: txn, error: txnError } = await (supabaseAdmin as any)
    .from(TABLE_EMAILS_PROCESSED)
    .select('id, amount, user_id')
    .eq('id', transactionId)
    .eq('user_id', user.id)
    .single() as { data: { id: string; amount: number | null; user_id: string } | null; error: unknown };

  if (txnError || !txn) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  // Fetch the most recent receipt for this transaction
  const { data: receipt, error: receiptError } = await (supabaseAdmin as any)
    .from(TABLE_RECEIPTS)
    .select('id, storage_path')
    .eq('transaction_id', transactionId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle() as { data: { id: string; storage_path: string } | null; error: unknown };

  if (receiptError || !receipt) {
    return res.status(404).json({ error: 'No receipt found for this transaction' });
  }

  // Download the stored JPEG from Supabase Storage
  const { data: blob, error: downloadError } = await supabaseAdmin.storage
    .from('receipts')
    .download(receipt.storage_path);

  if (downloadError || !blob) {
    console.error('[ReprocessReceipt] Storage download failed:', downloadError);
    return res.status(500).json({ error: 'Failed to download receipt image' });
  }

  // Convert Blob to Buffer
  const arrayBuffer = await blob.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  // Run OCR parsing
  const parentAmount = txn.amount ? Number(txn.amount) : null;

  try {
    const parsed = await parseReceiptWithOpenRouter({
      fileBuffer,
      mimeType: 'image/jpeg',
      parentAmount,
    });

    return res.status(200).json({ items: parsed.items });
  } catch (err) {
    if (err instanceof ReceiptParseError) {
      if (err.code === 'NOT_A_RECEIPT') {
        return res.status(422).json({
          error: 'The stored image does not appear to be a receipt',
          reason: err.reason,
        });
      }
      return res.status(500).json({ error: err.message });
    }

    console.error('[ReprocessReceipt] Parsing failed:', err);
    return res.status(500).json({ error: 'Failed to reprocess receipt' });
  }
});
