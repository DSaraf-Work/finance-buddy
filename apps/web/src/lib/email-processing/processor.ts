// Main Email Processing Engine

import { supabaseAdmin } from '../supabase';
import { TransactionExtractor } from './extractors/transaction-extractor';
import { TransactionExtractionRequest, ExtractedTransaction } from '../ai/types';
import { parseHTMLToCleanText } from '../gmail';
import type { Database } from '@finance-buddy/shared';

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
  private transactionExtractor = new TransactionExtractor();

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

  async processEmail(email: any): Promise<void> {
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

    // Create extraction request
    const extractionRequest: TransactionExtractionRequest = {
      emailId: email.id,
      subject: email.subject || '',
      fromAddress: email.from_address || '',
      plainBody: plainBody,
      snippet: email.snippet,
      internalDate: email.internal_date ? new Date(email.internal_date) : undefined,
    };

    // Extract transaction information
    const extractionResult = await this.transactionExtractor.extractTransaction(extractionRequest);

    if (!extractionResult.success || !extractionResult.transaction) {
      throw new Error(extractionResult.error || 'Transaction extraction failed');
    }

    // Save extracted transaction
    await this.saveExtractedTransaction(email, extractionResult.transaction);

    // Email status will automatically become 'PROCESSED' due to the transaction being saved
    console.log(`✅ Email ${email.id} processed successfully - status will be derived as PROCESSED`);
  }

  private async getEmailsToProcess(request: EmailProcessingRequest): Promise<any[]> {
    let query = (supabaseAdmin as any)
      .from('fb_emails_with_status')
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
      query = query.eq('status', 'FETCHED');
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

  private async saveExtractedTransaction(email: any, transaction: ExtractedTransaction): Promise<void> {
    const transactionData: Database['public']['Tables']['fb_extracted_transactions']['Insert'] = {
      user_id: email.user_id,
      google_user_id: email.google_user_id,
      connection_id: email.connection_id,
      email_row_id: email.id,
      txn_time: transaction.txnTime?.toISOString(),
      amount: transaction.amount,
      currency: transaction.currency,
      direction: transaction.direction,
      merchant_name: transaction.merchantName,
      merchant_normalized: transaction.merchantNormalized,
      category: transaction.category,
      account_hint: transaction.accountHint,
      reference_id: transaction.referenceId,
      location: transaction.location,
      account_type: transaction.accountType,
      transaction_type: transaction.transactionType,
      ai_notes: transaction.aiNotes,
      confidence: transaction.confidence,
      extraction_version: transaction.extractionVersion,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('💾 Saving extracted transaction:', {
      emailId: email.id,
      amount: transactionData.amount,
      merchant: transactionData.merchant_name,
      confidence: transactionData.confidence,
    });

    const { error } = await (supabaseAdmin as any)
      .from('fb_extracted_transactions')
      .upsert(transactionData, {
        onConflict: 'email_row_id',
      });

    if (error) {
      throw new Error(`Failed to save transaction: ${error.message}`);
    }
  }

  private async rejectEmail(emailId: string, reason: string, type: string = 'processing_error', errorDetails?: any): Promise<void> {
    // Get email details for the rejection record
    const { data: email, error: emailError } = await (supabaseAdmin as any)
      .from('fb_emails')
      .select('user_id, google_user_id, connection_id')
      .eq('id', emailId)
      .single();

    if (emailError || !email) {
      console.error(`Failed to get email details for rejection ${emailId}:`, emailError);
      return;
    }

    const { error } = await (supabaseAdmin as any)
      .from('fb_rejected_emails')
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
      .from('fb_emails_with_status')
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
        case 'PROCESSED':
          stats.processed++;
          break;
        case 'FETCHED':
          stats.fetched++;
          break;
        case 'REJECTED':
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
