// Notifications API - Get unread count

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { NotificationManager } from '@/lib/notifications';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const notificationManager = new NotificationManager();
    const count = await notificationManager.getUnreadCount(user.id);

    return res.status(200).json({ count });
  } catch (error: any) {
    console.error('Failed to get unread count:', error);
    return res.status(500).json({ 
      error: 'Failed to get unread count',
      details: error.message 
    });
  }
});

