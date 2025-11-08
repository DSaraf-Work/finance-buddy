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

    // Stop watch
    const watchManager = new WatchManager();
    await watchManager.stopWatch(connectionId);

    return res.status(200).json({
      success: true,
      message: 'Watch stopped successfully',
    });
  } catch (error: any) {
    console.error('❌ Watch stop failed:', error);
    return res.status(500).json({ 
      error: error.message,
      success: false,
    });
  }
}

