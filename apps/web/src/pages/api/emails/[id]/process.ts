import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Email ID is required' });
    }

    // Get the email first
    const { data: email, error: emailError } = await supabaseAdmin
      .from('fb_emails')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (emailError || !email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Get the Gmail connection for this user
    const { data: connection, error: connectionError } = await supabaseAdmin
      .from('fb_gmail_connections')
      .select('id, google_user_id')
      .eq('user_id', user.id)
      .eq('email_address', email.account)
      .single();

    if (connectionError || !connection) {
      console.warn('No Gmail connection found for user, using fallback values');
    }

    if (email.status === 'Processed') {
      return res.status(400).json({ error: 'Email already processed' });
    }

    // TODO: Implement actual transaction extraction logic here
    // For now, we'll create a placeholder transaction
    const extractedTransaction = {
      user_id: user.id,
      google_user_id: connection?.google_user_id || email.account || user.id, // Use connection data or fallback
      connection_id: connection?.id || null, // Use connection ID if available
      email_row_id: email.id, // Correct field name
      txn_time: email.internal_date || new Date().toISOString(), // Correct field name
      amount: 0, // TODO: Extract from email content
      currency: 'USD', // TODO: Extract from email content
      direction: 'debit', // TODO: Determine from email content
      merchant_name: email.from_address || 'Unknown',
      merchant_normalized: (email.from_address || 'Unknown').toLowerCase().replace(/[^a-z0-9]/g, ''),
      category: 'Other', // TODO: Categorize based on content
      account_hint: null, // TODO: Extract from email content
      reference_id: null, // TODO: Extract from email content
      location: null, // TODO: Extract from email content
      confidence: 0.5, // TODO: Calculate based on extraction quality
      extraction_version: '1.0', // Version of extraction algorithm
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert the extracted transaction
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('fb_extracted_transactions')
      .insert(extractedTransaction)
      .select()
      .single();

    if (transactionError) {
      console.error('Transaction creation error:', transactionError);
      return res.status(500).json({ error: 'Failed to create transaction' });
    }

    // Update email status to Processed
    const { error: updateError } = await supabaseAdmin
      .from('fb_emails')
      .update({
        status: 'Processed',
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Email status update error:', updateError);
      return res.status(500).json({ error: 'Failed to update email status' });
    }

    res.status(200).json({
      message: 'Email processed successfully',
      transaction,
    });
  } catch (error) {
    console.error('Email processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
