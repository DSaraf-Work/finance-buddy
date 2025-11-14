/**
 * Push Unsubscribe Endpoint
 * 
 * Removes a push notification subscription for the authenticated user.
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
      const { endpoint } = req.body;

      if (!endpoint) {
        return res.status(400).json({ error: 'Endpoint required' });
      }

      await PushManager.removeSubscription(endpoint);

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Failed to unsubscribe:', error);
      return res.status(500).json({ error: error.message });
    }
  }
);

