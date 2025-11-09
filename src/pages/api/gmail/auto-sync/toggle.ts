// Auto-Sync API - Enable/Disable auto-sync

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  TABLE_GMAIL_CONNECTIONS
} from '@/lib/constants/database';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { connection_id, enabled } = req.body;

    if (!connection_id || typeof enabled !== 'boolean') {
      return res.status(400).json({ 
        error: 'connection_id and enabled are required' 
      });
    }

    // Verify connection ownership
    const { data: connection, error: connError } = await (supabaseAdmin as any)
      .from(TABLE_GMAIL_CONNECTIONS)
      .select('id')
      .eq('id', connection_id)
      .eq('user_id', user.id)
      .single();

    if (connError || !connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Update auto-sync settings
    const { data: updated, error: updateError } = await (supabaseAdmin as any)
      .from(TABLE_GMAIL_CONNECTIONS)
      .update({
        auto_sync_enabled: enabled,
        auto_sync_interval_minutes: 15, // Fixed at 15 minutes
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection_id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ 
        error: 'Failed to update auto-sync settings',
        details: updateError.message 
      });
    }

    return res.status(200).json({ 
      success: true,
      connection: updated 
    });
  } catch (error: any) {
    console.error('Failed to toggle auto-sync:', error);
    return res.status(500).json({ 
      error: 'Failed to toggle auto-sync',
      details: error.message 
    });
  }
});

