/**
 * Authentication Middleware for API Routes
 * 
 * This module provides authentication middleware using Supabase SSR.
 * It handles session management, user authentication, and provides
 * a clean interface for protecting API routes.
 * 
 * @module auth/middleware
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '../supabase-server';

/**
 * Authenticated user information
 */
export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Handler function that receives authenticated user
 */
export type AuthenticatedHandler<T = any> = (
  req: NextApiRequest,
  res: NextApiResponse,
  user: AuthUser
) => Promise<T> | T;

/**
 * Get the authenticated user from the request
 * 
 * Uses Supabase SSR to retrieve the user from the session cookies.
 * Returns null if no valid session exists.
 * 
 * @param req - Next.js API request
 * @param res - Next.js API response
 * @returns Authenticated user or null
 */
export async function getAuthUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthUser | null> {
  try {
    const supabase = createClient(req, res);
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user || !user.email) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
    };
  } catch (error) {
    console.error('[Auth] Error getting user:', error);
    return null;
  }
}

/**
 * Require authentication for an API route
 * 
 * Returns the authenticated user or sends a 401 response.
 * Use this when you need to manually handle authentication.
 * 
 * @param req - Next.js API request
 * @param res - Next.js API response
 * @returns Authenticated user or null (with 401 response sent)
 */
export async function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthUser | null> {
  const user = await getAuthUser(req, res);
  
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  
  return user;
}

/**
 * Higher-order function to protect API routes with authentication
 * 
 * Wraps an API handler to automatically check authentication.
 * If the user is not authenticated, returns 401.
 * If authenticated, calls the handler with the user object.
 * 
 * @example
 * ```typescript
 * export default withAuth(async (req, res, user) => {
 *   // user is guaranteed to be authenticated here
 *   res.json({ userId: user.id });
 * });
 * ```
 * 
 * @param handler - The API handler to protect
 * @returns Protected API handler
 */
export function withAuth<T = any>(
  handler: AuthenticatedHandler<T>
): (req: NextApiRequest, res: NextApiResponse) => Promise<void> {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = await requireAuth(req, res);
    if (!user) {
      // requireAuth already sent 401 response
      return;
    }

    try {
      await handler(req, res, user);
    } catch (error) {
      console.error('[Auth] Handler error:', error);
      
      // Don't send error response if headers already sent
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  };
}

