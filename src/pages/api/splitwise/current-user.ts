import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchCurrentUser } from '@/lib/splitwise/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const result = await fetchCurrentUser();

  if (result.error) {
    console.error('Splitwise API error:', result.error);
    return res.status(result.statusCode || 500).json({ error: 'Failed to fetch current user from Splitwise' });
  }

  if (!result.data) {
    return res.status(500).json({ error: 'Invalid response from Splitwise' });
  }

  return res.status(200).json({ success: true, user: result.data });
}
