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
    const response = await fetch(`${SPLITWISE_API_BASE}/get_groups`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SPLITWISE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Splitwise API error:', errorText);
      return res.status(response.status).json({ error: 'Failed to fetch groups from Splitwise' });
    }

    const data = await response.json();

    // Transform groups to a simpler format
    const groups = (data.groups || []).map((group: any) => ({
      id: group.id,
      name: group.name,
      members: (group.members || []).map((member: any) => ({
        id: member.id,
        firstName: member.first_name,
        lastName: member.last_name,
        email: member.email,
        picture: member.picture?.medium,
      })),
      simplifyByDefault: group.simplify_by_default,
      groupType: group.group_type,
    }));

    return res.status(200).json({ success: true, groups });
  } catch (error) {
    console.error('Error fetching Splitwise groups:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
