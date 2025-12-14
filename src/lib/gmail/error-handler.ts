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
      errorMessage.includes('network') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('ECONNRESET')) {
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
