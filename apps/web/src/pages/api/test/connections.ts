import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { ConnectionsResponse, GmailConnectionPublic } from '@finance-buddy/shared';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // This is a test endpoint that returns mock data for testing purposes
    // In a real implementation, this would require authentication
    
    const mockConnections: GmailConnectionPublic[] = [
      {
        id: 'test-connection-1',
        email_address: 'test@example.com',
        google_user_id: 'test-google-user-1',
        granted_scopes: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/userinfo.email'
        ],
        last_sync_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        last_error: null,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'test-connection-2',
        email_address: 'demo@finance-buddy.com',
        google_user_id: 'test-google-user-2',
        granted_scopes: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/userinfo.email'
        ],
        last_sync_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        last_error: null,
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'test-connection-3',
        email_address: 'error@example.com',
        google_user_id: 'test-google-user-3',
        granted_scopes: [
          'https://www.googleapis.com/auth/gmail.readonly'
        ],
        last_sync_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        last_error: 'Token expired. Please reconnect your account.',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month ago
        updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];

    const response: ConnectionsResponse = {
      connections: mockConnections,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Test connections error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
