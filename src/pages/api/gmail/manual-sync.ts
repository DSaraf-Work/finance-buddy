import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  TABLE_EMAILS_FETCHED,
  TABLE_GMAIL_CONNECTIONS
} from '@/lib/constants/database';
import {
  listMessages,
  refreshAccessToken,
} from '@/lib/gmail';
import { fetchAndStoreMessages } from '@/lib/gmail/email-storage';
import {
  ManualSyncRequest,
  ManualSyncResponse,
  EmailPublic
} from '@/types';

/** Refresh tokens this many milliseconds before actual expiry (Bug 4 fix). */
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

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
      .from(TABLE_GMAIL_CONNECTIONS)
      .select('*')
      .eq('id', connection_id)
      .eq('user_id', user.id)
      .single();

    if (connError || !connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    let accessToken = (connection as any).access_token;

    // Check if token needs refresh.
    // Bug 4 fix: refresh 5 minutes before actual expiry to avoid mid-sync 401s.
    const tokenExpiry = new Date((connection as any).token_expiry);
    if (tokenExpiry <= new Date(Date.now() + TOKEN_REFRESH_BUFFER_MS)) {
      try {
        const newTokens = await refreshAccessToken((connection as any).refresh_token);
        accessToken = newTokens.access_token!;

        // Bug 1 fix: use the actual expiry Google returns instead of a fake +1 year.
        // expiry_date is an epoch-ms timestamp; fall back to expires_in (seconds) if absent.
        const newExpiry = newTokens.expiry_date
          ? new Date(newTokens.expiry_date)
          : new Date(Date.now() + (newTokens.expires_in ?? 3600) * 1000);

        // Bug 2 fix: persist a new refresh_token if Google issued one (token rotation).
        const tokenUpdate: Record<string, string> = {
          access_token: accessToken,
          token_expiry: newExpiry.toISOString(),
          updated_at: new Date().toISOString(),
        };
        if (newTokens.refresh_token) {
          tokenUpdate.refresh_token = newTokens.refresh_token;
        }

        await (supabaseAdmin as any)
          .from(TABLE_GMAIL_CONNECTIONS)
          .update(tokenUpdate)
          .eq('id', connection_id);
      } catch (refreshError) {
        console.error('Token refresh error:', refreshError);
        
        const { isInvalidGrantError, parseGmailOAuthError } = await import('@/lib/gmail/error-handler');
        const { resetGmailConnection } = await import('@/lib/gmail/connection-reset');
        
        const parsedError = parseGmailOAuthError(refreshError);
        
        // Handle invalid_grant error - return 401 (Unauthorized)
        if (isInvalidGrantError(refreshError)) {
          console.log('🔒 Invalid grant error, resetting connection...');
          await resetGmailConnection((connection as any).id, refreshError);
          
          return res.status(401).json({ 
            success: false,
            error: 'GMAIL_REAUTH_REQUIRED',
            message: 'Your Gmail connection has expired. Please reconnect your Gmail account.',
            requiresReconnection: true,
            code: 'GMAIL_REAUTH_REQUIRED',
          });
        }
        
        // Network or server errors - return 500 (Internal Server Error)
        return res.status(500).json({ 
          success: false,
          error: 'TOKEN_REFRESH_FAILED',
          message: `Failed to refresh token: ${parsedError.message}`,
          code: 'TOKEN_REFRESH_FAILED',
        });
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
      .from(TABLE_EMAILS_FETCHED)
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

    // Step 4 + 5: Fetch missing messages from Gmail and store them.
    const { fetched: fetchedCount, upserted: upsertCount } = await fetchAndStoreMessages(
      accessToken,
      missingIds,
      {
        id: (connection as any).id,
        user_id: user.id,
        google_user_id: (connection as any).google_user_id,
        email_address: (connection as any).email_address,
      }
    );

    // Update last sync time
    await (supabaseAdmin as any)
      .from(TABLE_GMAIL_CONNECTIONS)
      .update({
        last_sync_at: new Date().toISOString(),
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection_id);

    // Step 6: Return results with proper ordering
    const { data: resultEmails, error: resultError } = await (supabaseAdmin as any)
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
