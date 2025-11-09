import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import {
  TABLE_EMAILS_FETCHED,
  TABLE_REJECTED_EMAILS,
  VIEW_EMAILS_WITH_STATUS
} from '@/lib/constants/database';

interface EmailActionRequest {
  action: 'reject' | 'unreject';
  reason?: string;
  remarks?: string;
}

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { action, reason, remarks }: EmailActionRequest = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Email ID is required' });
    }

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    // Validate action
    const validActions = ['reject', 'unreject'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action', validActions });
    }

    // Get email details first
    const { data: email, error: emailError } = await supabaseAdmin
      .from(TABLE_EMAILS_FETCHED)
      .select('user_id, google_user_id, connection_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (emailError || !email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    if (action === 'reject') {
      // Add to rejected emails using service role (bypassing RLS)
      const emailData = email as any;
      const { error: rejectError } = await supabaseAdmin
        .from(TABLE_REJECTED_EMAILS)
        .upsert({
          user_id: emailData.user_id,
          google_user_id: emailData.google_user_id,
          connection_id: emailData.connection_id,
          email_row_id: id,
          rejection_reason: reason || 'Manual rejection',
          rejection_type: 'manual_rejection',
          error_details: remarks ? JSON.stringify({ remarks }) : null,
          rejected_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any, {
          onConflict: 'email_row_id',
        });

      if (rejectError) {
        console.error('Email rejection error:', rejectError);
        return res.status(500).json({ error: 'Failed to reject email', details: rejectError.message });
      }
    } else if (action === 'unreject') {
      // Remove from rejected emails using service role (bypassing RLS)
      const { error: unrejectError } = await supabaseAdmin
        .from(TABLE_REJECTED_EMAILS)
        .delete()
        .eq('email_row_id', id)
        .eq('user_id', user.id);

      if (unrejectError) {
        console.error('Email unrejection error:', unrejectError);
        return res.status(500).json({ error: 'Failed to unreject email', details: unrejectError.message });
      }
    }

    // Get the updated email with derived status
    const { data: updatedEmail, error: fetchError } = await (supabaseAdmin as any)
      .from(VIEW_EMAILS_WITH_STATUS)
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !updatedEmail) {
      return res.status(500).json({ error: 'Failed to fetch updated email' });
    }

    res.status(200).json({ success: true, email: updatedEmail, action });
  } catch (error) {
    console.error('Email status update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
