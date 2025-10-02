import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from './supabase';

const COOKIE_NAME = process.env.COOKIE_NAME || 'fb_session';
const COOKIE_MAX_AGE = 6 * 30 * 24 * 60 * 60; // 6 months in seconds

export interface AuthUser {
  id: string;
  email: string;
}

export async function getAuthUser(req: NextApiRequest): Promise<AuthUser | null> {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token) {
      return null;
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export function setAuthCookie(res: NextApiResponse, token: string) {
  res.setHeader('Set-Cookie', [
    `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}; Path=/`,
  ]);
}

export function clearAuthCookie(res: NextApiResponse) {
  res.setHeader('Set-Cookie', [
    `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`,
  ]);
}

export async function requireAuth(req: NextApiRequest, res: NextApiResponse): Promise<AuthUser | null> {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return user;
}

export function withAuth<T = any>(
  handler: (req: NextApiRequest, res: NextApiResponse, user: AuthUser) => Promise<T>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = await requireAuth(req, res);
    if (!user) return;

    try {
      return await handler(req, res, user);
    } catch (error) {
      console.error('API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
