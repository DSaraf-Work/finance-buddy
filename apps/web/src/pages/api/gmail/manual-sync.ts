import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { 
  listMessages, 
  getMessage, 
  refreshAccessToken,
  extractEmailFromHeaders,
  extractSubjectFromHeaders,
  extractToAddressesFromHeaders,
  extractPlainTextBody
} from '@/lib/gmail';
import { 
  ManualSyncRequest, 
  ManualSyncResponse, 
  EmailPublic 
} from '@finance-buddy/shared';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      connection_id,
      date_from,
      date_to,
      senders = [],
      page = 1,
      pageSize = 50,
      sort = 'asc'
    }: ManualSyncRequest = req.body;

    // Validate required fields
    if (!connection_id || !date_from || !date_to) {
      return res.status(400).json({ 
        error: 'connection_id, date_from, and date_to are required' 
      });
    }

    // Validate page size
    if (pageSize > 100) {
      return res.status(400).json({ error: 'pageSize cannot exceed 100' });
    }

    // Get connection with token refresh if needed
    const { data: connection, error: connError } = await (supabaseAdmin as any)
      .from('fb_gmail_connections')
      .select('*')
      .eq('id', connection_id)
      .eq('user_id', user.id)
      .single();

    if (connError || !connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    let accessToken = (connection as any).access_token;

    // Check if token needs refresh
    const tokenExpiry = new Date((connection as any).token_expiry);
    const now = new Date();
    if (tokenExpiry <= now) {
      try {
        const newTokens = await refreshAccessToken((connection as any).refresh_token);
        accessToken = newTokens.access_token!;
        
        // Update token in database
        const newExpiry = new Date();
        newExpiry.setSeconds(newExpiry.getSeconds() + (newTokens.expires_in || 3600));
        
        await (supabaseAdmin as any)
          .from('fb_gmail_connections')
          .update({
            access_token: accessToken,
            token_expiry: newExpiry.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', connection_id);
      } catch (refreshError) {
        console.error('Token refresh error:', refreshError);
        return res.status(401).json({ error: 'Token refresh failed' });
      }
    }

    // Build Gmail query
    let gmailQuery = `after:${date_from} before:${date_to}`;
    if (senders.length > 0) {
      const senderQuery = senders.map(sender => `from:${sender}`).join(' OR ');
      gmailQuery += ` (${senderQuery})`;
    }

    // Step 1: Get messages from Gmail (newest-first by default)
    const gmailResponse = await listMessages(accessToken, {
      q: gmailQuery,
      maxResults: 500, // Get more than needed for pagination
    });

    const messageIds = gmailResponse.messages?.map(m => m.id) || [];
    
    if (messageIds.length === 0) {
      const response: ManualSyncResponse = {
        items: [],
        stats: { probed: 0, fetched: 0, upserts: 0 }
      };
      return res.status(200).json(response);
    }

    // Step 2: Reverse to oldest-first and slice for page
    const reversedIds = [...messageIds].reverse();
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageIds = reversedIds.slice(startIndex, endIndex);

    // Step 3: Probe DB for existing messages
    const { data: existingMessages, error: probeError } = await (supabaseAdmin as any)
      .from('fb_emails')
      .select('message_id')
      .eq('user_id', user.id)
      .eq('google_user_id', (connection as any).google_user_id)
      .in('message_id', pageIds);

    if (probeError) {
      console.error('Database probe error:', probeError);
      return res.status(500).json({ error: 'Database probe failed' });
    }

    const existingMessageIds = new Set(existingMessages.map((m: any) => m.message_id));
    const missingIds = pageIds.filter(id => !existingMessageIds.has(id));

    let fetchedCount = 0;
    let upsertCount = 0;

    // Step 4: Fetch missing messages from Gmail
    for (const messageId of missingIds) {
      try {
        const gmailMessage = await getMessage(accessToken, messageId);
        fetchedCount++;

        // Extract email data
        const headers = gmailMessage.payload?.headers || [];
        const fromAddress = extractEmailFromHeaders(headers);
        const subject = extractSubjectFromHeaders(headers);
        const toAddresses = extractToAddressesFromHeaders(headers);
        const plainBody = extractPlainTextBody(gmailMessage.payload);

        // Convert Gmail internalDate (ms) to UTC timestamp
        const internalDate = gmailMessage.internalDate 
          ? new Date(parseInt(gmailMessage.internalDate)).toISOString()
          : null;

        // Step 5: Upsert into fb_emails
        const { error: upsertError } = await (supabaseAdmin as any)
          .from('fb_emails')
          .upsert({
            user_id: user.id,
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

        if (upsertError) {
          console.error('Upsert error for message', messageId, ':', upsertError);
        } else {
          upsertCount++;
        }
      } catch (fetchError) {
        console.error('Error fetching message', messageId, ':', fetchError);
      }
    }

    // Update last sync time
    await (supabaseAdmin as any)
      .from('fb_gmail_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection_id);

    // Step 6: Return results with proper ordering
    const { data: resultEmails, error: resultError } = await (supabaseAdmin as any)
      .from('fb_emails')
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
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .eq('google_user_id', connection.google_user_id)
      .in('message_id', pageIds)
      .order('internal_date', { ascending: sort === 'asc' });

    if (resultError) {
      console.error('Result fetch error:', resultError);
      return res.status(500).json({ error: 'Failed to fetch results' });
    }

    // Determine if there are more pages
    const hasMore = endIndex < reversedIds.length;
    const nextPageToken = hasMore ? `page_${page + 1}` : undefined;

    const response: ManualSyncResponse = {
      items: resultEmails as EmailPublic[],
      nextPageToken,
      stats: {
        probed: pageIds.length,
        fetched: fetchedCount,
        upserts: upsertCount,
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Manual sync error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
