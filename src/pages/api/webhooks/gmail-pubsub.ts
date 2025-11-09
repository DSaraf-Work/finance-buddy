import { NextApiRequest, NextApiResponse } from 'next';
import { WebhookValidator } from '@/lib/gmail-watch/webhook-validator';
import { HistorySync } from '@/lib/gmail-watch/history-sync';
import { AuditLogger } from '@/lib/gmail-watch/audit-logger';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔔 Received Gmail Pub/Sub notification');
  let auditLogId: string | null = null;

  try {
    const validator = new WebhookValidator();
    const historySync = new HistorySync();

    // Step 1: Validate webhook token (optional)
    const token = req.headers['x-webhook-token'] as string;
    if (!validator.verifyToken(token)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Step 2: Validate message structure
    if (!validator.validateMessage(req.body)) {
      return res.status(400).json({ error: 'Invalid message format' });
    }

    // Step 3: Parse notification
    const notification = validator.parseMessage(req.body);
    console.log('📧 Notification:', notification);

    // Step 4: Find connection for this email
    const { data: connection } = await supabaseAdmin
      .from('fb_gmail_connections')
      .select('*')
      .eq('email_address', notification.emailAddress)
      .eq('watch_enabled', true)
      .single();

    // Step 5: Create audit log
    auditLogId = await AuditLogger.logWebhookReceived(req, {
      messageId: req.body?.message?.messageId || `msg_${Date.now()}`,
      subscriptionName: req.body?.subscription,
      publishTime: req.body?.message?.publishTime,
      emailAddress: notification.emailAddress,
      historyId: notification.historyId,
      connectionId: (connection as any)?.id,
      userId: (connection as any)?.user_id,
      requestHeaders: req.headers as any,
      requestBody: req.body,
    });

    // Step 6: Log webhook receipt (legacy table for backward compatibility)
    const { data: webhookLog } = await supabaseAdmin
      .from('fb_webhook_logs')
      // @ts-ignore - Supabase type inference issue
      .insert({
        email_address: notification.emailAddress,
        history_id: notification.historyId,
        received_at: new Date().toISOString(),
        success: false, // Will update after processing
        new_messages: 0,
      })
      .select()
      .single();

    if (!connection) {
      console.warn(`⚠️ No active watch found for ${notification.emailAddress}`);

      // Update audit log
      if (auditLogId) {
        await AuditLogger.updateAuditLog(auditLogId, {
          status: 'failed',
          success: false,
          errorMessage: 'No active watch found',
          errorCode: 'NO_WATCH',
        });
      }

      // Update webhook log
      if (webhookLog) {
        await supabaseAdmin
          .from('fb_webhook_logs')
          // @ts-ignore - Supabase type inference issue
          .update({
            processed_at: new Date().toISOString(),
            success: false,
            error_message: 'No active watch found',
          })
          .eq('id', (webhookLog as any).id);
      }

      return res.status(200).json({
        success: false,
        message: 'No active watch found'
      });
    }

    // Step 7: Get last known history ID
    const lastHistoryId = (connection as any).last_history_id;

    if (!lastHistoryId) {
      console.warn('⚠️ No last history ID found, skipping sync');

      // Update audit log
      if (auditLogId) {
        await AuditLogger.updateAuditLog(auditLogId, {
          status: 'skipped',
          success: false,
          errorMessage: 'No last history ID',
          errorCode: 'NO_HISTORY_ID',
        });
      }

      // Update webhook log
      if (webhookLog) {
        await supabaseAdmin
          .from('fb_webhook_logs')
          // @ts-ignore - Supabase type inference issue
          .update({
            processed_at: new Date().toISOString(),
            success: false,
            error_message: 'No last history ID',
          })
          .eq('id', (webhookLog as any).id);
      }

      return res.status(200).json({
        success: false,
        message: 'No last history ID'
      });
    }

    // Step 8: Update audit log - processing started
    if (auditLogId) {
      await AuditLogger.updateAuditLog(auditLogId, {
        status: 'processing',
        historyStartId: lastHistoryId,
      });
    }

    // Step 9: Sync emails from history
    const syncStartTime = Date.now();
    const syncResult = await historySync.syncFromHistory(
      (connection as any).id,
      lastHistoryId
    );
    const syncDuration = Date.now() - syncStartTime;

    // Step 10: Update audit log with results
    if (auditLogId) {
      await AuditLogger.updateAuditLog(auditLogId, {
        status: syncResult.success ? 'success' : 'failed',
        success: syncResult.success,
        errorMessage: syncResult.error || undefined,
        newMessagesCount: syncResult.newMessages || 0,
        transactionsExtracted: 0, // Transaction processing disabled
        historyEndId: notification.historyId,
        gmailApiDurationMs: syncDuration,
        emailIds: syncResult.emailIds || [],
        transactionIds: [], // No transactions extracted (processing disabled)
        metadata: {
          syncResult,
          notification,
          note: 'Transaction processing temporarily disabled',
        },
      });
    }

    // Step 11: Update webhook log (legacy)
    if (webhookLog) {
      await supabaseAdmin
        .from('fb_webhook_logs')
        // @ts-ignore - Supabase type inference issue
        .update({
          processed_at: new Date().toISOString(),
          success: syncResult.success,
          new_messages: syncResult.newMessages,
          error_message: syncResult.error || null,
        })
        .eq('id', (webhookLog as any).id);
    }

    console.log('✅ Webhook processed:', syncResult);
    console.log('⚠️ Transaction processing is currently disabled');

    return res.status(200).json({
      success: syncResult.success,
      newMessages: syncResult.newMessages,
      processedTransactions: 0, // Transaction processing disabled
      emailIds: syncResult.emailIds || [],
      note: 'Emails stored successfully. Transaction processing is temporarily disabled.',
    });
  } catch (error: any) {
    console.error('❌ Webhook processing failed:', error);

    // Log error to audit
    if (auditLogId) {
      await AuditLogger.logError(auditLogId, error);
    }

    return res.status(500).json({
      error: error.message,
      success: false,
    });
  }
}

