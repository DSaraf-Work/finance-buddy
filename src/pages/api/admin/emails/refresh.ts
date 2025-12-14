// API endpoint for refreshing emails from Gmail
import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { refreshAccessToken, listMessages, getMessage } from '@/lib/gmail';
import {
  TABLE_CONFIG,
  TABLE_EMAILS_FETCHED,
  TABLE_EMAILS_PROCESSED,
  TABLE_GMAIL_CONNECTIONS
} from '@/lib/constants/database';

interface RefreshStats {
  totalFetched: number;
  newEmails: number;
  updatedEmails: number;
  errors: string[];
}

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stats: RefreshStats = {
      totalFetched: 0,
      newEmails: 0,
      updatedEmails: 0,
      errors: [],
    };

    // Get user's bank account types
    const { data: configData } = await (supabaseAdmin as any)
      .from(TABLE_CONFIG)
      .select('config_value')
      .eq('config_key', 'BANK_ACCOUNT_TYPES')
      .eq('user_id', user.id)
      .single();

    const bankAccountTypes: string[] = (configData as any)?.config_value || [];

    if (bankAccountTypes.length === 0) {
      return res.status(400).json({ error: 'No bank account types configured. Please add bank account email addresses in the admin settings.' });
    }

    // Get all Gmail connections for the user
    const { data: connections, error: connectionsError } = await (supabaseAdmin as any)
      .from(TABLE_GMAIL_CONNECTIONS)
      .select('*')
      .eq('user_id', user.id);

    if (connectionsError) throw connectionsError;

    if (!connections || connections.length === 0) {
      return res.status(400).json({ error: 'No Gmail connections found' });
    }

    // Process each connection
    for (const connection of connections) {
      try {
        // Refresh token if needed
        let accessToken = connection.access_token;
        const tokenExpiry = new Date(connection.token_expiry);
        
        if (tokenExpiry <= new Date()) {
          try {
            // refreshAccessToken now has built-in retry logic
            const refreshed = await refreshAccessToken(connection.refresh_token);
            accessToken = refreshed.access_token;

            // Set token expiry to 1 year from now
            const newExpiry = new Date();
            newExpiry.setFullYear(newExpiry.getFullYear() + 1);

            // Update token in database
            await (supabaseAdmin as any)
              .from(TABLE_GMAIL_CONNECTIONS)
              .update({
                access_token: accessToken,
                token_expiry: newExpiry.toISOString(),
              })
              .eq('id', connection.id);
          } catch (refreshError) {
            console.error('Token refresh error:', refreshError);
            
            const { isInvalidGrantError, parseGmailOAuthError } = await import('@/lib/gmail/error-handler');
            const { resetGmailConnection } = await import('@/lib/gmail/connection-reset');
            
            const parsedError = parseGmailOAuthError(refreshError);
            
            // Handle invalid_grant error - log and continue with other connections
            if (isInvalidGrantError(refreshError)) {
              console.log('🔒 Invalid grant error, resetting connection...');
              await resetGmailConnection(connection.id, refreshError);
              
              stats.errors.push(`Connection ${connection.email_address}: Gmail connection expired. Please reconnect.`);
              continue; // Skip this connection, continue with others
            }
            
            // Network or server errors - log and continue
            stats.errors.push(`Connection ${connection.email_address}: Token refresh failed - ${parsedError.message}`);
            continue; // Skip this connection, continue with others
          }
        }

        // Get last refresh timestamp
        const { data: lastEmail } = await (supabaseAdmin as any)
          .from(TABLE_EMAILS_FETCHED)
          .select('internal_date')
          .eq('user_id', user.id)
          .eq('connection_id', connection.id)
          .order('internal_date', { ascending: false })
          .limit(1)
          .single();

        const lastTimestamp = lastEmail?.internal_date 
          ? new Date(lastEmail.internal_date)
          : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: 7 days ago

        // Add 1 hour buffer (go back 1 hour from last timestamp)
        const startDate = new Date(lastTimestamp.getTime() - 60 * 60 * 1000);
        const endDate = new Date();

        // Break into 1-day batches if needed
        const batches = createDateBatches(startDate, endDate);

        for (const batch of batches) {
          // Build Gmail query for bank account types
          const senderQueries = bankAccountTypes.map(sender => `from:${sender}`).join(' OR ');
          const afterTimestamp = Math.floor(batch.start.getTime() / 1000);
          const beforeTimestamp = Math.floor(batch.end.getTime() / 1000);

          const gmailQuery = `(${senderQueries}) after:${afterTimestamp} before:${beforeTimestamp}`;

          // Fetch emails from Gmail
          const gmailResponse = await listMessages(accessToken, {
            q: gmailQuery,
            maxResults: 500,
          });

          const messageIds = gmailResponse.messages || [];
          stats.totalFetched += messageIds.length;

          // Process emails in parallel
          const emailPromises = messageIds.map(async (msg) => {
            try {
              const fullMessage = await getMessage(accessToken, msg.id);

              // Extract email data
              const headers = fullMessage.payload?.headers || [];
              const getHeader = (name: string) =>
                headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

              const from = getHeader('from');
              const to = getHeader('to');
              const subject = getHeader('subject');
              const date = getHeader('date');

              // Get email body
              let body = '';
              if (fullMessage.payload?.body?.data) {
                body = Buffer.from(fullMessage.payload.body.data, 'base64').toString('utf-8');
              } else if (fullMessage.payload?.parts) {
                const textPart = fullMessage.payload.parts.find(
                  (part: any) => part.mimeType === 'text/plain' || part.mimeType === 'text/html'
                );
                if (textPart?.body?.data) {
                  body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
                }
              }

              const internalDate = new Date(parseInt(fullMessage.internalDate || '0'));

              // Check if email already exists
              const { data: existingEmail } = await (supabaseAdmin as any)
                .from(TABLE_EMAILS_FETCHED)
                .select('id')
                .eq('user_id', user.id)
                .eq('google_user_id', connection.google_user_id)
                .eq('message_id', msg.id)
                .single();

              if (existingEmail) {
                // Update existing email
                await (supabaseAdmin as any)
                  .from(TABLE_EMAILS_FETCHED)
                  .update({
                    from_address: from,
                    to_address: to,
                    subject: subject,
                    plain_body: body,
                    internal_date: internalDate.toISOString(),
                    email_date: date,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', existingEmail.id);

                // Mark related transactions as REFRESHED
                await (supabaseAdmin as any)
                  .from(TABLE_EMAILS_PROCESSED)
                  .update({ status: 'REFRESHED' })
                  .eq('email_id', existingEmail.id);

                stats.updatedEmails++;
              } else {
                // Insert new email
                await (supabaseAdmin as any)
                  .from(TABLE_EMAILS_FETCHED)
                  .insert({
                    user_id: user.id,
                    connection_id: connection.id,
                    google_user_id: connection.google_user_id,
                    message_id: msg.id,
                    from_address: from,
                    to_address: to,
                    subject: subject,
                    plain_body: body,
                    internal_date: internalDate.toISOString(),
                    email_date: date,
                    status: 'Fetched',
                  });

                stats.newEmails++;
              }
            } catch (error: any) {
              console.error(`Error processing email ${msg.id}:`, error);
              stats.errors.push(`Email ${msg.id}: ${error.message}`);
            }
          });

          await Promise.all(emailPromises);
        }
      } catch (error: any) {
        console.error(`Error processing connection ${connection.id}:`, error);
        stats.errors.push(`Connection ${connection.email_address}: ${error.message}`);
      }
    }

    return res.status(200).json({ stats });
  } catch (error: any) {
    console.error('Refresh emails error:', error);
    return res.status(500).json({
      error: 'Failed to refresh emails',
      details: error.message,
    });
  }
});

// Helper function to create date batches
function createDateBatches(startDate: Date, endDate: Date): Array<{ start: Date; end: Date }> {
  const batches: Array<{ start: Date; end: Date }> = [];
  const oneDayMs = 24 * 60 * 60 * 1000;

  let currentStart = new Date(startDate);
  
  while (currentStart < endDate) {
    const currentEnd = new Date(Math.min(
      currentStart.getTime() + oneDayMs,
      endDate.getTime()
    ));

    batches.push({
      start: new Date(currentStart),
      end: new Date(currentEnd),
    });

    currentStart = new Date(currentEnd);
  }

  return batches;
}

