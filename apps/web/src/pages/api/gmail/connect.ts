import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { withAuth } from '@/lib/auth';
import { getAuthUrl } from '@/lib/gmail';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Generate state parameter for CSRF protection
    const state = uuidv4();
    
    // Store state in session/cookie for verification in callback
    res.setHeader('Set-Cookie', [
      `oauth_state=${state}; HttpOnly; Secure; SameSite=Strict; Max-Age=600; Path=/`,
    ]);

    const authUrl = getAuthUrl(state);
    
    // Redirect to Google OAuth
    res.redirect(302, authUrl);
  } catch (error) {
    console.error('Gmail connect error:', error);
    res.status(500).json({ error: 'Failed to initiate OAuth flow' });
  }
});
