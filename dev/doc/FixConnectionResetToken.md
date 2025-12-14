# Fix Connection Reset Token - Fix Plan

## Problem Analysis

### Error: "Token refresh failed: invalid_grant"

**Root Cause:**
The `invalid_grant` error occurs when Google OAuth refresh token is:
- **Revoked** by the user (via Google Account settings)
- **Expired** (after 6 months of inactivity for unverified apps)
- **Invalidated** due to password change or security events
- **Invalid** due to OAuth client credentials mismatch

**Current State:**
Token refresh error handling is **inconsistent** across the codebase:

1. ✅ `src/lib/priority-email-processor.ts` - Marks connection as `invalid` status
2. ⚠️ `src/pages/api/emails/search.ts` - Clears tokens but doesn't set status
3. ❌ `src/lib/gmail-auto-sync/sync-executor.ts` - No error handling for invalid_grant
4. ❌ `src/pages/api/gmail/manual-sync.ts` - Returns 401 but doesn't mark connection
5. ⚠️ `src/pages/api/admin/emails/refresh.ts` - Unknown error handling

**Impact:**
- Connections with invalid refresh tokens continue to be processed
- Users don't get clear indication that reconnection is needed
- Auto-sync keeps failing silently
- Webhooks fail without proper status updates
- Inconsistent connection states in database

---

## Solution Architecture

### 1. Centralized Error Detection Utility

Create a shared utility function to:
- Detect `invalid_grant` errors consistently
- Parse Google OAuth error responses
- Return standardized error information

**Location:** `src/lib/gmail/error-handler.ts`

### 2. Centralized Connection Reset Function

Create a shared function to:
- Mark connection as `invalid` status
- Clear access_token and token_expiry
- Set last_error with detailed message
- Update updated_at timestamp
- Optionally notify user (future enhancement)

**Location:** `src/lib/gmail/connection-reset.ts`

### 3. Consistent Error Handling

Update all token refresh locations to:
- Use centralized error detection
- Use centralized connection reset
- Provide consistent error messages
- Log errors with proper context

**Files to Update:**
1. `src/lib/gmail.ts` - Improve error parsing
2. `src/lib/priority-email-processor.ts` - Use centralized reset
3. `src/pages/api/emails/search.ts` - Use centralized reset
4. `src/lib/gmail-auto-sync/sync-executor.ts` - Add error handling
5. `src/pages/api/gmail/manual-sync.ts` - Use centralized reset
6. `src/pages/api/admin/emails/refresh.ts` - Add error handling

---

## Implementation Plan

### Phase 1: Create Error Detection Utility

**File:** `src/lib/gmail/error-handler.ts`

```typescript
/**
 * Gmail OAuth Error Handler
 * 
 * Detects and categorizes Gmail OAuth errors, particularly invalid_grant errors
 * that indicate refresh token is expired/revoked/invalid.
 */

export interface GmailOAuthError {
  type: 'invalid_grant' | 'invalid_client' | 'network' | 'unknown';
  message: string;
  originalError: any;
  requiresReconnection: boolean;
}

/**
 * Detect if error is an invalid_grant error (requires reconnection)
 */
export function isInvalidGrantError(error: any): boolean {
  if (!error) return false;

  const errorMessage = error.message || error.toString() || '';
  const errorCode = error.code || '';
  const errorResponse = error.response?.data || {};

  // Check error message
  if (errorMessage.includes('invalid_grant')) return true;
  if (errorMessage.includes('Invalid Credentials')) return true;
  if (errorMessage.includes('Token has been expired or revoked')) return true;

  // Check error code
  if (errorCode === 'invalid_grant') return true;

  // Check Google API error response
  if (errorResponse.error === 'invalid_grant') return true;
  if (errorResponse.error_description?.includes('Token has been expired')) return true;
  if (errorResponse.error_description?.includes('Token has been revoked')) return true;

  return false;
}

/**
 * Parse Gmail OAuth error and return structured error information
 */
export function parseGmailOAuthError(error: any): GmailOAuthError {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  const errorCode = error?.code || '';
  const errorResponse = error?.response?.data || {};

  // Check for invalid_grant
  if (isInvalidGrantError(error)) {
    return {
      type: 'invalid_grant',
      message: errorResponse.error_description || 
               errorMessage || 
               'Refresh token is invalid, expired, or revoked',
      originalError: error,
      requiresReconnection: true,
    };
  }

  // Check for invalid_client
  if (errorCode === 'invalid_client' || 
      errorResponse.error === 'invalid_client' ||
      errorMessage.includes('invalid_client')) {
    return {
      type: 'invalid_client',
      message: 'OAuth client credentials are invalid',
      originalError: error,
      requiresReconnection: false,
    };
  }

  // Check for network errors
  if (errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ETIMEDOUT') ||
      errorMessage.includes('network')) {
    return {
      type: 'network',
      message: 'Network error while refreshing token',
      originalError: error,
      requiresReconnection: false,
    };
  }

  // Unknown error
  return {
    type: 'unknown',
    message: errorMessage,
    originalError: error,
    requiresReconnection: false,
  };
}
```

