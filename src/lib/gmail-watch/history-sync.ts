import { createGmailClient, refreshAccessToken } from '../gmail';
import { supabaseAdmin } from '../supabase';
import { EmailProcessor } from '../email-processing/processor';
import { batchProcessor } from './batch-processor';
import { errorHandler } from './error-handler';
import { rateLimiter } from './rate-limiter';
import type { Database } from '@/types/database';

type GmailConnection = Database['public']['Tables']['fb_gmail_connections']['Row'];

export interface HistorySyncResult {
  success: boolean;
  newMessages: number;
  processedTransactions: number;
  newHistoryId?: string;
  error?: string;
  emailIds?: string[];
  transactionIds?: string[];
}

export class HistorySync {
  private emailProcessor = new EmailProcessor();

  /**
   * Sync emails using history.list API
   */
  async syncFromHistory(
    connectionId: string,
    startHistoryId: string
  ): Promise<HistorySyncResult> {
    try {
      console.log(`📜 Starting history sync from ${startHistoryId}`);

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

      // Step 2: Refresh token if needed
      let accessToken = connection.access_token;
      if (new Date(connection.token_expiry) <= new Date()) {
        console.log('🔄 Refreshing access token...');
        const tokens = await refreshAccessToken(connection.refresh_token);
        accessToken = tokens.access_token;
      }

      // Step 3: Call history.list API
      const gmail = createGmailClient(accessToken);
      
      let allHistory: any[] = [];
      let pageToken: string | undefined;

      try {
        do {
          const historyResponse = await gmail.users.history.list({
            userId: 'me',
            startHistoryId: startHistoryId,
            historyTypes: ['messageAdded'],
            labelId: 'INBOX',
            maxResults: 100,
            pageToken,
          });

          allHistory = allHistory.concat(historyResponse.data.history || []);
          pageToken = historyResponse.data.nextPageToken || undefined;

        } while (pageToken);
      } catch (error: any) {
        // If history is too old (404), perform full sync
        if (error.code === 404 || error.message?.includes('history')) {
          console.warn('⚠️ History gap detected, performing full sync');
          return await this.performFullSync(connectionId, connection);
        }
        throw error;
      }

      console.log(`📬 Found ${allHistory.length} history records`);

      // Step 4: Extract new message IDs
      const newMessageIds: string[] = [];
      for (const record of allHistory) {
        if (record.messagesAdded) {
          for (const added of record.messagesAdded) {
            if (added.message?.id) {
              newMessageIds.push(added.message.id);
            }
          }
        }
      }

      console.log(`🆕 ${newMessageIds.length} new messages found`);

      if (newMessageIds.length === 0) {
        // Get latest history ID
        const profileResponse = await gmail.users.getProfile({ userId: 'me' });
        const newHistoryId = profileResponse.data.historyId || undefined;

        return {
          success: true,
          newMessages: 0,
          processedTransactions: 0,
          newHistoryId,
        };
      }

      // Step 5: Check which messages already exist
      const { data: existingEmails } = await supabaseAdmin
        .from('fb_emails')
        .select('message_id')
        .eq('user_id', connection.user_id)
        .in('message_id', newMessageIds);

      const existingIds = new Set((existingEmails as any)?.map((e: any) => e.message_id) || []);
      const trulyNewIds = newMessageIds.filter(id => !existingIds.has(id));

      console.log(`✨ ${trulyNewIds.length} truly new messages`);

      if (trulyNewIds.length === 0) {
        const profileResponse = await gmail.users.getProfile({ userId: 'me' });
        const newHistoryId = profileResponse.data.historyId || undefined;

        return {
          success: true,
          newMessages: 0,
          processedTransactions: 0,
          newHistoryId,
        };
      }

      // Step 6: Fetch and store new messages
      const syncResult = await this.fetchAndStoreMessages(
        trulyNewIds,
        connection,
        accessToken
      );

      // Step 7: Get new history ID
      const profileResponse = await gmail.users.getProfile({ userId: 'me' });
      const newHistoryId = profileResponse.data.historyId || undefined;

      // Step 8: Update history ID in database
      await supabaseAdmin
        .from('fb_gmail_connections')
        // @ts-ignore - Supabase type inference issue
        .update({ last_history_id: newHistoryId })
        .eq('id', connectionId);

      await supabaseAdmin
        .from('fb_gmail_watch_subscriptions')
        // @ts-ignore - Supabase type inference issue
        .update({ history_id: newHistoryId })
        .eq('connection_id', connectionId);

      return {
        success: true,
        newMessages: trulyNewIds.length,
        processedTransactions: syncResult.processedCount,
        newHistoryId,
        emailIds: syncResult.emailIds,
        transactionIds: syncResult.transactionIds,
      };
    } catch (error: any) {
      console.error('❌ History sync failed:', error);
      return {
        success: false,
        newMessages: 0,
        processedTransactions: 0,
        error: error.message,
      };
    }
  }

