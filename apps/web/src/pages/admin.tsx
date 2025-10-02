import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { GmailConnectionPublic, ConnectionsResponse } from '@finance-buddy/shared';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface SystemHealth {
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

const AdminPage: NextPage = () => {
  const [connections, setConnections] = useState<GmailConnectionPublic[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalEmails: 0,
    totalTransactions: 0,
    lastSyncDate: null as string | null,
  });

  useEffect(() => {
    fetchConnections();
    fetchHealth();
    fetchStats();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/gmail/connections');
      if (response.ok) {
        const data: ConnectionsResponse = await response.json();
        setConnections(data.connections);
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    }
  };

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/test/health');
      if (response.ok) {
        const data = await response.json();
        setHealth(data);
      }
    } catch (error) {
      console.error('Failed to fetch health:', error);
    }
  };

  const fetchStats = async () => {
    // This would normally call actual stats APIs
    // For now, showing placeholder data
    setStats({
      totalEmails: 0,
      totalTransactions: 0,
      lastSyncDate: null,
    });
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this Gmail account? This will revoke access tokens but preserve historical data.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/gmail/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connection_id: connectionId, revoke: true }),
      });

      if (response.ok) {
        await fetchConnections(); // Refresh the list
      } else {
        alert('Failed to disconnect account');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      alert('Failed to disconnect account');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = '/api/gmail/connect';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getConnectionStatus = (connection: GmailConnectionPublic) => {
    if (connection.last_error) {
      return { status: 'error', label: 'Error', color: 'bg-red-100 text-red-800' };
    }
    if (connection.last_sync_at) {
      const lastSync = new Date(connection.last_sync_at);
      const daysSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceSync > 7) {
        return { status: 'stale', label: 'Stale', color: 'bg-yellow-100 text-yellow-800' };
      }
      return { status: 'active', label: 'Active', color: 'bg-green-100 text-green-800' };
    }
    return { status: 'new', label: 'New', color: 'bg-blue-100 text-blue-800' };
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Finance Buddy - Admin Dashboard</title>
        <meta name="description" content="Admin dashboard for Finance Buddy" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage Gmail connections and monitor system health
                </p>
              </div>
              <button
                onClick={handleConnect}
                className="btn-primary"
              >
                Connect Gmail Account
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* System Health Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    health?.status === 'healthy' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <div className={`w-3 h-3 rounded-full ${
                      health?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">System Status</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {health?.status || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Emails</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.totalEmails.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Transactions</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.totalTransactions.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Last Sync</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.lastSyncDate ? formatDate(stats.lastSyncDate) : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gmail Connections */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Gmail Connections</h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage connected Gmail accounts and their sync status
              </p>
            </div>

            {connections.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Gmail accounts connected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by connecting your first Gmail account.
                </p>
                <div className="mt-6">
                  <button
                    onClick={handleConnect}
                    className="btn-primary"
                  >
                    Connect Gmail Account
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Account
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Sync
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Scopes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Connected
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {connections.map((connection) => {
                      const status = getConnectionStatus(connection);
                      return (
                        <tr key={connection.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <svg className="h-6 w-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                  </svg>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {connection.email_address}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {connection.google_user_id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                              {status.label}
                            </span>
                            {connection.last_error && (
                              <div className="text-xs text-red-600 mt-1" title={connection.last_error}>
                                Error: {connection.last_error.substring(0, 50)}...
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(connection.last_sync_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="max-w-xs truncate" title={connection.granted_scopes.join(', ')}>
                              {connection.granted_scopes.length} scopes
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(connection.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleDisconnect(connection.id)}
                              disabled={loading}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              Disconnect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* System Information */}
          {health && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">System Information</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Environment Variables</h3>
                    <div className="space-y-2">
                      {Object.entries(health.environment).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{key}</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {value ? 'Set' : 'Missing'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Database Status</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Connection</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          health.database.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {health.database.connected ? 'Connected' : 'Failed'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">RLS Active</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          health.database.rls_active ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {health.database.rls_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="mt-3">
                        <span className="text-sm text-gray-600">Tables:</span>
                        <div className="text-xs text-gray-500 mt-1">
                          {health.database.tables.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-900">Version: </span>
                      <span className="text-sm text-gray-600">{health.version}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">Last Updated: </span>
                      <span className="text-sm text-gray-600">{formatDate(health.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminPage;
