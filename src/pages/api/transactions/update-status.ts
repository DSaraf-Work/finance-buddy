import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  TABLE_EMAILS_PROCESSED
} from '@/lib/constants/database';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transactionId, status } = req.body;

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Validate status value
    const validStatuses = ['REVIEW', 'APPROVED', 'INVALID', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status value',
        validStatuses 
      });
    }

    console.log('🔄 Updating transaction status:', {
      transactionId,
      status,
      user_id: user.id,
      timestamp: new Date().toISOString(),
    });

    // Update the transaction status
    const { data: updatedTransaction, error } = await (supabaseAdmin as any)
      .from(TABLE_EMAILS_PROCESSED)
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId)
      .eq('user_id', user.id) // Ensure user can only update their own transactions
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating transaction status:', error);
      return res.status(500).json({
        error: 'Failed to update transaction status',
        details: error.message,
      });
    }

    if (!updatedTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    console.log('✅ Transaction status updated successfully:', {
      transactionId,
      newStatus: status,
    });

    res.status(200).json({
      success: true,
      transaction: updatedTransaction,
    });
  } catch (error: any) {
    console.error('❌ Transaction status update error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
});

