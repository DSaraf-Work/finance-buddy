/**
 * Authentication Module
 * 
 * This module provides a clean, modular authentication system using
 * Supabase SSR for Next.js API routes. It handles session management,
 * user authentication, and provides utilities for both server and client.
 * 
 * @module auth
 * 
 * @example
 * ```typescript
 * // Protect an API route
 * import { withAuth } from '@/lib/auth';
 * 
 * export default withAuth(async (req, res, user) => {
 *   res.json({ userId: user.id, email: user.email });
 * });
 * ```
 * 
 * @example
 * ```typescript
 * // Manual authentication check
 * import { requireAuth } from '@/lib/auth';
 * 
 * export default async function handler(req, res) {
 *   const user = await requireAuth(req, res);
 *   if (!user) return; // 401 already sent
 *   
 *   // Continue with authenticated logic
 * }
 * ```
 */

// Middleware exports
export {
  withAuth,
  requireAuth,
  getAuthUser,
  type AuthUser,
  type AuthenticatedHandler,
} from './middleware';

// Client utilities exports
export {
  createUserClient,
  getUserAccessToken,
  refreshUserSession,
} from './client';

