import { supabaseAdmin } from '@/lib/supabase';

interface CreateTransactionNotificationParams {
  userId: string;
  transactionId: string;
  merchantName: string | null | undefined;
  amount: number | string;
  direction: string;
}

/**
 * Creates an in-app notification record for a newly created transaction.
 * Fire-and-forget: errors are logged but never thrown to avoid breaking the caller.
 */
export async function createTransactionNotification(
  params: CreateTransactionNotificationParams
): Promise<void> {
  const { userId, transactionId, merchantName, amount, direction } = params;

  const merchant = merchantName || 'Unknown';
  const amountNum = parseFloat(String(amount)) || 0;
  const isExpense = direction === 'debit';
  const sign = isExpense ? '−' : '+';
  const amountDisplay = `${sign}₹${amountNum.toLocaleString('en-IN')}`;

  try {
    const { error } = await (supabaseAdmin as any)
      .from('fb_notifications')
      .insert({
        user_id: userId,
        type: 'transaction_created',
        title: merchant,
        message: `${amountDisplay} · ${isExpense ? 'expense' : 'credit'}`,
        transaction_id: transactionId,
        action_url: `/transactions?editTxnId=${transactionId}`,
        action_label: 'View',
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[createTransactionNotification] DB error:', error.message);
    }
  } catch (err) {
    console.error('[createTransactionNotification] Unexpected error:', err);
  }
}
