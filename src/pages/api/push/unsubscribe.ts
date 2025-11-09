import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase-server';

/**
 * API endpoint to remove push notification subscription
 * POST /api/push/unsubscribe
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(req, res);

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }

    // Delete subscription from database
    const { error } = await supabase
      .from('fb_push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint);

    if (error) {
      console.error('[Push Unsubscribe] Database error:', error);
      return res.status(500).json({ error: 'Failed to remove subscription' });
    }

    console.log('[Push Unsubscribe] Subscription removed for user:', user.id);
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('[Push Unsubscribe] Error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

