import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase-server';
import webpush from 'web-push';

/**
 * API endpoint to send push notifications
 * POST /api/push/send
 * 
 * Body:
 * {
 *   userId?: string,  // Optional: send to specific user, otherwise send to current user
 *   title: string,
 *   body: string,
 *   icon?: string,
 *   badge?: string,
 *   tag?: string,
 *   url?: string,
 *   data?: any
 * }
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

    const { userId, title, body, icon, badge, tag, url, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    // Configure VAPID details
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:dsaraf.adob@gmail.com';

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('[Push Send] VAPID keys not configured');
      return res.status(500).json({ error: 'Push notifications not configured' });
    }

    webpush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );

    // Get subscriptions for the target user
    const targetUserId = userId || user.id;
    const { data: subscriptions, error: subError } = await supabase
      .from('fb_push_subscriptions')
      .select('*')
      .eq('user_id', targetUserId);

    if (subError) {
      console.error('[Push Send] Failed to fetch subscriptions:', subError);
      return res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ error: 'No subscriptions found for user' });
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/icons/icon-192x192.png',
      badge: badge || '/icons/icon-96x96.png',
      tag: tag || 'finance-buddy-notification',
      data: {
        ...data,
        url: url || '/',
        timestamp: Date.now()
      }
    });

    // Send push notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: sub.keys
          };

          await webpush.sendNotification(pushSubscription, payload);
          return { success: true, endpoint: sub.endpoint };
        } catch (error: any) {
          console.error('[Push Send] Failed to send to endpoint:', sub.endpoint, error);
          
          // If subscription is invalid (410 Gone), delete it
          if (error.statusCode === 410) {
            await supabase
              .from('fb_push_subscriptions')
              .delete()
              .eq('id', sub.id);
            console.log('[Push Send] Deleted invalid subscription:', sub.id);
          }
          
          return { success: false, endpoint: sub.endpoint, error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(`[Push Send] Sent ${successful}/${results.length} notifications`);

    return res.status(200).json({
      success: true,
      sent: successful,
      failed,
      total: results.length
    });

  } catch (error) {
    console.error('[Push Send] Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

