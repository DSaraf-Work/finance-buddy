import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthUser } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication status
    const user = await getAuthUser(req);
    
    // Get cookie information
    const cookies = req.headers.cookie || '';
    const sessionCookie = req.cookies.fb_session;
    
    // Check headers
    const authHeader = req.headers.authorization;
    const userAgent = req.headers['user-agent'];
    const referer = req.headers.referer;
    
    const authStatus = {
      authenticated: !!user,
      user: user ? { id: user.id, email: user.email } : null,
      session: {
        hasCookie: !!sessionCookie,
        cookieLength: sessionCookie ? sessionCookie.length : 0,
        cookiePreview: sessionCookie ? `${sessionCookie.substring(0, 20)}...` : null,
      },
      headers: {
        hasAuthHeader: !!authHeader,
        authHeaderType: authHeader ? authHeader.split(' ')[0] : null,
        userAgent: userAgent ? userAgent.substring(0, 100) : null,
        referer: referer || null,
      },
      cookies: {
        total: cookies.split(';').filter(c => c.trim()).length,
        sessionCookiePresent: cookies.includes('fb_session'),
        allCookieNames: cookies.split(';').map(c => c.trim().split('=')[0]).filter(Boolean),
      },
      timestamp: new Date().toISOString(),
    };

    // Test different authentication scenarios
    const testResults = {
      authStatus,
      tests: {
        cookieAuth: {
          description: 'Cookie-based authentication (current method)',
          status: user ? 'PASS' : 'FAIL',
          details: user ? 'Valid session found' : 'No valid session cookie',
        },
        headerAuth: {
          description: 'Authorization header authentication',
          status: authHeader ? 'DETECTED' : 'NOT_PRESENT',
          details: authHeader ? `Found ${authHeader.split(' ')[0]} token` : 'No Authorization header',
        },
        sessionIntegrity: {
          description: 'Session cookie integrity',
          status: sessionCookie && sessionCookie.length > 50 ? 'PASS' : 'FAIL',
          details: sessionCookie 
            ? `Cookie length: ${sessionCookie.length} chars` 
            : 'No session cookie found',
        },
      },
      recommendations: [],
    };

    // Add recommendations based on test results
    if (!user && sessionCookie) {
      testResults.recommendations.push('Session cookie exists but is invalid - may be expired');
    }
    
    if (!user && !sessionCookie) {
      testResults.recommendations.push('No authentication found - user needs to sign in');
    }
    
    if (user) {
      testResults.recommendations.push('Authentication successful - all API endpoints should work');
    }

    res.status(200).json(testResults);
  } catch (error) {
    console.error('Auth flow test error:', error);
    res.status(500).json({ 
      error: 'Auth flow test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
