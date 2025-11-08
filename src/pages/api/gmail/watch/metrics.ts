import { NextApiRequest, NextApiResponse } from 'next';
import { performanceMonitor } from '@/lib/gmail-watch/performance-monitor';
import { rateLimiter } from '@/lib/gmail-watch/rate-limiter';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get performance metrics
    const summary = performanceMonitor.getSummary();
    const recentErrors = performanceMonitor.getRecentErrors(5);

    // Get watch subscription stats
    const { data: subscriptions } = await supabaseAdmin
      .from('fb_gmail_watch_subscriptions')
      .select('status');

    const subscriptionStats = {
      total: subscriptions?.length || 0,
      active: subscriptions?.filter(s => (s as any).status === 'active').length || 0,
      expired: subscriptions?.filter(s => (s as any).status === 'expired').length || 0,
      failed: subscriptions?.filter(s => (s as any).status === 'failed').length || 0,
    };

    // Get webhook stats (last 24 hours)
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const { data: webhooks } = await supabaseAdmin
      .from('fb_webhook_logs')
      .select('success, new_messages')
      .gte('created_at', yesterday.toISOString());

    const webhookStats = {
      total: webhooks?.length || 0,
      successful: webhooks?.filter(w => (w as any).success).length || 0,
      failed: webhooks?.filter(w => !(w as any).success).length || 0,
      totalMessages: webhooks?.reduce((sum, w) => sum + ((w as any).new_messages || 0), 0) || 0,
    };

    // Get connection stats
    const { data: connections } = await supabaseAdmin
      .from('fb_gmail_connections')
      .select('watch_enabled');

    const connectionStats = {
      total: connections?.length || 0,
      watchEnabled: connections?.filter(c => (c as any).watch_enabled).length || 0,
      watchDisabled: connections?.filter(c => !(c as any).watch_enabled).length || 0,
    };

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      performance: summary,
      recentErrors,
      subscriptions: subscriptionStats,
      webhooks: webhookStats,
      connections: connectionStats,
    });
  } catch (error: any) {
    console.error('❌ Failed to get metrics:', error);
    return res.status(500).json({ 
      error: error.message,
      success: false,
    });
  }
}

