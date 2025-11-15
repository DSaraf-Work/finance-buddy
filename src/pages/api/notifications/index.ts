import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  const userId = user.id;

  try {
    if (req.method === 'GET') {
      // Get query parameters
      const { limit = '50', unread_only = 'false' } = req.query;

      // Build query - use supabaseAdmin with type casting
      // @ts-ignore - fb_notifications table exists but not in types yet
      let query = (supabaseAdmin as any)
        .from('fb_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(parseInt(limit as string));

      // Filter by unread if requested
      if (unread_only === 'true') {
        query = query.eq('read', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ error: 'Failed to fetch notifications' });
      }

      return res.status(200).json(data);
    } else if (req.method === 'POST') {
      // Mark all notifications as read - use supabaseAdmin with type casting
      // @ts-ignore - fb_notifications table exists but not in types yet
      const { error } = await (supabaseAdmin as any)
        .from('fb_notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error marking notifications as read:', error);
        return res.status(500).json({ error: 'Failed to mark notifications as read' });
      }

      return res.status(200).json({ success: true });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

