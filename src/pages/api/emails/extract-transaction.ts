// Single Email Transaction Extraction API

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { TransactionExtractor } from '@/lib/email-processing/extractors/transaction-extractor';
import { TransactionExtractionRequest } from '@/lib/ai/types';
import {
  TABLE_EMAILS_FETCHED,
  TABLE_EMAILS_PROCESSED
} from '@/lib/constants/database';

interface ExtractTransactionRequest {
  emailId: string;
  saveToDatabase?: boolean;
}

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔍 Transaction extraction request:', {
    user_id: user.id,
    request_body: req.body,
    timestamp: new Date().toISOString(),
  });

  try {
    const { emailId, saveToDatabase = false }: ExtractTransactionRequest = req.body;

    if (!emailId) {
      return res.status(400).json({ error: 'emailId is required' });
    }

    // Fetch the email
    const { data: email, error: emailError } = await (supabaseAdmin as any)
      .from(TABLE_EMAILS_FETCHED)
      .select('*')
      .eq('id', emailId)
      .eq('user_id', user.id) // Ensure user owns the email
      .single();

    if (emailError || !email) {
      return res.status(404).json({
        error: 'Email not found or access denied',
        details: emailError?.message
      });
    }

    console.log('📧 Processing email:', {
      id: (email as any).id,
      subject: (email as any).subject,
      from: (email as any).from_address,
      date: (email as any).internal_date,
    });

    // Create extraction request
    const extractionRequest: TransactionExtractionRequest = {
      emailId: (email as any).id,
      subject: (email as any).subject || '',
      fromAddress: (email as any).from_address || '',
      plainBody: (email as any).plain_body || '',
      snippet: (email as any).snippet,
      internalDate: email.internal_date ? new Date(email.internal_date) : undefined,
    };

    // Extract transaction
    const extractor = new TransactionExtractor();
    const result = await extractor.extractTransaction(extractionRequest);

    if (!result.success) {
      return res.status(422).json({
        error: 'Transaction extraction failed',
        details: result.error,
        modelUsed: result.modelUsed,
        processingTime: result.processingTime,
      });
    }

    console.log('✅ Transaction extracted successfully:', {
      emailId: email.id,
      confidence: result.transaction?.confidence,
      amount: result.transaction?.amount,
      merchant: result.transaction?.merchantName,
      modelUsed: result.modelUsed,
      processingTime: result.processingTime,
    });

    // Save to database if requested
    let savedTransaction = null;
    if (saveToDatabase && result.transaction) {
      try {
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

        const { data: saved, error: saveError } = await (supabaseAdmin as any)
          .from(TABLE_EMAILS_PROCESSED)
          .upsert(transactionData, {
            onConflict: 'email_row_id',
          })
          .select()
          .single();

        if (saveError) {
          console.error('Failed to save transaction:', saveError);
        } else {
          savedTransaction = saved;
          console.log('💾 Transaction saved to database:', saved.id);
        }
      } catch (saveError: any) {
        console.error('Error saving transaction:', saveError);
      }
    }

    // Return the extraction result
    res.status(200).json({
      success: true,
      email: {
        id: email.id,
        subject: email.subject,
        fromAddress: email.from_address,
        internalDate: email.internal_date,
      },
      extraction: {
        transaction: result.transaction,
        modelUsed: result.modelUsed,
        processingTime: result.processingTime,
        confidence: result.transaction?.confidence,
      },
      saved: saveToDatabase,
      savedTransaction,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Transaction extraction error:', error);
    
    res.status(500).json({ 
      error: 'Transaction extraction failed',
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});
