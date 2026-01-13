import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchGroups } from '@/lib/splitwise/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const result = await fetchGroups();

  if (result.error || !result.data) {
    console.error('Splitwise API error:', result.error);
    return res.status(result.statusCode || 500).json({ error: 'Failed to fetch groups from Splitwise' });
  }

  // Transform groups to a simpler format and sort by last activity (updated_at) descending
  const groups = result.data
      .map((group: any) => ({
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
        updatedAt: group.updated_at,
      }))
      .sort((a: any, b: any) => {
        // Sort by updated_at descending (most recent first)
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });

  return res.status(200).json({ success: true, groups });
}
