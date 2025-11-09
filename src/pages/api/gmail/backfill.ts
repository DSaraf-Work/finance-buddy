import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { BackfillRequest, BackfillResponse } from '@/types';
import {
  TABLE_GMAIL_CONNECTIONS,
  TABLE_JOBS
} from '@/lib/constants/database';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      connection_id,
      date_from,
      date_to,
      senders = [],
      chunk_size_days = 7
    }: BackfillRequest = req.body;

    // Validate required fields
    if (!connection_id || !date_from || !date_to) {
      return res.status(400).json({ 
        error: 'connection_id, date_from, and date_to are required' 
      });
    }

    // Validate connection exists
    const { data: connection, error: connError } = await (supabaseAdmin as any)
      .from(TABLE_GMAIL_CONNECTIONS)
      .select('id')
      .eq('id', connection_id)
      .eq('user_id', user.id)
      .single();

    if (connError || !connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Parse dates
    const startDate = new Date(date_from);
    const endDate = new Date(date_to);

    if (startDate >= endDate) {
      return res.status(400).json({ error: 'date_from must be before date_to' });
    }

    // Split date range into chunks
    const chunks: { date_from: string; date_to: string }[] = [];
    let currentDate = new Date(startDate);

    while (currentDate < endDate) {
      const chunkEnd = new Date(currentDate);
      chunkEnd.setDate(chunkEnd.getDate() + chunk_size_days);
      
      if (chunkEnd > endDate) {
        chunkEnd.setTime(endDate.getTime());
      }

      chunks.push({
        date_from: currentDate.toISOString().split('T')[0],
        date_to: chunkEnd.toISOString().split('T')[0],
      });

      currentDate = new Date(chunkEnd);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Create job payload
    const jobPayload = {
      connection_id,
      senders,
      chunks,
      current_chunk: 0,
      total_chunks: chunks.length,
      completed_chunks: 0,
      failed_chunks: 0,
      created_at: new Date().toISOString(),
    };

    // Insert job into database
    const { data: job, error: jobError } = await (supabaseAdmin as any)
      .from(TABLE_JOBS)
      .insert({
        user_id: user.id,
        type: 'backfill',
        payload: jobPayload,
        status: 'queued',
        attempts: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id, status')
      .single();

    if (jobError || !job) {
      console.error('Job creation error:', jobError);
      return res.status(500).json({ error: 'Failed to create backfill job' });
    }

    const response: BackfillResponse = {
      job_id: job.id,
      status: job.status as any,
      message: `Backfill job created with ${chunks.length} chunks`,
    };

    res.status(202).json(response);
  } catch (error) {
    console.error('Backfill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
