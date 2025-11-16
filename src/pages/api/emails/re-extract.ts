import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { extractTransactionFromEmail } from '@/lib/ai-extraction';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient(req, res);

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { email_row_id } = req.body;

    if (!email_row_id) {
      return res.status(400).json({ error: 'email_row_id is required' });
    }

    // Fetch the email from fb_emails_fetched
    const { data: emailData, error: fetchError } = await supabase
      .from('fb_emails_fetched')
      .select('*')
      .eq('id', email_row_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !emailData) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Re-extract transaction using AI
    const extractedData = await extractTransactionFromEmail(
      emailData.plain_body || emailData.html_body || '',
      emailData.subject || '',
      emailData.from_address || ''
    );

    if (!extractedData) {
      return res.status(500).json({ error: 'Failed to extract transaction data' });
    }

    // Update the existing processed email record
    const { data: existingProcessed, error: existingError } = await supabase
      .from('fb_emails_processed')
      .select('id')
      .eq('email_row_id', email_row_id)
      .eq('user_id', user.id)
      .single();

    if (existingError || !existingProcessed) {
      return res.status(404).json({ error: 'Processed email record not found' });
    }

    // Update the processed email with new extraction
    const { data: updatedData, error: updateError } = await supabase
      .from('fb_emails_processed')
      .update({
        amount: extractedData.amount,
        currency: extractedData.currency,
        direction: extractedData.direction,
        txn_time: extractedData.txn_time,
        merchant_name: extractedData.merchant_name,
        merchant_normalized: extractedData.merchant_normalized,
        category: extractedData.category,
        account_hint: extractedData.account_hint,
        account_type: extractedData.account_type,
        reference_id: extractedData.reference_id,
        location: extractedData.location,
        confidence: extractedData.confidence,
        ai_notes: extractedData.ai_notes,
        extraction_version: extractedData.extraction_version,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingProcessed.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating processed email:', updateError);
      return res.status(500).json({ error: 'Failed to update transaction' });
    }

    return res.status(200).json({
      success: true,
      data: updatedData,
      message: 'Transaction re-extracted successfully',
    });
  } catch (error: any) {
    console.error('Error in re-extract API:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

