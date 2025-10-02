import { NextApiRequest, NextApiResponse } from 'next';
import { ManualSyncRequest, ManualSyncResponse } from '@finance-buddy/shared';

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
      job_id: `test-job-${Date.now()}`,
      status: 'completed',
      message: `Mock sync completed for connection ${syncRequest.connection_id}`,
      emails_processed: Math.floor(Math.random() * 100) + 10,
      emails_new: Math.floor(Math.random() * 20) + 1,
      emails_updated: Math.floor(Math.random() * 5),
      date_range: {
        from: syncRequest.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: syncRequest.date_to || new Date().toISOString().split('T')[0],
      },
      sync_duration_ms: 1000 + Math.random() * 2000,
      started_at: new Date(Date.now() - 3000).toISOString(),
      completed_at: new Date().toISOString(),
    };

    // Simulate different outcomes based on connection_id
    if (syncRequest.connection_id.includes('error')) {
      mockResponse.status = 'failed';
      mockResponse.message = 'Mock sync failed: Invalid credentials';
      mockResponse.emails_processed = 0;
      mockResponse.emails_new = 0;
      mockResponse.emails_updated = 0;
    } else if (syncRequest.connection_id.includes('slow')) {
      mockResponse.status = 'running';
      mockResponse.message = 'Mock sync is still running...';
      mockResponse.completed_at = undefined;
    }

    res.status(200).json(mockResponse);
  } catch (error) {
    console.error('Test manual sync error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
