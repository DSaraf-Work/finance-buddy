import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  const userId = user.id;

  try {
    if (req.method === 'POST') {
      const { notificationId } = req.body;

      if (!notificationId) {
        return res.status(400).json({ error: 'Notification ID required' });
      }

      // Fetch notification
      const { data: notification, error } = await (supabaseAdmin as any)
        .from('fb_notifications')
        .select('*')
        .eq('id', notificationId)
        .eq('user_id', userId)
        .single();

      if (error || !notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      // Return notification data for client-side push
      return res.status(200).json({
        success: true,
        notification: {
          id: notification.id,
          title: notification.title,
          body: notification.subtitle || notification.body,
          url: notification.url,
          data: notification.metadata,
        },
      });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

