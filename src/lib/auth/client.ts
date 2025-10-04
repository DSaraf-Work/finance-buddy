/**
 * Client-side Authentication Utilities
 * 
 * This module provides client-side authentication helpers using Supabase.
 * It handles user authentication, session management, and provides
 * a clean interface for client-side auth operations.
 * 
 * @module auth/client
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '../supabase-server';

/**
 * Create a Supabase client for the authenticated user
 * 
 * This creates a Supabase client that uses the user's session
 * from cookies, enabling Row Level Security (RLS) enforcement.
 * 
 * @param req - Next.js API request
 * @param res - Next.js API response
 * @returns Supabase client with user session
 */
export function createUserClient(req: NextApiRequest, res: NextApiResponse) {
  return createClient(req, res);
}

/**
 * Get the user's access token from the session
 * 
 * Useful for making authenticated requests to external APIs
 * or services that require the user's access token.
 * 
 * @param req - Next.js API request
 * @param res - Next.js API response
 * @returns Access token or null
 */
export async function getUserAccessToken(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<string | null> {
  try {
    const supabase = createClient(req, res);
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      return null;
    }

    return session.access_token;
  } catch (error) {
    console.error('[Auth] Error getting access token:', error);
    return null;
  }
}

/**
 * Refresh the user's session
 * 
 * Attempts to refresh the user's session using the refresh token.
 * This is useful for long-running operations or when the access
 * token has expired.
 * 
 * @param req - Next.js API request
 * @param res - Next.js API response
 * @returns True if refresh was successful
 */
export async function refreshUserSession(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<boolean> {
  try {
    const supabase = createClient(req, res);
    const { data, error } = await supabase.auth.refreshSession();

    if (error || !data.session) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Auth] Error refreshing session:', error);
    return false;
  }
}

