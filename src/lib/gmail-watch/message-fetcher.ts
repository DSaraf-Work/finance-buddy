import { google } from 'googleapis';
import { supabaseAdmin } from '../supabase';
import type { Database } from '@/types/database';

type GmailConnection = Database['public']['Tables']['fb_gmail_connections']['Row'];

/**
 * MessageFetcher - Fetches a single Gmail message by ID and stores it
 *
 * This replaces the history sync approach with direct message fetching.
 * Used when webhook receives a specific message ID to process.
 */
export class MessageFetcher {
  /**
   * Fetch a single message from Gmail and store in database
   */
  async fetchAndStoreMessage(
    connectionId: string,
    messageId: string
  ): Promise<{
    success: boolean;
    emailId?: string;
    transactionId?: string;
    error?: string;
  }> {
    try {
      console.log(`📧 Fetching message ${messageId} for connection ${connectionId}`);

      // 1. Get connection details
      const { data: connectionData, error: connError } = await supabaseAdmin
        .from('fb_gmail_connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (connError || !connectionData) {
        throw new Error(`Connection not found: ${connError?.message}`);
      }

      const connection = connectionData as GmailConnection;

      // 2. Check if token needs refresh
      let accessToken = connection.access_token;
      const tokenExpiry = new Date(connection.token_expiry);
      const now = new Date();

      if (tokenExpiry <= now) {
        console.log('🔄 Access token expired, refreshing...');
        const refreshed = await this.refreshAccessToken(connection.refresh_token);
        accessToken = refreshed.access_token;

        // Update token in database
        await (supabaseAdmin as any)
          .from('fb_gmail_connections')
          .update({
            access_token: refreshed.access_token,
            token_expiry: refreshed.expiry,
          })
          .eq('id', connectionId);
      }

      // 3. Create Gmail client
      const gmail = google.gmail({ version: 'v1' });
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      // 4. Fetch message from Gmail API
      console.log(`📨 Fetching message from Gmail API...`);
      const response = await gmail.users.messages.get({
        auth,
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      const message = response.data;

      if (!message.id) {
        throw new Error('Message ID not found in response');
      }

      // 5. Check if message already exists (idempotency)
      const { data: existingEmail } = await (supabaseAdmin as any)
        .from('fb_emails')
        .select('id')
        .eq('message_id', message.id)
        .eq('connection_id', connectionId)
        .single();

      if (existingEmail) {
        console.log(`⚠️ Message ${message.id} already exists, skipping`);
        return {
          success: true,
          emailId: (existingEmail as any).id,
        };
      }

      // 6. Extract email details
      const headers = message.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

      const from = getHeader('from');
      const subject = getHeader('subject');
      const to = getHeader('to');
      const date = getHeader('date');

      // 7. Store in fb_emails
      console.log(`💾 Storing email in database...`);
      const { data: email, error: emailError } = await (supabaseAdmin as any)
        .from('fb_emails')
        .insert({
          user_id: connection.user_id,
          google_user_id: connection.google_user_id,
          connection_id: connection.id,
          email_address: connection.email_address,
          message_id: message.id,
          thread_id: message.threadId || message.id,
          from_address: from,
          to_addresses: to ? [to] : [],
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
        console.error('❌ Failed to store email:', emailError);
        throw emailError;
      }

      const emailId = (email as any).id;
      console.log(`✅ Email stored successfully: ${emailId}`);

      // 8. (Optional) Process for transaction - COMMENTED FOR NOW
      // const transactionIds = await this.emailProcessor.processEmail(emailId);
      // const transactionId = transactionIds?.[0];
      console.log(`⚠️ Transaction processing is disabled`);

      return {
        success: true,
        emailId,
        // transactionId,
      };
    } catch (error: any) {
      console.error('❌ Failed to fetch and store message:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    expiry: string;
  }> {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token || !credentials.expiry_date) {
      throw new Error('Failed to refresh access token');
    }

    return {
      access_token: credentials.access_token,
      expiry: new Date(credentials.expiry_date).toISOString(),
    };
  }

  /**
   * Extract plain text body from Gmail message
   */
  private extractBody(message: any): string {
    try {
      const payload = message.payload;
      if (!payload) return '';

      // Check if body is directly in payload
      if (payload.body?.data) {
        return Buffer.from(payload.body.data, 'base64').toString('utf-8');
      }

      // Check parts for text/plain
      if (payload.parts) {
        for (const part of payload.parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            return Buffer.from(part.body.data, 'base64').toString('utf-8');
          }

          // Check nested parts
          if (part.parts) {
            for (const nestedPart of part.parts) {
              if (nestedPart.mimeType === 'text/plain' && nestedPart.body?.data) {
                return Buffer.from(nestedPart.body.data, 'base64').toString('utf-8');
              }
            }
          }
        }

        // Fallback to text/html if no text/plain found
        for (const part of payload.parts) {
          if (part.mimeType === 'text/html' && part.body?.data) {
            return Buffer.from(part.body.data, 'base64').toString('utf-8');
          }
        }
      }

      return '';
    } catch (error) {
      console.error('Error extracting body:', error);
      return '';
    }
  }
}

