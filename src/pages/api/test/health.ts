import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import {
  TABLE_EMAILS_FETCHED,
  TABLE_EMAILS_PROCESSED,
  TABLE_GMAIL_CONNECTIONS,
  TABLE_JOBS,
  TABLE_REJECTED_EMAILS
} from '@/lib/constants/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test basic Supabase connection (this will work even with RLS)
    const { data, error } = await supabaseAdmin
      .from('auth.users')
      .select('count')
      .limit(1);

    // RLS error is expected and shows security is working
    const dbConnected = !error || error.message.includes('permission denied');

    // Test environment variables
    const envCheck = {
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabase_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      gmail_client_id: !!process.env.GMAIL_CLIENT_ID,
      gmail_client_secret: !!process.env.GMAIL_CLIENT_SECRET,
      nextauth_url: !!process.env.NEXTAUTH_URL,
    };

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: {
        connected: dbConnected,
        rls_active: error?.message.includes('permission denied') || false,
        tables: [TABLE_GMAIL_CONNECTIONS, TABLE_EMAILS_FETCHED, TABLE_EMAILS_PROCESSED, TABLE_JOBS, TABLE_REJECTED_EMAILS],
      },
      version: '1.0.0-L1',
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({ 
      error: 'Health check failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
