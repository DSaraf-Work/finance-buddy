import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthUser } from '@/lib/auth';
import { exchangeCodeForTokens, getUserInfo } from '@/lib/gmail';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('📞 Gmail OAuth Callback received:', {
    method: req.method,
    query_params: Object.keys(req.query),
    has_code: !!req.query.code,
    has_state: !!req.query.state,
    has_error: !!req.query.error,
    timestamp: new Date().toISOString(),
    user_agent: req.headers['user-agent']
  });

  if (req.method !== 'GET') {
    console.log('❌ Invalid method for OAuth callback:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, state, error } = req.query;

    console.log('🔍 OAuth callback parameters:', {
      code_length: code ? (code as string).length : 0,
      state_length: state ? (state as string).length : 0,
      error: error || 'none',
      code_preview: code ? (code as string).substring(0, 20) + '...' : 'none',
      state_preview: state ? (state as string).substring(0, 20) + '...' : 'none'
    });

    if (error) {
      console.error('❌ OAuth error from Google:', error);
      return res.redirect(302, '/?error=oauth_denied');
    }

    if (!code || !state) {
      console.error('❌ Missing required OAuth parameters:', { has_code: !!code, has_state: !!state });
      return res.redirect(302, '/?error=invalid_callback');
    }

    // Verify state parameter for CSRF protection
    const storedState = req.cookies.oauth_state;
    console.log('🔐 State verification:', {
      has_stored_state: !!storedState,
      states_match: storedState === state,
      stored_state_preview: storedState ? storedState.substring(0, 20) + '...' : 'none',
      received_state_preview: state ? (state as string).substring(0, 20) + '...' : 'none'
    });

    if (!storedState || storedState !== state) {
      console.error('❌ State verification failed:', {
        stored_state: !!storedState,
        states_match: storedState === state
      });

      // In development, if state cookie is missing but state format is valid,
      // we can still proceed if we can verify the user ID
      const stateParts = (state as string).split(':');
      if (process.env.NODE_ENV !== 'production' && stateParts.length === 2) {
        console.log('⚠️ Development mode: Proceeding with state verification bypass');
      } else {
        return res.redirect(302, '/?error=invalid_state');
      }
    }

    // Extract user ID from state parameter (format: "uuid:userId")
    const stateParts = (state as string).split(':');
    console.log('🔍 Parsing state parameter:', {
      state_parts_count: stateParts.length,
      expected_format: 'uuid:userId',
      first_part_length: stateParts[0]?.length || 0,
      second_part_length: stateParts[1]?.length || 0
    });

    if (stateParts.length !== 2) {
      console.error('❌ Invalid state format:', { parts_count: stateParts.length, expected: 2 });
      return res.redirect(302, '/?error=invalid_state_format');
    }
    const userId = stateParts[1];

    console.log('👤 User identification process:', {
      user_id_from_state: userId,
      attempting_session_auth: true
    });

    // Try to get user from session first, fallback to user ID from state
    let user = await getAuthUser(req, res);
    console.log('🔑 Session authentication result:', {
      session_valid: !!user,
      user_id_from_session: user?.id || 'none',
      user_email_from_session: user?.email || 'none',
      user_ids_match: user?.id === userId
    });

    if (!user) {
      console.log('🔄 Session expired, attempting user lookup by ID:', { user_id: userId });
      // Session expired, but we have user ID from state
      // Verify the user exists in the database
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

      console.log('🔍 User lookup result:', {
        lookup_successful: !!userData?.user,
        user_error: userError?.message || 'none',
        found_user_id: userData?.user?.id || 'none',
        found_user_email: userData?.user?.email || 'none'
      });

      if (userError || !userData.user) {
        console.error('❌ User lookup failed:', userError);
        return res.redirect(302, '/auth?error=session_expired&message=Please sign in again to connect your Gmail account');
      }
      user = {
        id: userData.user.id,
        email: userData.user.email!,
      };
    }

    console.log('🔄 Starting token exchange with Google:', {
      user_id: user.id,
      user_email: user.email,
      code_length: (code as string).length
    });

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code as string);

    console.log('🎫 Token exchange result:', {
      has_access_token: !!tokens.access_token,
      has_refresh_token: !!tokens.refresh_token,
      access_token_length: tokens.access_token?.length || 0,
      refresh_token_length: tokens.refresh_token?.length || 0,
      token_type: tokens.token_type || 'none',
      expires_in: tokens.expires_in || 'none',
      scope: tokens.scope || 'none'
    });

    if (!tokens.access_token || !tokens.refresh_token) {
      console.error('❌ Token exchange failed - missing tokens:', {
        has_access_token: !!tokens.access_token,
        has_refresh_token: !!tokens.refresh_token
      });
      return res.redirect(302, '/?error=token_exchange_failed');
    }

    console.log('👤 Fetching Google user info with access token...');

    // Get user info from Google
    const googleUser = await getUserInfo(tokens.access_token);

    console.log('📧 Google user info result:', {
      has_google_id: !!googleUser.id,
      has_google_email: !!googleUser.email,
      google_id: googleUser.id || 'none',
      google_email: googleUser.email || 'none',
      google_name: googleUser.name || 'none',
      google_picture: !!googleUser.picture
    });

    if (!googleUser.id || !googleUser.email) {
      console.error('❌ Google user info incomplete:', {
        google_id: googleUser.id || 'missing',
        google_email: googleUser.email || 'missing'
      });
      return res.redirect(302, '/?error=user_info_failed');
    }

    // Calculate token expiry
    const tokenExpiry = new Date();
    if (tokens.expires_in) {
      tokenExpiry.setSeconds(tokenExpiry.getSeconds() + tokens.expires_in);
    } else {
      tokenExpiry.setHours(tokenExpiry.getHours() + 1); // Default 1 hour
    }

    console.log('⏰ Token expiry calculation:', {
      expires_in_seconds: tokens.expires_in || 'none',
      calculated_expiry: tokenExpiry.toISOString(),
      expires_in_minutes: tokens.expires_in ? Math.round(tokens.expires_in / 60) : 'default 60'
    });

    const connectionData = {
      user_id: user.id,
      email_address: googleUser.email,
      google_user_id: googleUser.id,
      granted_scopes: tokens.scope?.split(' ') || [],
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: tokenExpiry.toISOString(),
      token_type: tokens.token_type || 'Bearer',
      updated_at: new Date().toISOString(),
    };

    console.log('💾 Storing Gmail connection in database:', {
      user_id: connectionData.user_id,
      email_address: connectionData.email_address,
      google_user_id: connectionData.google_user_id,
      granted_scopes_count: connectionData.granted_scopes.length,
      granted_scopes: connectionData.granted_scopes,
      token_type: connectionData.token_type,
      token_expiry: connectionData.token_expiry,
      access_token_length: connectionData.access_token.length,
      refresh_token_length: connectionData.refresh_token.length
    });

    // Store connection in database
    const { error: dbError } = await (supabaseAdmin as any)
      .from('fb_gmail_connections')
      .upsert(connectionData, {
        onConflict: 'user_id,email_address',
      });

    console.log('💾 Database storage result:', {
      success: !dbError,
      error: dbError?.message || 'none',
      error_code: dbError?.code || 'none',
      error_details: dbError?.details || 'none'
    });

    if (dbError) {
      console.error('❌ Database error storing Gmail connection:', dbError);
      return res.redirect(302, '/?error=database_error');
    }

    console.log('🧹 Clearing OAuth state cookie...');

    // Clear state cookie
    res.setHeader('Set-Cookie', [
      'oauth_state=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/',
    ]);

    console.log('✅ Gmail OAuth flow completed successfully:', {
      user_id: user.id,
      user_email: user.email,
      google_email: googleUser.email,
      google_user_id: googleUser.id,
      connection_stored: true,
      timestamp: new Date().toISOString()
    });

    // Redirect to dashboard with success
    return res.redirect(302, '/?success=gmail_connected');
  } catch (error) {
    console.error('❌ Gmail callback error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return res.redirect(302, '/?error=callback_failed');
  }
}
