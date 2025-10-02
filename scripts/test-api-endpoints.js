#!/usr/bin/env node

/**
 * Comprehensive API Testing Script for Finance Buddy
 * Tests all endpoints, authentication, and fallback functionality
 */

const https = require('https');
const http = require('http');

class APITester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = [];
  }

  async request(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${path}`;
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Finance-Buddy-API-Tester/1.0',
          ...options.headers
        }
      };

      const req = client.request(requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = data ? JSON.parse(data) : {};
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: jsonData
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: { raw: data }
            });
          }
        });
      });

      req.on('error', reject);

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  log(emoji, message, details = '') {
    console.log(`${emoji} ${message}${details ? ` - ${details}` : ''}`);
  }

  async testEndpoint(name, path, options = {}, expectedStatus = 200) {
    try {
      const response = await this.request(path, options);
      const success = response.status === expectedStatus;
      
      this.results.push({
        name,
        path,
        status: response.status,
        expected: expectedStatus,
        success,
        data: response.data
      });

      const emoji = success ? '✅' : '❌';
      const statusInfo = `${response.status}${response.status !== expectedStatus ? ` (expected ${expectedStatus})` : ''}`;
      this.log(emoji, `${name}`, `Status: ${statusInfo}`);
      
      return response;
    } catch (error) {
      this.log('❌', `${name}`, `Error: ${error.message}`);
      this.results.push({
        name,
        path,
        status: 0,
        expected: expectedStatus,
        success: false,
        error: error.message
      });
      return null;
    }
  }

  async testAuthFlow() {
    this.log('🔐', 'Testing Authentication Flow');
    
    // Test auth flow analysis
    await this.testEndpoint(
      'Auth Flow Analysis',
      '/api/test/auth-flow'
    );

    // Test session endpoint
    await this.testEndpoint(
      'Session Check (No Auth)',
      '/api/auth/session',
      {},
      401
    );

    // Test protected endpoint
    await this.testEndpoint(
      'Protected Connections (No Auth)',
      '/api/gmail/connections',
      {},
      401
    );
  }

  async testFallbackEndpoints() {
    this.log('🔄', 'Testing Fallback Endpoints');

    // Test connections fallback
    await this.testEndpoint(
      'Test Connections Endpoint',
      '/api/test/connections'
    );

    // Test manual sync fallback
    await this.testEndpoint(
      'Test Manual Sync Endpoint',
      '/api/test/manual-sync',
      {
        method: 'POST',
        body: {
          connection_id: 'test-connection-1',
          date_from: '2024-01-01',
          date_to: '2024-01-31'
        }
      }
    );
  }

  async testHealthEndpoints() {
    this.log('🏥', 'Testing Health Endpoints');

    await this.testEndpoint(
      'System Health',
      '/api/test/health'
    );
  }

  async testProtectedEndpoints() {
    this.log('🔒', 'Testing Protected Endpoints (Should Return 401)');

    const protectedEndpoints = [
      { name: 'Gmail Connections', path: '/api/gmail/connections' },
      { name: 'Gmail Connect', path: '/api/gmail/connect' },
      { name: 'Email Search', path: '/api/emails/search', method: 'POST', body: { page: 1 } },
      { name: 'Transaction Search', path: '/api/transactions/search', method: 'POST', body: { page: 1 } }
    ];

    for (const endpoint of protectedEndpoints) {
      await this.testEndpoint(
        endpoint.name,
        endpoint.path,
        {
          method: endpoint.method || 'GET',
          body: endpoint.body
        },
        401
      );
    }
  }

  async testFallbackLogic() {
    this.log('🎯', 'Testing Fallback Logic');

    // Simulate frontend fallback logic
    try {
      // Try protected endpoint
      let response = await this.request('/api/gmail/connections');
      let finalEndpoint = '/api/gmail/connections';
      
      // If 401, try test endpoint
      if (response.status === 401) {
        response = await this.request('/api/test/connections');
        finalEndpoint = '/api/test/connections';
      }
      
      const success = response.status === 200 && response.data.connections;
      this.log(
        success ? '✅' : '❌',
        'Fallback Logic Test',
        `${finalEndpoint} - ${response.data.connections?.length || 0} connections`
      );
    } catch (error) {
      this.log('❌', 'Fallback Logic Test', `Error: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log('🧪 Finance Buddy API Testing Suite\n');
    console.log(`Testing against: ${this.baseUrl}\n`);

    await this.testHealthEndpoints();
    console.log();
    
    await this.testAuthFlow();
    console.log();
    
    await this.testProtectedEndpoints();
    console.log();
    
    await this.testFallbackEndpoints();
    console.log();
    
    await this.testFallbackLogic();
    console.log();

    this.printSummary();
  }

  printSummary() {
    console.log('📊 Test Summary');
    console.log('================');
    
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${Math.round((passed / total) * 100)}%\n`);

    if (failed > 0) {
      console.log('❌ Failed Tests:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`   • ${r.name}: ${r.error || `Status ${r.status} (expected ${r.expected})`}`);
        });
      console.log();
    }

    console.log('🎯 Key Findings:');
    
    // Check if server is running
    const healthTest = this.results.find(r => r.name === 'System Health');
    if (healthTest?.success) {
      console.log('   ✅ Server is running and healthy');
    } else {
      console.log('   ❌ Server may not be running or accessible');
    }

    // Check authentication
    const authTests = this.results.filter(r => r.expected === 401);
    const authWorking = authTests.every(r => r.success);
    if (authWorking) {
      console.log('   ✅ Authentication protection is working correctly');
    } else {
      console.log('   ❌ Authentication protection may have issues');
    }

    // Check fallback endpoints
    const fallbackTests = this.results.filter(r => r.path.includes('/api/test/'));
    const fallbackWorking = fallbackTests.every(r => r.success);
    if (fallbackWorking) {
      console.log('   ✅ Fallback endpoints are working correctly');
    } else {
      console.log('   ❌ Fallback endpoints may have issues');
    }

    console.log('\n🚀 Next Steps:');
    console.log('   1. Run manual browser tests using BROWSER_TESTING_GUIDE.md');
    console.log('   2. Test authentication flows in the browser');
    console.log('   3. Verify UI components work correctly');
    console.log('   4. Test protected route redirects');
  }
}

// Run the tests
const tester = new APITester();
tester.runAllTests().catch(console.error);
