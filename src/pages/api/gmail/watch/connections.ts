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

    // Fetch all Gmail connections for the user
    const { data: connections, error } = await supabaseAdmin
      .from('fb_gmail_connections')
      .select('id, email_address, watch_enabled, watch_setup_at, last_history_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching connections:', error);
      return res.status(500).json({ error: 'Failed to fetch connections' });
    }

    // Fetch watch subscriptions for these connections
    const connectionIds = (connections || []).map((c: any) => c.id);
    const { data: subscriptions } = await supabaseAdmin
      .from('fb_gmail_watch_subscriptions')
      .select('connection_id, expiration, status')
      .in('connection_id', connectionIds);

    // Merge subscription data with connections
    const connectionsWithSubs = (connections || []).map((conn: any) => {
      const sub: any = (subscriptions || []).find((s: any) => s.connection_id === conn.id);
      return {
        ...conn,
        expiration: sub?.expiration || null,
        subscription_status: sub?.status || null,
      };
    });

    return res.status(200).json({
      success: true,
      connections: connectionsWithSubs || [],
    });
  } catch (error) {
    console.error('Error in connections API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

