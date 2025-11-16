# Gmail Token Error Handling

## Overview

This document explains how Finance Buddy handles Gmail OAuth token errors, particularly "Invalid Credentials" errors that occur when tokens are revoked or expired.

---

## Problem Statement

**Error**: `Invalid Credentials`

**Cause**: Gmail OAuth refresh token has been:
- Revoked by the user (via Google Account settings)
- Expired (after 6 months of inactivity for unverified apps)
- Invalidated due to password change or security events

**Impact**: The system cannot fetch emails from Gmail for this connection.

---

## Solution Architecture

### 1. Automatic Error Detection

When processing emails (webhook or cron), the system:

1. Checks if access token is valid (not expired)
2. If expired, attempts to refresh using refresh token
3. If refresh fails with "Invalid Credentials", marks connection as invalid

**Location**: `src/lib/priority-email-processor.ts` → `getValidAccessToken()`

### 2. Database Schema

**Table**: `fb_gmail_connections`

**New Column**: `status` (TEXT)

**Possible Values**:
- `active` - Connection is working normally
- `invalid` - Credentials revoked/expired, user needs to reconnect
- `disconnected` - User manually disconnected

**Additional Fields**:
- `last_error` - Error message from last failed operation
- `updated_at` - Timestamp of last update

### 3. Error Handling Flow

```
Email Processing Request
    ↓
Check Access Token Validity
    ↓
Token Expired? → Yes → Refresh Token
    ↓                       ↓
    No                  Success? → Yes → Continue Processing
    ↓                       ↓
Continue Processing         No
                            ↓
                    Detect Error Type
                            ↓
                    "Invalid Credentials"?
                            ↓
                        Yes → Mark Connection as 'invalid'
                            ↓
                        Update last_error field
                            ↓
                        Return Error to Caller
```

---

## Implementation Details

### Token Refresh Error Handling

**File**: `src/lib/priority-email-processor.ts`

```typescript
try {
  const tokens = await refreshAccessToken(connection.refresh_token);
  // Update connection with new token
} catch (error) {
  // Check if credentials are revoked
  if (error.message?.includes('Invalid Credentials') || 
      error.message?.includes('invalid_grant') ||
      error.message?.includes('Token has been expired or revoked')) {
    
    // Mark connection as invalid
    await supabaseAdmin
      .from('fb_gmail_connections')
      .update({
        status: 'invalid',
        last_error: error.message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id);
  }
  
  throw error;
}
```

### Webhook Response

**File**: `src/pages/api/webhooks/gmail-pubsub.ts`

When webhook receives "Invalid Credentials" error:

```json
{
  "success": false,
  "message": "Gmail connection credentials are invalid - user needs to reconnect",
  "error": "Invalid Credentials",
  "credentialError": true,
  "data": {
    "emailAddress": "user@gmail.com",
    "connectionId": "uuid",
    "messageId": "19a87b10cfb9cb5c"
  }
}
```

**HTTP Status**: 200 (to acknowledge receipt and prevent retries)

---

## User Impact

### What Happens

1. ❌ **Email sync stops** for this Gmail connection
2. ❌ **Webhooks fail** for new emails
3. ❌ **Auto-sync fails** for this connection
4. ✅ **Other connections continue working** (isolated failure)

### User Action Required

**User must reconnect their Gmail account**:

1. Navigate to Gmail Connections page
2. See connection marked as "Invalid" with error message
3. Click "Reconnect" button
4. Complete OAuth flow again
5. New tokens are stored, status changes to "active"

---

## Monitoring & Debugging

### Check Invalid Connections

```sql
SELECT 
  email_address,
  status,
  last_error,
  updated_at
FROM fb_gmail_connections
WHERE status = 'invalid'
ORDER BY updated_at DESC;
```

### Check Recent Errors

```sql
SELECT 
  email_address,
  last_error,
  last_sync_at,
  updated_at
FROM fb_gmail_connections
WHERE last_error IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;
```

### Check All Connection Statuses

```sql
SELECT 
  status,
  COUNT(*) as count
FROM fb_gmail_connections
GROUP BY status;
```

---

## Error Messages Reference

| Error Message | Cause | Action |
|--------------|-------|--------|
| `Invalid Credentials` | Token revoked by user | Reconnect |
| `invalid_grant` | Token expired or invalid | Reconnect |
| `Token has been expired or revoked` | Token no longer valid | Reconnect |

---

## Prevention Strategies

### For Verified Apps (Recommended for Production)

- ✅ Tokens don't expire after 6 months
- ✅ More reliable for production use
- ✅ Better user experience
- ❌ Requires Google OAuth verification process

### For Unverified Apps (Current State)

- ✅ Quick setup for development
- ✅ No verification required
- ❌ Tokens expire after 6 months of inactivity
- ❌ Users must reconnect periodically

---

## Future Enhancements

- [ ] Email notification to user when connection becomes invalid
- [ ] Push notification when connection fails
- [ ] Auto-retry with exponential backoff before marking invalid
- [ ] Dashboard alert/banner for invalid connections
- [ ] Automatic cleanup of old invalid connections (after 30 days)
- [ ] Metrics tracking for token refresh failures
- [ ] Health check endpoint for connection status

---

## Related Documentation

- [Gmail Auto-Sync Architecture](../docs/GMAIL_AUTO_SYNC_ARCHITECTURE.md)
- [Gmail Pub/Sub Webhook Testing](../docs/GMAIL_PUBSUB_WEBHOOK_TESTING.md)
- [Authentication Guide](../docs/AUTHENTICATION.md)
- [Security Documentation](../docs/SECURITY.md)

---

**Last Updated**: 2025-11-16
**Version**: 1.0.0

