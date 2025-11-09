#!/usr/bin/env node

/**
 * Test script for Push Notification API
 * 
 * Usage:
 *   node scripts/test-push-api.js
 * 
 * Prerequisites:
 *   1. User must be logged in and have a session cookie
 *   2. User must have enabled push notifications in Settings
 *   3. Server must be running on localhost:3000
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:3000';
const SESSION_COOKIE = process.env.SESSION_COOKIE || '';

// Test notification payloads
const testNotifications = [
  {
    name: 'Transaction Notification',
    payload: {
      title: '💳 New Transaction Detected',
      body: 'A transaction of ₹1,250.00 was detected from HDFC Bank',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: 'transaction-notification',
      url: '/transactions',
      data: {
        type: 'transaction',
        transactionId: 'test-123',
        amount: 1250.00,
        merchant: 'HDFC Bank'
      }
    }
  },
  {
    name: 'Email Notification',
    payload: {
      title: '📧 New Financial Email',
      body: '3 new financial emails detected from your bank',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: 'email-notification',
      url: '/emails',
      data: {
        type: 'email',
        count: 3,
        sender: 'alerts@bank.com'
      }
    }
  },
  {
    name: 'Sync Complete Notification',
    payload: {
      title: '✅ Sync Complete',
      body: 'Email sync completed successfully. 5 new emails processed.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: 'sync-complete',
      url: '/emails',
      data: {
        type: 'sync-complete',
        emailCount: 5
      }
    }
  },
  {
    name: 'Error Notification',
    payload: {
      title: '⚠️ Sync Error',
      body: 'Failed to sync emails. Please check your connection.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: 'sync-error',
      url: '/settings',
      data: {
        type: 'error',
        errorCode: 'SYNC_FAILED'
      }
    }
  }
];

/**
 * Send a push notification
 */
async function sendPushNotification(payload, sessionCookie) {
  return new Promise((resolve, reject) => {
    const url = new URL('/api/push/send', BASE_URL);
    const postData = JSON.stringify(payload);

    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Cookie': sessionCookie ? `fbsession=${sessionCookie}` : ''
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: response });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Main test function
 */
async function main() {
  console.log('🔔 Push Notification API Test\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!SESSION_COOKIE) {
    console.log('⚠️  No session cookie provided.');
    console.log('   To test with authentication, set SESSION_COOKIE environment variable:');
    console.log('   SESSION_COOKIE=your-cookie-value node scripts/test-push-api.js\n');
  }

  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`🍪 Session cookie: ${SESSION_COOKIE ? 'Provided' : 'Not provided'}\n`);

  // Test each notification
  for (const test of testNotifications) {
    console.log(`\n📤 Testing: ${test.name}`);
    console.log(`   Title: ${test.payload.title}`);
    console.log(`   Body: ${test.payload.body}`);
    console.log(`   URL: ${test.payload.url}`);

    try {
      const result = await sendPushNotification(test.payload, SESSION_COOKIE);
      
      if (result.statusCode === 200) {
        console.log(`   ✅ Success! Sent: ${result.data.sent}, Failed: ${result.data.failed}, Total: ${result.data.total}`);
      } else {
        console.log(`   ❌ Failed with status ${result.statusCode}`);
        console.log(`   Error: ${result.data.error || JSON.stringify(result.data)}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    // Wait 1 second between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Test complete!\n');
  console.log('💡 Tips:');
  console.log('   - Make sure you\'re logged in and have enabled push notifications');
  console.log('   - Check the browser console for notification events');
  console.log('   - Visit /test-push for a UI-based test\n');
}

// Run tests
main().catch(console.error);

