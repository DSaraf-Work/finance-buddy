import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { 
  EmailSearchRequest, 
  PaginatedResponse, 
  EmailPublic 
} from '@finance-buddy/shared';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      google_user_id,
      email_address,
      date_from,
      date_to,
      sender,
      status,
      q,
      page = 1,
      pageSize = 50,
      sort = 'asc'
    }: EmailSearchRequest = req.body;

    // Validate page size
    if (pageSize > 100) {
      return res.status(400).json({ error: 'pageSize cannot exceed 100' });
    }

    // Build query
    let query = supabaseAdmin
      .from('fb_emails')
      .select(`
        id,
        google_user_id,
        connection_id,
        email_address,
        message_id,
        thread_id,
        from_address,
        to_addresses,
        subject,
        snippet,
        internal_date,
        status,
        error_reason,
        processed_at,
        created_at,
        updated_at
      `, { count: 'exact' })
      .eq('user_id', user.id);

    // Apply filters
    if (google_user_id) {
      query = query.eq('google_user_id', google_user_id);
    }

    if (email_address) {
      query = query.eq('email_address', email_address);
    }

    if (date_from) {
      query = query.gte('internal_date', `${date_from}T00:00:00Z`);
    }

    if (date_to) {
      query = query.lte('internal_date', `${date_to}T23:59:59Z`);
    }

    if (sender) {
      query = query.ilike('from_address', `%${sender}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (q) {
      // Search in subject and snippet
      query = query.or(`subject.ilike.%${q}%,snippet.ilike.%${q}%`);
    }

    // Apply pagination and sorting
    const offset = (page - 1) * pageSize;
    query = query
      .order('internal_date', { ascending: sort === 'asc' })
      .range(offset, offset + pageSize - 1);

    const { data: emails, error, count } = await query;

    if (error) {
      console.error('Email search error:', error);
      return res.status(500).json({ error: 'Failed to search emails' });
    }

    const totalPages = Math.ceil((count || 0) / pageSize);

    const response: PaginatedResponse<EmailPublic> = {
      items: emails as EmailPublic[],
      total: count || 0,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Email search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
