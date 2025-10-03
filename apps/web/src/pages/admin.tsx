import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { GmailConnectionPublic, ConnectionsResponse } from '@finance-buddy/shared';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';

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
        body: JSON.stringify({
          connection_id: connectionId,
          revoke: true,
        }),
      });

      if (response.ok) {
        await fetchConnections();
        alert('Gmail account disconnected successfully');
      } else {
        const error = await response.text();
        alert(`Failed to disconnect: ${error}`);
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
      const daysSinceSync = Math.floor((Date.now() - new Date(connection.last_sync_at).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceSync > 7) {
        return { status: 'stale', label: 'Stale', color: 'bg-yellow-100 text-yellow-800' };
      }
      return { status: 'active', label: 'Active', color: 'bg-green-100 text-green-800' };
    }
    return { status: 'new', label: 'New', color: 'bg-blue-100 text-blue-800' };
  };

  return (
    <ProtectedRoute>
      <Layout 
        title="Admin Dashboard - Finance Buddy"
        description="Admin dashboard for Finance Buddy"
      >
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">📧</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Emails</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalEmails}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Transactions</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalTransactions}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">🔄</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Last Sync</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.lastSyncDate ? formatDate(stats.lastSyncDate) : 'Never'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gmail Connections */}
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Gmail Connections</h2>
              </div>
              {connections.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl mb-4 block">📧</span>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Gmail accounts connected</h3>
                  <p className="text-gray-500 mb-6">Connect your first Gmail account to start syncing financial emails</p>
                  <button
                    onClick={handleConnect}
                    className="btn-primary"
                  >
                    Connect Gmail Account
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                                  <span className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    📧
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {connection.email_address}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {connection.id.substring(0, 8)}...
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
      </Layout>
    </ProtectedRoute>
  );
};

export default AdminPage;
