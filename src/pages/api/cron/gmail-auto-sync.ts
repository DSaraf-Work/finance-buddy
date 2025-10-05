// Cron Endpoint - Gmail Auto-Sync
// Runs every 15 minutes to sync emails and process with AI

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { SyncExecutor } from '@/lib/gmail-auto-sync/sync-executor';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret (for security)
  const cronSecret = req.headers['authorization'];
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;
  
  if (cronSecret !== expectedSecret) {
    console.error('❌ Unauthorized cron request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🕐 Auto-sync cron job started:', new Date().toISOString());

  try {
    // Find all connections with auto-sync enabled
    const { data: connections, error: connError } = await supabaseAdmin
      .from('fb_gmail_connections')
      .select('*')
      .eq('auto_sync_enabled', true);

    if (connError) {
      throw connError;
    }

    if (!connections || connections.length === 0) {
      console.log('ℹ️ No connections with auto-sync enabled');
      return res.status(200).json({ 
        success: true,
        message: 'No connections to sync' 
      });
    }

    console.log(`📧 Found ${connections.length} connections with auto-sync enabled`);

    const syncExecutor = new SyncExecutor();
    const results = [];

    // Process each connection
    for (const connection of connections) {
      try {
        // Check if sync is due
        const lastSync = connection.last_auto_sync_at 
          ? new Date(connection.last_auto_sync_at)
          : new Date(0);
        const now = new Date();
        const minutesSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60);

        if (minutesSinceLastSync < connection.auto_sync_interval_minutes) {
          console.log(`⏭️ Skipping connection ${connection.id} (synced ${minutesSinceLastSync.toFixed(1)} minutes ago)`);
          continue;
        }

        console.log(`🔄 Syncing connection ${connection.id} (${connection.email_address})...`);

        // Execute sync
        const result = await syncExecutor.executeAutoSync(connection);

        results.push({
          connection_id: connection.id,
          email_address: connection.email_address,
          success: result.success,
          emails_found: result.emails_found,
          emails_synced: result.emails_synced,
          transactions_processed: result.transactions_processed,
          notifications_created: result.notifications_created,
          errors: result.errors,
        });

        // Update last sync time
        await supabaseAdmin
          .from('fb_gmail_connections')
          .update({
            last_auto_sync_at: new Date().toISOString(),
          })
          .eq('id', connection.id);

        console.log(`✅ Sync completed for ${connection.email_address}:`, {
          emails_synced: result.emails_synced,
          transactions: result.transactions_processed,
          notifications: result.notifications_created,
        });

      } catch (error: any) {
        console.error(`❌ Failed to sync connection ${connection.id}:`, error);
        results.push({
          connection_id: connection.id,
          email_address: connection.email_address,
          success: false,
          error: error.message,
        });
      }
    }

    console.log('✅ Auto-sync cron job completed:', {
      total_connections: connections.length,
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    });

    return res.status(200).json({ 
      success: true,
      results 
    });

  } catch (error: any) {
    console.error('❌ Auto-sync cron job failed:', error);
    return res.status(500).json({ 
      error: 'Auto-sync failed',
      details: error.message 
    });
  }
}

