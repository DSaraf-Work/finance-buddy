import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  listMessages,
  getMessage,
  getMessageRaw,
  refreshAccessToken,
  extractEmailFromHeaders,
  extractSubjectFromHeaders,
  extractToAddressesFromHeaders,
  extractPlainTextBody,
  parseRawEmailContent
} from '@/lib/gmail';
import {
  EmailSearchRequest,
  PaginatedResponse,
  EmailPublic
} from '@/types';
import {
  TABLE_EMAILS_FETCHED,
  TABLE_EMAILS_PROCESSED,
  TABLE_GMAIL_CONNECTIONS
} from '@/lib/constants/database';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔍 Email search request:', {
    user_id: user.id,
    user_email: user.email,
    request_body: req.body,
    timestamp: new Date().toISOString()
  });

  try {
    const {
      google_user_id,
      email_address,
      date_from,
      date_to,
      sender,
      status,
      q,
      page = 1,
      pageSize = 50,
      sort = 'desc', // Default to newest-to-oldest
      db_only = false,
      ignore_defaults = false // New parameter to bypass default filters
    }: EmailSearchRequest & { ignore_defaults?: boolean } = req.body;

    // Apply default filters only if ignore_defaults is false and no specific filters are provided
    // When ignore_defaults is true, use the provided values as-is (including undefined/empty)
    const finalEmailAddress = ignore_defaults
      ? email_address
      : (email_address || 'dheerajsaraf1996@gmail.com');

    const finalSender = ignore_defaults
      ? sender
      : (sender || 'alerts@dcbbank.com,alerts@yes.bank.in');

    console.log('🔧 Filter processing debug:', {
      ignore_defaults,
      original_email_address: email_address,
      original_sender: sender,
      finalEmailAddress,
      finalSender,
      willApplySenderFilter: !!finalSender
    });

    // Validate page size
    if (pageSize > 1000) {
      return res.status(400).json({ error: 'pageSize cannot exceed 1000' });
    }

    // If db_only is false, sync with Gmail API first
    if (!db_only && date_from && date_to) {
      console.log('📧 Starting Gmail sync:', {
        user_id: user.id,
        date_from,
        date_to,
        sender: finalSender,
        email_address: finalEmailAddress
      });
      try {
        await syncEmailsFromGmail(user.id, date_from, date_to, finalSender, finalEmailAddress);
        console.log('✅ Gmail sync completed successfully');
      } catch (gmailError) {
        const errorMessage = gmailError instanceof Error ? gmailError.message : String(gmailError);

        // If it's a re-auth required error, return it to the user
        if (errorMessage.includes('GMAIL_REAUTH_REQUIRED')) {
          console.error('🔒 Gmail re-authentication required');
          return res.status(401).json({
            error: 'Gmail connection expired',
            message: 'Your Gmail connection has expired. Please reconnect your Gmail account in Settings.',
            requiresReauth: true
          });
        }

        console.error('❌ Gmail sync error (continuing with DB-only search):', gmailError);
        // Continue with database search for other errors
      }
    } else {
      console.log('🗄️ Skipping Gmail sync - using database only:', { db_only, date_from, date_to });
    }

    // Build query
    console.log('🔍 Building database query with filters:', {
      user_id: user.id,
      google_user_id,
      email_address: finalEmailAddress,
      date_from,
      date_to,
      sender: finalSender,
      status,
      q,
      page,
      pageSize,
      ignore_defaults
    });

    console.log('🔧 About to build Supabase query...');

    // Use supabaseAdmin for server-side operations
    // Authorization enforced by withAuth() + explicit user_id filter
    // RLS policies remain as defense-in-depth layer
    let query = supabaseAdmin
      .from(TABLE_EMAILS_FETCHED)
      .select(`
        id,
        google_user_id,
        connection_id,
        email_address,
        message_id,
        thread_id,
        from_address,
        to_addresses,
        subject,
        snippet,
        internal_date,
        processed_id,
        rejected_id,
        error_reason,
        processed_at,
        remarks,
        created_at,
        updated_at
      `, { count: 'exact' })
      .eq('user_id', user.id);

    // Apply filters
    if (google_user_id) {
      query = query.eq('google_user_id', google_user_id);
    }

    if (finalEmailAddress) {
      query = query.eq('email_address', finalEmailAddress);
    }

    if (date_from) {
      query = query.gte('internal_date', `${date_from}T00:00:00Z`);
    }

    if (date_to) {
      query = query.lte('internal_date', `${date_to}T23:59:59Z`);
    }

    if (finalSender) {
      query = query.ilike('from_address', `%${finalSender}%`);
    }

    // Apply status filter using FK presence
    // Status is derived: processed_id NOT NULL = Processed, rejected_id NOT NULL = Rejected, else = Fetched
    if (status) {
      const upperStatus = status.toUpperCase();
      if (upperStatus === 'PROCESSED') {
        query = query.not('processed_id', 'is', null);
      } else if (upperStatus === 'REJECTED' || upperStatus === 'REJECT') {
        query = query.not('rejected_id', 'is', null);
      } else if (upperStatus === 'FETCHED') {
        query = query.is('processed_id', null).is('rejected_id', null);
      }
    }

    if (q) {
      // Search in subject and snippet
      query = query.or(`subject.ilike.%${q}%,snippet.ilike.%${q}%`);
    }

    // Apply pagination and sorting
    const offset = (page - 1) * pageSize;
    query = query
      .order('internal_date', { ascending: sort === 'asc' })
      .range(offset, offset + pageSize - 1);

    console.log('🔍 Executing database query...');
    console.log('🔧 Final query filters applied:', {
      user_id: user.id,
      google_user_id: google_user_id || 'NOT_APPLIED',
      email_address: finalEmailAddress || 'NOT_APPLIED',
      date_from: date_from || 'NOT_APPLIED',
      date_to: date_to || 'NOT_APPLIED',
      sender: finalSender || 'NOT_APPLIED',
      status: status || 'NOT_APPLIED',
      search_query: q || 'NOT_APPLIED'
    });

    // Execute query and capture detailed results
    const { data: emails, error, count } = await query;

    console.log('🔧 Raw query execution results:', {
      error: error ? error.message : 'NO_ERROR',
      data_type: Array.isArray(emails) ? 'array' : typeof emails,
      data_length: emails ? emails.length : 'null',
      count_value: count,
      count_type: typeof count
    });

    if (error) {
      console.error('❌ Email search error:', error);
      return res.status(500).json({ error: 'Failed to search emails' });
    }

    // Derive status from FK presence and fetch transaction IDs for emails
    if (emails && emails.length > 0) {
      // Add derived status to each email (uppercase enum values)
      (emails as any[]).forEach((email: any) => {
        if (email.processed_id) {
          email.status = 'PROCESSED';
        } else if (email.rejected_id) {
          email.status = 'REJECTED';
        } else {
          email.status = 'FETCHED';
        }
      });

      const emailIds = emails.map((e: any) => e.id);
      const { data: transactions } = await supabaseAdmin
        .from(TABLE_EMAILS_PROCESSED)
        .select('id, email_row_id')
        .in('email_row_id', emailIds);

      // Map transaction IDs to emails
      if (transactions) {
        const transactionMap = new Map<string, any[]>();
        transactions.forEach((t: any) => {
          if (!transactionMap.has(t.email_row_id)) {
            transactionMap.set(t.email_row_id, []);
          }
          transactionMap.get(t.email_row_id)!.push({ id: t.id });
        });

        // Add transaction IDs to emails
        (emails as any[]).forEach((email: any) => {
          email.fb_extracted_transactions = transactionMap.get(email.id) || null;
        });
      }
    }

    console.log('📊 Database query results:', {
      count: count || 0,
      emails_found: emails?.length || 0,
      first_email_subject: (emails as any)?.[0]?.subject || 'N/A',
      first_email_from: (emails as any)?.[0]?.from_address || 'N/A',
      first_email_status: (emails as any)?.[0]?.status || 'N/A',
      page,
      pageSize
    });

    const totalPages = Math.ceil((count || 0) / pageSize);

    const response: PaginatedResponse<EmailPublic> = {
      items: emails as EmailPublic[],
      total: count || 0,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    console.log('✅ Sending response:', {
      total: response.total,
      items_count: response.items.length,
      page: response.page,
      totalPages: response.totalPages
    });

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Email search error:', error);
    
    // Handle errors with status codes
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    const code = error.code || 'UNKNOWN_ERROR';
    
    return res.status(statusCode).json({
      success: false,
      error: message,
      code,
      requiresReconnection: code === 'GMAIL_REAUTH_REQUIRED',
    });
  }
});

