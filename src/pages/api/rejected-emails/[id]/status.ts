import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  TABLE_REJECTED_EMAILS
} from '@/lib/constants/database';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { status, action } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Rejected email ID is required' });
    }

    console.log('🔄 Updating rejected email status:', {
      id,
      status,
      action,
      user_id: user.id,
      timestamp: new Date().toISOString()
    });

    if (action === 'delete') {
      // Delete the rejected email record
      const { error: deleteError } = await (supabaseAdmin as any)
        .from(TABLE_REJECTED_EMAILS)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting rejected email:', deleteError);
        return res.status(500).json({ error: 'Failed to delete rejected email' });
      }

      console.log(`✅ Deleted rejected email ${id}`);
      return res.status(200).json({
        success: true,
        message: 'Rejected email deleted successfully'
      });
    }

    if (!status || !['REVIEW', 'INVALID'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (REVIEW or INVALID) is required' });
    }

    // Update the rejected email status
    const { data: updatedEmail, error } = await (supabaseAdmin as any)
      .from(TABLE_REJECTED_EMAILS)
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating rejected email status:', error);
      return res.status(500).json({ error: 'Failed to update rejected email status' });
    }

    if (!updatedEmail) {
      return res.status(404).json({ error: 'Rejected email not found' });
    }

    console.log(`✅ Updated rejected email ${id} status to ${status}`);

    res.status(200).json({
      success: true,
      rejectedEmail: updatedEmail,
      message: `Rejected email status updated to ${status}`
    });

  } catch (error) {
    console.error('Rejected email status update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
