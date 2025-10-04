import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient(req, res);

  if (req.method === 'POST') {
    // Establish server-side session from client-side auth using Supabase SSR
    try {
      const { access_token, refresh_token } = req.body;

      console.log('[Session] POST request received');

      if (!access_token || !refresh_token) {
        console.error('[Session] Missing tokens');
        return res.status(400).json({ error: 'Access token and refresh token required' });
      }

      console.log('[Session] Tokens received');

      // Set the session using Supabase SSR - this handles cookies automatically
      const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (error) {
        console.error('[Session] Supabase session error:', error);
        return res.status(401).json({ error: 'Invalid tokens', details: error.message });
      }

      if (!data.user) {
        console.error('[Session] No user returned from Supabase');
        return res.status(401).json({ error: 'Invalid tokens - no user' });
      }

      console.log('[Session] Session set successfully:', data.user.id, data.user.email);

      res.status(200).json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email
        }
      });
    } catch (error) {
      console.error('[Session] Session creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Session] Error details:', errorMessage);
      res.status(500).json({
        error: 'Failed to create session',
        details: errorMessage
      });
    }
  } else if (req.method === 'DELETE') {
    // Clear server-side session using Supabase SSR
    try {
      await supabase.auth.signOut();
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('[Session] Sign out error:', error);
      res.status(500).json({ error: 'Failed to sign out' });
    }
  } else if (req.method === 'GET') {
    // Check current session status using Supabase SSR
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return res.status(401).json({ error: 'No session' });
      }

      res.status(200).json({
        user: {
          id: user.id,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Session check error:', error);
      res.status(500).json({ error: 'Failed to check session' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