### Phase 2: Create Connection Reset Utility

**File:** `src/lib/gmail/connection-reset.ts`

```typescript
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
  error?: string;
}

/**
 * Reset a Gmail connection due to invalid refresh token
 * 
 * Marks the connection as 'invalid', clears tokens, and sets error message.
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
        error: updateError.message,
      };
    }

    console.log(`✅ [ConnectionReset] Successfully reset connection: ${connection.email_address}`, {
      connectionId,
      errorType: parsedError.type,
      requiresReconnection: parsedError.requiresReconnection,
    });

    return {
      success: true,
      connectionId,
      emailAddress: connection.email_address,
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
      .select('id, email_address')
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
```

### Phase 3: Update refreshAccessToken Function

**File:** `src/lib/gmail.ts`

```typescript
import { parseGmailOAuthError } from './gmail/error-handler';

export async function refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
  try {
    console.log('🔑 Attempting to refresh access token...');

    if (!refreshToken) {
      throw new Error('Refresh token is required');
    }

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const { credentials } = await oauth2Client.refreshAccessToken();

    console.log('✅ Access token refreshed successfully', {
      has_access_token: !!credentials.access_token,
      expires_in: (credentials as any).expires_in,
      token_type: credentials.token_type
    });

    return credentials as OAuthTokens;
  } catch (error) {
    console.error('❌ Failed to refresh access token:', error);
    
    // Parse error to provide better error messages
    const parsedError = parseGmailOAuthError(error);
    
    if (parsedError.type === 'invalid_grant') {
      // Throw error with clear message that indicates reconnection needed
      throw new Error(`Token refresh failed: invalid_grant - ${parsedError.message}`);
    }
    
    if (error instanceof Error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
    throw error;
  }
}
```

### Phase 4: Update All Token Refresh Locations

#### 4.1 Update priority-email-processor.ts

**File:** `src/lib/priority-email-processor.ts`

```typescript
import { resetGmailConnection } from '@/lib/gmail/connection-reset';
import { isInvalidGrantError } from '@/lib/gmail/error-handler';

async function getValidAccessToken(connection: any): Promise<string> {
  // ... existing token validation code ...

  try {
    const tokens = await refreshAccessToken(connection.refresh_token);
    // ... existing success handling ...
  } catch (error: any) {
    console.error(`❌ [PriorityEmailProcessor] Failed to refresh access token for ${connection.email_address}:`, {
      error: error.message,
      connectionId: connection.id,
    });

    // Use centralized error detection and reset
    if (isInvalidGrantError(error)) {
      console.log(`🔒 [PriorityEmailProcessor] Invalid grant error detected, resetting connection: ${connection.email_address}`);
      
      await resetGmailConnection(connection.id, error);
      
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }

    // Re-throw other errors
    throw new Error(`Failed to refresh access token: ${error.message}`);
  }
}
```

#### 4.2 Update emails/search.ts

**File:** `src/pages/api/emails/search.ts`

