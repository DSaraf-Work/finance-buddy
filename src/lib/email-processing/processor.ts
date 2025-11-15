// Main Email Processing Engine

import { supabaseAdmin } from '../supabase';
import { SchemaAwareTransactionExtractor } from '../ai/extractors/transaction-schema-extractor';
import { parseHTMLToCleanText } from '../gmail';
import {
  TABLE_EMAILS_FETCHED,
  TABLE_EMAILS_PROCESSED,
  TABLE_REJECTED_EMAILS
} from '@/lib/constants/database';
import type { Database } from '@/types';

export interface EmailProcessingRequest {
  emailId?: string;
  userId?: string;
  batchSize?: number;
  forceReprocess?: boolean;
}

export interface EmailProcessingResult {
  success: boolean;
  processedCount: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    emailId: string;
    error: string;
  }>;
  processingTime: number;
}

export class EmailProcessor {
  private transactionExtractor = new SchemaAwareTransactionExtractor();

  async processEmails(request: EmailProcessingRequest = {}): Promise<EmailProcessingResult> {
    const startTime = Date.now();
    
    console.log('🚀 Starting email processing:', request);

    try {
      // Get emails to process
      const emails = await this.getEmailsToProcess(request);
      
      if (emails.length === 0) {
        console.log('ℹ️ No emails to process');
        return {
          success: true,
          processedCount: 0,
          successCount: 0,
          errorCount: 0,
          errors: [],
          processingTime: Date.now() - startTime,
        };
      }

      console.log(`📧 Found ${emails.length} emails to process`);

      const results = {
        success: true,
        processedCount: emails.length,
        successCount: 0,
        errorCount: 0,
        errors: [] as Array<{ emailId: string; error: string }>,
        processingTime: 0,
      };

      // Process emails one by one (could be parallelized with careful rate limiting)
      for (const email of emails) {
        try {
          await this.processEmail(email);
          results.successCount++;
          
          console.log(`✅ Processed email ${email.id} successfully`);
        } catch (error: any) {
          results.errorCount++;
          results.errors.push({
            emailId: email.id,
            error: error.message || 'Unknown processing error',
          });

          console.error(`❌ Failed to process email ${email.id}:`, error);

          // Reject the email instead of updating status
          await this.rejectEmail(email.id, error.message || 'Processing failed', 'processing_error', { error: error.message });
        }
      }

      results.processingTime = Date.now() - startTime;
      
      console.log('🏁 Email processing completed:', {
        processed: results.processedCount,
        successful: results.successCount,
        errors: results.errorCount,
        processingTime: results.processingTime,
      });

      return results;

    } catch (error: any) {
      console.error('❌ Email processing failed:', error);
      
      return {
        success: false,
        processedCount: 0,
        successCount: 0,
        errorCount: 1,
        errors: [{ emailId: 'unknown', error: error.message }],
        processingTime: Date.now() - startTime,
      };
    }
  }

  async processEmail(email: any): Promise<string[]> {
    console.log(`🔄 Processing email ${email.id}:`, {
      subject: email.subject,
      from: email.from_address,
      date: email.internal_date,
    });

    // Parse HTML content if needed
    let plainBody = email.plain_body || '';

    // Check if the content is HTML and parse it to clean text
    if (plainBody.includes('<') && plainBody.includes('>')) {
      console.log('📧 Detected HTML content, parsing to clean text...');
      const parsedText = parseHTMLToCleanText(plainBody);
      if (parsedText) {
        plainBody = parsedText;
        console.log('✅ HTML parsed successfully:', {
          originalLength: email.plain_body?.length || 0,
          parsedLength: plainBody.length
        });
      } else {
        console.log('⚠️ HTML parsing failed, using original content');
      }
    }

    // Prepare email content and metadata for the new schema-aware extractor
    const emailContent = plainBody;
    const emailMetadata = {
      emailId: email.id,
      subject: email.subject || '',
      fromAddress: email.from_address || '',
      snippet: email.snippet,
      internalDate: email.internal_date,
      userId: email.user_id // Pass user_id for user-specific account type classification
    };

    console.log('🧠 Using SchemaAwareTransactionExtractor for processing:', {
      emailId: email.id,
      userId: email.user_id,
      contentLength: emailContent?.length || 0,
      hasContent: !!emailContent,
      metadata: emailMetadata
    });

    // Extract transaction information using the new schema-aware extractor
    const extractedTransaction = await this.transactionExtractor.extractTransaction(emailContent, emailMetadata);

    if (!extractedTransaction) {
      throw new Error('Transaction extraction failed - no result returned');
    }

    // Save extracted transaction and get the ID
    const transactionId = await this.saveExtractedTransaction(email, extractedTransaction);

    // Email status will automatically become 'Processed' via database trigger
    console.log(`✅ Email ${email.id} processed successfully - status auto-updated to 'Processed' by trigger`);

    return transactionId ? [transactionId] : [];
  }

