/**
 * Gmail Connection Reset Utility
 * 
 * Handles resetting Gmail connections when refresh tokens become invalid.
 * Marks connections as 'invalid' and clears token data.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { TABLE_GMAIL_CONNECTIONS } from '@/lib/constants/database';
import { parseGmailOAuthError, GmailOAuthError } from './error-handler';

export interface ConnectionResetResult {
  success: boolean;
  connectionId: string;
  emailAddress: string;
  userId?: string;
  error?: string;
}

/**
 * Reset a Gmail connection due to invalid refresh token
 * 
 * Marks the connection as 'invalid', clears tokens, and sets error message.
 * Sends push notification to user for critical alerts.
 * 
 * @param connectionId - The connection ID to reset
 * @param error - The error that triggered the reset
 * @returns Result of the reset operation
 */
export async function resetGmailConnection(
  connectionId: string,
  error: any
): Promise<ConnectionResetResult> {
  try {
    console.log(`🔒 [ConnectionReset] Resetting Gmail connection: ${connectionId}`);

    // Parse error to get detailed message
    const parsedError: GmailOAuthError = parseGmailOAuthError(error);
    
    // Get connection details before reset
    const { data: connection, error: fetchError } = await (supabaseAdmin as any)
      .from(TABLE_GMAIL_CONNECTIONS)
      .select('id, email_address, user_id')
      .eq('id', connectionId)
      .single();

    if (fetchError || !connection) {
      console.error(`❌ [ConnectionReset] Connection not found: ${connectionId}`, fetchError);
      return {
        success: false,
        connectionId,
        emailAddress: 'unknown',
        error: fetchError?.message || 'Connection not found',
      };
    }

    // Reset connection
    const { error: updateError } = await (supabaseAdmin as any)
      .from(TABLE_GMAIL_CONNECTIONS)
      .update({
        status: 'invalid',
        access_token: null,
        token_expiry: null,
        refresh_token: null, // Clear refresh token for security
        last_error: parsedError.message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId);

    if (updateError) {
      console.error(`❌ [ConnectionReset] Failed to reset connection: ${connectionId}`, updateError);
      return {
        success: false,
        connectionId,
        emailAddress: connection.email_address,
        userId: connection.user_id,
        error: updateError.message,
      };
    }

    console.log(`✅ [ConnectionReset] Successfully reset connection: ${connection.email_address}`, {
      connectionId,
      errorType: parsedError.type,
      requiresReconnection: parsedError.requiresReconnection,
    });

    // Send push notification for critical alerts (invalid_grant)
    if (parsedError.requiresReconnection && connection.user_id) {
      try {
        const { PushManager } = await import('@/lib/push/push-manager');
        await PushManager.sendToUser(connection.user_id, {
          title: 'Gmail Connection Expired',
          body: `Your Gmail connection (${connection.email_address}) has expired. Please reconnect in Settings.`,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          data: {
            type: 'gmail_connection_expired',
            connectionId: connection.id,
            emailAddress: connection.email_address,
            action: 'reconnect',
            url: '/settings',
            tag: 'gmail-connection-expired',
          },
        });
        console.log(`📢 [ConnectionReset] Push notification sent to user: ${connection.user_id}`);
      } catch (pushError) {
        console.error(`⚠️ [ConnectionReset] Failed to send push notification:`, pushError);
        // Don't fail the reset if push notification fails
      }
    }

    return {
      success: true,
      connectionId,
      emailAddress: connection.email_address,
      userId: connection.user_id,
    };
  } catch (error: any) {
    console.error(`❌ [ConnectionReset] Unexpected error resetting connection: ${connectionId}`, error);
    return {
      success: false,
      connectionId,
      emailAddress: 'unknown',
      error: error.message || 'Unexpected error',
    };
  }
}

/**
 * Reset connection by email address (useful when connection ID is unknown)
 */
export async function resetGmailConnectionByEmail(
  emailAddress: string,
  userId: string,
  error: any
): Promise<ConnectionResetResult> {
  try {
    // Find connection by email and user
    const { data: connection, error: fetchError } = await (supabaseAdmin as any)
      .from(TABLE_GMAIL_CONNECTIONS)
      .select('id, email_address, user_id')
      .eq('email_address', emailAddress)
      .eq('user_id', userId)
      .single();

    if (fetchError || !connection) {
      return {
        success: false,
        connectionId: 'unknown',
        emailAddress,
        error: fetchError?.message || 'Connection not found',
      };
    }

    return await resetGmailConnection(connection.id, error);
  } catch (error: any) {
    return {
      success: false,
      connectionId: 'unknown',
      emailAddress,
      error: error.message || 'Unexpected error',
    };
  }
}
