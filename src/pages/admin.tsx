import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { GmailConnectionPublic, ConnectionsResponse } from '@/types';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { useMockAI } from '@/contexts/MockAIContext';
import KeywordManager from '@/components/KeywordManager';
import BankAccountTypesManager from '@/components/BankAccountTypesManager';
import CustomAccountTypesManager from '@/components/CustomAccountTypesManager';
import CategoriesManager from '@/components/CategoriesManager';

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
  const { mockAIEnabled, toggleMockAI } = useMockAI();
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
        <div className="py-6 sm:py-8 lg:py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#6b4ce6] to-[#8b5cf6] rounded-[var(--radius-lg)] flex items-center justify-center shadow-[0_0_20px_rgba(107,76,230,0.3)]">
                    <span className="text-xl sm:text-2xl">⚙️</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#f8fafc]">Admin Dashboard</h1>
                </div>
                <p className="mt-1 text-sm sm:text-base text-[#cbd5e1]">
                  Manage Gmail connections and monitor system health
                </p>
              </div>
              <button
                onClick={handleConnect}
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-[#6b4ce6] text-white font-medium rounded-[var(--radius-md)] hover:bg-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#6b4ce6] focus:ring-offset-2 focus:ring-offset-[#0f0a1a] transition-all duration-200 shadow-[0_0_15px_rgba(107,76,230,0.3)] hover:shadow-[0_0_20px_rgba(107,76,230,0.5)] w-full sm:w-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Connect Gmail Account
              </button>
            </div>

            {/* Mock AI Configuration */}
            <div className="bg-[#1a1625] shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-[#2d1b4e] rounded-[var(--radius-lg)] mb-8">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg leading-6 font-semibold text-[#f8fafc] flex items-center gap-2">
                      <span className="text-xl">🤖</span>
                      Mock AI Configuration
                    </h3>
                    <p className="mt-1 text-sm text-[#cbd5e1]">
                      {mockAIEnabled
                        ? 'Using pattern-based mock responses for development/testing'
                        : 'Using real AI models (OpenAI, Anthropic, Google)'
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      mockAIEnabled
                        ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/30'
                        : 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30'
                    }`}>
                      {mockAIEnabled ? 'Mock AI' : 'Real AI'}
                    </span>
                    <button
                      onClick={toggleMockAI}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#6b4ce6] focus:ring-offset-2 focus:ring-offset-[#1a1625] ${
                        mockAIEnabled ? 'bg-[#6b4ce6]' : 'bg-[#2d1b4e]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-[0_0_10px_rgba(107,76,230,0.3)] ring-0 transition duration-200 ease-in-out ${
                          mockAIEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                {mockAIEnabled && (
                  <div className="mt-4 p-3 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 rounded-[var(--radius-md)]">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <span className="text-[var(--color-warning)] text-lg">⚠️</span>
                      </div>
                      <div>
                        <p className="text-sm text-[#cbd5e1]">
                          Mock AI is enabled. Transaction extraction will use pattern-based logic instead of real AI models.
                          This saves API costs during development but may be less accurate than real AI.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
              <div className="bg-[#1a1625] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-[#2d1b4e] rounded-[var(--radius-lg)] hover:border-[#6b4ce6] hover:shadow-[0_0_20px_rgba(107,76,230,0.2)] transition-all duration-300">
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#6b4ce6] to-[#8b5cf6] rounded-[var(--radius-lg)] flex items-center justify-center shadow-[0_0_15px_rgba(107,76,230,0.3)]">
                      <span className="text-2xl">📧</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <dl>
                        <dt className="text-xs sm:text-sm font-medium text-[#94a3b8] truncate uppercase tracking-wide">Total Emails</dt>
                        <dd className="text-xl sm:text-2xl font-bold text-[#f8fafc] mt-1">{stats.totalEmails}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a1625] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-[#2d1b4e] rounded-[var(--radius-lg)] hover:border-[#6b4ce6] hover:shadow-[0_0_20px_rgba(107,76,230,0.2)] transition-all duration-300">
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-[var(--radius-lg)] flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <dl>
                        <dt className="text-xs sm:text-sm font-medium text-[#94a3b8] truncate uppercase tracking-wide">Total Transactions</dt>
                        <dd className="text-xl sm:text-2xl font-bold text-[#f8fafc] mt-1">{stats.totalTransactions}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a1625] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-[#2d1b4e] rounded-[var(--radius-lg)] hover:border-[#6b4ce6] hover:shadow-[0_0_20px_rgba(107,76,230,0.2)] transition-all duration-300">
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#ec4899] to-[#db2777] rounded-[var(--radius-lg)] flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                      <span className="text-2xl">🔄</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <dl>
                        <dt className="text-xs sm:text-sm font-medium text-[#94a3b8] truncate uppercase tracking-wide">Last Sync</dt>
                        <dd className="text-xl sm:text-2xl font-bold text-[#f8fafc] mt-1 truncate">
                          {stats.lastSyncDate ? formatDate(stats.lastSyncDate) : 'Never'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gmail Connections */}
            <div className="bg-[#1a1625] shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-[#2d1b4e] rounded-[var(--radius-lg)] mb-8">
              <div className="px-6 py-4 border-b border-[#2d1b4e]">
                <h2 className="text-base sm:text-lg font-semibold text-[#f8fafc] flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#6b4ce6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Gmail Connections
                </h2>
              </div>
              {connections.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#6b4ce6] to-[#8b5cf6] rounded-[var(--radius-lg)] flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(107,76,230,0.3)]">
                    <span className="text-3xl">📧</span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#f8fafc] mb-2">No Gmail accounts connected</h3>
                  <p className="text-[#cbd5e1] mb-6 max-w-md mx-auto">Connect your first Gmail account to start syncing financial emails</p>
                  <button
                    onClick={handleConnect}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#6b4ce6] text-white font-medium rounded-[var(--radius-md)] hover:bg-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#6b4ce6] focus:ring-offset-2 focus:ring-offset-[#1a1625] transition-all duration-200 shadow-[0_0_15px_rgba(107,76,230,0.3)] hover:shadow-[0_0_20px_rgba(107,76,230,0.5)]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Connect Gmail Account
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-[#0f0a1a]/50 border-b border-[#2d1b4e]">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                          Account
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                          Last Sync
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                          Scopes
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                          Connected
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#1a1625]">
                      {connections.map((connection) => {
                        const status = getConnectionStatus(connection);
                        const statusConfig = {
                          error: { bg: 'bg-[#ef4444]/10', color: 'text-[#ef4444]', border: 'border-[#ef4444]/30' },
                          stale: { bg: 'bg-[var(--color-warning)]/10', color: 'text-[var(--color-warning)]', border: 'border-[var(--color-warning)]/30' },
                          active: { bg: 'bg-[#10b981]/10', color: 'text-[#10b981]', border: 'border-[#10b981]/30' },
                          new: { bg: 'bg-[#6b4ce6]/10', color: 'text-[#a78bfa]', border: 'border-[#6b4ce6]/30' },
                        };
                        const statusStyle = statusConfig[status.status as keyof typeof statusConfig] || statusConfig.new;

                        return (
                          <tr key={connection.id} className="hover:bg-[#2d1b4e]/20 transition-all duration-200 border-b border-[#2d1b4e]">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-[#6b4ce6] to-[#8b5cf6] rounded-[var(--radius-md)] flex items-center justify-center shadow-[0_0_10px_rgba(107,76,230,0.3)]">
                                  <span className="text-lg">📧</span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-[#f8fafc]">
                                    {connection.email_address}
                                  </div>
                                  <div className="text-xs text-[#94a3b8]">
                                    ID: {connection.id.substring(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusStyle.bg} ${statusStyle.color} border ${statusStyle.border}`}>
                                {status.label}
                              </span>
                              {connection.last_error && (
                                <div className="text-xs text-[#ef4444] mt-1" title={connection.last_error}>
                                  Error: {connection.last_error.substring(0, 50)}...
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#cbd5e1]">
                              {formatDate(connection.last_sync_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#94a3b8]">
                              <div className="max-w-xs truncate" title={connection.granted_scopes.join(', ')}>
                                {connection.granted_scopes.length} scopes
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#94a3b8]">
                              {formatDate(connection.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleDisconnect(connection.id)}
                                disabled={loading}
                                className="px-3 py-1.5 text-[#ef4444] hover:text-[#dc2626] hover:bg-[#ef4444]/10 rounded-[var(--radius-md)] border border-transparent hover:border-[#ef4444] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Bank Account Types Management */}
            <BankAccountTypesManager className="mb-8" />

            {/* Custom Account Types Management */}
            <CustomAccountTypesManager className="mb-8" />

            {/* Transaction Categories Management */}
            <CategoriesManager className="mb-8" />

            {/* Transaction Keywords Management */}
            <KeywordManager className="mb-8" />

            {/* System Information */}
            {health && (
              <div className="bg-[#1a1625] rounded-[var(--radius-lg)] shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-[#2d1b4e]">
                <div className="px-6 py-4 border-b border-[#2d1b4e]">
                  <h2 className="text-base sm:text-lg font-semibold text-[#f8fafc] flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#6b4ce6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    System Information
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-[#f8fafc] mb-3 uppercase tracking-wide">Environment Variables</h3>
                      <div className="space-y-2">
                        {Object.entries(health.environment).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between p-2 bg-[#0f0a1a]/50 rounded-[var(--radius-md)] border border-[#2d1b4e]">
                            <span className="text-sm text-[#cbd5e1]">{key}</span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              value ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30' : 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30'
                            }`}>
                              {value ? 'Set' : 'Missing'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-[#f8fafc] mb-3 uppercase tracking-wide">Database Status</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-[#0f0a1a]/50 rounded-[var(--radius-md)] border border-[#2d1b4e]">
                          <span className="text-sm text-[#cbd5e1]">Connection</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            health.database.connected ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30' : 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30'
                          }`}>
                            {health.database.connected ? 'Connected' : 'Failed'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-[#0f0a1a]/50 rounded-[var(--radius-md)] border border-[#2d1b4e]">
                          <span className="text-sm text-[#cbd5e1]">RLS Active</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            health.database.rls_active ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30' : 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/30'
                          }`}>
                            {health.database.rls_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="mt-3 p-2 bg-[#0f0a1a]/50 rounded-[var(--radius-md)] border border-[#2d1b4e]">
                          <span className="text-sm text-[#cbd5e1] font-medium">Tables:</span>
                          <div className="text-xs text-[#94a3b8] mt-1">
                            {health.database.tables.join(', ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-[#2d1b4e]">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-sm font-semibold text-[#f8fafc]">Version: </span>
                        <span className="text-sm text-[#cbd5e1]">{health.version}</span>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-[#f8fafc]">Last Updated: </span>
                        <span className="text-sm text-[#cbd5e1]">{formatDate(health.timestamp)}</span>
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
