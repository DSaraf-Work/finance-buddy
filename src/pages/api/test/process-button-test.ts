import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { EmailProcessor } from '@/lib/email-processing/processor';
import {
  TABLE_EMAILS_FETCHED,
  TABLE_EMAILS_PROCESSED,
  TABLE_GMAIL_CONNECTIONS
} from '@/lib/constants/database';

/**
 * Test endpoint to verify that the process button endpoint uses the standardized extractor
 * This bypasses authentication for testing purposes
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { emailId } = req.body;

    if (!emailId) {
      return res.status(400).json({ error: 'emailId is required' });
    }

    console.log('🧪 Testing process button endpoint with standardized extractor:', {
      emailId,
      timestamp: new Date().toISOString()
    });

    // Get the email first
    const { data: email, error: emailError } = await (supabaseAdmin as any)
      .from(TABLE_EMAILS_FETCHED)
      .select('*')
      .eq('id', emailId)
      .single();

    if (emailError || !email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Get the Gmail connection for this user
    const { data: connection, error: connectionError } = await (supabaseAdmin as any)
      .from(TABLE_GMAIL_CONNECTIONS)
      .select('id, google_user_id')
      .eq('user_id', email.user_id)
      .eq('email_address', email.email_address)
      .single();

    if (connectionError || !connection) {
      console.warn('No Gmail connection found for user, using fallback values');
    }

    if (email.status === 'Processed') {
      return res.status(400).json({ error: 'Email already processed' });
    }

    console.log(`🔄 Processing email ${emailId} using EmailProcessor:`, {
      subject: email.subject,
      fromAddress: email.from_address,
      userId: email.user_id,
      timestamp: new Date().toISOString()
    });

    // Use the standardized EmailProcessor for actual AI extraction
    const processor = new EmailProcessor();
    
    const result = await processor.processEmails({
      emailId: emailId,
      userId: email.user_id,
      batchSize: 1,
      forceReprocess: true,
    });

    if (!result.success || result.errorCount > 0) {
      console.error(`❌ Email processing failed for ${emailId}:`, result.errors);
      return res.status(500).json({ 
        error: 'Email processing failed',
        details: result.errors 
      });
    }

    // Get the created transaction
    const { data: transaction, error: transactionError } = await (supabaseAdmin as any)
      .from(TABLE_EMAILS_PROCESSED)
      .select('*')
      .eq('email_row_id', emailId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (transactionError) {
      console.error('Failed to retrieve created transaction:', transactionError);
      return res.status(500).json({ error: 'Failed to retrieve transaction' });
    }

    console.log(`✅ Email ${emailId} processed successfully using EmailProcessor:`, {
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
}
