import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { 
  TransactionSearchRequest, 
  PaginatedResponse, 
  ExtractedTransactionPublic 
} from '@finance-buddy/shared';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      google_user_id,
      date_from,
      date_to,
      direction,
      category,
      merchant,
      min_amount,
      max_amount,
      min_confidence,
      page = 1,
      pageSize = 50,
      sort = 'asc'
    }: TransactionSearchRequest = req.body;

    // Validate page size
    if (pageSize > 100) {
      return res.status(400).json({ error: 'pageSize cannot exceed 100' });
    }

    // Build query
    let query = supabaseAdmin
      .from('fb_extracted_transactions')
      .select(`
        id,
        google_user_id,
        connection_id,
        email_row_id,
        txn_time,
        amount,
        currency,
        direction,
        merchant_name,
        merchant_normalized,
        category,
        account_hint,
        reference_id,
        location,
        confidence,
        extraction_version,
        created_at,
        updated_at
      `, { count: 'exact' })
      .eq('user_id', user.id);

    // Apply filters
    if (google_user_id) {
      query = query.eq('google_user_id', google_user_id);
    }

    if (date_from) {
      query = query.gte('txn_time', `${date_from}T00:00:00Z`);
    }

    if (date_to) {
      query = query.lte('txn_time', `${date_to}T23:59:59Z`);
    }

    if (direction) {
      query = query.eq('direction', direction);
    }

    if (category) {
      query = query.ilike('category', `${category}%`);
    }

    if (merchant) {
      query = query.or(`merchant_name.ilike.%${merchant}%,merchant_normalized.ilike.%${merchant}%`);
    }

    if (min_amount !== undefined) {
      query = query.gte('amount', min_amount);
    }

    if (max_amount !== undefined) {
      query = query.lte('amount', max_amount);
    }

    if (min_confidence !== undefined) {
      query = query.gte('confidence', min_confidence);
    }

    // Apply pagination and sorting
    const offset = (page - 1) * pageSize;
    query = query
      .order('txn_time', { ascending: sort === 'asc' })
      .range(offset, offset + pageSize - 1);

    const { data: transactions, error, count } = await query;

    if (error) {
      console.error('Transaction search error:', error);
      return res.status(500).json({ error: 'Failed to search transactions' });
    }

    const totalPages = Math.ceil((count || 0) / pageSize);

    const response: PaginatedResponse<ExtractedTransactionPublic> = {
      items: transactions as ExtractedTransactionPublic[],
      total: count || 0,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Transaction search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
