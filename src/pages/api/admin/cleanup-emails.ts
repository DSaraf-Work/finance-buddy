// Admin API - Cleanup duplicate emails from fb_emails_fetched
// This will delete all emails with cascading to fb_emails_processed

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { TABLE_EMAILS_FETCHED, TABLE_EMAILS_PROCESSED } from '@/lib/constants/database';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧹 Starting email cleanup...');

    // Get counts before cleanup
    const { count: emailsCount } = await (supabaseAdmin as any)
      .from(TABLE_EMAILS_FETCHED)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: processedCount } = await (supabaseAdmin as any)
      .from(TABLE_EMAILS_PROCESSED)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    console.log(`📊 Before cleanup: ${emailsCount} emails, ${processedCount} processed`);

    // Delete all emails for this user (will cascade to fb_emails_processed)
    const { error: deleteError } = await (supabaseAdmin as any)
      .from(TABLE_EMAILS_FETCHED)
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('❌ Delete error:', deleteError);
      throw deleteError;
    }

    // Verify cleanup
    const { count: remainingEmails } = await (supabaseAdmin as any)
      .from(TABLE_EMAILS_FETCHED)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: remainingProcessed } = await (supabaseAdmin as any)
      .from(TABLE_EMAILS_PROCESSED)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    console.log(`✅ After cleanup: ${remainingEmails} emails, ${remainingProcessed} processed`);

    return res.status(200).json({
      success: true,
      deleted: {
        emails: emailsCount,
        processed: processedCount,
      },
      remaining: {
        emails: remainingEmails,
        processed: remainingProcessed,
      },
    });
  } catch (error: any) {
    console.error('❌ Cleanup failed:', error);
    return res.status(500).json({
      error: 'Cleanup failed',
      details: error.message,
    });
  }
});

