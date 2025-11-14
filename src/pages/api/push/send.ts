/**
 * Send Push Notification Endpoint
 * 
 * Sends a push notification to a specific user.
 * Can be called from:
 * 1. Server-side code (internal)
 * 2. External services (cron jobs, webhooks) with authentication
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { PushManager } from '@/lib/push/push-manager';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify request authentication for external requests
    const authHeader = req.headers.authorization;
    const internalSecret = process.env.PUSH_INTERNAL_SECRET;

    // Check if request is from external source (requires auth)
    const isExternalRequest = authHeader !== undefined;

    if (isExternalRequest) {
      // Verify external request with secret token
      if (!internalSecret) {
        return res.status(500).json({ error: 'Internal secret not configured' });
      }

      const token = authHeader?.replace('Bearer ', '');
      if (token !== internalSecret) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const { userId, payload } = req.body;

    if (!userId || !payload) {
      return res.status(400).json({ error: 'userId and payload required' });
    }

    const result = await PushManager.sendToUser(userId, payload);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Failed to send push notification:', error);
    return res.status(500).json({ error: error.message });
  }
}

