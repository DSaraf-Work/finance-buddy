import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { EmailStatus } from '@finance-buddy/shared';

interface UpdateStatusRequest {
  status: EmailStatus;
  remarks?: string;
}

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { status, remarks }: UpdateStatusRequest = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Email ID is required' });
    }

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Validate status
    const validStatuses: EmailStatus[] = ['Fetched', 'Processed', 'Failed', 'Invalid', 'NON_TRANSACTIONAL', 'REJECT'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update the email status
    const { data: updatedEmail, error } = await supabaseAdmin
      .from('fb_emails')
      .update({
        status,
        remarks: remarks || null,
        updated_at: new Date().toISOString(),
        processed_at: status === 'Processed' ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only update their own emails
      .select()
      .single();

    if (error) {
      console.error('Email status update error:', error);
      return res.status(500).json({ error: 'Failed to update email status' });
    }

    if (!updatedEmail) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.status(200).json(updatedEmail);
  } catch (error) {
    console.error('Email status update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
