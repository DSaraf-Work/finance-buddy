import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { revokeToken } from '@/lib/gmail';
import { DisconnectRequest } from '@finance-buddy/shared';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { connection_id, revoke = true }: DisconnectRequest = req.body;

    if (!connection_id) {
      return res.status(400).json({ error: 'connection_id is required' });
    }

    // Get the connection to revoke token
    const { data: connection, error: fetchError } = await (supabaseAdmin as any)
      .from('fb_gmail_connections')
      .select('access_token, refresh_token')
      .eq('id', connection_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Revoke token with Google if requested
    if (revoke) {
      try {
        await revokeToken((connection as any).access_token);
      } catch (revokeError) {
        console.error('Token revocation error:', revokeError);
        // Continue with deletion even if revocation fails
      }
    }

    // Hard delete the connection (per ADR-06)
    const { error: deleteError } = await (supabaseAdmin as any)
      .from('fb_gmail_connections')
      .delete()
      .eq('id', connection_id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete connection' });
    }

    res.status(204).end();
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
