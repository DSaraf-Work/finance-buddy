import type { NextApiRequest, NextApiResponse } from 'next';

const SPLITWISE_API_KEY = process.env.SPLITWISE_API_KEY;
const SPLITWISE_API_BASE = 'https://secure.splitwise.com/api/v3.0';

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

  try {
    const response = await fetch(`${SPLITWISE_API_BASE}/get_expense/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SPLITWISE_API_KEY}`,
      },
    });

    if (!response.ok) {
      // 404 or other error means expense doesn't exist
      if (response.status === 404) {
        return res.status(200).json({ exists: false, reason: 'not_found' });
      }
      const errorText = await response.text();
      console.error('Splitwise API error:', errorText);
      return res.status(response.status).json({
        error: 'Failed to fetch expense from Splitwise',
        details: errorText
      });
    }

    const data = await response.json();

    // Check if expense was deleted
    if (data.expense?.deleted_at) {
      return res.status(200).json({
        exists: false,
        reason: 'deleted',
        deleted_at: data.expense.deleted_at
      });
    }

    // Expense exists and is not deleted
    return res.status(200).json({
      exists: true,
      expense: {
        id: data.expense?.id,
        description: data.expense?.description,
        cost: data.expense?.cost,
        currency_code: data.expense?.currency_code,
        date: data.expense?.date,
        created_at: data.expense?.created_at,
        payment: data.expense?.payment,
      }
    });
  } catch (error) {
    console.error('Error fetching Splitwise expense:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