  private async getEmailsToProcess(request: EmailProcessingRequest): Promise<any[]> {
    let query = (supabaseAdmin as any)
      .from(TABLE_EMAILS_FETCHED)
      .select('*');

    // Filter by specific email ID
    if (request.emailId) {
      query = query.eq('id', request.emailId);
    }

    // Filter by user ID
    if (request.userId) {
      query = query.eq('user_id', request.userId);
    }

    // Filter by processing status - only process FETCHED emails (not PROCESSED or REJECTED)
    if (!request.forceReprocess) {
      query = query.eq('status', 'Fetched');
    }

    // Limit batch size
    if (request.batchSize) {
      query = query.limit(request.batchSize);
    }

    // Order by date (oldest first)
    query = query.order('internal_date', { ascending: true });

    const { data: emails, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch emails: ${error.message}`);
    }

    return emails || [];
  }

  private async saveExtractedTransaction(email: any, transaction: any): Promise<string | null> {
    // Handle both old and new transaction formats
    const transactionData: Database['public']['Tables']['fb_emails_processed']['Insert'] = {
      user_id: email.user_id,
      google_user_id: email.google_user_id,
      connection_id: email.connection_id,
      email_row_id: email.id,
      // Handle both old format (txnTime) and new format (txn_time)
      txn_time: transaction.txn_time || (transaction.txnTime ? transaction.txnTime.toISOString() : null),
      amount: transaction.amount ? transaction.amount.toString() : null,
      currency: transaction.currency || 'INR',
      direction: transaction.direction,
      merchant_name: transaction.merchant_name || transaction.merchantName,
      merchant_normalized: transaction.merchant_normalized || transaction.merchantNormalized,
      category: transaction.category,
      account_hint: transaction.account_hint || transaction.accountHint,
      reference_id: transaction.reference_id || transaction.referenceId,
      location: transaction.location,
      account_type: transaction.account_type || transaction.accountType,
      transaction_type: transaction.transaction_type || transaction.transactionType,
      ai_notes: transaction.ai_notes || transaction.aiNotes,
      confidence: transaction.confidence ? transaction.confidence.toString() : '0.5',
      extraction_version: '2.0.0', // New schema-aware version
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('💾 Saving extracted transaction:', {
      emailId: email.id,
      amount: transactionData.amount,
      merchant: transactionData.merchant_name,
      confidence: transactionData.confidence,
    });

    const { data, error } = await (supabaseAdmin as any)
      .from(TABLE_EMAILS_PROCESSED)
      .upsert(transactionData, {
        onConflict: 'email_row_id',
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save transaction: ${error.message}`);
    }

    const transactionId = data?.id || null;

    // Send push notification in background (fire and forget)
    // The database trigger will create the notification in fb_notifications
    // We need to wait a bit for the trigger to complete, then send the push
    if (transactionId) {
      this.sendPushNotificationForTransaction(transactionId).catch((error) => {
        console.error('❌ Failed to send push notification:', error);
      });
    }

