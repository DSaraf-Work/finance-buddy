// Test AI Extraction Endpoint (No Auth Required)

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { TransactionExtractor } from '@/lib/email-processing/extractors/transaction-extractor';
import { TransactionExtractionRequest } from '@/lib/ai/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🧪 Test AI extraction request:', {
    body: req.body,
    timestamp: new Date().toISOString(),
  });

  try {
    const { emailId, testContent } = req.body;

    let email = null;
    let extractionRequest: TransactionExtractionRequest;

    if (emailId) {
      // Fetch email from database
      console.log('📧 Fetching email from database:', emailId);
      
      const { data: fetchedEmail, error: emailError } = await supabaseAdmin
        .from('fb_emails')
        .select('*')
        .eq('id', emailId)
        .single();

      if (emailError || !fetchedEmail) {
        return res.status(404).json({ 
          error: 'Email not found',
          details: emailError?.message 
        });
      }

      email = fetchedEmail;
      
      extractionRequest = {
        emailId: email.id,
        subject: email.subject || '',
        fromAddress: email.from_address || '',
        plainBody: email.plain_body || email.snippet || '',
        snippet: email.snippet,
        internalDate: email.internal_date ? new Date(email.internal_date) : undefined,
      };
    } else if (testContent) {
      // Use test content
      console.log('🧪 Using test content for extraction');
      
      extractionRequest = {
        emailId: 'test-email',
        subject: testContent.subject || 'Test Email',
        fromAddress: testContent.fromAddress || 'test@example.com',
        plainBody: testContent.content || '',
        snippet: testContent.snippet,
        internalDate: new Date(),
      };
    } else {
      return res.status(400).json({ 
        error: 'Either emailId or testContent is required' 
      });
    }

    console.log('🔍 Extraction request prepared:', {
      emailId: extractionRequest.emailId,
      subject: extractionRequest.subject,
      fromAddress: extractionRequest.fromAddress,
      contentLength: extractionRequest.plainBody?.length || 0,
      hasSnippet: !!extractionRequest.snippet,
    });

    // Perform AI extraction
    console.log('🤖 Starting AI extraction...');
    const extractor = new TransactionExtractor();
    const result = await extractor.extractTransaction(extractionRequest);

    console.log('📊 AI extraction result:', {
      success: result.success,
      modelUsed: result.modelUsed,
      processingTime: result.processingTime,
      hasTransaction: !!result.transaction,
      error: result.error,
    });

    // Save to database if successful and we have a real email
    let savedTransaction = null;
    if (result.success && result.transaction && email) {
      try {
        console.log('💾 Saving transaction to database...');
        
        const transactionData = {
          user_id: email.user_id,
          google_user_id: email.google_user_id,
          connection_id: email.connection_id,
          email_row_id: email.id,
          txn_time: result.transaction.txnTime?.toISOString(),
          amount: result.transaction.amount,
          currency: result.transaction.currency,
          direction: result.transaction.direction,
          merchant_name: result.transaction.merchantName,
          merchant_normalized: result.transaction.merchantNormalized,
          category: result.transaction.category,
          account_hint: result.transaction.accountHint,
          reference_id: result.transaction.referenceId,
          location: result.transaction.location,
          confidence: result.transaction.confidence,
          extraction_version: result.transaction.extractionVersion,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: saved, error: saveError } = await supabaseAdmin
          .from('fb_extracted_transactions')
          .upsert(transactionData, {
            onConflict: 'email_row_id',
          })
          .select()
          .single();

        if (saveError) {
          console.error('❌ Error saving transaction:', saveError);
        } else {
          savedTransaction = saved;
          console.log('✅ Transaction saved:', saved.id);
        }
      } catch (saveError: any) {
        console.error('❌ Save error:', saveError);
      }
    }

    // Return comprehensive response
    res.status(200).json({
      success: result.success,
      email: email ? {
        id: email.id,
        subject: email.subject,
        fromAddress: email.from_address,
        hasPlainBody: !!email.plain_body,
        hasSnippet: !!email.snippet,
        contentUsed: email.plain_body ? 'plain_body' : 'snippet',
      } : null,
      extraction: {
        modelUsed: result.modelUsed,
        processingTime: result.processingTime,
        transaction: result.transaction,
        error: result.error,
      },
      savedTransaction,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Test AI extraction error:', error);
    
    res.status(500).json({ 
      error: 'AI extraction test failed',
      details: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }
}
