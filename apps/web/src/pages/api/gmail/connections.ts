import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { ConnectionsResponse, GmailConnectionPublic } from '@finance-buddy/shared';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data: connections, error } = await supabaseAdmin
      .from('fb_gmail_connections')
      .select(`
        id,
        email_address,
        google_user_id,
        granted_scopes,
        last_sync_at,
        last_error,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch connections' });
    }

    const response: ConnectionsResponse = {
      connections: connections as GmailConnectionPublic[],
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Connections error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
