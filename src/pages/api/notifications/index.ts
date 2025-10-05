// Notifications API - List notifications

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { NotificationManager } from '@/lib/notifications';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      read, 
      type, 
      limit = '20', 
      offset = '0' 
    } = req.query;

    const notificationManager = new NotificationManager();
    
    const filters = {
      read: read === 'true' ? true : read === 'false' ? false : undefined,
      type: type as any,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    const result = await notificationManager.getNotifications(user.id, filters);

    return res.status(200).json({
      notifications: result.notifications,
      total: result.total,
      limit: filters.limit,
      offset: filters.offset,
    });
  } catch (error: any) {
    console.error('Failed to fetch notifications:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch notifications',
      details: error.message 
    });
  }
});

