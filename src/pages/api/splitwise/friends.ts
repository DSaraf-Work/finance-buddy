import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchFriends } from '@/lib/splitwise/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const result = await fetchFriends();

  if (result.error || !result.data) {
    console.error('Splitwise API error:', result.error);
    return res.status(result.statusCode || 500).json({ error: 'Failed to fetch friends from Splitwise' });
  }

  // Transform friends to a simpler format
  const friends = result.data.map((friend) => ({
    id: friend.id,
    firstName: friend.first_name,
    lastName: friend.last_name,
    email: friend.email,
  }));

  return res.status(200).json({ success: true, friends });
}
