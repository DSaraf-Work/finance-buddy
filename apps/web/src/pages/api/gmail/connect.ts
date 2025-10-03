import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { withAuth } from '@/lib/auth';
import { getAuthUrl } from '@/lib/gmail';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔗 Gmail OAuth Connect initiated:', {
    user_id: user.id,
    user_email: user.email,
    timestamp: new Date().toISOString(),
    user_agent: req.headers['user-agent'],
    referer: req.headers.referer
  });

  try {
    // Generate state parameter for CSRF protection and include user ID
    const state = `${uuidv4()}:${user.id}`;

    console.log('🔑 OAuth state generated:', {
      state_length: state.length,
      user_id: user.id,
      state_preview: state.substring(0, 20) + '...'
    });

    // Store state in session/cookie for verification in callback
    // Use less restrictive cookie settings for localhost development
    const isProduction = process.env.NODE_ENV === 'production';
    res.setHeader('Set-Cookie', [
      `oauth_state=${state}; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Lax; Max-Age=600; Path=/`,
    ]);

    const authUrl = getAuthUrl(state);

    console.log('🌐 Redirecting to Google OAuth:', {
      auth_url_length: authUrl.length,
      contains_state: authUrl.includes(state),
      redirect_uri: authUrl.includes('localhost:3000'),
      timestamp: new Date().toISOString()
    });

    // Redirect to Google OAuth
    res.redirect(302, authUrl);
  } catch (error) {
    console.error('❌ Gmail connect error:', error);
    res.status(500).json({ error: 'Failed to initiate OAuth flow' });
  }
});