```typescript
import { resetGmailConnection } from '@/lib/gmail/connection-reset';
import { isInvalidGrantError } from '@/lib/gmail/error-handler';

async function syncEmailsFromGmail(...) {
  // ... existing code ...

  if (connection.token_expiry && new Date(connection.token_expiry) <= new Date()) {
    try {
      // ... existing refresh code ...
    } catch (refreshError) {
      console.error('❌ Token refresh failed:', refreshError);

      // Use centralized error detection and reset
      if (isInvalidGrantError(refreshError)) {
        console.log('🔒 Refresh token is invalid/expired. Resetting connection...');
        
        await resetGmailConnection(connection.id, refreshError);
        
        throw new Error('GMAIL_REAUTH_REQUIRED: Your Gmail connection has expired. Please reconnect your Gmail account in Settings.');
      }

      throw new Error(`Failed to refresh Gmail access token: ${errorMessage}`);
    }
  }
}
```

#### 4.3 Update gmail-auto-sync/sync-executor.ts

**File:** `src/lib/gmail-auto-sync/sync-executor.ts`

```typescript
import { resetGmailConnection } from '@/lib/gmail/connection-reset';
import { isInvalidGrantError } from '@/lib/gmail/error-handler';

async executeAutoSync(connection: GmailConnection): Promise<SyncResult> {
  try {
    // Step 1: Refresh token if needed
    let accessToken = connection.access_token;
    if (new Date(connection.token_expiry) <= new Date()) {
      try {
        console.log('🔑 Refreshing access token...');
        const newTokens = await refreshAccessToken(connection.refresh_token);
        accessToken = newTokens.access_token!;
        // ... existing success handling ...
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        
        // Handle invalid_grant error
        if (isInvalidGrantError(refreshError)) {
          console.log('🔒 Invalid grant error, resetting connection...');
          await resetGmailConnection(connection.id, refreshError);
          
          result.errors.push('Gmail connection expired. Please reconnect your account.');
          result.success = false;
          return result;
        }
        
        // Re-throw other errors
        throw refreshError;
      }
    }
    // ... rest of sync logic ...
  } catch (error: any) {
    // ... existing error handling ...
  }
}
```

#### 4.4 Update gmail/manual-sync.ts

**File:** `src/pages/api/gmail/manual-sync.ts`

```typescript
import { resetGmailConnection } from '@/lib/gmail/connection-reset';
import { isInvalidGrantError } from '@/lib/gmail/error-handler';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ... existing code ...

  // Check if token needs refresh
  const tokenExpiry = new Date((connection as any).token_expiry);
  const now = new Date();
  if (tokenExpiry <= now) {
    try {
      const newTokens = await refreshAccessToken((connection as any).refresh_token);
      // ... existing success handling ...
    } catch (refreshError) {
      console.error('Token refresh error:', refreshError);
      
      // Handle invalid_grant error
      if (isInvalidGrantError(refreshError)) {
        console.log('🔒 Invalid grant error, resetting connection...');
        await resetGmailConnection((connection as any).id, refreshError);
        
        return res.status(401).json({ 
          error: 'GMAIL_REAUTH_REQUIRED',
          message: 'Your Gmail connection has expired. Please reconnect your Gmail account.',
          requiresReconnection: true,
        });
      }
      
      return res.status(401).json({ error: 'Token refresh failed' });
    }
  }
  // ... rest of handler ...
}
```

#### 4.5 Update admin/emails/refresh.ts

**File:** `src/pages/api/admin/emails/refresh.ts`

```typescript
import { resetGmailConnection } from '@/lib/gmail/connection-reset';
import { isInvalidGrantError } from '@/lib/gmail/error-handler';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ... existing code ...

  try {
    // ... existing refresh logic ...
    if (connection.token_expiry && new Date(connection.token_expiry) <= new Date()) {
      try {
        const refreshed = await refreshAccessToken(connection.refresh_token);
        // ... existing success handling ...
      } catch (refreshError) {
        console.error('Token refresh error:', refreshError);
        
        // Handle invalid_grant error
        if (isInvalidGrantError(refreshError)) {
          console.log('🔒 Invalid grant error, resetting connection...');
          await resetGmailConnection(connection.id, refreshError);
          
          return res.status(401).json({
            error: 'GMAIL_REAUTH_REQUIRED',
            message: 'Gmail connection expired. Please reconnect.',
            connectionId: connection.id,
            emailAddress: connection.email_address,
          });
        }
        
        throw refreshError;
      }
    }
    // ... rest of handler ...
  } catch (error) {
    // ... existing error handling ...
  }
}
```

---

## Testing Plan

### Unit Tests

