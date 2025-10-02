import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { exchangeCodeForTokens, getUserInfo } from '@/lib/gmail';
import { supabaseAdmin } from '@/lib/supabase';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, state, error } = req.query;

    if (error) {
      console.error('OAuth error:', error);
      return res.redirect(302, '/dashboard?error=oauth_denied');
    }

    if (!code || !state) {
      return res.redirect(302, '/dashboard?error=invalid_callback');
    }

    // Verify state parameter for CSRF protection
    const storedState = req.cookies.oauth_state;
    if (!storedState || storedState !== state) {
      return res.redirect(302, '/dashboard?error=invalid_state');
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code as string);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      return res.redirect(302, '/dashboard?error=token_exchange_failed');
    }

    // Get user info from Google
    const googleUser = await getUserInfo(tokens.access_token);
    
    if (!googleUser.id || !googleUser.email) {
      return res.redirect(302, '/dashboard?error=user_info_failed');
    }

    // Calculate token expiry
    const tokenExpiry = new Date();
    if (tokens.expires_in) {
      tokenExpiry.setSeconds(tokenExpiry.getSeconds() + tokens.expires_in);
    } else {
      tokenExpiry.setHours(tokenExpiry.getHours() + 1); // Default 1 hour
    }

    // Store connection in database
    const { error: dbError } = await supabaseAdmin
      .from('fb_gmail_connections')
      .upsert({
        user_id: user.id,
        email_address: googleUser.email,
        google_user_id: googleUser.id,
        granted_scopes: tokens.scope?.split(' ') || [],
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: tokenExpiry.toISOString(),
        token_type: tokens.token_type || 'Bearer',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,email_address',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return res.redirect(302, '/dashboard?error=database_error');
    }

    // Clear state cookie
    res.setHeader('Set-Cookie', [
      'oauth_state=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/',
    ]);

    // Redirect to dashboard with success
    res.redirect(302, '/dashboard?success=connected');
  } catch (error) {
    console.error('Gmail callback error:', error);
    res.redirect(302, '/dashboard?error=callback_failed');
  }
});
