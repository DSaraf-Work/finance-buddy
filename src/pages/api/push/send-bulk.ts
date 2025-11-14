/**
 * Bulk Push Notification Endpoint
 * 
 * Sends push notifications to multiple users in parallel.
 * Used by cron jobs, auto-sync, and other automated processes.
 * Requires authentication via secret token.
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
    // Verify authentication
    const authHeader = req.headers.authorization;
    const internalSecret = process.env.PUSH_INTERNAL_SECRET;

    if (!internalSecret) {
      return res.status(500).json({ error: 'Internal secret not configured' });
    }

    const token = authHeader?.replace('Bearer ', '');
    if (token !== internalSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { notifications } = req.body;

    if (!notifications || !Array.isArray(notifications)) {
      return res.status(400).json({ 
        error: 'notifications array required',
        example: {
          notifications: [
            { userId: 'uuid', payload: { title: '...', body: '...' } }
          ]
        }
      });
    }

    // Send notifications in parallel
    const results = await Promise.allSettled(
      notifications.map(({ userId, payload }) => 
        PushManager.sendToUser(userId, payload)
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return res.status(200).json({
      success: true,
      total: notifications.length,
      successful,
      failed,
      results: results.map((r, i) => ({
        userId: notifications[i].userId,
        status: r.status,
        ...(r.status === 'fulfilled' ? { data: r.value } : { error: r.reason.message })
      }))
    });
  } catch (error: any) {
    console.error('Failed to send bulk push notifications:', error);
    return res.status(500).json({ error: error.message });
  }
}

