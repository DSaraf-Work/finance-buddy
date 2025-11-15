/**
 * Push Notification Helper
 * 
 * Helper functions to send push notifications from server-side code.
 * Can be called from:
 * - API routes
 * - Database triggers (via HTTP)
 * - Edge Functions
 * - Cron jobs
 */

import { PushManager } from '@/lib/push/push-manager';

/**
 * Send push notification for a notification ID
 * This is the main function to call from server-side code
 */
export async function sendPushForNotification(notificationId: string): Promise<void> {
  try {
    console.log('[sendPushForNotification] 📢 Sending push for notification:', notificationId);
    
    const internalSecret = process.env.PUSH_INTERNAL_SECRET;
    
    if (!internalSecret) {
      console.error('[sendPushForNotification] ❌ PUSH_INTERNAL_SECRET not configured');
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/notifications/send-push-internal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${internalSecret}`,
      },
      body: JSON.stringify({ notificationId }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[sendPushForNotification] ❌ Failed to send push:', error);
    } else {
      const result = await response.json();
      console.log('[sendPushForNotification] ✅ Push sent:', result);
    }
  } catch (error) {
    console.error('[sendPushForNotification] ❌ Error sending push:', error);
  }
}

/**
 * Send push notification directly with data
 * Useful when you don't have a notification ID yet
 */
export async function sendPushDirect(
  userId: string,
  title: string,
  options: {
    subtitle?: string;
    body?: string;
    url?: string;
  } = {}
): Promise<void> {
  try {
    console.log('[sendPushDirect] 📢 Sending push to user:', userId);
    
    const payload = {
      title,
      body: options.subtitle || options.body || '',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: {
        url: options.url || '/',
      },
    };

    const result = await PushManager.sendToUser(userId, payload);
    
    console.log('[sendPushDirect] ✅ Push sent:', {
      userId,
      successCount: result.successCount,
      failureCount: result.failureCount,
    });
  } catch (error) {
    console.error('[sendPushDirect] ❌ Error sending push:', error);
  }
}

/**
 * Send push notification in background (fire and forget)
 * This doesn't wait for the response, useful for triggers
 */
export function sendPushInBackground(notificationId: string): void {
  // Don't await - fire and forget
  sendPushForNotification(notificationId).catch((error) => {
    console.error('[sendPushInBackground] ❌ Error:', error);
  });
}

