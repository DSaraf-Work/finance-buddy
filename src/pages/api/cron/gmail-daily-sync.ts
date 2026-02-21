// Cron Endpoint - Gmail Daily Sync
// Runs once per day and syncs emails from the last 12 hours for ALL connected
// Gmail accounts, filtered to whitelisted senders only.

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { SyncExecutor } from '@/lib/gmail-auto-sync/sync-executor';
import {
  TABLE_GMAIL_CONNECTIONS,
  TABLE_CONFIG,
} from '@/lib/constants/database';

const CONFIG_KEY = 'WHITELISTED_SENDERS';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret
  const cronSecret = req.headers['authorization'];
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

  if (cronSecret !== expectedSecret) {
    console.error('❌ Unauthorized cron request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🕐 Daily Gmail sync cron started:', new Date().toISOString());

  try {
    // Step 1: Fetch whitelisted senders
    const { data: configData, error: configError } = await (supabaseAdmin as any)
      .from(TABLE_CONFIG)
      .select('config_value')
      .eq('config_key', CONFIG_KEY)
      .single();

    if (configError && configError.code !== 'PGRST116') {
      throw configError;
    }

    const whitelistedSenders: string[] = (configData as any)?.config_value || [];

    if (whitelistedSenders.length === 0) {
      console.log('ℹ️ No whitelisted senders configured — nothing to sync');
      return res.status(200).json({
        success: true,
        message: 'No whitelisted senders configured',
      });
    }

    console.log(`📋 Whitelisted senders (${whitelistedSenders.length}):`, whitelistedSenders);

    // Step 2: Fetch ALL active Gmail connections (across all users)
    const { data: connections, error: connError } = await (supabaseAdmin as any)
      .from(TABLE_GMAIL_CONNECTIONS)
      .select('*');

    if (connError) {
      throw connError;
    }

    if (!connections || connections.length === 0) {
      console.log('ℹ️ No Gmail connections found');
      return res.status(200).json({
        success: true,
        message: 'No Gmail connections found',
      });
    }

    console.log(`📧 Found ${connections.length} Gmail connection(s) to sync`);

    const syncExecutor = new SyncExecutor();
    const results = [];

    // Step 3: Sync each connection
    for (const connection of connections as any[]) {
      try {
        console.log(`🔄 Daily-syncing connection ${connection.id} (${connection.email_address})...`);

        const result = await syncExecutor.executeDailySync(connection, whitelistedSenders);

        results.push({
          connection_id: connection.id,
          email_address: connection.email_address,
          success: result.success,
          emails_found: result.emails_found,
          emails_synced: result.emails_synced,
          transactions_processed: result.transactions_processed,
          errors: result.errors,
        });

        console.log(`✅ Daily sync completed for ${connection.email_address}:`, {
          emails_synced: result.emails_synced,
          transactions: result.transactions_processed,
        });

      } catch (error: any) {
        console.error(`❌ Daily sync failed for connection ${connection.id}:`, error);
        results.push({
          connection_id: connection.id,
          email_address: connection.email_address,
          success: false,
          error: error.message,
        });
      }
    }

    console.log('✅ Daily Gmail sync cron completed:', {
      total_connections: connections.length,
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    });

    return res.status(200).json({
      success: true,
      results,
    });

  } catch (error: any) {
    console.error('❌ Daily Gmail sync cron failed:', error);
    return res.status(500).json({
      error: 'Daily sync failed',
      details: error.message,
    });
  }
}
