#!/usr/bin/env node

/**
 * Test Finance Buddy API endpoints
 * Usage: node scripts/test-apis.js
 * 
 * This script tests the API endpoints to ensure they're properly configured
 * and return expected responses for basic scenarios.
 */

const http = require('http');

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

async function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function testEndpoint(name, path, method = 'GET', body = null, expectedStatus = 401) {
  try {
    console.log(`Testing ${name}...`);
    const response = await makeRequest(path, method, body);
    
    if (response.status === expectedStatus) {
      console.log(`✅ ${name}: Expected status ${expectedStatus}`);
    } else {
      console.log(`⚠️  ${name}: Got status ${response.status}, expected ${expectedStatus}`);
      if (response.data) {
        console.log('   Response:', response.data);
      }
    }
  } catch (error) {
    console.log(`❌ ${name}: Error - ${error.message}`);
  }
}

async function runTests() {
  console.log('Testing Finance Buddy API endpoints...');
  console.log('Base URL:', BASE_URL);
  console.log('Note: Most endpoints should return 401 (Unauthorized) without auth\n');

  // Test Gmail endpoints
  await testEndpoint('Gmail Connect', '/api/gmail/connect');
  await testEndpoint('Gmail Callback', '/api/gmail/callback');
  await testEndpoint('Gmail Connections', '/api/gmail/connections');
  
  await testEndpoint('Gmail Disconnect', '/api/gmail/disconnect', 'POST', {
    connection_id: '00000000-0000-0000-0000-000000000000'
  });
  
  await testEndpoint('Gmail Manual Sync', '/api/gmail/manual-sync', 'POST', {
    connection_id: '00000000-0000-0000-0000-000000000000',
    date_from: '2024-01-01',
    date_to: '2024-01-31'
  });
  
  await testEndpoint('Gmail Backfill', '/api/gmail/backfill', 'POST', {
    connection_id: '00000000-0000-0000-0000-000000000000',
    date_from: '2024-01-01',
    date_to: '2024-01-31'
  });

  // Test search endpoints
  await testEndpoint('Email Search', '/api/emails/search', 'POST', {
    page: 1,
    pageSize: 10
  });
  
  await testEndpoint('Transaction Search', '/api/transactions/search', 'POST', {
    page: 1,
    pageSize: 10
  });

  console.log('\nAPI endpoint tests completed!');
  console.log('To fully test the APIs, you need to:');
  console.log('1. Set up environment variables (.env.local)');
  console.log('2. Apply the database migration');
  console.log('3. Start the Next.js development server');
  console.log('4. Implement authentication flow');
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
