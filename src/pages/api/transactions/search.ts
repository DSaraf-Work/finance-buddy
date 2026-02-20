import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  VIEW_ALL_TRANSACTIONS
} from '@/lib/constants/database';
import {
  TransactionSearchRequest,
  PaginatedResponse,
  UnifiedTransaction,
  RecordType
} from '@/types';

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
      status,
      account_type,
      min_amount,
      max_amount,
      min_confidence,
      record_type,  // 'parent' | 'sub' - filter by record type (parent vs sub-transaction)
      page = 1,
      pageSize = 50,
      sort = 'asc'
    } = req.body;

    console.log('🔍 Transaction search request:', {
      user_id: user.id,
      user_email: user.email,
      request_body: req.body,
      timestamp: new Date().toISOString(),
    });

    // Validate page size
    if (pageSize > 100) {
      return res.status(400).json({ error: 'pageSize cannot exceed 100' });
    }

    // Build query using unified view (v_all_transactions)
    // This view includes both regular transactions and sub-transactions
    // - Parents with status='split' are excluded (their sub-txns appear instead)
    // - Sub-transactions inherit parent metadata via JOIN
    // Authorization enforced by withAuth() + explicit user_id filter
    let query = supabaseAdmin
      .from(VIEW_ALL_TRANSACTIONS)
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
        account_type,
        record_type,
        transaction_type,
        parent_transaction_id,
        ai_notes,
        user_notes,
        confidence,
        extraction_version,
        status,
        created_at,
        updated_at,
        splitwise_expense_id,
        sub_transaction_count
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

    if (status) {
      query = query.eq('status', status);
    }

    if (account_type) {
      query = query.eq('account_type', account_type);
    }

    // Filter by record type ('parent' or 'sub')
    if (record_type) {
      query = query.eq('record_type', record_type);
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

    console.log('✅ Transaction search results:', {
      count,
      transactions_found: transactions?.length || 0,
      page,
      totalPages,
    });

    // Return response in format expected by frontend
    res.status(200).json({
      success: true,
      transactions: transactions || [],
      total: count || 0,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    });
  } catch (error) {
    console.error('Transaction search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
