import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

const threeMonthsAgo = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString();
};

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method === 'GET') {
    // List unread notifications within the 3-month window
    const { data, error } = await (supabaseAdmin as any)
      .from('fb_notifications')
      .select('id, type, title, message, transaction_id, action_url, read, created_at')
      .eq('user_id', user.id)
      .gte('created_at', threeMonthsAgo())
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[GET /api/notifications] error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }

    return res.status(200).json({ notifications: data ?? [] });
  }

  if (req.method === 'DELETE') {
    const { transaction_id } = req.query;

    let query = (supabaseAdmin as any)
      .from('fb_notifications')
      .delete()
      .eq('user_id', user.id);

    if (transaction_id && typeof transaction_id === 'string') {
      query = query.eq('transaction_id', transaction_id);
    }

    const { error } = await query;

    if (error) {
      console.error('[DELETE /api/notifications] error:', error.message);
      return res.status(500).json({ error: 'Failed to delete notifications' });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
