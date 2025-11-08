import { supabaseAdmin } from '@/lib/supabase';
import { NextApiRequest } from 'next';

interface AuditLogData {
  messageId: string;
  subscriptionName?: string;
  publishTime?: string;
  emailAddress: string;
  historyId: string;
  connectionId?: string;
  userId?: string;
  requestHeaders?: Record<string, any>;
  requestBody?: any;
  requestIp?: string;
  userAgent?: string;
}

interface AuditUpdateData {
  status?: 'received' | 'processing' | 'success' | 'failed' | 'skipped';
  success?: boolean;
  errorMessage?: string;
  errorStack?: string;
  errorCode?: string;
  newMessagesCount?: number;
  emailsFetched?: number;
  emailsProcessed?: number;
  emailsFailed?: number;
  transactionsExtracted?: number;
  historyStartId?: string;
  historyEndId?: string;
  historyRecordsProcessed?: number;
  gmailApiCalls?: number;
  gmailApiDurationMs?: number;
  dbQueries?: number;
  dbDurationMs?: number;
  aiExtractionDurationMs?: number;
  metadata?: Record<string, any>;
  tags?: string[];
}

export class AuditLogger {
  /**
   * Create initial audit log entry when webhook is received
   */
  static async logWebhookReceived(
    req: NextApiRequest,
    data: AuditLogData
  ): Promise<string | null> {
    try {
      const startTime = Date.now();

      const { data: auditLog, error } = await supabaseAdmin
        .from('fb_gmail_webhook_audit')
        // @ts-ignore - Supabase type inference issue with new table
        .insert({
          message_id: data.messageId,
          subscription_name: data.subscriptionName,
          publish_time: data.publishTime,
          email_address: data.emailAddress,
          history_id: data.historyId,
          connection_id: data.connectionId,
          user_id: data.userId,
          request_headers: data.requestHeaders || {},
          request_body: data.requestBody || {},
          request_ip: data.requestIp || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          user_agent: data.userAgent || req.headers['user-agent'],
          received_at: new Date().toISOString(),
          status: 'received',
          success: false,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to create audit log:', error);
        return null;
      }

      return (auditLog as any)?.id || null;
    } catch (error) {
      console.error('Error in logWebhookReceived:', error);
      return null;
    }
  }

  /**
   * Update audit log with processing status
   */
  static async updateAuditLog(
    auditLogId: string,
    updates: AuditUpdateData
  ): Promise<void> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Add processing timestamps
      if (updates.status === 'processing') {
        updateData.processing_started_at = new Date().toISOString();
      } else if (updates.status === 'success' || updates.status === 'failed') {
        updateData.processing_completed_at = new Date().toISOString();
        
        // Calculate processing duration
        const { data: existingLog } = await supabaseAdmin
          .from('fb_gmail_webhook_audit')
          // @ts-ignore - Supabase type inference issue with new table
          .select('received_at')
          .eq('id', auditLogId)
          .single();

        if (existingLog) {
          const receivedAt = new Date((existingLog as any).received_at).getTime();
          const completedAt = Date.now();
          updateData.processing_duration_ms = completedAt - receivedAt;
        }
      }

      // Map all update fields
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.success !== undefined) updateData.success = updates.success;
      if (updates.errorMessage !== undefined) updateData.error_message = updates.errorMessage;
      if (updates.errorStack !== undefined) updateData.error_stack = updates.errorStack;
      if (updates.errorCode !== undefined) updateData.error_code = updates.errorCode;
      if (updates.newMessagesCount !== undefined) updateData.new_messages_count = updates.newMessagesCount;
      if (updates.emailsFetched !== undefined) updateData.emails_fetched = updates.emailsFetched;
      if (updates.emailsProcessed !== undefined) updateData.emails_processed = updates.emailsProcessed;
      if (updates.emailsFailed !== undefined) updateData.emails_failed = updates.emailsFailed;
      if (updates.transactionsExtracted !== undefined) updateData.transactions_extracted = updates.transactionsExtracted;
      if (updates.historyStartId !== undefined) updateData.history_start_id = updates.historyStartId;
      if (updates.historyEndId !== undefined) updateData.history_end_id = updates.historyEndId;
      if (updates.historyRecordsProcessed !== undefined) updateData.history_records_processed = updates.historyRecordsProcessed;
      if (updates.gmailApiCalls !== undefined) updateData.gmail_api_calls = updates.gmailApiCalls;
      if (updates.gmailApiDurationMs !== undefined) updateData.gmail_api_duration_ms = updates.gmailApiDurationMs;
      if (updates.dbQueries !== undefined) updateData.db_queries = updates.dbQueries;
      if (updates.dbDurationMs !== undefined) updateData.db_duration_ms = updates.dbDurationMs;
      if (updates.aiExtractionDurationMs !== undefined) updateData.ai_extraction_duration_ms = updates.aiExtractionDurationMs;
      if (updates.metadata !== undefined) updateData.metadata = updates.metadata;
      if (updates.tags !== undefined) updateData.tags = updates.tags;

      const { error } = await supabaseAdmin
        .from('fb_gmail_webhook_audit')
        // @ts-ignore - Supabase type inference issue with new table
        .update(updateData)
        .eq('id', auditLogId);

      if (error) {
        console.error('Failed to update audit log:', error);
      }
    } catch (error) {
      console.error('Error in updateAuditLog:', error);
    }
  }

  /**
   * Log error to audit table
   */
  static async logError(
    auditLogId: string,
    error: Error | any
  ): Promise<void> {
    await this.updateAuditLog(auditLogId, {
      status: 'failed',
      success: false,
      errorMessage: error.message || String(error),
      errorStack: error.stack,
      errorCode: error.code,
    });
  }
}

