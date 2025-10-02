import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { ManualSyncRequest, ConnectionsResponse, ManualSyncResponse } from '@finance-buddy/shared';

interface HealthStatus {
  status: string;
  timestamp: string;
  environment: Record<string, boolean>;
  database: {
    connected: boolean;
    rls_active: boolean;
    tables: string[];
  };
  version: string;
}

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  response: any;
  timestamp: string;
  success: boolean;
}

const TestPage: NextPage = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncForm, setSyncForm] = useState<ManualSyncRequest>({
    connection_id: '',
    date_from: '2024-01-01',
    date_to: '2024-01-31',
    senders: [],
    page: 1,
    pageSize: 10,
    sort: 'asc'
  });

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/test/health');
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const testEndpoint = async (endpoint: string, method: string = 'GET', body?: any) => {
    setLoading(true);
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      
      const data = await response.json();
      const result: TestResult = {
        endpoint,
        method,
        status: response.status,
        response: data,
        timestamp: new Date().toISOString(),
        success: response.ok || response.status === 401, // 401 is expected for auth endpoints
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
    } catch (error) {
      const result: TestResult = {
        endpoint,
        method,
        status: 0,
        response: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date().toISOString(),
        success: false,
      };
      setTestResults(prev => [result, ...prev.slice(0, 9)]);
    } finally {
      setLoading(false);
    }
  };

  const testAllEndpoints = async () => {
    const endpoints = [
      { path: '/api/gmail/connections', method: 'GET' },
      { path: '/api/gmail/connect', method: 'GET' },
      { path: '/api/gmail/disconnect', method: 'POST', body: { connection_id: 'test-id' } },
      { path: '/api/gmail/manual-sync', method: 'POST', body: syncForm },
      { path: '/api/gmail/backfill', method: 'POST', body: { connection_id: 'test-id', date_from: '2024-01-01', date_to: '2024-01-31' } },
      { path: '/api/emails/search', method: 'POST', body: { page: 1, pageSize: 10 } },
      { path: '/api/transactions/search', method: 'POST', body: { page: 1, pageSize: 10 } },
    ];

    for (const endpoint of endpoints) {
      await testEndpoint(endpoint.path, endpoint.method, endpoint.body);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
    }
  };

  return (
    <>
      <Head>
        <title>Finance Buddy - Testing Dashboard</title>
        <meta name="description" content="Testing interface for Finance Buddy L1 features" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Finance Buddy Testing Dashboard</h1>
            <p className="mt-2 text-gray-600">Comprehensive testing interface for L1 features validation</p>
          </div>

          {/* Health Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">System Health</h2>
                <button
                  onClick={fetchHealth}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Refresh
                </button>
              </div>
              
              {health ? (
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-2 ${health.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="font-medium">{health.status}</span>
                    <span className="ml-2 text-sm text-gray-500">{health.version}</span>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Environment Variables</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(health.environment).map(([key, value]) => (
                        <div key={key} className="flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-2 ${value ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span className="truncate">{key}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Database</h3>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${health.database.connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span>Connection: {health.database.connected ? 'Active' : 'Failed'}</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${health.database.rls_active ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                        <span>RLS: {health.database.rls_active ? 'Active' : 'Inactive'}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Tables: {health.database.tables.join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">Loading health status...</div>
              )}
            </div>

            {/* API Testing Controls */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">API Testing</h2>
              
              <div className="space-y-4">
                <button
                  onClick={testAllEndpoints}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Testing...' : 'Test All Endpoints'}
                </button>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => testEndpoint('/api/gmail/connections')}
                    className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                  >
                    Test Connections
                  </button>
                  <button
                    onClick={() => testEndpoint('/api/gmail/connect')}
                    className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                  >
                    Test OAuth
                  </button>
                  <button
                    onClick={() => testEndpoint('/api/emails/search', 'POST', { page: 1 })}
                    className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                  >
                    Test Email Search
                  </button>
                  <button
                    onClick={() => testEndpoint('/api/transactions/search', 'POST', { page: 1 })}
                    className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                  >
                    Test Transactions
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Manual Sync Testing */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Manual Sync Testing</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Connection ID</label>
                <input
                  type="text"
                  value={syncForm.connection_id}
                  onChange={(e) => setSyncForm(prev => ({ ...prev, connection_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="test-connection-id"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                <input
                  type="date"
                  value={syncForm.date_from}
                  onChange={(e) => setSyncForm(prev => ({ ...prev, date_from: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                <input
                  type="date"
                  value={syncForm.date_to}
                  onChange={(e) => setSyncForm(prev => ({ ...prev, date_to: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Page Size</label>
                <select
                  value={syncForm.pageSize}
                  onChange={(e) => setSyncForm(prev => ({ ...prev, pageSize: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={() => testEndpoint('/api/gmail/manual-sync', 'POST', syncForm)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Test Manual Sync
            </button>
          </div>

          {/* Test Results */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Test Results</h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {testResults.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  No test results yet. Run some tests to see results here.
                </div>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-3 ${result.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="font-medium">{result.method} {result.endpoint}</span>
                        <span className={`ml-2 px-2 py-1 text-xs rounded ${
                          result.status === 200 ? 'bg-green-100 text-green-800' :
                          result.status === 401 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {result.status}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 rounded p-3 text-sm">
                      <pre className="whitespace-pre-wrap text-xs overflow-x-auto">
                        {JSON.stringify(result.response, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TestPage;
