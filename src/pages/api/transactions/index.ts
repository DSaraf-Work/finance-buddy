import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  TABLE_EMAILS_PROCESSED,
  TABLE_TRANSACTION_KEYWORDS
} from '@/lib/constants/database';

// Helper function to update keyword usage counts
async function updateKeywordUsage(userId: string, aiNotes: string) {
  if (!aiNotes || !aiNotes.trim()) return;

  const keywords = aiNotes.split(',').map(k => k.trim()).filter(k => k.length > 0);

  for (const keywordText of keywords) {
    try {
      // Find the keyword by text and user
      const { data: keywordData, error: findError } = await (supabaseAdmin as any)
        .from(TABLE_TRANSACTION_KEYWORDS)
        .select('id, usage_count')
        .eq('user_id', userId)
        .eq('keyword', keywordText)
        .single();

      if (!findError && keywordData) {
        // Increment usage count
        const newUsageCount = ((keywordData as any).usage_count || 0) + 1;
        await (supabaseAdmin as any)
          .from(TABLE_TRANSACTION_KEYWORDS)
          .update({ usage_count: newUsageCount })
          .eq('id', (keywordData as any).id);
      }
    } catch (error) {
      console.error(`Error updating usage for keyword "${keywordText}":`, error);
    }
  }
}

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method === 'GET') {
    try {
      // Fetch transactions for the authenticated user
      const { data: transactions, error } = await (supabaseAdmin as any)
        .from(TABLE_EMAILS_PROCESSED)
        .select('*')
        .eq('user_id', user.id)
        .order('txn_time', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        return res.status(500).json({
          error: 'Failed to fetch transactions',
          details: error.message
        });
      }

      // Calculate stats
      const total = transactions?.length || 0;
      const totalAmount = transactions?.reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0) || 0;
      const avgConfidence = total > 0
        ? transactions.reduce((sum: number, t: any) => sum + (parseFloat(t.confidence) || 0), 0) / total
        : 0;

      const stats = {
        total,
        totalAmount,
        avgConfidence: Math.round(avgConfidence * 100),
      };

      res.status(200).json({
        success: true,
        transactions: transactions || [],
        stats,
      });
    } catch (error: any) {
      console.error('API error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message 
      });
    }
  } else if (req.method === 'PUT') {
    try {
      const {
        id,
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
        transaction_type,
        user_notes,
        ai_notes
      } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Transaction ID is required' });
      }

      // Update the transaction with all editable fields
      const { data: updatedTransaction, error } = await (supabaseAdmin as any)
        .from(TABLE_EMAILS_PROCESSED)
        .update({
          txn_time: txn_time ? new Date(txn_time).toISOString() : null,
          amount: amount ? parseFloat(amount) : null,
          currency,
          direction,
          merchant_name,
          merchant_normalized,
          category,
          account_hint,
          reference_id,
          location,
          account_type,
          transaction_type,
          user_notes,
          ai_notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id) // Ensure user can only update their own transactions
        .select()
        .single();

      if (error) {
        console.error('Error updating transaction:', error);
        return res.status(500).json({
          error: 'Failed to update transaction',
          details: error.message
        });
      }

      // Update keyword usage counts if ai_notes were provided
      if (ai_notes) {
        await updateKeywordUsage(user.id, ai_notes);
      }

      res.status(200).json({
        success: true,
        transaction: updatedTransaction,
      });
    } catch (error: any) {
      console.error('API error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message 
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
});
