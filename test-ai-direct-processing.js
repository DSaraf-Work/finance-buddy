#!/usr/bin/env node

// Direct AI processing test - bypasses authentication
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ewvzppahjocjpipaywlg.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dnpwcGFoam9janBpcGF5d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwNjg4MywiZXhwIjoyMDcyNjgyODgzfQ.aSQuObM0WeoLH3k3BVdzr72ixe_K7z0oQO9krVV06Os';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testDirectAIProcessing() {
  console.log('🤖 Testing Direct AI Processing (No Auth Required)');
  console.log('=' .repeat(60));

  try {
    // Step 1: Get DCB Bank emails directly from database
    console.log('\n📧 Step 1: Fetching DCB Bank emails from database...');
    
    const { data: emails, error: emailError } = await supabase
      .from('fb_emails')
      .select('*')
      .eq('user_id', '19ebbae0-475b-4043-85f9-438cd07c3677')
      .in('from_address', ['alerts@dcbbank.com', 'alerts@yes.bank.in'])
      .eq('status', 'Fetched')
      .order('internal_date', { ascending: false })
      .limit(3);

    if (emailError) {
      console.error('❌ Error fetching emails:', emailError);
      return;
    }

    console.log(`📊 Found ${emails?.length || 0} DCB Bank emails`);
    
    if (!emails || emails.length === 0) {
      console.log('❌ No DCB Bank emails found');
      return;
    }

    // Display email details
    emails.forEach((email, index) => {
      console.log(`\n📧 Email ${index + 1}:`);
      console.log(`   ID: ${email.id}`);
      console.log(`   Subject: ${email.subject}`);
      console.log(`   From: ${email.from_address}`);
      console.log(`   Date: ${email.internal_date}`);
      console.log(`   Body Length: ${email.plain_body?.length || 0} chars`);
      console.log(`   Snippet: ${email.snippet?.substring(0, 100)}...`);
    });

    // Step 2: Test AI processing directly (without API)
    console.log('\n🤖 Step 2: Testing direct AI processing...');
    
    // Import the AI processing modules directly
    const { TransactionExtractor } = require('./apps/web/src/lib/email-processing/extractors/transaction-extractor');
    
    try {
      const extractor = new TransactionExtractor();
      const testEmail = emails[0];
      
      console.log(`\n🔍 Processing email: "${testEmail.subject}"`);
      console.log(`📧 Email content preview:`);
      console.log(`   From: ${testEmail.from_address}`);
      console.log(`   Body: ${testEmail.plain_body?.substring(0, 300)}...`);
      
      const extractionRequest = {
        emailId: testEmail.id,
        subject: testEmail.subject || '',
        fromAddress: testEmail.from_address || '',
        plainBody: testEmail.plain_body || '',
        snippet: testEmail.snippet,
        internalDate: testEmail.internal_date ? new Date(testEmail.internal_date) : undefined,
      };

      console.log('\n🚀 Starting AI extraction...');
      const result = await extractor.extractTransaction(extractionRequest);
      
      if (result.success && result.transaction) {
        console.log('\n✅ AI Extraction Successful!');
        console.log('📊 Extracted Transaction:');
        console.log(`   Amount: ${result.transaction.amount} ${result.transaction.currency || 'N/A'}`);
        console.log(`   Merchant: ${result.transaction.merchantName || 'N/A'}`);
        console.log(`   Normalized: ${result.transaction.merchantNormalized || 'N/A'}`);
        console.log(`   Category: ${result.transaction.category || 'N/A'}`);
        console.log(`   Direction: ${result.transaction.direction || 'N/A'}`);
        console.log(`   Date: ${result.transaction.txnTime?.toISOString() || 'N/A'}`);
        console.log(`   Reference: ${result.transaction.referenceId || 'N/A'}`);
        console.log(`   Account: ${result.transaction.accountHint || 'N/A'}`);
        console.log(`   Location: ${result.transaction.location || 'N/A'}`);
        console.log(`   Confidence: ${result.transaction.confidence}`);
        console.log(`   Model Used: ${result.modelUsed}`);
        console.log(`   Processing Time: ${result.processingTime}ms`);
        
        // Step 3: Save to database
        console.log('\n💾 Step 3: Saving to database...');
        
        const transactionData = {
          user_id: testEmail.user_id,
          google_user_id: testEmail.google_user_id,
          connection_id: testEmail.connection_id,
          email_row_id: testEmail.id,
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

        const { data: savedTransaction, error: saveError } = await supabase
          .from('fb_extracted_transactions')
          .upsert(transactionData, {
            onConflict: 'email_row_id',
          })
          .select()
          .single();

        if (saveError) {
          console.error('❌ Error saving transaction:', saveError);
        } else {
          console.log('✅ Transaction saved successfully!');
          console.log(`   Database ID: ${savedTransaction.id}`);
        }
        
      } else {
        console.error('❌ AI Extraction Failed:');
        console.error(`   Error: ${result.error}`);
        console.error(`   Model Used: ${result.modelUsed}`);
        console.error(`   Processing Time: ${result.processingTime}ms`);
      }
      
    } catch (aiError) {
      console.error('❌ AI Processing Error:', aiError.message);
      console.error('   This might be due to missing API keys or model configuration');
      
      // Check environment variables
      console.log('\n🔧 Environment Check:');
      console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'Set' : 'Missing'}`);
      console.log(`   ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'Set' : 'Missing'}`);
      console.log(`   GOOGLE_AI_API_KEY: ${process.env.GOOGLE_AI_API_KEY ? 'Set' : 'Missing'}`);
    }

    // Step 4: Check all extracted transactions
    console.log('\n📊 Step 4: Checking all extracted transactions...');
    
    const { data: transactions, error: txnError } = await supabase
      .from('fb_extracted_transactions')
      .select('*')
      .eq('user_id', '19ebbae0-475b-4043-85f9-438cd07c3677')
      .order('created_at', { ascending: false })
      .limit(10);

    if (txnError) {
      console.error('❌ Error fetching transactions:', txnError);
    } else {
      console.log(`📈 Found ${transactions?.length || 0} extracted transactions`);
      
      transactions?.forEach((txn, index) => {
        console.log(`\n💰 Transaction ${index + 1}:`);
        console.log(`   ID: ${txn.id}`);
        console.log(`   Amount: ${txn.amount} ${txn.currency || 'N/A'}`);
        console.log(`   Merchant: ${txn.merchant_name || 'N/A'}`);
        console.log(`   Category: ${txn.category || 'N/A'}`);
        console.log(`   Confidence: ${txn.confidence}`);
        console.log(`   Created: ${txn.created_at}`);
      });
    }

    console.log('\n🎉 Direct AI Processing Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Load environment variables from .env.local
require('dotenv').config({ path: './apps/web/.env.local' });

testDirectAIProcessing().catch(console.error);
