/**
 * Priority Email Processor
 *
 * Processes unread emails from priority senders (banks) across all Gmail connections.
 * This module is reusable and can be called from:
 * - Cron jobs (automated)
 * - Manual triggers (user-initiated)
 * - Webhooks (event-driven)
 */

import { supabaseAdmin } from '@/lib/supabase';
import { TABLE_GMAIL_CONNECTIONS } from '@/lib/constants/database';
import { refreshAccessToken, listMessages, getMessage, markAsRead } from '@/lib/gmail';
import { EmailProcessor } from '@/lib/email-processing/processor';
import { extractEmailFromHeaders, extractSubjectFromHeaders, extractPlainTextBody } from '@/lib/gmail';

// Priority senders to check for unread emails
const PRIORITY_SENDERS = [
  'alerts@dcbbank.com',
  'alerts@yes.bank.in',
  'alerts@hdfcbank.net',
];

export interface PriorityEmailProcessorResult {
  success: boolean;
  connectionsProcessed: number;
  emailsFound: number;
  emailsProcessed: number;
  emailsMarkedRead: number;
  errors: string[];
  details: Array<{
    connectionId: string;
    emailAddress: string;
    emailsFound: number;
    emailsProcessed: number;
    error?: string;
  }>;
}

/**
 * Process unread priority emails across all Gmail connections
 */
export async function processPriorityEmails(): Promise<PriorityEmailProcessorResult> {
  console.log('🚀 [PriorityEmailProcessor] Starting priority email processing...');

  const result: PriorityEmailProcessorResult = {
    success: true,
    connectionsProcessed: 0,
    emailsFound: 0,
    emailsProcessed: 0,
    emailsMarkedRead: 0,
    errors: [],
    details: [],
  };

  try {
    // Get all active Gmail connections
    const { data: connections, error: connError } = await (supabaseAdmin as any)
      .from(TABLE_GMAIL_CONNECTIONS)
      .select('*')
      .eq('status', 'active');

    if (connError) {
      throw new Error(`Failed to fetch connections: ${connError.message}`);
    }

    if (!connections || connections.length === 0) {
      console.log('ℹ️ [PriorityEmailProcessor] No active Gmail connections found');
      return result;
    }

    console.log(`📧 [PriorityEmailProcessor] Found ${connections.length} active connections`);

    // Process each connection
    for (const connection of connections) {
      const connectionResult = await processConnectionPriorityEmails(connection);

      result.connectionsProcessed++;
      result.emailsFound += connectionResult.emailsFound;
      result.emailsProcessed += connectionResult.emailsProcessed;
      result.emailsMarkedRead += connectionResult.emailsMarkedRead;

      if (connectionResult.error) {
        result.errors.push(connectionResult.error);
      }

      result.details.push({
        connectionId: connection.id,
        emailAddress: connection.email_address,
        emailsFound: connectionResult.emailsFound,
        emailsProcessed: connectionResult.emailsProcessed,
        error: connectionResult.error,
      });
    }

    result.success = result.errors.length === 0;

    console.log('✅ [PriorityEmailProcessor] Processing complete:', {
      connectionsProcessed: result.connectionsProcessed,
      emailsFound: result.emailsFound,
      emailsProcessed: result.emailsProcessed,
      emailsMarkedRead: result.emailsMarkedRead,
      errors: result.errors.length,
    });

    return result;

  } catch (error: any) {
    console.error('❌ [PriorityEmailProcessor] Fatal error:', error);
    result.success = false;
    result.errors.push(error.message);
    return result;
  }
}

/**
 * Process priority emails for a single Gmail connection
 */