1. **Error Detection Tests**
   - Test `isInvalidGrantError()` with various error formats
   - Test `parseGmailOAuthError()` with different error types
   - Verify error message extraction

2. **Connection Reset Tests**
   - Test `resetGmailConnection()` with valid connection ID
   - Test with invalid connection ID
   - Verify database updates
   - Verify error logging

### Integration Tests

1. **Token Refresh Flow**
   - Test refresh with valid token
   - Test refresh with invalid_grant error
   - Verify connection reset on invalid_grant
   - Verify error propagation

2. **Email Sync Flow**
   - Test sync with expired token (valid refresh)
   - Test sync with invalid_grant error
   - Verify connection reset and error response

3. **Auto-Sync Flow**
   - Test auto-sync with invalid_grant error
   - Verify connection reset
   - Verify sync result indicates failure

### Manual Testing

1. **Simulate invalid_grant Error**
   - Revoke refresh token in Google Account
   - Attempt email sync
   - Verify connection marked as invalid
   - Verify error message in UI

2. **Test Reconnection Flow**
   - After connection reset, attempt reconnect
   - Verify new tokens stored
   - Verify status changes to 'active'
   - Verify sync works after reconnect

---

## Database Schema Verification

Ensure `fb_gmail_connections` table has:
- ✅ `status` column (TEXT) - Values: 'active', 'invalid', 'disconnected'
- ✅ `last_error` column (TEXT) - Stores error messages
- ✅ `access_token` column (TEXT, nullable) - Cleared on reset
- ✅ `token_expiry` column (TIMESTAMP, nullable) - Cleared on reset
- ✅ `refresh_token` column (TEXT, nullable) - Cleared on reset (security)
- ✅ `updated_at` column (TIMESTAMP) - Updated on reset

**Migration Check:**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'fb_gmail_connections'
  AND column_name IN ('status', 'last_error', 'access_token', 'token_expiry', 'refresh_token', 'updated_at');
```

---

## Rollout Plan

### Phase 1: Create Utilities (Low Risk)
1. Create `src/lib/gmail/error-handler.ts`
2. Create `src/lib/gmail/connection-reset.ts`
3. Add unit tests
4. Deploy and verify

### Phase 2: Update Core Function (Medium Risk)
1. Update `src/lib/gmail.ts` refreshAccessToken
2. Test token refresh flow
3. Deploy and monitor

### Phase 3: Update All Callers (Medium Risk)
1. Update `priority-email-processor.ts`
2. Update `emails/search.ts`
3. Update `gmail-auto-sync/sync-executor.ts`
4. Update `gmail/manual-sync.ts`
5. Update `admin/emails/refresh.ts`
6. Test each integration
7. Deploy incrementally

### Phase 4: Monitoring & Validation
1. Monitor error logs for invalid_grant errors
2. Verify connections are reset correctly
3. Check database for proper status updates
4. Validate user experience (error messages)

---

## Success Criteria

✅ **All token refresh locations handle invalid_grant consistently**
✅ **Connections are marked as 'invalid' when refresh fails**
✅ **Tokens are cleared on reset (security)**
✅ **Error messages are clear and actionable**
✅ **No silent failures - all errors logged**
✅ **Users can reconnect after connection reset**
✅ **Auto-sync gracefully handles invalid connections**

---

## Future Enhancements

1. **User Notifications**
   - Email notification when connection becomes invalid
   - Push notification for mobile app
   - In-app banner/alert

2. **Automatic Retry Logic**
   - Exponential backoff before marking invalid
   - Retry with different strategies
   - Network error vs invalid_grant distinction

3. **Connection Health Dashboard**
   - Show connection status in UI
   - Last sync time
   - Error history
   - Quick reconnect button

4. **Metrics & Monitoring**
   - Track invalid_grant error rate
   - Connection reset frequency
   - Average time to reconnect
   - Alert on high error rate

---

## Related Documentation

- [Gmail Token Error Handling](../readmes/GMAIL_TOKEN_ERROR_HANDLING.md)
- [Gmail Auto-Sync Architecture](../docs/GMAIL_AUTO_SYNC_ARCHITECTURE.md)
- [Authentication Guide](../docs/AUTHENTICATION.md)

---

**Created:** 2025-01-03
**Status:** Ready for Implementation
**Priority:** High
**Estimated Effort:** 4-6 hours
