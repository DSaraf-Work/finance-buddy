/**
 * Send Test Push Notification Endpoint
 * 
 * Sends a test push notification to the authenticated user.
 * Requires authentication via withAuth middleware.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { PushManager } from '@/lib/push/push-manager';

export default withAuth(
  async (req: NextApiRequest, res: NextApiResponse, user) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      // Send test notification
      const result = await PushManager.sendToUser(user.id, {
        title: '🎉 Test Notification',
        body: 'This is a test push notification from Finance Buddy!',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        data: {
          url: '/transactions',
          timestamp: new Date().toISOString(),
        },
        actions: [
          {
            action: 'view',
            title: 'View Transactions',
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
          },
        ],
      });

      if (result.successCount === 0) {
        return res.status(404).json({ 
          error: 'No active push subscriptions found. Please enable push notifications first.',
          result,
        });
      }

      return res.status(200).json({ 
        success: true,
        message: `Test notification sent to ${result.successCount} device(s)`,
        result,
      });
    } catch (error: any) {
      console.error('Failed to send test notification:', error);
      return res.status(500).json({ error: error.message });
    }
  }
);

