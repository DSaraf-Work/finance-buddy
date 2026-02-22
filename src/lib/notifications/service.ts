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
        body: `${amountDisplay} · ${isExpense ? 'expense' : 'credit'}`,
        url: `/transactions?editTxnId=${transactionId}`,
        metadata: { transaction_id: transactionId },
        read: false,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[createTransactionNotification] DB error:', error.message);
    }
  } catch (err) {
    console.error('[createTransactionNotification] Unexpected error:', err);
  }
}
