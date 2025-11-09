import { NextApiRequest, NextApiResponse } from 'next';
import { WebhookValidator } from '@/lib/gmail-watch/webhook-validator';
import { MessageFetcher } from '@/lib/gmail-watch/message-fetcher';
import { AuditLogger } from '@/lib/gmail-watch/audit-logger';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔔 Received Gmail Pub/Sub notification');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📨 REQUEST HEADERS:');
  console.log(JSON.stringify(req.headers, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 REQUEST BODY:');
  console.log(JSON.stringify(req.body, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let auditLogId: string | null = null;

  try {
    const validator = new WebhookValidator();
    const messageFetcher = new MessageFetcher();

    // Step 1: Validate webhook token (optional)
    const token = req.headers['x-webhook-token'] as string;
    if (!validator.verifyToken(token)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Step 2: Validate message structure
    if (!validator.validateMessage(req.body)) {
      return res.status(400).json({ error: 'Invalid message format' });
    }

    // Step 3: Parse notification (supports both old and new formats)
    let notification;
    try {
      notification = validator.parseMessage(req.body);
      console.log('📧 PARSED NOTIFICATION:');
      console.log(JSON.stringify(notification, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (error: any) {
      // Check if this is a test message
      if (error.message.includes('Test message detected')) {
        console.log('✅ Test message received successfully');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return res.status(200).json({
          success: true,
          message: 'Test message received',
          note: 'This was a test message from GCP Console'
        });
      }
      throw error; // Re-throw if it's a real error
    }

    // Step 4: Find connection for this email
    const { data: connection } = await supabaseAdmin
      .from('fb_gmail_connections')
      .select('*')
      .eq('email_address', notification.emailAddress)
      .eq('watch_enabled', true)
      .single();

    if (!connection) {
      console.warn(`⚠️ No active watch found for ${notification.emailAddress}`);
      return res.status(200).json({
        success: false,
        message: 'No active watch found'
      });
    }

    // Step 5: Create audit log
    auditLogId = await AuditLogger.logWebhookReceived(req, {
      messageId: notification.messageId || req.body?.message?.messageId || `msg_${Date.now()}`,
      subscriptionName: req.body?.subscription,
      publishTime: req.body?.message?.publishTime,
      emailAddress: notification.emailAddress,
      historyId: notification.historyId || '',
      connectionId: (connection as any).id,
      userId: (connection as any).user_id,
      requestHeaders: req.headers as any,
      requestBody: req.body,
    });

    // Step 6: Update audit log - processing started
    if (auditLogId) {
      await AuditLogger.updateAuditLog(auditLogId, {
        status: 'processing',
      });
    }

    // Step 7: Fetch and store message
    console.log(`📧 Fetching message: ${notification.messageId}`);
    const fetchStartTime = Date.now();
    const result = await messageFetcher.fetchAndStoreMessage(
      (connection as any).id,
      notification.messageId
    );
    const fetchDuration = Date.now() - fetchStartTime;

    // Step 8: Update audit log with results
    if (auditLogId) {
      await AuditLogger.updateAuditLog(auditLogId, {
        status: result.success ? 'success' : 'failed',
        success: result.success,
        errorMessage: result.error || undefined,
        newMessagesCount: result.success ? 1 : 0,
        transactionsExtracted: 0, // Transaction processing disabled
        gmailApiDurationMs: fetchDuration,
        emailIds: result.emailId ? [result.emailId] : [],
        transactionIds: [], // No transactions extracted (processing disabled)
        metadata: {
          result,
          notification,
          note: 'Transaction processing temporarily disabled',
        },
      });
    }

    console.log('✅ Webhook processed:', result);
    console.log('⚠️ Transaction processing is currently disabled');

    return res.status(200).json({
      success: result.success,
      emailId: result.emailId,
      processedTransactions: 0, // Transaction processing disabled
      note: 'Email stored successfully. Transaction processing is temporarily disabled.',
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

