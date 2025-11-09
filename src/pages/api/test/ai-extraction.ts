// Test AI Extraction Endpoint (No Auth Required)

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { SchemaAwareTransactionExtractor } from '../../../lib/ai/extractors/transaction-schema-extractor';
import { TransactionExtractionRequest } from '../../../lib/ai/types';
import {
  TABLE_EMAILS_FETCHED,
  TABLE_EMAILS_PROCESSED
} from '@/lib/constants/database';

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

      const { data: fetchedEmail, error: emailError } = await (supabaseAdmin as any)
        .from(TABLE_EMAILS_FETCHED)
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
        emailId: (email as any).id,
        subject: (email as any).subject || '',
        fromAddress: (email as any).from_address || '',
        plainBody: (email as any).plain_body || (email as any).snippet || '',
        snippet: (email as any).snippet,
        internalDate: (email as any).internal_date ? new Date((email as any).internal_date) : undefined,
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

    // Perform Schema-Aware AI extraction
    console.log('🧠 Starting Schema-Aware AI extraction...');
    const extractor = new SchemaAwareTransactionExtractor();

    const content = extractionRequest.plainBody || extractionRequest.snippet || '';

    let extractedTransaction;
    try {
      extractedTransaction = await extractor.extractTransaction(content, {
        subject: extractionRequest.subject,
        fromAddress: extractionRequest.fromAddress,
        emailId: extractionRequest.emailId
      });

      console.log('📊 Real AI extraction result:', {
        amount: extractedTransaction.amount,
        merchantName: extractedTransaction.merchant_name,
        accountType: extractedTransaction.account_type,
        transactionType: extractedTransaction.transaction_type,
        confidence: extractedTransaction.confidence,
      });
    } catch (error: any) {
      console.error('❌ AI extraction failed:', error.message);
      return res.status(500).json({
        success: false,
        error: 'AI extraction failed',
        details: error.message,
        reason: 'All AI models failed after retries. Please check your AI configuration and API keys.',
        timestamp: new Date().toISOString(),
      });
    }

    // Save to database if successful and we have a real email
    let savedTransaction = null;
    if (extractedTransaction && email) {
      try {
        console.log('💾 Saving transaction to database...');

        const transactionData = {
          user_id: email.user_id,
          google_user_id: email.google_user_id,
          connection_id: email.connection_id,
          email_row_id: email.id,
          txn_time: extractedTransaction.txn_time,
          amount: extractedTransaction.amount,
          currency: extractedTransaction.currency,
          direction: extractedTransaction.direction,
          merchant_name: extractedTransaction.merchant_name,
          merchant_normalized: extractedTransaction.merchant_normalized,
          category: extractedTransaction.category,
          account_hint: extractedTransaction.account_hint,
          reference_id: extractedTransaction.reference_id,
          location: extractedTransaction.location,
          account_type: extractedTransaction.account_type,
          transaction_type: extractedTransaction.transaction_type,
          ai_notes: extractedTransaction.ai_notes,
          confidence: extractedTransaction.confidence,
          extraction_version: '2.0.0', // Schema-aware version
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: saved, error: saveError } = await (supabaseAdmin as any)
          .from(TABLE_EMAILS_PROCESSED)
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
      success: true,
      email: email ? {
        id: email.id,
        subject: email.subject,
        fromAddress: email.from_address,
        hasPlainBody: !!email.plain_body,
        hasSnippet: !!email.snippet,
        contentUsed: email.plain_body ? 'plain_body' : 'snippet',
      } : null,
      extraction: {
        modelUsed: 'real-ai-with-automatic-fallbacks',
        processingTime: 0,
        transaction: extractedTransaction,
        extractionVersion: '2.0.0',
        schemaAware: true,
        realAI: true,
        fallbacksEnabled: true,
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
