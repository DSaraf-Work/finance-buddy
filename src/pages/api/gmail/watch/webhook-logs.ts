import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth/middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const user = await requireAuth(req, res);
    if (!user) {
      return; // 401 already sent by requireAuth
    }

    const limit = parseInt(req.query.limit as string) || 50;

    // Get user's Gmail connections
    const { data: connections } = await supabaseAdmin
      .from('fb_gmail_connections')
      .select('email_address')
      .eq('user_id', user.id);

    const emailAddresses = connections?.map((c: any) => c.email_address) || [];

    if (emailAddresses.length === 0) {
      return res.status(200).json({
        success: true,
        logs: [],
      });
    }

    // Fetch webhook logs for user's connections
    const { data: logs, error } = await supabaseAdmin
      .from('fb_webhook_logs')
      .select('*')
      .in('email_address', emailAddresses)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching webhook logs:', error);
      return res.status(500).json({ error: 'Failed to fetch webhook logs' });
    }

    return res.status(200).json({
      success: true,
      logs: logs || [],
    });
  } catch (error) {
    console.error('Error in webhook-logs API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

