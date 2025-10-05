// Notifications API - Mark all as read

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { NotificationManager } from '@/lib/notifications';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const notificationManager = new NotificationManager();
    await notificationManager.markAllAsRead(user.id);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Failed to mark all notifications as read:', error);
    return res.status(500).json({ 
      error: 'Failed to mark all notifications as read',
      details: error.message 
    });
  }
});

