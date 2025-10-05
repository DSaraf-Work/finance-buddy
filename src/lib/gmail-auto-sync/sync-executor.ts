// Gmail Auto-Sync Executor - Fetches emails and processes with AI

import { supabaseAdmin } from '../supabase';
import { listMessages, refreshAccessToken } from '../gmail';
import { EmailProcessor } from '../email-processing/processor';
import { NotificationManager } from '../notifications/notification-manager';
import { NotificationBuilder } from '../notifications/notification-builder';
import { SyncResult, GmailConnection } from './types';

export class SyncExecutor {
  private emailProcessor = new EmailProcessor();
  private notificationManager = new NotificationManager();

  /**
   * Execute auto-sync for a connection
   */
  async executeAutoSync(connection: GmailConnection): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      emails_found: 0,
      emails_synced: 0,
      transactions_processed: 0,
      notifications_created: 0,
      errors: [],
    };

    try {
      console.log(`🔄 Starting auto-sync for connection ${connection.id}`);

      // Step 1: Refresh token if needed
      let accessToken = connection.access_token;
      if (new Date(connection.token_expiry) <= new Date()) {
        console.log('🔑 Refreshing access token...');
        const newTokens = await refreshAccessToken(connection.refresh_token);
        accessToken = newTokens.access_token!;
        
        // Update token in database
        await (supabaseAdmin as any)
          .from('fb_gmail_connections')
          .update({
            access_token: accessToken,
            token_expiry: new Date(Date.now() + 3600000).toISOString(),
          })
          .eq('id', connection.id);
      }

      // Step 2: Calculate sync window
      const syncFrom = await this.calculateSyncWindow(connection.user_id);
      console.log(`📅 Sync window: from ${syncFrom.toISOString()}`);

      // Step 3: Build Gmail query with time filter
      const timeQuery = `after:${Math.floor(syncFrom.getTime() / 1000)}`;
      const fullQuery = timeQuery; // Can be extended with filters later

      // Step 4: Fetch messages from Gmail
      console.log(`📧 Fetching emails with query: ${fullQuery}`);
      const gmailResponse = await listMessages(accessToken, {
        q: fullQuery,
        maxResults: 50, // Limit to prevent timeout
      });

      const messageIds = gmailResponse.messages?.map(m => m.id) || [];
      result.emails_found = messageIds.length;

      if (messageIds.length === 0) {
        console.log('✅ No new emails to sync');
        result.success = true;
        return result;
      }

      console.log(`📬 Found ${messageIds.length} emails`);

      // Step 5: Check which messages already exist
      const { data: existingEmails } = await (supabaseAdmin as any)
        .from('fb_emails')
        .select('message_id')
        .eq('user_id', connection.user_id)
        .eq('google_user_id', connection.google_user_id)
        .in('message_id', messageIds);

      const existingIds = new Set(existingEmails?.map((e: any) => e.message_id) || []);
      const newMessageIds = messageIds.filter(id => !existingIds.has(id));

      console.log(`🆕 ${newMessageIds.length} new emails to sync`);

      if (newMessageIds.length === 0) {
        result.success = true;
        return result;
      }

      // Step 6: Fetch and store new messages (using existing manual-sync logic)
      // We'll call the existing manual-sync endpoint internally
      const syncResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/gmail/manual-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connection_id: connection.id,
          user_id: connection.user_id,
          message_ids: newMessageIds,
        }),
      });

      if (!syncResponse.ok) {
        throw new Error('Failed to sync emails via manual-sync endpoint');
      }

      const syncData = await syncResponse.json();
      result.emails_synced = syncData.synced || newMessageIds.length;

      // Step 7: Process emails with AI immediately
      console.log(`🤖 Processing ${result.emails_synced} emails with AI...`);
      const processedTransactions = await this.processNewEmails(
        newMessageIds,
        connection.user_id
      );

      result.transactions_processed = processedTransactions.length;
      console.log(`✅ Processed ${result.transactions_processed} transactions`);

      // Step 8: Create notifications for processed transactions
      console.log(`🔔 Creating notifications...`);
      const notificationCount = await this.createNotificationsForTransactions(
        processedTransactions,
        connection.user_id
      );

      result.notifications_created = notificationCount;
      console.log(`✅ Created ${notificationCount} notifications`);

      result.success = true;
      return result;

    } catch (error: any) {
      console.error(`❌ Auto-sync failed for connection ${connection.id}:`, error);
      result.errors.push(error.message);
      
      // Create error notification if sync fails
      try {
        await this.notificationManager.create(
          NotificationBuilder.forSyncError(
            connection.user_id,
            connection.id,
            error.message
          )
        );
      } catch (notifError) {
        console.error('Failed to create error notification:', notifError);
      }

      return result;
    }
  }

  /**
   * Calculate sync window from last processed email
   */
  private async calculateSyncWindow(userId: string): Promise<Date> {
    // Get the most recent processed email
    const { data: lastProcessedEmail } = await (supabaseAdmin as any)
      .from('fb_emails')
      .select('internal_date')
      .eq('user_id', userId)
      .eq('status', 'Processed')
      .order('internal_date', { ascending: false })
      .limit(1)
      .single();

    if (lastProcessedEmail && (lastProcessedEmail as any).internal_date) {
      // Subtract 10 minutes for safety buffer
      const lastDate = new Date((lastProcessedEmail as any).internal_date);
      return new Date(lastDate.getTime() - 10 * 60 * 1000);
    }

    // If no processed emails, sync from last 7 days
    return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }

  /**
   * Process newly synced emails with AI
   */
  private async processNewEmails(
    emailIds: string[],
    userId: string
  ): Promise<any[]> {
    const processedTransactions: any[] = [];

    // Get email row IDs from message IDs
    const { data: emails } = await supabaseAdmin
      .from('fb_emails')
      .select('id, message_id')
      .eq('user_id', userId)
      .in('message_id', emailIds);

    if (!emails || emails.length === 0) {
      return processedTransactions;
    }

    for (const email of emails) {
      try {
        // Process email with AI
        const result = await this.emailProcessor.processEmails({
          emailId: (email as any).id,
          userId: userId,
          batchSize: 1,
        });

        if (result.success && result.successCount > 0) {
          // Fetch the created transaction
          const { data: transaction } = await (supabaseAdmin as any)
            .from('fb_extracted_transactions')
            .select('*')
            .eq('email_row_id', (email as any).id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (transaction) {
            processedTransactions.push(transaction);
          }
        }
      } catch (error: any) {
        console.error(`Failed to process email ${(email as any).id}:`, error);
      }
    }

    return processedTransactions;
  }

  /**
   * Create notifications for processed transactions
   */
  private async createNotificationsForTransactions(
    transactions: any[],
    userId: string
  ): Promise<number> {
    let notificationCount = 0;

    for (const transaction of transactions) {
      try {
        // Fetch related email
        const { data: email } = await supabaseAdmin
          .from('fb_emails')
          .select('*')
          .eq('id', transaction.email_row_id)
          .single();

        if (email) {
          // Build and create notification
          const notificationParams = NotificationBuilder.forTransaction(
            userId,
            transaction,
            email
          );

          await this.notificationManager.create(notificationParams);
          notificationCount++;
        }
      } catch (error: any) {
        console.error(`Failed to create notification for transaction ${transaction.id}:`, error);
      }
    }

    return notificationCount;
  }
}

