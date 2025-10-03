#!/usr/bin/env node

// Test script for AI-powered email processing system
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ewvzppahjocjpipaywlg.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dnpwcGFoam9janBpcGF5d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwNjg4MywiZXhwIjoyMDcyNjgyODgzfQ.aSQuObM0WeoLH3k3BVdzr72ixe_K7z0oQO9krVV06Os';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testAIEmailProcessing() {
  console.log('🤖 Testing AI-Powered Email Processing System');
  console.log('=' .repeat(60));

  try {
    // Step 1: Check if we have any emails to process
    console.log('\n📧 Step 1: Checking available emails...');
    
    const { data: emails, error: emailError } = await supabase
      .from('fb_emails')
      .select('id, subject, from_address, internal_date, status')
      .eq('user_id', '19ebbae0-475b-4043-85f9-438cd07c3677')
      .limit(5);

    if (emailError) {
      console.error('❌ Error fetching emails:', emailError);
      return;
    }

    console.log(`📊 Found ${emails?.length || 0} emails`);
    
    if (!emails || emails.length === 0) {
      console.log('⚠️ No emails found. Please sync some emails first.');
      console.log('\n🎯 To test the system:');
      console.log('1. Connect Gmail account via OAuth');
      console.log('2. Sync some financial emails');
      console.log('3. Run this test script again');
      return;
    }

    // Display available emails
    console.log('\n📋 Available emails:');
    emails.forEach((email, index) => {
      console.log(`${index + 1}. ${email.subject} (${email.from_address}) - Status: ${email.status}`);
    });

    // Step 2: Test AI model status
    console.log('\n🤖 Step 2: Checking AI model status...');
    
    try {
      const response = await fetch('http://localhost:3000/api/ai/models', {
        method: 'GET',
        headers: {
          'Cookie': 'fb_session=eyJhbGciOiJIUzI1NiIsImtpZCI6ImVuQlhhdWJ2aXo0RkNGU1oiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2V3dnpwcGFoam9janBpcGF5d2xnLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIxOWViYmFlMC00NzViLTQwNDMtODVmOS00MzhjZDA3YzM2NzciLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU5NTAxMDMzLCJpYXQiOjE3NTk0OTc0MzMsImVtYWlsIjoiZGhlZXJhanNhcmFmMTk5NkBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoiZGhlZXJhanNhcmFmMTk5NkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiIxOWViYmFlMC00NzViLTQwNDMtODVmOS00MzhjZDA3YzM2NzcifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc1OTQ0ODQzN31dLCJzZXNzaW9uX2lkIjoiY2ZhMmQwYWItM2FiZC00N2M4LWExOGItOThmOWE2ZDliYjcyIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.KCMx_B6ZTjG3Ny4OMsa2G-D0qMvVCgoAxojqUNh944U'
        }
      });

      if (response.ok) {
        const modelData = await response.json();
        console.log('✅ AI Models Status:');
        
        Object.entries(modelData.models).forEach(([key, status]) => {
          const s = status;
          console.log(`   ${s.healthy ? '✅' : '❌'} ${key}: ${s.config.provider}/${s.config.model} (${s.healthy ? 'healthy' : 'unhealthy'})`);
        });

        console.log('\n🔧 Environment Variables:');
        console.log(`   Valid: ${modelData.environment.valid ? '✅' : '❌'}`);
        if (!modelData.environment.valid) {
          console.log(`   Missing: ${modelData.environment.missing.join(', ')}`);
        }
      } else {
        console.log('❌ Failed to check AI model status:', response.status);
      }
    } catch (error) {
      console.log('❌ Error checking AI models:', error.message);
    }

    // Step 3: Test single email extraction
    console.log('\n🔍 Step 3: Testing single email transaction extraction...');
    
    const testEmail = emails[0];
    console.log(`Testing with email: "${testEmail.subject}"`);

    try {
      const extractResponse = await fetch('http://localhost:3000/api/emails/extract-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'fb_session=eyJhbGciOiJIUzI1NiIsImtpZCI6ImVuQlhhdWJ2aXo0RkNGU1oiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2V3dnpwcGFoam9janBpcGF5d2xnLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIxOWViYmFlMC00NzViLTQwNDMtODVmOS00MzhjZDA3YzM2NzciLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU5NTAxMDMzLCJpYXQiOjE3NTk0OTc0MzMsImVtYWlsIjoiZGhlZXJhanNhcmFmMTk5NkBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoiZGhlZXJhanNhcmFmMTk5NkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiIxOWViYmFlMC00NzViLTQwNDMtODVmOS00MzhjZDA3YzM2NzcifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc1OTQ0ODQzN31dLCJzZXNzaW9uX2lkIjoiY2ZhMmQwYWItM2FiZC00N2M4LWExOGItOThmOWE2ZDliYjcyIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.KCMx_B6ZTjG3Ny4OMsa2G-D0qMvVCgoAxojqUNh944U'
        },
        body: JSON.stringify({
          emailId: testEmail.id,
          saveToDatabase: true
        })
      });

      if (extractResponse.ok) {
        const extractData = await extractResponse.json();
        console.log('✅ Transaction extraction successful!');
        console.log(`   Model used: ${extractData.extraction.modelUsed}`);
        console.log(`   Processing time: ${extractData.extraction.processingTime}ms`);
        console.log(`   Confidence: ${extractData.extraction.confidence}`);
        
        if (extractData.extraction.transaction) {
          const txn = extractData.extraction.transaction;
          console.log('\n💰 Extracted Transaction:');
          console.log(`   Amount: ${txn.amount} ${txn.currency || 'N/A'}`);
          console.log(`   Merchant: ${txn.merchantName || 'N/A'}`);
          console.log(`   Category: ${txn.category || 'N/A'}`);
          console.log(`   Direction: ${txn.direction || 'N/A'}`);
          console.log(`   Date: ${txn.txnTime || 'N/A'}`);
          console.log(`   Reference: ${txn.referenceId || 'N/A'}`);
        }

        if (extractData.saved && extractData.savedTransaction) {
          console.log(`\n💾 Saved to database with ID: ${extractData.savedTransaction.id}`);
        }
      } else {
        const errorData = await extractResponse.json();
        console.log('❌ Transaction extraction failed:', errorData.error);
        console.log('   Details:', errorData.details);
      }
    } catch (error) {
      console.log('❌ Error testing extraction:', error.message);
    }

    // Step 4: Check extracted transactions
    console.log('\n📊 Step 4: Checking extracted transactions...');
    
    const { data: transactions, error: txnError } = await supabase
      .from('fb_extracted_transactions')
      .select('*')
      .eq('user_id', '19ebbae0-475b-4043-85f9-438cd07c3677')
      .order('created_at', { ascending: false })
      .limit(5);

    if (txnError) {
      console.error('❌ Error fetching transactions:', txnError);
    } else {
      console.log(`📈 Found ${transactions?.length || 0} extracted transactions`);
      
      transactions?.forEach((txn, index) => {
        console.log(`${index + 1}. ${txn.amount} ${txn.currency} - ${txn.merchant_name} (${txn.confidence})`);
      });
    }

    console.log('\n🎉 AI Email Processing System Test Complete!');
    console.log('\n🎯 Next Steps:');
    console.log('1. Set up environment variables for AI models (OPENAI_API_KEY, etc.)');
    console.log('2. Process more emails using /api/emails/process');
    console.log('3. Review extracted transactions in the database');
    console.log('4. Fine-tune prompts and confidence thresholds');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAIEmailProcessing().catch(console.error);
