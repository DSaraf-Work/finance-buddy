import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { EmailProcessor } from '@/lib/email-processing/processor';
import {
  TABLE_EMAILS_FETCHED,
  TABLE_EMAILS_PROCESSED,
  TABLE_GMAIL_CONNECTIONS
} from '@/lib/constants/database';

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
    const { data: email, error: emailError } = await (supabaseAdmin as any)
      .from(TABLE_EMAILS_FETCHED)
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (emailError || !email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Get the Gmail connection for this user
    const { data: connection, error: connectionError } = await (supabaseAdmin as any)
      .from(TABLE_GMAIL_CONNECTIONS)
      .select('id, google_user_id')
      .eq('user_id', user.id)
      .eq('email_address', (email as any).email_address)
      .single();

    if (connectionError || !connection) {
      console.warn('No Gmail connection found for user, using fallback values');
    }

    if ((email as any).status === 'Processed') {
      return res.status(400).json({ error: 'Email already processed' });
    }

    console.log(`🔄 Processing email ${id} using EmailProcessor:`, {
      subject: (email as any).subject,
      fromAddress: (email as any).from_address,
      userId: user.id,
      timestamp: new Date().toISOString()
    });

    // Use the standardized EmailProcessor for actual AI extraction
    const processor = new EmailProcessor();

    const result = await processor.processEmails({
      emailId: id,
      userId: user.id,
      batchSize: 1,
      forceReprocess: true,
    });

    if (!result.success || result.errorCount > 0) {
      console.error(`❌ Email processing failed for ${id}:`, result.errors);
      return res.status(500).json({
        error: 'Email processing failed',
        details: result.errors
      });
    }

    // Get the created transaction
    const { data: transaction, error: transactionError } = await (supabaseAdmin as any)
      .from(TABLE_EMAILS_PROCESSED)
      .select('*')
      .eq('email_row_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (transactionError) {
      console.error('Failed to retrieve created transaction:', transactionError);
      return res.status(500).json({ error: 'Failed to retrieve transaction' });
    }

    console.log(`✅ Email ${id} processed successfully using EmailProcessor:`, {
      transactionId: transaction?.id,
      amount: transaction?.amount,
      currency: transaction?.currency,
      confidence: transaction?.confidence,
      extractionVersion: transaction?.extraction_version
    });

    res.status(200).json({
      message: 'Email processed successfully',
      transaction,
      status: 'PROCESSED',
      processingTime: result.processingTime,
      extractionVersion: transaction?.extraction_version || '2.0.0'
    });
  } catch (error) {
    console.error('Email processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
