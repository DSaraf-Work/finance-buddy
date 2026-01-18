import type { NextApiRequest, NextApiResponse } from 'next';
import { createSplitwiseExpense } from '@/lib/splitwise/client';

interface CreateExpenseRequest {
  description: string;
  cost: number;
  currencyCode: string;
  date?: string;
  groupId?: number;
  splits: Array<{
    userId: number;
    paidShare: number;
    owedShare: number;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { description, cost, currencyCode, date, groupId, splits } = req.body as CreateExpenseRequest;

  if (!description || !cost || !splits || splits.length === 0) {
    return res.status(400).json({ error: 'Missing required fields: description, cost, and splits are required' });
  }

  // Build the expense data with indexed user parameters
  const expenseData: Record<string, string> = {
    cost: cost.toFixed(2),
    description,
    currency_code: currencyCode || 'INR',
    date: date || new Date().toISOString().split('T')[0],
  };

  if (groupId) {
    expenseData.group_id = groupId.toString();
  }

  // Add user splits with indexed parameters
  splits.forEach((split, index) => {
    expenseData[`users__${index}__user_id`] = split.userId.toString();
    expenseData[`users__${index}__paid_share`] = split.paidShare.toFixed(2);
    expenseData[`users__${index}__owed_share`] = split.owedShare.toFixed(2);
  });

  const result = await createSplitwiseExpense(expenseData);

  if (result.error) {
    console.error('Splitwise API error:', result.error);
    return res.status(result.statusCode || 500).json({ error: 'Failed to create expense on Splitwise', details: result.error });
  }

  const data = result.data;
  if (!data) {
    return res.status(500).json({ error: 'Invalid response from Splitwise' });
  }

  if (data.errors && Object.keys(data.errors).length > 0) {
    return res.status(400).json({ error: 'Splitwise validation error', details: data.errors });
  }

  return res.status(200).json({
    success: true,
    expense: data.expenses?.[0] || (data as any).expense,
    message: 'Expense created successfully on Splitwise'
  });
}
