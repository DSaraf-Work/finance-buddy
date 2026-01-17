// Transaction API - Get, Update, Delete transaction

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { checkSplitwiseExpenseExists } from '@/lib/splitwise/validate-expense';

// Type for transaction query result
interface TransactionRow {
  id: string;
  user_id: string;
  email_row_id: string;
  google_user_id: string;
  connection_id: string | null;
  txn_time: string | null;
  amount: number | null;
  currency: string | null;
  direction: string | null;
  merchant_name: string | null;
  merchant_normalized: string | null;
  category: string | null;
  account_hint: string | null;
  reference_id: string | null;
  location: string | null;
  account_type: string | null;
  transaction_type: string | null;
  confidence: number | null;
  ai_notes: string | null;
  user_notes: string | null;
  status: string;
  extraction_version: string | null;
  splitwise_expense_id: string | null;
  created_at: string;
  updated_at: string;
  email?: {
    id: string;
    message_id: string;
    from_address: string | null;
    to_addresses: string[] | null;
    subject: string | null;
    snippet: string | null;
    internal_date: string | null;
    plain_body: string | null;
    status?: string;
  } | null;
}

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }

  if (req.method === 'GET') {
    try {
      // Fetch transaction with related email
      const { data: transactionData, error: txnError } = await supabaseAdmin
        .from('fb_emails_processed')
        .select(`
          *,
          email:fb_emails_fetched!email_row_id (
            id,
            message_id,
            from_address,
            to_addresses,
            subject,
            snippet,
            internal_date,
            plain_body
          )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (txnError || !transactionData) {
        return res.status(404).json({
          error: 'Transaction not found',
          details: txnError?.message
        });
      }

      // Type assertion for the transaction
      const transaction = transactionData as TransactionRow;

      // Validate Splitwise link if present
      if (transaction.splitwise_expense_id) {
        const expenseCheck = await checkSplitwiseExpenseExists(
          transaction.splitwise_expense_id
        );

        // If Splitwise expense no longer exists, clear the link from the database
        if (!expenseCheck.exists) {
          await (supabaseAdmin as any)
            .from('fb_emails_processed')
            .update({
              splitwise_expense_id: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', user.id);

          // Clear the field in the returned transaction
          (transaction as any).splitwise_expense_id = null;
        }
      }

      return res.status(200).json({ transaction });
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
        .from('fb_emails_processed')
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
        .from('fb_emails_processed')
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

