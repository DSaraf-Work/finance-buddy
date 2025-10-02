import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { setAuthCookie, clearAuthCookie } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Establish server-side session from client-side auth
    try {
      const { access_token } = req.body;
      
      if (!access_token) {
        return res.status(400).json({ error: 'Access token required' });
      }

      // Verify the token with Supabase
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(access_token);
      
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Set the auth cookie with the access token
      setAuthCookie(res, access_token);

      res.status(200).json({ 
        success: true, 
        user: { 
          id: user.id, 
          email: user.email 
        } 
      });
    } catch (error) {
      console.error('Session creation error:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  } else if (req.method === 'DELETE') {
    // Clear server-side session
    clearAuthCookie(res);
    res.status(200).json({ success: true });
  } else if (req.method === 'GET') {
    // Check current session status
    try {
      const token = req.cookies.fb_session;
      if (!token) {
        return res.status(401).json({ error: 'No session' });
      }

      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user) {
        clearAuthCookie(res);
        return res.status(401).json({ error: 'Invalid session' });
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
