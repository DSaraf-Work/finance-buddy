/**
 * GET /api/cron/receipt-cleanup
 *
 * Vercel Cron: runs daily at 03:00 UTC.
 * Deletes expired receipts (expires_at < now()):
 *   1. Remove files from Supabase Storage 'receipts' bucket
 *   2. Delete rows from fb_receipts (CASCADE removes fb_receipt_items)
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { TABLE_RECEIPTS } from '@/lib/constants/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret (same pattern as gmail-auto-sync.ts)
  const cronSecret = req.headers['authorization'];
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

  if (cronSecret !== expectedSecret) {
    console.error('❌ Unauthorized receipt cleanup request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🗑️ Receipt cleanup cron started:', new Date().toISOString());

  try {
    // Fetch expired receipts (as any: Supabase types not generated for receipt tables)
    const { data: expired, error: fetchError } = await (supabaseAdmin as any)
      .from(TABLE_RECEIPTS)
      .select('id, storage_path')
      .lt('expires_at', new Date().toISOString()) as {
        data: Array<{ id: string; storage_path: string }> | null;
        error: unknown;
      };

    if (fetchError) {
      console.error('Failed to fetch expired receipts:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch expired receipts' });
    }

    if (!expired || expired.length === 0) {
      console.log('✅ No expired receipts to clean up');
      return res.status(200).json({ deleted: 0 });
    }

    const storagePaths = expired.map((r: { id: string; storage_path: string }) => r.storage_path);
    const receiptIds = expired.map((r: { id: string; storage_path: string }) => r.id);

    // Delete Storage files
    const { error: storageError } = await supabaseAdmin.storage
      .from('receipts')
      .remove(storagePaths);

    if (storageError) {
      // Log but continue — DB delete is more important for RLS/privacy
      console.error('Storage cleanup partial failure:', storageError);
    }

    // Delete DB rows (CASCADE removes fb_receipt_items automatically)
    const { error: dbError } = await (supabaseAdmin as any)
      .from(TABLE_RECEIPTS)
      .delete()
      .in('id', receiptIds);

    if (dbError) {
      console.error('Failed to delete expired receipt rows:', dbError);
      return res.status(500).json({ error: 'Failed to delete expired receipts' });
    }

    console.log(`✅ Receipt cleanup complete: deleted ${expired.length} expired receipts`);
    return res.status(200).json({ deleted: expired.length });
  } catch (err) {
    console.error('Receipt cleanup cron error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
