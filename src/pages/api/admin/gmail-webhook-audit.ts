import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth/middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const user = await requireAuth(req, res);
    if (!user) {
      return; // 401 already sent by requireAuth
    }

    const limit = parseInt(req.query.limit as string) || 100;
    const status = req.query.status as string;
    const email = req.query.email as string;

    // Build query
    let query = supabaseAdmin
      .from('fb_gmail_webhook_audit')
      .select('*')
      .eq('user_id', user.id)
      .order('received_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (email) {
      query = query.eq('email_address', email);
    }

    const { data: auditLogs, error } = await query;

    if (error) {
      console.error('Error fetching webhook audit logs:', error);
      return res.status(500).json({ error: 'Failed to fetch audit logs' });
    }

    // Get summary stats
    // @ts-ignore - Supabase type inference issue with new table
    const { data: stats } = await supabaseAdmin
      .from('fb_gmail_webhook_audit')
      .select('status, success, new_messages_count, processing_duration_ms')
      .eq('user_id', user.id);

    const summary = {
      total: stats?.length || 0,
      success: stats?.filter((s: any) => s.success).length || 0,
      failed: stats?.filter((s: any) => !s.success && s.status === 'failed').length || 0,
      processing: stats?.filter((s: any) => s.status === 'processing').length || 0,
      avgProcessingTime: stats && stats.length > 0
        ? Math.round(stats.reduce((sum: number, s: any) => sum + (s.processing_duration_ms || 0), 0) / stats.length)
        : 0,
      totalMessages: stats?.reduce((sum: number, s: any) => sum + (s.new_messages_count || 0), 0) || 0,
    };

    return res.status(200).json({
      success: true,
      logs: auditLogs || [],
      summary,
    });
  } catch (error) {
    console.error('Error in webhook audit API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