    return transactionId;
  }

  /**
   * Send push notification for a newly created transaction
   * This is called after the transaction is saved and the database trigger has created the notification
   */
  private async sendPushNotificationForTransaction(transactionId: string): Promise<void> {
    let notificationId: string | null = null;

    try {
      // Wait a bit for the database trigger to create the notification
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('[sendPushNotificationForTransaction] 📢 Sending push for transaction:', transactionId);

      // Find the notification created by the trigger
      const { data: notification, error } = await (supabaseAdmin as any)
        .from('fb_notifications')
        .select('id, user_id, title, subtitle, body, url')
        .eq('metadata->>transaction_id', transactionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !notification) {
        console.error('[sendPushNotificationForTransaction] ❌ Notification not found for transaction:', transactionId);
        return;
      }

      notificationId = notification.id;

      // Send push notification directly using PushManager (no HTTP call)
      const { PushManager } = await import('@/lib/push/push-manager');

      const payload = {
        title: notification.title,
        body: notification.subtitle || notification.body || '',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: {
          url: notification.url || '/',
          notificationId: notification.id,
        },
      };

      const result = await PushManager.sendToUser(notification.user_id, payload);

      // Update notification with push delivery status
      await (supabaseAdmin as any)
        .from('fb_notifications')
        .update({
          push_sent: true,
          push_sent_at: new Date().toISOString(),
          push_success_count: result.successCount,
          push_failure_count: result.failureCount,
          push_error: result.failureCount > 0 ? 'Some devices failed to receive push' : null,
        })
        .eq('id', notification.id);

      console.log('[sendPushNotificationForTransaction] ✅ Push sent and tracked:', {
        notificationId: notification.id,
        userId: notification.user_id,
        successCount: result.successCount,
        failureCount: result.failureCount,
      });
    } catch (error: any) {
      console.error('[sendPushNotificationForTransaction] ❌ Error:', error);

      // Update notification with error status if we have the notification ID
      if (notificationId) {
        try {
          await (supabaseAdmin as any)
            .from('fb_notifications')
            .update({
              push_sent: true,
              push_sent_at: new Date().toISOString(),
              push_success_count: 0,
              push_failure_count: 1,
              push_error: error.message || 'Failed to send push notification',
            })
            .eq('id', notificationId);
        } catch (updateError) {
          console.error('[sendPushNotificationForTransaction] ❌ Failed to update notification with error:', updateError);
        }
      }
    }
  }

  private async rejectEmail(emailId: string, reason: string, type: string = 'processing_error', errorDetails?: any): Promise<void> {
    // Get email details for the rejection record
    const { data: email, error: emailError } = await (supabaseAdmin as any)
      .from(TABLE_EMAILS_FETCHED)
      .select('user_id, google_user_id, connection_id')
      .eq('id', emailId)
      .single();

    if (emailError || !email) {
      console.error(`Failed to get email details for rejection ${emailId}:`, emailError);
      return;
    }

    const { error } = await (supabaseAdmin as any)
      .from(TABLE_REJECTED_EMAILS)
      .upsert({
        user_id: email.user_id,
        google_user_id: email.google_user_id,
        connection_id: email.connection_id,
        email_row_id: emailId,
        rejection_reason: reason,
        rejection_type: type,
        error_details: errorDetails ? JSON.stringify(errorDetails) : null,
        rejected_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'email_row_id',
      });

    if (error) {
      console.error(`Failed to reject email ${emailId}:`, error);
    }
  }

  // Utility methods for batch processing
  async getProcessingStats(userId?: string): Promise<{
    total: number;
    processed: number;
    fetched: number;
    rejected: number;
  }> {
    let query = (supabaseAdmin as any)
      .from(TABLE_EMAILS_FETCHED)
      .select('status');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: emails, error } = await query;

    if (error) {
      throw new Error(`Failed to get processing stats: ${error.message}`);
    }

    const stats = {
      total: emails?.length || 0,
      processed: 0,
      fetched: 0,
      rejected: 0,
    };

    emails?.forEach((email: any) => {
      switch (email.status) {
        case 'Processed':
          stats.processed++;
          break;
        case 'Fetched':
          stats.fetched++;
          break;
        case 'Rejected':
          stats.rejected++;
          break;
      }
    });

    return stats;
  }

  async reprocessFailedEmails(userId?: string): Promise<EmailProcessingResult> {
    return this.processEmails({
      userId,
      forceReprocess: false, // Only reprocess errors
      batchSize: 50,
    });
  }
}