// Helper function to sync emails from Gmail
async function syncEmailsFromGmail(
  userId: string,
  dateFrom: string,
  dateTo: string,
  sender?: string,
  emailAddress?: string
): Promise<void> {
  console.log('🔄 syncEmailsFromGmail started:', { userId, dateFrom, dateTo, sender, emailAddress });

  // Get the user's Gmail connections
  let query = (supabaseAdmin as any)
    .from(TABLE_GMAIL_CONNECTIONS)
    .select('*')
    .eq('user_id', userId);

  // If emailAddress is provided, filter by that specific email address
  if (emailAddress) {
    query = query.eq('email_address', emailAddress);
  }

  const { data: connections, error: connError } = await query;

  console.log('📧 Gmail connections query result:', {
    connections_count: connections?.length || 0,
    error: connError,
    email_address_filter: emailAddress,
    connections: connections?.map((c: any) => ({ id: c.id, email_address: c.email_address, has_token: !!c.access_token }))
  });

  if (connError || !connections || connections.length === 0) {
    const errorMsg = emailAddress
      ? `No Gmail connection found for email address: ${emailAddress}`
      : 'No Gmail connections found';
    throw new Error(errorMsg);
  }

  // Find connection with valid token or use the first one
  const activeConnection = connections.find((c: any) => c.access_token) || connections[0];
  console.log('📧 Using Gmail connection:', {
    id: (activeConnection as any).id,
    email_address: (activeConnection as any).email_address,
    has_token: !!(activeConnection as any).access_token
  });

  if (!(activeConnection as any).access_token) {
    throw new Error('No valid access token found for Gmail connection');
  }

  // Use the active connection
  const connection = activeConnection;

  // Check if token needs refresh
  let accessToken = connection.access_token;
  if (connection.token_expiry && new Date(connection.token_expiry) <= new Date()) {
    try {
      console.log('🔑 Token expired, attempting refresh...', {
        connection_id: connection.id,
        token_expiry: connection.token_expiry,
        has_refresh_token: !!connection.refresh_token
      });

      if (!connection.refresh_token) {
        throw new Error('No refresh token available for this connection');
      }

      const refreshedTokens = await refreshAccessToken(connection.refresh_token);
      accessToken = refreshedTokens.access_token!;

      console.log('✅ Token refreshed successfully');

      // Set token expiry to 1 year from now
      const newExpiry = new Date();
      newExpiry.setFullYear(newExpiry.getFullYear() + 1);

      // Update the connection with new tokens
      await (supabaseAdmin as any)
        .from(TABLE_GMAIL_CONNECTIONS)
        .update({
          access_token: accessToken,
          token_expiry: newExpiry.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', connection.id);

      console.log('✅ Token updated in database');
    } catch (refreshError) {
      console.error('❌ Token refresh failed:', refreshError);

      // Use centralized error detection and reset
      const { isInvalidGrantError, parseGmailOAuthError } = await import('@/lib/gmail/error-handler');
      const { resetGmailConnection } = await import('@/lib/gmail/connection-reset');

      const parsedError = parseGmailOAuthError(refreshError);

      if (isInvalidGrantError(refreshError)) {
        console.log('🔒 Refresh token is invalid/expired. Resetting connection...');
        
        await resetGmailConnection(connection.id, refreshError);
        
        // Throw error with status code for handler to catch
        const error: any = new Error('GMAIL_REAUTH_REQUIRED: Your Gmail connection has expired. Please reconnect your Gmail account in Settings.');
        error.statusCode = 401;
        error.code = 'GMAIL_REAUTH_REQUIRED';
        throw error;
      }

      // Network or server errors - throw with 500 status
      const error: any = new Error(`Failed to refresh Gmail access token: ${parsedError.message}`);
      error.statusCode = 500;
      error.code = 'TOKEN_REFRESH_FAILED';
      throw error;
    }
  }

  // Build Gmail query
  let gmailQuery = `after:${dateFrom} before:${dateTo}`;
  if (sender) {
    gmailQuery += ` from:${sender}`;
  }

  console.log('📧 Gmail API query details:', {
    query: gmailQuery,
    dateFrom,
    dateTo,
    sender,
    maxResults: 100,
    connection_email: connection.email_address
  });

  // Get messages from Gmail
  const gmailResponse = await listMessages(accessToken, {
    q: gmailQuery,
    maxResults: 100, // Limit to avoid overwhelming the system
  });

  console.log('📧 Gmail API response:', {
    messages_count: gmailResponse.messages?.length || 0,
    resultSizeEstimate: gmailResponse.resultSizeEstimate,
    nextPageToken: gmailResponse.nextPageToken ? 'present' : 'none',
    first_message_id: gmailResponse.messages?.[0]?.id || 'none'
  });

  const messageIds = gmailResponse.messages?.map(m => m.id) || [];

  if (messageIds.length === 0) {
    console.log('⚠️ No messages found in Gmail for the given query');
    return; // No messages to sync
  }

  // Check which messages already exist in the database
  const { data: existingMessages } = await (supabaseAdmin as any)
    .from(TABLE_EMAILS_FETCHED)
    .select('message_id')
    .eq('user_id', userId)
    .eq('google_user_id', (connection as any).google_user_id)
    .in('message_id', messageIds);

  const existingMessageIds = new Set(existingMessages?.map((m: any) => m.message_id) || []);
  const missingIds = messageIds.filter(id => !existingMessageIds.has(id));

  console.log('📊 Message sync analysis:', {
    total_gmail_messages: messageIds.length,
    existing_in_db: existingMessageIds.size,
    missing_from_db: missingIds.length,
    will_sync: Math.min(missingIds.length, 20)
  });

  // Fetch and store missing messages
  let processedCount = 0;
  for (const messageId of missingIds.slice(0, 20)) { // Limit to 20 messages per sync
    try {
      console.log(`📧 Processing message ${processedCount + 1}/${Math.min(missingIds.length, 20)}: ${messageId}`);
      const gmailMessage = await getMessage(accessToken, messageId);

      // Extract email data
      const headers = gmailMessage.payload?.headers || [];
      const fromAddress = extractEmailFromHeaders(headers);
      const subject = extractSubjectFromHeaders(headers);
      const toAddresses = extractToAddressesFromHeaders(headers);

      // Try structured parsing first
      let plainBody = extractPlainTextBody(gmailMessage.payload);

      // If structured parsing fails or returns only short content (likely truncated),
      // fall back to raw email parsing for complete content
      if (!plainBody || plainBody.length < 500 || plainBody.includes('Email disclaimer')) {
        console.log(`📧 Structured parsing incomplete for ${messageId}, using raw parsing...`);
        try {
          const rawMessage = await getMessageRaw(accessToken, messageId);
          if (rawMessage.decodedRaw) {
            const parsedContent = parseRawEmailContent(rawMessage.decodedRaw);
            // Use the best available content: plain text, HTML, or any body content
            plainBody = parsedContent.plainTextBody ||
                       parsedContent.htmlBody ||
                       parsedContent.allBodies.join('\n\n') ||
                       plainBody; // fallback to original if all else fails

            console.log(`✅ Raw parsing successful for ${messageId}:`, {
              originalLength: extractPlainTextBody(gmailMessage.payload)?.length || 0,
              rawLength: plainBody?.length || 0,
              improvement: plainBody && extractPlainTextBody(gmailMessage.payload) ?
                plainBody.length - (extractPlainTextBody(gmailMessage.payload)?.length || 0) : 0
            });
          }
        } catch (rawError) {
          console.error(`❌ Raw parsing failed for ${messageId}:`, rawError);
          // Continue with structured parsing result
        }
      }

      // Convert Gmail internalDate (ms) to UTC timestamp
      const internalDate = gmailMessage.internalDate
        ? new Date(parseInt(gmailMessage.internalDate)).toISOString()
        : null;

      // Insert into fb_emails_fetched (status is now derived)
      await (supabaseAdmin as any)
        .from(TABLE_EMAILS_FETCHED)
        .upsert({
          user_id: userId,
          google_user_id: (connection as any).google_user_id,
          connection_id: (connection as any).id,
          email_address: connection.email_address,
          message_id: messageId,
          thread_id: gmailMessage.threadId || '',
          from_address: fromAddress,
          to_addresses: toAddresses,
          subject,
          snippet: gmailMessage.snippet,
          internal_date: internalDate,
          plain_body: plainBody,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,google_user_id,message_id',
          ignoreDuplicates: false,
        });

      processedCount++;
      console.log(`✅ Successfully processed message: ${subject || 'No subject'} from ${fromAddress || 'Unknown'}`);
    } catch (messageError) {
      console.error(`❌ Failed to sync message ${messageId}:`, messageError);
      // Continue with other messages
    }
  }

  console.log(`🎉 Gmail sync completed: ${processedCount} messages processed`);
}
