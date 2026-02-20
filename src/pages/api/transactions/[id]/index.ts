// Transaction API - Get, Update, Delete transaction

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  TABLE_EMAILS_PROCESSED
} from '@/lib/constants/database';
import { checkSplitwiseExpenseExists } from '@/lib/splitwise/validate-expense';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }

  if (req.method === 'GET') {
    try {
      // Fetch transaction (no email JOIN — avoids schema cache issues with fb_emails FK)
      const { data, error: txnError } = await supabaseAdmin
        .from(TABLE_EMAILS_PROCESSED)
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (txnError || !data) {
        return res.status(404).json({
          error: 'Transaction not found',
          details: txnError?.message
        });
      }

      // Type assertion for transaction data (Supabase types not generated)
      const transaction = data as Record<string, any>;

      // Validate Splitwise link if present
      if (transaction.splitwise_expense_id) {
        const expenseCheck = await checkSplitwiseExpenseExists(
          transaction.splitwise_expense_id
        );

        // If Splitwise expense no longer exists, clear the link from the database
        if (!expenseCheck.exists) {
          await (supabaseAdmin as any)
            .from(TABLE_EMAILS_PROCESSED)
            .update({
              splitwise_expense_id: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', user.id);

          // Clear the field in the returned transaction
          transaction.splitwise_expense_id = null;
        }
      }

      return res.status(200).json({ success: true, transaction });
    } catch (error: any) {
      console.error('Failed to fetch transaction:', error);
      return res.status(500).json({
        error: 'Failed to fetch transaction',
        details: error.message
      });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const updates = req.body;

      // Validate updates
      const allowedFields = [
        'txn_time',
        'amount',
        'currency',
        'direction',
        'merchant_name',
        'merchant_normalized',
        'category',
        'account_hint',
        'reference_id',
        'location',
        'account_type',
        'transaction_type',
        'user_notes',
        'status',
        'splitwise_expense_id',
      ];

      const filteredUpdates: any = {};
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      }

      filteredUpdates.updated_at = new Date().toISOString();

      // Update transaction
      const { data: updated, error: updateError } = await (supabaseAdmin as any)
        .from(TABLE_EMAILS_PROCESSED)
        .update(filteredUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({ 
          error: 'Failed to update transaction',
          details: updateError.message 
        });
      }

      return res.status(200).json({ transaction: updated });
    } catch (error: any) {
      console.error('Failed to update transaction:', error);
      return res.status(500).json({ 
        error: 'Failed to update transaction',
        details: error.message 
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error: deleteError } = await supabaseAdmin
        .from(TABLE_EMAILS_PROCESSED)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        return res.status(500).json({ 
          error: 'Failed to delete transaction',
          details: deleteError.message 
        });
      }

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Failed to delete transaction:', error);
      return res.status(500).json({ 
        error: 'Failed to delete transaction',
        details: error.message 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});

