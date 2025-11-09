// Auto-Sync API - Get auto-sync status

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  TABLE_GMAIL_CONNECTIONS
} from '@/lib/constants/database';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { connection_id } = req.query;

    if (!connection_id || typeof connection_id !== 'string') {
      return res.status(400).json({ error: 'connection_id is required' });
    }

    // Fetch connection with auto-sync settings
    const { data: connection, error: connError } = await (supabaseAdmin as any)
      .from(TABLE_GMAIL_CONNECTIONS)
      .select('id, auto_sync_enabled, auto_sync_interval_minutes, last_auto_sync_at')
      .eq('id', connection_id)
      .eq('user_id', user.id)
      .single();

    if (connError || !connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    return res.status(200).json({
      auto_sync_enabled: (connection as any).auto_sync_enabled,
      interval_minutes: (connection as any).auto_sync_interval_minutes,
      last_sync_at: (connection as any).last_auto_sync_at,
    });
  } catch (error: any) {
    console.error('Failed to get auto-sync status:', error);
    return res.status(500).json({ 
      error: 'Failed to get auto-sync status',
      details: error.message 
    });
  }
});

