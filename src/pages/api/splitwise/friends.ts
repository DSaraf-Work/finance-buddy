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

  try {
    const response = await fetch(`${SPLITWISE_API_BASE}/get_friends`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SPLITWISE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Splitwise API error:', errorText);
      return res.status(response.status).json({ error: 'Failed to fetch friends from Splitwise' });
    }

    const data = await response.json();

    // Transform friends to a simpler format
    const friends = (data.friends || []).map((friend: any) => ({
      id: friend.id,
      firstName: friend.first_name,
      lastName: friend.last_name,
      email: friend.email,
      picture: friend.picture?.medium,
    }));

    return res.status(200).json({ success: true, friends });
  } catch (error) {
    console.error('Error fetching Splitwise friends:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
