import { NextApiRequest, NextApiResponse } from 'next';
import { WatchManager } from '@/lib/gmail-watch/watch-manager';
import { supabaseAdmin } from '@/lib/supabase';
import type { Database } from '@/types/database';

type WatchSubscription = Database['public']['Tables']['fb_gmail_watch_subscriptions']['Row'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret
  const cronSecret = req.headers['authorization'];
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🔄 Watch renewal cron started');

  try {
    const watchManager = new WatchManager();

    // Find watches expiring in next 24 hours
    const expiringDate = new Date();
    expiringDate.setHours(expiringDate.getHours() + 24);

    const { data: expiring } = await supabaseAdmin
      .from('fb_gmail_watch_subscriptions')
      .select('*')
      .eq('status', 'active')
      .lt('expiration', expiringDate.toISOString());

    console.log(`📋 Found ${expiring?.length || 0} watches to renew`);

    const results: Array<{subscription_id: string; success: boolean; error?: string}> = [];
    for (const subscription of (expiring || []) as WatchSubscription[]) {
      const result = await watchManager.renewWatch(subscription.id);
      results.push({
        subscription_id: subscription.id,
        success: result.success,
        error: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      renewed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    });
  } catch (error: any) {
    console.error('❌ Watch renewal cron failed:', error);
    return res.status(500).json({ error: error.message });
  }
}

