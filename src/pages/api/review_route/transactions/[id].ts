import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * PATCH /api/review_route/transactions/[id]
 * 
 * Update a transaction by ID
 * 
 * Security:
 * - Layer 1: Authentication via withAuth() middleware
 * - Layer 2: Explicit authorization via user_id filter
 * - Layer 3: RLS policies as defense-in-depth
 */
export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    console.log('📝 Updating transaction:', {
      transaction_id: id,
      user_id: user.id,
    });

    // First, verify the transaction belongs to the user
    const { data: existingTransaction, error: fetchError } = await supabaseAdmin
      .from('fb_extracted_transactions')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id) // Explicit authorization
      .single();

    if (fetchError || !existingTransaction) {
      console.error('❌ Transaction not found or unauthorized:', fetchError);
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Extract updatable fields from request body
    const {
      txn_time,
      amount,
      currency,
      direction,
      merchant_name,
      merchant_normalized,
      category,
      account_hint,
      account_type,
      reference_id,
      location,
      confidence,
      user_notes,
    } = req.body;

    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (txn_time !== undefined) updateData.txn_time = txn_time;
    if (amount !== undefined) updateData.amount = amount;
    if (currency !== undefined) updateData.currency = currency;
    if (direction !== undefined) updateData.direction = direction;
    if (merchant_name !== undefined) updateData.merchant_name = merchant_name;
    if (merchant_normalized !== undefined) updateData.merchant_normalized = merchant_normalized;
    if (category !== undefined) updateData.category = category;
    if (account_hint !== undefined) updateData.account_hint = account_hint;
    if (account_type !== undefined) updateData.account_type = account_type;
    if (reference_id !== undefined) updateData.reference_id = reference_id;
    if (location !== undefined) updateData.location = location;
    if (confidence !== undefined) updateData.confidence = confidence;
    if (user_notes !== undefined) updateData.user_notes = user_notes;

    // Update the transaction
    const { data, error } = await supabaseAdmin
      .from('fb_extracted_transactions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // Explicit authorization
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating transaction:', error);
      return res.status(500).json({ error: 'Failed to update transaction' });
    }

    console.log('✅ Transaction updated successfully');

    return res.status(200).json({
      transaction: data,
      message: 'Transaction updated successfully',
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

