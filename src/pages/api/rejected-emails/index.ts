import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  TABLE_REJECTED_EMAILS
} from '@/lib/constants/database';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method === 'GET') {
    try {
      const { status = 'REVIEW' } = req.query;

      console.log('🔍 Fetching rejected emails:', {
        user_id: user.id,
        status,
        timestamp: new Date().toISOString()
      });

      // Get rejected emails with email details
      const { data: rejectedEmails, error } = await (supabaseAdmin as any)
        .from(TABLE_REJECTED_EMAILS)
        .select(`
          *,
          fb_emails!inner(
            id,
            subject,
            from_address,
            snippet,
            internal_date,
            email_address
          )
        `)
        .eq('user_id', user.id)
        .eq('status', status)
        .order('rejected_at', { ascending: false });

      if (error) {
        console.error('Error fetching rejected emails:', error);
        return res.status(500).json({ error: 'Failed to fetch rejected emails' });
      }

      console.log(`✅ Found ${rejectedEmails?.length || 0} rejected emails with status ${status}`);

      res.status(200).json({
        success: true,
        rejectedEmails: rejectedEmails || [],
        count: rejectedEmails?.length || 0
      });

    } catch (error) {
      console.error('Rejected emails fetch error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
});
