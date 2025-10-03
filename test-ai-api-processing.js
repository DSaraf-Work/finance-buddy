#!/usr/bin/env node

// Test AI processing via API endpoints
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ewvzppahjocjpipaywlg.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dnpwcGFoam9janBpcGF5d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwNjg4MywiZXhwIjoyMDcyNjgyODgzfQ.aSQuObM0WeoLH3k3BVdzr72ixe_K7z0oQO9krVV06Os';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Get a fresh session token
async function getSessionToken() {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'dheerajsaraf1996@gmail.com',
      password: 'password123'
    });
    
    if (error) {
      console.error('❌ Auth error:', error);
      return null;
    }
    
    return data.session?.access_token;
  } catch (error) {
    console.error('❌ Session error:', error);
    return null;
  }
}

async function testAIProcessingAPI() {
  console.log('🤖 Testing AI Processing via API');
  console.log('=' .repeat(50));

  try {
    // Step 1: Get session token
    console.log('\n🔐 Step 1: Getting session token...');
    const sessionToken = await getSessionToken();
    
    if (!sessionToken) {
      console.log('❌ Failed to get session token, using old token');
    } else {
      console.log('✅ Got fresh session token');
    }

    // Use session token or fallback to old one
    const authCookie = sessionToken 
      ? `sb-ewvzppahjocjpipaywlg-auth-token=${sessionToken}`
      : 'fb_session=eyJhbGciOiJIUzI1NiIsImtpZCI6ImVuQlhhdWJ2aXo0RkNGU1oiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2V3dnpwcGFoam9janBpcGF5d2xnLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIxOWViYmFlMC00NzViLTQwNDMtODVmOS00MzhjZDA3YzM2NzciLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU5NTAxMDMzLCJpYXQiOjE3NTk0OTc0MzMsImVtYWlsIjoiZGhlZXJhanNhcmFmMTk5NkBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoiZGhlZXJhanNhcmFmMTk5NkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiIxOWViYmFlMC00NzViLTQwNDMtODVmOS00MzhjZDA3YzM2NzcifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc1OTQ0ODQzN31dLCJzZXNzaW9uX2lkIjoiY2ZhMmQwYWItM2FiZC00N2M4LWExOGItOThmOWE2ZDliYjcyIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.KCMx_B6ZTjG3Ny4OMsa2G-D0qMvVCgoAxojqUNh944U';

    // Step 2: Get DCB Bank emails
    console.log('\n📧 Step 2: Getting DCB Bank emails...');
    
    const { data: emails, error: emailError } = await supabase
      .from('fb_emails')
      .select('*')
      .eq('user_id', '19ebbae0-475b-4043-85f9-438cd07c3677')
      .eq('from_address', 'alerts@dcbbank.com')
      .order('internal_date', { ascending: false })
      .limit(1);

    if (emailError || !emails || emails.length === 0) {
      console.error('❌ No emails found:', emailError);
      return;
    }

    const testEmail = emails[0];
    console.log('📧 Test email:', {
      id: testEmail.id,
      subject: testEmail.subject,
      from: testEmail.from_address,
      hasPlainBody: !!testEmail.plain_body,
      hasSnippet: !!testEmail.snippet,
      snippetPreview: testEmail.snippet?.substring(0, 100) + '...'
    });

    // Step 3: Test AI model status
    console.log('\n🤖 Step 3: Checking AI model status...');
    
    try {
      const modelResponse = await fetch('http://localhost:3000/api/ai/models', {
        method: 'GET',
        headers: {
          'Cookie': authCookie
        }
      });

      if (modelResponse.ok) {
        const modelData = await modelResponse.json();
        console.log('✅ AI Models Status:');
        
        Object.entries(modelData.models).forEach(([key, status]) => {
          const s = status;
          console.log(`   ${s.healthy ? '✅' : '❌'} ${key}: ${s.config.provider}/${s.config.model}`);
        });

        console.log('\n🔧 Environment Check:');
        console.log(`   Valid: ${modelData.environment.valid ? '✅' : '❌'}`);
        if (!modelData.environment.valid) {
          console.log(`   Missing: ${modelData.environment.missing.join(', ')}`);
        }
      } else {
        console.log('❌ Failed to check AI models:', modelResponse.status);
      }
    } catch (error) {
      console.log('❌ Error checking AI models:', error.message);
    }

    // Step 4: Test single email extraction
    console.log('\n🔍 Step 4: Testing single email extraction...');
    
    try {
      const extractResponse = await fetch('http://localhost:3000/api/emails/extract-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          emailId: testEmail.id,
          saveToDatabase: true
        })
      });

      console.log(`📡 Extract API Response Status: ${extractResponse.status}`);

      if (extractResponse.ok) {
        const extractData = await extractResponse.json();
        console.log('✅ Extraction successful!');
        console.log('📊 Results:', {
          success: extractData.success,
          modelUsed: extractData.extraction?.modelUsed,
          processingTime: extractData.extraction?.processingTime,
          confidence: extractData.extraction?.confidence,
        });

        if (extractData.extraction?.transaction) {
          const txn = extractData.extraction.transaction;
          console.log('\n💰 Extracted Transaction:');
          console.log(`   Amount: ${txn.amount} ${txn.currency || 'N/A'}`);
          console.log(`   Merchant: ${txn.merchantName || 'N/A'}`);
          console.log(`   Category: ${txn.category || 'N/A'}`);
          console.log(`   Direction: ${txn.direction || 'N/A'}`);
          console.log(`   Confidence: ${txn.confidence}`);
        }

        if (extractData.saved) {
          console.log(`\n💾 Saved to database: ${extractData.saved}`);
        }
      } else {
        const errorData = await extractResponse.text();
        console.log('❌ Extraction failed:', extractResponse.status);
        console.log('   Response:', errorData);
      }
    } catch (error) {
      console.log('❌ Error testing extraction:', error.message);
    }

    // Step 5: Test batch processing
    console.log('\n🔄 Step 5: Testing batch processing...');
    
    try {
      const batchResponse = await fetch('http://localhost:3000/api/emails/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          batchSize: 2,
          forceReprocess: false
        })
      });

      console.log(`📡 Batch API Response Status: ${batchResponse.status}`);

      if (batchResponse.ok) {
        const batchData = await batchResponse.json();
        console.log('✅ Batch processing result:', {
          success: batchData.success,
          processed: batchData.processed,
          successful: batchData.successful,
          errors: batchData.errors,
          processingTime: batchData.processingTime,
        });

        if (batchData.errorDetails && batchData.errorDetails.length > 0) {
          console.log('\n❌ Processing errors:');
          batchData.errorDetails.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error.emailId}: ${error.error}`);
          });
        }
      } else {
        const errorData = await batchResponse.text();
        console.log('❌ Batch processing failed:', batchResponse.status);
        console.log('   Response:', errorData);
      }
    } catch (error) {
      console.log('❌ Error testing batch processing:', error.message);
    }

    // Step 6: Check final results
    console.log('\n📊 Step 6: Checking extracted transactions...');
    
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
        console.log(`\n💰 Transaction ${index + 1}:`);
        console.log(`   Amount: ${txn.amount} ${txn.currency || 'N/A'}`);
        console.log(`   Merchant: ${txn.merchant_name || 'N/A'}`);
        console.log(`   Category: ${txn.category || 'N/A'}`);
        console.log(`   Confidence: ${txn.confidence}`);
        console.log(`   Created: ${txn.created_at}`);
      });
    }

    console.log('\n🎉 AI Processing API Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAIProcessingAPI().catch(console.error);
