/**
 * Shared Gmail email storage utility
 *
 * Fetches Gmail messages and persists them to the DB.
 * Used by both manual-sync and auto-sync so neither needs to call the other
 * over HTTP (which would require auth cookies and a matching API contract).
 */

import { supabaseAdmin } from '@/lib/supabase';
import {
  getEnhancedMessage,
  extractEmailFromHeaders,
  extractSubjectFromHeaders,
  extractToAddressesFromHeaders,
} from '@/lib/gmail';
import { TABLE_EMAILS_FETCHED } from '@/lib/constants/database';

export interface StorageConnection {
  id: string;
  user_id: string;
  google_user_id: string;
  email_address: string;
}

export interface FetchAndStoreResult {
  fetched: number;
  upserted: number;
}

/**
 * Fetch a list of Gmail messages and upsert them into the database.
 *
 * Errors on individual messages are caught and logged so a single bad
 * message never aborts the whole batch.
 */
export async function fetchAndStoreMessages(
  accessToken: string,
  messageIds: string[],
  connection: StorageConnection
): Promise<FetchAndStoreResult> {
  let fetched = 0;
  let upserted = 0;

  for (const messageId of messageIds) {
    try {
      const enhancedResult = await getEnhancedMessage(accessToken, messageId);
      fetched++;

      const headers = enhancedResult.message.payload?.headers || [];
      const fromAddress = extractEmailFromHeaders(headers);
      const subject = extractSubjectFromHeaders(headers);
      const toAddresses = extractToAddressesFromHeaders(headers);
      const plainBody = enhancedResult.content;

      const internalDate = enhancedResult.message.internalDate
        ? new Date(parseInt(enhancedResult.message.internalDate)).toISOString()
        : null;

      const { error: upsertError } = await (supabaseAdmin as any)
        .from(TABLE_EMAILS_FETCHED)
        .upsert(
          {
            user_id: connection.user_id,
            google_user_id: connection.google_user_id,
            connection_id: connection.id,
            email_address: connection.email_address,
            message_id: messageId,
            thread_id: enhancedResult.message.threadId || '',
            from_address: fromAddress,
            to_addresses: toAddresses,
            subject,
            snippet: enhancedResult.message.snippet,
            internal_date: internalDate,
            plain_body: plainBody,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,google_user_id,message_id',
            ignoreDuplicates: false,
          }
        );

      if (upsertError) {
        console.error(`Upsert error for message ${messageId}:`, upsertError);
      } else {
        upserted++;
      }
    } catch (fetchError) {
      console.error(`Error fetching message ${messageId}:`, fetchError);
    }
  }

  return { fetched, upserted };
}
