// Notifications API - Delete notification

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { NotificationManager } from '@/lib/notifications';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    const notificationManager = new NotificationManager();
    await notificationManager.delete(id, user.id);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete notification:', error);
    return res.status(500).json({ 
      error: 'Failed to delete notification',
      details: error.message 
    });
  }
});

