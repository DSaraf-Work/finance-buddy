import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { SchemaAwareTransactionExtractor } from '../../../lib/ai/extractors/transaction-schema-extractor';

/**
 * Debug endpoint to test email extraction with detailed logging
 * This helps debug why certain emails return null values
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { emailId } = req.body;

    if (!emailId) {
      return res.status(400).json({ error: 'Email ID is required' });
    }

    console.log('🧪 Debug Email Extraction Request:', {
      emailId,
      timestamp: new Date().toISOString()
    });

    // Get the email details
    const { data: email, error: emailError } = await (supabaseAdmin as any)
      .from('fb_emails')
      .select('*')
      .eq('id', emailId)
      .single();

    if (emailError || !email) {
      console.error('❌ Email not found:', emailError);
      return res.status(404).json({ error: 'Email not found' });
    }

    console.log('📧 Email Details Retrieved:', {
      id: email.id,
      subject: email.subject,
      fromAddress: email.from_address,
      plainBodyLength: email.plain_body?.length || 0,
      plainBodyExists: !!email.plain_body,
      snippetLength: email.snippet?.length || 0,
      snippetExists: !!email.snippet,
      internalDate: email.internal_date
    });

    // Prepare the email content for extraction
    const emailContent = email.plain_body || email.snippet || '';
    const emailMetadata = {
      emailId: email.id,
      subject: email.subject,
      fromAddress: email.from_address,
      snippet: email.snippet,
      internalDate: email.internal_date
    };

    console.log('🔍 Content Analysis Before AI:', {
      contentLength: emailContent.length,
      contentPreview: emailContent.substring(0, 200) + '...',
      hasActualContent: emailContent.length > 100 && !emailContent.includes('Email disclaimer'),
      isOnlyDisclaimer: emailContent.includes('Email disclaimer') && emailContent.length < 500
    });

    // Initialize the extractor
    const extractor = new SchemaAwareTransactionExtractor();

    // Extract transaction data with detailed logging
    const extractionResult = await extractor.extractTransaction(emailContent, emailMetadata);

    console.log('✅ Extraction Complete:', {
      hasResult: !!extractionResult,
      resultPreview: extractionResult ? {
        amount: extractionResult.amount,
        merchant: extractionResult.merchant_name,
        confidence: extractionResult.confidence
      } : null
    });

    return res.status(200).json({
      success: true,
      email: {
        id: email.id,
        subject: email.subject,
        fromAddress: email.from_address,
        plainBodyLength: email.plain_body?.length || 0,
        snippetLength: email.snippet?.length || 0,
        internalDate: email.internal_date
      },
      content: {
        length: emailContent.length,
        preview: emailContent.substring(0, 200),
        isOnlyDisclaimer: emailContent.includes('Email disclaimer') && emailContent.length < 500
      },
      extraction: extractionResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Debug extraction error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