async function processConnectionPriorityEmails(connection: any): Promise<{
  emailsFound: number;
  emailsProcessed: number;
  emailsMarkedRead: number;
  error?: string;
}> {
  const result = {
    emailsFound: 0,
    emailsProcessed: 0,
    emailsMarkedRead: 0,
    error: undefined as string | undefined,
  };

  try {
    console.log(`🔄 [PriorityEmailProcessor] Processing connection: ${connection.email_address}`);

    // Refresh access token if needed
    const accessToken = await getValidAccessToken(connection);

    // Build Gmail query for unread emails from priority senders
    const senderQuery = PRIORITY_SENDERS.map(sender => `from:${sender}`).join(' OR ');
    const gmailQuery = `is:unread (${senderQuery})`;

    console.log(`📧 [PriorityEmailProcessor] Gmail query: ${gmailQuery}`);

    // Search for unread priority emails
    const gmailResponse = await listMessages(accessToken, {
      q: gmailQuery,
      maxResults: 50, // Limit to prevent timeout
    });

    const messageIds = gmailResponse.messages?.map(m => m.id) || [];
    result.emailsFound = messageIds.length;

    if (messageIds.length === 0) {
      console.log(`ℹ️ [PriorityEmailProcessor] No unread priority emails found for ${connection.email_address}`);
      return result;
    }

    console.log(`📧 [PriorityEmailProcessor] Found ${messageIds.length} unread priority emails`);

    // Process each email
    for (const messageId of messageIds) {
      try {
        await processSingleEmail(connection, accessToken, messageId, true); // Mark as read for priority emails
        result.emailsProcessed++;
        result.emailsMarkedRead++;
      } catch (error: any) {
        console.error(`❌ [PriorityEmailProcessor] Failed to process email ${messageId}:`, error);
        // Continue processing other emails even if one fails
      }
    }

    return result;

  } catch (error: any) {
    console.error(`❌ [PriorityEmailProcessor] Error processing connection ${connection.id}:`, error);
    result.error = error.message;
    return result;
  }
}

/**
 * Process a single email from webhook notification
 * This is a public wrapper for webhook usage
 *
 * @param connection - Gmail connection object from database
 * @param messageId - Gmail message ID to process
 * @param options - Processing options
 */
