import { NextApiRequest, NextApiResponse } from 'next';
import { ManualSyncRequest, ManualSyncResponse } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const syncRequest: ManualSyncRequest = req.body;
    
    // Validate required fields
    if (!syncRequest.connection_id) {
      return res.status(400).json({ error: 'connection_id is required' });
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Mock response based on connection_id
    const mockResponse: ManualSyncResponse = {
      items: [], // Mock empty items array
      stats: {
        probed: Math.floor(Math.random() * 100) + 10,
        fetched: Math.floor(Math.random() * 20) + 1,
        upserts: Math.floor(Math.random() * 5),
      },
      nextPageToken: syncRequest.connection_id.includes('more') ? 'next-page-token' : undefined,
    };

    // Simulate different outcomes based on connection_id
    if (syncRequest.connection_id.includes('error')) {
      mockResponse.stats.probed = 0;
      mockResponse.stats.fetched = 0;
      mockResponse.stats.upserts = 0;
    } else if (syncRequest.connection_id.includes('slow')) {
      mockResponse.stats.probed = Math.floor(Math.random() * 50);
      mockResponse.stats.fetched = Math.floor(Math.random() * 10);
      mockResponse.stats.upserts = Math.floor(Math.random() * 3);
    }

    res.status(200).json(mockResponse);
  } catch (error) {
    console.error('Test manual sync error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
