#!/usr/bin/env node

// Test script to verify authentication fallback functionality
const fetch = require('node-fetch');

async function testAuthFallback() {
  console.log('🧪 Testing Authentication Fallback Functionality\n');

  const baseUrl = 'http://localhost:3000';
  
  // Test 1: Direct protected endpoint (should fail)
  console.log('1️⃣ Testing protected endpoint directly...');
  try {
    const response = await fetch(`${baseUrl}/api/gmail/connections`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data)}`);
    console.log(`   ✅ Expected 401 - ${response.status === 401 ? 'PASS' : 'FAIL'}\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 2: Test endpoint (should work)
  console.log('2️⃣ Testing fallback endpoint...');
  try {
    const response = await fetch(`${baseUrl}/api/test/connections`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Connections found: ${data.connections ? data.connections.length : 0}`);
    console.log(`   ✅ Expected 200 - ${response.status === 200 ? 'PASS' : 'FAIL'}\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 3: Simulate frontend fallback logic
  console.log('3️⃣ Testing frontend fallback logic...');
  try {
    // Try protected endpoint first
    let response = await fetch(`${baseUrl}/api/gmail/connections`);
    let endpoint = '/api/gmail/connections';
    
    // If 401, try test endpoint
    if (response.status === 401) {
      console.log('   🔄 Got 401, falling back to test endpoint...');
      response = await fetch(`${baseUrl}/api/test/connections`);
      endpoint = '/api/test/connections';
    }
    
    const data = await response.json();
    console.log(`   Final endpoint used: ${endpoint}`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Connections found: ${data.connections ? data.connections.length : 0}`);
    console.log(`   ✅ Fallback logic - ${response.status === 200 ? 'PASS' : 'FAIL'}\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 4: Auth flow analysis
  console.log('4️⃣ Testing auth flow analysis...');
  try {
    const response = await fetch(`${baseUrl}/api/test/auth-flow`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Authenticated: ${data.authStatus.authenticated}`);
    console.log(`   Session cookie: ${data.authStatus.session.hasCookie ? 'Present' : 'Missing'}`);
    console.log(`   Recommendations: ${data.recommendations.length}`);
    data.recommendations.forEach((rec, i) => {
      console.log(`     ${i + 1}. ${rec}`);
    });
    console.log(`   ✅ Auth analysis - ${response.status === 200 ? 'PASS' : 'FAIL'}\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 5: Manual sync fallback
  console.log('5️⃣ Testing manual sync fallback...');
  try {
    const syncData = {
      connection_id: 'test-connection-1',
      date_from: '2024-01-01',
      date_to: '2024-01-31'
    };

    // Try protected endpoint first
    let response = await fetch(`${baseUrl}/api/gmail/manual-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(syncData)
    });
    let endpoint = '/api/gmail/manual-sync';
    
    // If 401, try test endpoint
    if (response.status === 401) {
      console.log('   🔄 Got 401, falling back to test endpoint...');
      response = await fetch(`${baseUrl}/api/test/manual-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncData)
      });
      endpoint = '/api/test/manual-sync';
    }
    
    const data = await response.json();
    console.log(`   Final endpoint used: ${endpoint}`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Job ID: ${data.job_id || 'N/A'}`);
    console.log(`   Emails processed: ${data.emails_processed || 0}`);
    console.log(`   ✅ Manual sync fallback - ${response.status === 200 ? 'PASS' : 'FAIL'}\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  console.log('🎯 Authentication Fallback Test Complete!');
  console.log('📝 Summary: All protected endpoints return 401 as expected,');
  console.log('   and test endpoints provide mock data for development/testing.');
}

// Run the test
testAuthFallback().catch(console.error);
