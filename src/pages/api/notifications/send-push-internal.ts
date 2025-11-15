/**
 * Send Push Notification (Internal API)
 * 
 * This endpoint is called internally from server-side code to send push notifications.
 * It requires PUSH_INTERNAL_SECRET for authentication.
 * 
 * Can be called:
 * 1. From database triggers (via HTTP request if pg_net is enabled)
 * 2. From other API routes
 * 3. From Edge Functions
 * 4. From cron jobs
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { PushManager } from '@/lib/push/push-manager';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify internal request
    const authHeader = req.headers.authorization;
    const internalSecret = process.env.PUSH_INTERNAL_SECRET;

    if (!internalSecret) {
      console.error('[send-push-internal] ❌ PUSH_INTERNAL_SECRET not configured');
      return res.status(500).json({ error: 'Internal secret not configured' });
    }

    // Verify the secret
    const token = authHeader?.replace('Bearer ', '');
    if (token !== internalSecret) {
      console.error('[send-push-internal] ❌ Unauthorized request');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { notificationId, userId, title, subtitle, body, url } = req.body;

    // Support two modes:
    // 1. Pass notificationId - fetch from database
    // 2. Pass all fields directly - use provided data
    
    let notification;
    
    if (notificationId) {
      console.log('[send-push-internal] Fetching notification from database:', notificationId);
      // @ts-ignore - fb_notifications table exists but not in types yet
      const { data, error } = await (supabaseAdmin as any)
        .from('fb_notifications')
        .select('*')
        .eq('id', notificationId)
        .single();

      if (error || !data) {
        console.error('[send-push-internal] ❌ Failed to fetch notification:', error);
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      notification = data;
    } else if (userId && title) {
      // Use provided data directly
      notification = {
        user_id: userId,
        title,
        subtitle,
        body,
        url,
        id: 'direct-call',
      };
    } else {
      return res.status(400).json({ 
        error: 'Either notificationId or (userId + title) required' 
      });
    }

    console.log('[send-push-internal] 📢 Sending push notification:', {
      userId: notification.user_id,
      title: notification.title,
      notificationId: notification.id,
    });

    // Send push notification to user
    const payload = {
      title: notification.title,
      body: notification.subtitle || notification.body || '',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: {
        url: notification.url || '/',
        notificationId: notification.id,
      },
    };

    const result = await PushManager.sendToUser(notification.user_id, payload);

    console.log('[send-push-internal] ✅ Push notification sent:', {
      notificationId: notification.id,
      userId: notification.user_id,
      successCount: result.successCount,
      failureCount: result.failureCount,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[send-push-internal] ❌ Failed to send push notification:', error);
    return res.status(500).json({ error: error.message });
  }
}

