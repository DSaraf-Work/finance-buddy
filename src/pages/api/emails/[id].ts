import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase';
import {
  TABLE_EMAILS_FETCHED
} from '@/lib/constants/database';

/**
 * GET /api/emails/[id]
 * 
 * Fetch a single email by ID including its plain_body
 * 
 * Security:
 * - Layer 1: Authentication via withAuth() middleware
 * - Layer 2: Explicit authorization via user_id filter
 * - Layer 3: RLS policies as defense-in-depth
 */
export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Email ID is required' });
    }

    console.log('📧 Fetching email:', {
      email_id: id,
      user_id: user.id,
    });

    // Fetch email with explicit user_id filter for authorization
    const { data, error } = await supabaseAdmin
      .from(TABLE_EMAILS_FETCHED)
      .select('id, plain_body, subject, from_address, internal_date')
      .eq('id', id)
      .eq('user_id', user.id) // Explicit authorization
      .single();

    if (error || !data) {
      console.error('❌ Error fetching email:', error);
      return res.status(404).json({ error: 'Email not found' });
    }

    console.log('✅ Email fetched successfully');

    return res.status(200).json(data);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