export async function processWebhookEmail(
  connection: any,
  messageId: string,
  options: {
    markAsRead?: boolean;  // Whether to mark email as read after processing (default: false for webhooks)
    fromAddress?: string;  // Optional: sender address for logging
  } = {}
): Promise<{
  success: boolean;
  emailId?: string;
  error?: string;
}> {
  try {
    console.log(`📧 [WebhookEmailProcessor] Processing webhook email:`, {
      messageId,
      connectionId: connection.id,
      emailAddress: connection.email_address,
      fromAddress: options.fromAddress,
      markAsRead: options.markAsRead ?? false,
    });

    // Get valid access token
    const accessToken = await getValidAccessToken(connection);

    // Process the email
    await processSingleEmail(connection, accessToken, messageId, options.markAsRead ?? false);

    console.log(`✅ [WebhookEmailProcessor] Successfully processed webhook email: ${messageId}`);

    return {
      success: true,
      emailId: messageId,
    };
  } catch (error: any) {
    console.error(`❌ [WebhookEmailProcessor] Failed to process webhook email:`, {
      messageId,
      error: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Process a single email message
 * Similar to the gmail-pubsub webhook flow
 */
async function processSingleEmail(
  connection: any,
  accessToken: string,
  messageId: string,
  shouldMarkAsRead: boolean = true  // Default to true for priority email cron
): Promise<void> {
  console.log(`📧 [PriorityEmailProcessor] Processing email: ${messageId}`);

  // Fetch email details from Gmail
  const gmailMessage = await getMessage(accessToken, messageId);

  // Extract email metadata
  const headers = gmailMessage.payload?.headers || [];
  const fromAddress = extractEmailFromHeaders(headers);
  const subject = extractSubjectFromHeaders(headers);
  const plainBody = extractPlainTextBody(gmailMessage.payload);

  console.log(`📧 [PriorityEmailProcessor] Email details:`, {
    messageId,
    from: fromAddress,
    subject,
    hasBody: !!plainBody,
  });

  // Check if this email is already in our database
  const { data: existingEmail } = await (supabaseAdmin as any)
    .from('fb_emails_fetched')
    .select('id, status')
    .eq('message_id', messageId)
    .eq('user_id', connection.user_id)
    .single();

  if (existingEmail) {
    console.log(`ℹ️ [PriorityEmailProcessor] Email already exists in database:`, {
      id: existingEmail.id,
      status: existingEmail.status,
    });

    // If already processed, just mark as read
    if (existingEmail.status === 'processed') {
      await markAsRead(accessToken, messageId);
      console.log(`✅ [PriorityEmailProcessor] Marked already-processed email as read: ${messageId}`);
      return;
    }
  }

  // Store email in database if not exists
  if (!existingEmail) {
    const emailData = {
      user_id: connection.user_id,
      google_user_id: connection.google_user_id,
      connection_id: connection.id,
      email_address: connection.email_address,
      message_id: messageId,
      thread_id: gmailMessage.threadId,
      from_address: fromAddress,
      subject: subject,
      snippet: gmailMessage.snippet,
      internal_date: new Date(parseInt(gmailMessage.internalDate || '0')).toISOString(),
      status: 'fetched',
    };

    await (supabaseAdmin as any)
      .from('fb_emails_fetched')
      .insert(emailData);

    console.log(`✅ [PriorityEmailProcessor] Stored email in database: ${messageId}`);
  }

  // Process email with AI to extract transaction
  try {
    const emailProcessor = new EmailProcessor();

    const emailForProcessing = {
      id: existingEmail?.id || messageId,
      message_id: messageId,
      from_address: fromAddress,
      subject: subject,
      snippet: gmailMessage.snippet,
      internal_date: new Date(parseInt(gmailMessage.internalDate || '0')).toISOString(),
      user_id: connection.user_id,
      plain_body: plainBody || '', // Add plain_body to the email object
    };

    await emailProcessor.processEmail(emailForProcessing as any);

    console.log(`✅ [PriorityEmailProcessor] Processed email with AI: ${messageId}`);
  } catch (error: any) {
    console.error(`❌ [PriorityEmailProcessor] Failed to process email with AI:`, error);
    // Don't throw - we still want to mark as read if requested
  }

  // Mark email as read in Gmail (only if requested)
  if (shouldMarkAsRead) {
    await markAsRead(accessToken, messageId);
    console.log(`✅ [PriorityEmailProcessor] Marked email as read: ${messageId}`);
  } else {
    console.log(`ℹ️ [PriorityEmailProcessor] Skipped marking email as read (shouldMarkAsRead=false): ${messageId}`);
  }
}

/**
 * Get valid access token for a connection (refresh if needed)
 */
async function getValidAccessToken(connection: any): Promise<string> {
  // Check if access token is still valid (simple check - could be enhanced)
  if (connection.access_token) {
    return connection.access_token;
  }

  // Refresh access token
  console.log(`🔑 [PriorityEmailProcessor] Refreshing access token for ${connection.email_address}`);

  const tokens = await refreshAccessToken(connection.refresh_token);

  // Update connection with new access token
  await (supabaseAdmin as any)
    .from(TABLE_GMAIL_CONNECTIONS)
    .update({
      access_token: tokens.access_token,
      token_expires_at: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
    })
    .eq('id', connection.id);

  return tokens.access_token!;
}

/**
 * Get priority email check configuration
 */
export async function getPriorityEmailConfig(): Promise<{
  enabled: boolean;
  intervalMinutes: number;
}> {
  try {
    const { data: enabledConfig } = await (supabaseAdmin as any)
      .from('fb_config')
      .select('config_value')
      .eq('config_key', 'priority_email_check_enabled')
      .single();

    const { data: intervalConfig } = await (supabaseAdmin as any)
      .from('fb_config')
      .select('config_value')
      .eq('config_key', 'priority_email_check_interval')
      .single();

    return {
      enabled: enabledConfig?.config_value === true,
      intervalMinutes: intervalConfig?.config_value || 1,
    };
  } catch (error) {
    console.error('❌ [PriorityEmailProcessor] Failed to get config:', error);
    return {
      enabled: true, // Default to enabled
      intervalMinutes: 1, // Default to 1 minute
    };
  }
}

/**
 * Update priority email check configuration
 */
export async function updatePriorityEmailConfig(
  enabled?: boolean,
  intervalMinutes?: number
): Promise<void> {
  if (enabled !== undefined) {
    await (supabaseAdmin as any)
      .from('fb_config')
      .upsert({
        config_key: 'priority_email_check_enabled',
        config_value: enabled,
        description: 'Enable/disable priority email checking',
      }, {
        onConflict: 'config_key',
      });
  }

  if (intervalMinutes !== undefined) {
    await (supabaseAdmin as any)
      .from('fb_config')
      .upsert({
        config_key: 'priority_email_check_interval',
        config_value: intervalMinutes,
        description: 'Interval in minutes for priority email checking',
      }, {
        onConflict: 'config_key',
      });
  }

  console.log('✅ [PriorityEmailProcessor] Updated config:', { enabled, intervalMinutes });
}

