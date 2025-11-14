import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase';
import { TABLE_EMAILS_PROCESSED, TABLE_EMAILS_FETCHED } from '@/lib/constants/database';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid email ID' });
  }

  const userId = user.id;

  try {
    if (req.method === 'GET') {
      // Fetch email processed with related email fetched data
      const { data: emailProcessed, error: processedError } = await (supabaseAdmin as any)
        .from(TABLE_EMAILS_PROCESSED)
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (processedError || !emailProcessed) {
        return res.status(404).json({ error: 'Email not found' });
      }

      // Fetch related email fetched data
      const { data: emailFetched, error: fetchedError } = await (supabaseAdmin as any)
        .from(TABLE_EMAILS_FETCHED)
        .select('*')
        .eq('id', emailProcessed.email_row_id)
        .single();

      if (fetchedError) {
        console.error('Error fetching related email:', fetchedError);
      }

      return res.status(200).json({
        ...emailProcessed,
        email_fetched: emailFetched || null,
      });
    } else if (req.method === 'PATCH') {
      // Update email processed
      const updates = req.body;

      // Remove fields that shouldn't be updated
      delete updates.id;
      delete updates.user_id;
      delete updates.google_user_id;
      delete updates.connection_id;
      delete updates.email_row_id;
      delete updates.created_at;
      delete updates.email_fetched;

      // Add updated_at timestamp
      updates.updated_at = new Date().toISOString();

      const { data, error } = await (supabaseAdmin as any)
        .from(TABLE_EMAILS_PROCESSED)
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating email:', error);
        return res.status(500).json({ error: 'Failed to update email' });
      }

      return res.status(200).json(data);
    } else if (req.method === 'DELETE') {
      // Delete email processed
      const { error } = await (supabaseAdmin as any)
        .from(TABLE_EMAILS_PROCESSED)
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting email:', error);
        return res.status(500).json({ error: 'Failed to delete email' });
      }

      return res.status(200).json({ success: true });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

