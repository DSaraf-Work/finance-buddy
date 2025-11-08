import { google } from 'googleapis';
import { supabaseAdmin } from '../supabase';
import { createGmailClient, refreshAccessToken } from '../gmail';
import { performanceMonitor } from './performance-monitor';
import { errorHandler } from './error-handler';
import type { Database } from '@/types/database';

type GmailConnection = Database['public']['Tables']['fb_gmail_connections']['Row'];

export interface WatchSetupResult {
  success: boolean;
  historyId?: string;
  expiration?: Date;
  error?: string;
}

export interface WatchRenewalResult {
  success: boolean;
  newExpiration?: Date;
  error?: string;
}

export class WatchManager {
  private readonly TOPIC_NAME: string;
  
  constructor() {
    // Format: projects/{PROJECT_ID}/topics/{TOPIC_NAME}
    const projectId = process.env.GCP_PROJECT_ID;
    if (!projectId) {
      console.warn('⚠️ GCP_PROJECT_ID not set, watch functionality will not work');
    }
    this.TOPIC_NAME = `projects/${projectId}/topics/gmail-notifications`;
  }

  /**
   * Set up Gmail watch for a connection
   */
  async setupWatch(connectionId: string): Promise<WatchSetupResult> {
    return await performanceMonitor.trackOperation(
      'watch-setup',
      async () => this.setupWatchInternal(connectionId),
      { connectionId }
    );
  }

  /**
   * Internal watch setup implementation
   */
  private async setupWatchInternal(connectionId: string): Promise<WatchSetupResult> {
    try {
      console.log(`🔔 Setting up watch for connection ${connectionId}`);

      // Step 1: Get connection details
      const { data: connectionData, error: connError } = await supabaseAdmin
        .from('fb_gmail_connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (connError || !connectionData) {
        throw new Error(`Connection not found: ${connError?.message || 'Unknown error'}`);
      }

      const connection = connectionData as GmailConnection;

      // Step 2: Refresh access token if needed
      let accessToken = connection.access_token;
      if (new Date(connection.token_expiry) <= new Date()) {
        console.log('🔄 Refreshing access token...');
        const tokens = await refreshAccessToken(connection.refresh_token);
        accessToken = tokens.access_token;
        
        // Update token in database
        const tokenExpiry = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();
        const { error: updateError } = await supabaseAdmin
          .from('fb_gmail_connections')
          // @ts-ignore - Supabase type inference issue with update
          .update({
            access_token: tokens.access_token,
            token_expiry: tokenExpiry,
          })
          .eq('id', connectionId);

        if (updateError) {
          console.error('Failed to update token:', updateError);
        }
      }

      // Step 3: Call Gmail API users.watch
      const gmail = createGmailClient(accessToken);
      const watchResponse = await gmail.users.watch({
        userId: 'me',
        requestBody: {
          topicName: this.TOPIC_NAME,
          labelIds: ['INBOX'], // Only watch INBOX
        },
      });

      const historyId = watchResponse.data.historyId!;
      const expiration = new Date(parseInt(watchResponse.data.expiration!));

      console.log('✅ Watch setup successful:', {
        historyId,
        expiration: expiration.toISOString(),
      });

      // Step 4: Store watch subscription in database
      await supabaseAdmin
        .from('fb_gmail_watch_subscriptions')
        // @ts-ignore - Supabase type inference issue with upsert
        .upsert({
          user_id: connection.user_id,
          connection_id: connectionId,
          history_id: historyId,
          expiration: expiration.toISOString(),
          status: 'active',
          last_renewed_at: new Date().toISOString(),
          renewal_attempts: 0,
        });

      // Step 5: Update connection
      await supabaseAdmin
        .from('fb_gmail_connections')
        // @ts-ignore - Supabase type inference issue with update
        .update({
          watch_enabled: true,
          watch_setup_at: new Date().toISOString(),
          last_history_id: historyId,
          last_watch_error: null,
        })
        .eq('id', connectionId);

      return {
        success: true,
        historyId,
        expiration,
      };
    } catch (error: any) {
      console.error('❌ Watch setup failed:', error);
      
      // Update error in database
      await supabaseAdmin
        .from('fb_gmail_connections')
        // @ts-ignore - Supabase type inference issue with update
        .update({
          last_watch_error: error.message,
        })
        .eq('id', connectionId);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Renew an existing watch subscription
   */
  async renewWatch(subscriptionId: string): Promise<WatchRenewalResult> {
    try {
      console.log(`🔄 Renewing watch subscription ${subscriptionId}`);

      // Step 1: Get subscription details
      const { data: subscriptionData, error: subError } = await supabaseAdmin
        .from('fb_gmail_watch_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (subError || !subscriptionData) {
        throw new Error('Subscription not found');
      }

      const subscription = subscriptionData as Database['public']['Tables']['fb_gmail_watch_subscriptions']['Row'];

      // Step 2: Update status to 'renewing'
      await supabaseAdmin
        .from('fb_gmail_watch_subscriptions')
        // @ts-ignore - Supabase type inference issue with update
        .update({ status: 'renewing' })
        .eq('id', subscriptionId);

      // Step 3: Setup new watch (Gmail doesn't have explicit renewal)
      const result = await this.setupWatch(subscription.connection_id);

      if (!result.success) {
        // Mark as failed
        await supabaseAdmin
          .from('fb_gmail_watch_subscriptions')
          // @ts-ignore - Supabase type inference issue with update
          .update({
            status: 'failed',
            last_error: result.error,
            renewal_attempts: subscription.renewal_attempts + 1,
          })
          .eq('id', subscriptionId);

        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
        newExpiration: result.expiration,
      };
    } catch (error: any) {
      console.error('❌ Watch renewal failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Stop watch for a connection
   */
  async stopWatch(connectionId: string): Promise<void> {
    try {
      console.log(`🛑 Stopping watch for connection ${connectionId}`);

      // Step 1: Get connection
      const { data: connectionData } = await supabaseAdmin
        .from('fb_gmail_connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (!connectionData) {
        throw new Error('Connection not found');
      }

      const connection = connectionData as GmailConnection;

      // Step 2: Call Gmail API users.stop
      const gmail = createGmailClient(connection.access_token);
      await gmail.users.stop({ userId: 'me' });

      // Step 3: Update database
      await supabaseAdmin
        .from('fb_gmail_watch_subscriptions')
        // @ts-ignore - Supabase type inference issue with update
        .update({ status: 'expired' })
        .eq('connection_id', connectionId);

      await supabaseAdmin
        .from('fb_gmail_connections')
        // @ts-ignore - Supabase type inference issue with update
        .update({
          watch_enabled: false,
          last_watch_error: null,
        })
        .eq('id', connectionId);

      console.log('✅ Watch stopped successfully');
    } catch (error: any) {
      console.error('❌ Failed to stop watch:', error);
      throw error;
    }
  }

  /**
   * Get watch status for a connection
   */
  async getWatchStatus(connectionId: string): Promise<any> {
    const { data: subscription } = await supabaseAdmin
      .from('fb_gmail_watch_subscriptions')
      .select('*')
      .eq('connection_id', connectionId)
      .single();

    return subscription;
  }

  /**
   * Find watches expiring soon (within 24 hours)
   */
  async findExpiringSoon(): Promise<any[]> {
    const expiringDate = new Date();
    expiringDate.setHours(expiringDate.getHours() + 24);

    const { data: expiring } = await supabaseAdmin
      .from('fb_gmail_watch_subscriptions')
      .select('*')
      .eq('status', 'active')
      .lt('expiration', expiringDate.toISOString());

    return expiring || [];
  }
}

