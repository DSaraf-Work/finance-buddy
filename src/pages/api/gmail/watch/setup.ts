import { NextApiRequest, NextApiResponse } from 'next';
import { WatchManager } from '@/lib/gmail-watch/watch-manager';
import { createSupabaseClient } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createSupabaseClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { connectionId } = req.body;

    if (!connectionId) {
      return res.status(400).json({ error: 'connectionId is required' });
    }

    // Verify connection belongs to user
    const { data: connection } = await supabase
      .from('fb_gmail_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('user_id', user.id)
      .single();

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Setup watch
    const watchManager = new WatchManager();
    const result = await watchManager.setupWatch(connectionId);

    if (!result.success) {
      return res.status(500).json({ 
        error: result.error,
        success: false,
      });
    }

    return res.status(200).json({
      success: true,
      historyId: result.historyId,
      expiration: result.expiration,
      message: 'Watch setup successfully',
    });
  } catch (error: any) {
    console.error('❌ Watch setup failed:', error);
    return res.status(500).json({ 
      error: error.message,
      success: false,
    });
  }
}

