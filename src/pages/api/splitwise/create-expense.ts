import type { NextApiRequest, NextApiResponse } from 'next';

const SPLITWISE_API_KEY = process.env.SPLITWISE_API_KEY;
const SPLITWISE_API_BASE = 'https://secure.splitwise.com/api/v3.0';

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

  if (!SPLITWISE_API_KEY) {
    return res.status(500).json({ error: 'Splitwise API key not configured' });
  }

  try {
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

    // Convert to URL-encoded format
    const formBody = Object.keys(expenseData)
      .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(expenseData[key]))
      .join('&');

    const response = await fetch(`${SPLITWISE_API_BASE}/create_expense`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SPLITWISE_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Splitwise API error:', errorText);
      return res.status(response.status).json({ error: 'Failed to create expense on Splitwise', details: errorText });
    }

    const data = await response.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
      return res.status(400).json({ error: 'Splitwise validation error', details: data.errors });
    }

    return res.status(200).json({
      success: true,
      expense: data.expenses?.[0] || data.expense,
      message: 'Expense created successfully on Splitwise'
    });
  } catch (error) {
    console.error('Error creating Splitwise expense:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
