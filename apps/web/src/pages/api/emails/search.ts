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
} from '@finance-buddy/shared';

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
      email_address = 'dheerajsaraf1996@gmail.com', // Default account filter
      date_from,
      date_to,
      sender = 'alerts@dcbbank.com', // Default sender filter
      status,
      q,
      page = 1,
      pageSize = 50,
      sort = 'asc',
      db_only = false
    }: EmailSearchRequest = req.body;

    // Validate page size
    if (pageSize > 100) {
      return res.status(400).json({ error: 'pageSize cannot exceed 100' });
    }

    // If db_only is false, sync with Gmail API first
    if (!db_only && date_from && date_to) {
      console.log('📧 Starting Gmail sync:', {
        user_id: user.id,
        date_from,
        date_to,
        sender,
        email_address
      });
      try {
        await syncEmailsFromGmail(user.id, date_from, date_to, sender);
        console.log('✅ Gmail sync completed successfully');
      } catch (gmailError) {
        console.error('❌ Gmail sync error (continuing with DB-only search):', gmailError);
        // Continue with database search even if Gmail sync fails
      }
    } else {
      console.log('🗄️ Skipping Gmail sync - using database only:', { db_only, date_from, date_to });
    }

    // Build query
    console.log('🔍 Building database query with filters:', {
      user_id: user.id,
      google_user_id,
      email_address,
      date_from,
      date_to,
      sender,
      status,
      q,
      page,
      pageSize
    });

    let query = (supabaseAdmin as any)
      .from('fb_emails_with_status')
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
        status,
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

    if (email_address) {
      query = query.eq('email_address', email_address);
    }

    if (date_from) {
      query = query.gte('internal_date', `${date_from}T00:00:00Z`);
    }

    if (date_to) {
      query = query.lte('internal_date', `${date_to}T23:59:59Z`);
    }

    if (sender) {
      query = query.ilike('from_address', `%${sender}%`);
    }

    if (status) {
      query = query.eq('status', status);
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
    const { data: emails, error, count } = await query;

    if (error) {
      console.error('❌ Email search error:', error);
      return res.status(500).json({ error: 'Failed to search emails' });
    }

    console.log('📊 Database query results:', {
      count: count || 0,
      emails_found: emails?.length || 0,
      first_email_subject: (emails as any)?.[0]?.subject || 'N/A',
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
  } catch (error) {
    console.error('Email search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to sync emails from Gmail
async function syncEmailsFromGmail(
  userId: string,
  dateFrom: string,
  dateTo: string,
  sender?: string
): Promise<void> {
  console.log('🔄 syncEmailsFromGmail started:', { userId, dateFrom, dateTo, sender });

  // Get the user's Gmail connections
  const { data: connections, error: connError } = await (supabaseAdmin as any)
    .from('fb_gmail_connections')
    .select('*')
    .eq('user_id', userId);

  console.log('📧 Gmail connections query result:', {
    connections_count: connections?.length || 0,
    error: connError,
    connections: connections?.map((c: any) => ({ id: c.id, email_address: c.email_address, has_token: !!c.access_token }))
  });

  if (connError || !connections || connections.length === 0) {
    throw new Error('No Gmail connections found');
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
      const refreshedTokens = await refreshAccessToken(connection.refresh_token);
      accessToken = refreshedTokens.access_token!;

      // Update the connection with new tokens
      await (supabaseAdmin as any)
        .from('fb_gmail_connections')
        .update({
          access_token: accessToken,
          token_expiry: (refreshedTokens as any).expiry_date
            ? new Date((refreshedTokens as any).expiry_date).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', connection.id);
    } catch (refreshError) {
      throw new Error('Failed to refresh Gmail access token');
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
    .from('fb_emails')
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

      // Insert into fb_emails (status is now derived)
      await (supabaseAdmin as any)
        .from('fb_emails')
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
