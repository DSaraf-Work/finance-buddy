import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase';
import {
  TABLE_EMAILS_PROCESSED
} from '@/lib/constants/database';

/**
 * GET /api/review_route/transactions
 * 
 * Fetch transactions with filters:
 * - start: Start date (YYYY-MM-DD)
 * - end: End date (YYYY-MM-DD)
 * - sort: 'asc' or 'desc' (default: 'desc')
 * - q: Search keyword (searches merchant, category, notes)
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
    const { start, end, sort = 'desc', q } = req.query;

    console.log('🔍 Fetching transactions for review_route:', {
      user_id: user.id,
      start,
      end,
      sort,
      search: q,
    });

    // Build query
    let query = supabaseAdmin
      .from(TABLE_EMAILS_PROCESSED)
      .select('*')
      .eq('user_id', user.id); // Explicit authorization

    // Apply date filters
    if (start && typeof start === 'string') {
      query = query.gte('txn_time', `${start}T00:00:00`);
    }

    if (end && typeof end === 'string') {
      query = query.lte('txn_time', `${end}T23:59:59`);
    }

    // Apply search filter
    if (q && typeof q === 'string') {
      // Search across merchant_name, merchant_normalized, category, user_notes, ai_notes
      query = query.or(
        `merchant_name.ilike.%${q}%,merchant_normalized.ilike.%${q}%,category.ilike.%${q}%,user_notes.ilike.%${q}%,ai_notes.ilike.%${q}%`
      );
    }

    // Apply sorting
    const sortOrder = sort === 'asc' ? true : false;
    query = query.order('txn_time', { ascending: sortOrder });

    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching transactions:', error);
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }

    console.log(`✅ Found ${data?.length || 0} transactions`);

    return res.status(200).json({
      transactions: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

