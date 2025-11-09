import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase-server';

/**
 * API endpoint to save push notification subscription
 * POST /api/push/subscribe
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

    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    // Save subscription to database
    const { data, error } = await supabase
      .from('fb_push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        expiration_time: subscription.expirationTime,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,endpoint'
      })
      .select()
      .single();

    if (error) {
      console.error('[Push Subscribe] Database error:', error);
      return res.status(500).json({ error: 'Failed to save subscription' });
    }

    console.log('[Push Subscribe] Subscription saved:', data.id);
    return res.status(200).json({ 
      success: true, 
      subscriptionId: data.id 
    });

  } catch (error) {
    console.error('[Push Subscribe] Error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

