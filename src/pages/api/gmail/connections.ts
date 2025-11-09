import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { ConnectionsResponse, GmailConnectionPublic } from '@/types';
import {
  TABLE_GMAIL_CONNECTIONS
} from '@/lib/constants/database';

/**
 * Get Gmail connections for the authenticated user
 *
 * Security Model (Defense-in-Depth):
 * 1. Authentication: withAuth() middleware verifies JWT and extracts user
 * 2. Authorization: Explicit .eq('user_id', user.id) filter in query
 * 3. RLS Layer: Database RLS policies provide additional protection
 *
 * We use supabaseAdmin (service role) for performance and reliability:
 * - Service role bypasses RLS (by design)
 * - More performant (no RLS overhead)
 * - More reliable (no cookie/session issues)
 * - Authorization is explicitly handled in application code
 *
 * RLS policies remain enabled as defense-in-depth:
 * - Protects against accidental use of anon key
 * - Protects against SQL injection
 * - Provides audit trail
 */
export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use supabaseAdmin for server-side operations
    // Authorization is enforced by withAuth() + explicit user_id filter
    const { data: connections, error } = await supabaseAdmin
      .from(TABLE_GMAIL_CONNECTIONS)
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
      .eq('user_id', user.id) // Explicit authorization check
      .order('created_at', { ascending: false});

    if (error) {
      console.error('[Connections] Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch connections' });
    }

    const response: ConnectionsResponse = {
      connections: connections as GmailConnectionPublic[],
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('[Connections] Connections error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
