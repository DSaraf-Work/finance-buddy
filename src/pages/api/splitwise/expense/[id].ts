import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchSplitwiseExpense, SPLITWISE_API_KEY } from '@/lib/splitwise/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!SPLITWISE_API_KEY) {
    return res.status(500).json({ error: 'Splitwise API key not configured' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Expense ID is required' });
  }

  const result = await fetchSplitwiseExpense(id);

  if (result.error) {
    if (result.statusCode === 404) {
      return res.status(200).json({ exists: false, reason: 'not_found' });
    }
    console.error('Splitwise API error:', result.error);
    return res.status(result.statusCode || 500).json({
      error: 'Failed to fetch expense from Splitwise',
      details: result.error,
    });
  }

  const expense = result.data;
  if (!expense) {
    return res.status(500).json({ error: 'Invalid response from Splitwise' });
  }

  // Check if expense was deleted
  if (expense.deleted_at) {
    return res.status(200).json({
      exists: false,
      reason: 'deleted',
      deleted_at: expense.deleted_at,
    });
  }

  // Extract participant names (exclude current user who paid)
  const users = expense.users || [];
  const participants = users
    .filter((u) => parseFloat(u.owed_share || '0') > 0 && parseFloat(u.paid_share || '0') === 0)
    .map((u) => u.user?.first_name || 'Unknown')
    .slice(0, 3); // Limit to 3 names for display

  // Expense exists and is not deleted
  return res.status(200).json({
    exists: true,
    expense: {
      id: expense.id,
      description: expense.description,
      cost: expense.cost,
      currency_code: expense.currency_code,
      date: expense.date,
      created_at: expense.created_at,
      payment: expense.payment,
    },
    splitWith: participants,
    totalParticipants: users.length,
    groupId: expense.group_id,
  });
}
