/**
 * Push Subscription Endpoint
 * 
 * Saves a push notification subscription for the authenticated user.
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
      const subscription = req.body;

      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Invalid subscription' });
      }

      await PushManager.saveSubscription(user.id, subscription);

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Failed to save subscription:', error);
      return res.status(500).json({ error: error.message });
    }
  }
);

