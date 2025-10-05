// Notifications API - Mark notification as read

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { NotificationManager } from '@/lib/notifications';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    const notificationManager = new NotificationManager();
    await notificationManager.markAsRead(id, user.id);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Failed to mark notification as read:', error);
    return res.status(500).json({ 
      error: 'Failed to mark notification as read',
      details: error.message 
    });
  }
});