  /**
   * Fetch and store messages (optimized with batch processing)
   */
  private async fetchAndStoreMessages(
    messageIds: string[],
    connection: GmailConnection,
    accessToken: string
  ): Promise<{ processedCount: number; emailIds: string[]; transactionIds: string[] }> {
    const gmail = createGmailClient(accessToken);

    console.log(`📦 Fetching ${messageIds.length} messages with batch processing...`);

    // Process messages in batches
    const results = await batchProcessor.processBatch(
      messageIds,
      async (messageId) => {
        // Wait for rate limit
        await rateLimiter.waitForLimit(`gmail-${connection.user_id}`);

        // Fetch message with retry
        return await errorHandler.withRetry(async () => {
          const messageResponse = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'full',
          });
          return messageResponse.data;
        });
      },
      {
        batchSize: 10,
        concurrency: 5,
        delayBetweenBatches: 100,
      }
    );

    // Store successful messages
    let processedCount = 0;
    const emailIds: string[] = [];
    const transactionIds: string[] = [];

    for (const { result: message, error } of results) {
      if (error || !message) {
        console.error(`❌ Failed to fetch message:`, error?.message);
        continue;
      }

      try {

        // Extract headers
        const headers = message.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

        const from = getHeader('from');
        const subject = getHeader('subject');
        const date = getHeader('date');

        // Store email
        const { data: email, error: emailError } = await supabaseAdmin
          .from('fb_emails')
          // @ts-ignore - Supabase type inference issue
          .insert({
            user_id: connection.user_id,
            google_user_id: connection.google_user_id,
            connection_id: connection.id,
            email_address: connection.email_address,
            message_id: message.id!,
            thread_id: message.threadId!,
            from_address: from,
            to_addresses: [], // Gmail API doesn't provide this in history sync
            subject: subject,
            snippet: message.snippet || '',
            internal_date: message.internalDate
              ? new Date(parseInt(message.internalDate)).toISOString()
              : new Date().toISOString(),
            plain_body: this.extractBody(message),
            status: 'Fetched',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (emailError) {
          console.error(`❌ Failed to store email ${message.id}:`, emailError);
          throw emailError;
        }

        if (email) {
          const emailId = (email as any).id;
          emailIds.push(emailId);

          // Process for transactions
          const extractedTransactionIds = await this.emailProcessor.processEmail(emailId);
          if (extractedTransactionIds && extractedTransactionIds.length > 0) {
            transactionIds.push(...extractedTransactionIds);
          }
          processedCount++;
        }
      } catch (error: any) {
        console.error(`❌ Failed to store message:`, error.message);
      }
    }

    const stats = batchProcessor.getStats(results);
    console.log(`📊 Batch stats: ${stats.successful}/${stats.total} fetched (${stats.successRate}%)`);
    console.log(`💾 Stored and processed: ${processedCount} messages`);
    console.log(`📧 Email IDs: ${emailIds.length}, Transaction IDs: ${transactionIds.length}`);

    return { processedCount, emailIds, transactionIds };
  }

  /**
   * Extract email body text
   */
  private extractBody(message: any): string {
    const parts = message.payload?.parts || [message.payload];

    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
    }

    // Fallback to snippet
    return message.snippet || '';
  }

  /**
   * Perform full sync when history gap is detected
   */
  private async performFullSync(
    connectionId: string,
    connection: GmailConnection
  ): Promise<HistorySyncResult> {
    console.log('🔄 Performing full sync due to history gap...');

    // Use SyncExecutor for full sync
    const { SyncExecutor } = await import('../gmail-auto-sync');
    const syncExecutor = new SyncExecutor();

    const result = await syncExecutor.executeAutoSync(connection as any);

    return {
      success: result.success,
      newMessages: result.emails_synced || 0,
      processedTransactions: result.transactions_processed || 0,
      newHistoryId: undefined, // Will be updated by next sync
    };
  }
}

