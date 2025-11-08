import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { GmailConnectionPublic, ConnectionsResponse } from '@/types';

interface DashboardStats {
  totalEmails: number;
  totalTransactions: number;
  totalConnections: number;
  recentActivity: Array<{
    id: string;
    type: 'email' | 'transaction' | 'connection';
    description: string;
    timestamp: string;
  }>;
}

const HomePage: NextPage = () => {
  const { user, loading, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmails: 0,
    totalTransactions: 0,
    totalConnections: 0,
    recentActivity: [],
  });
  const [connections, setConnections] = useState<GmailConnectionPublic[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // Load dashboard data for authenticated users
  useEffect(() => {
    if (user && !loading) {
      loadDashboardData();
    }
  }, [user, loading]);

  const loadDashboardData = async () => {
    setLoadingStats(true);
    try {
      // Load connections
      let connectionsData: ConnectionsResponse | null = null;
      const connectionsResponse = await fetch('/api/gmail/connections');
      if (connectionsResponse.ok) {
        connectionsData = await connectionsResponse.json();
        setConnections(connectionsData?.connections || []);
      }

      // Load email stats
      const emailResponse = await fetch('/api/emails/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 1, pageSize: 1 }),
      });

      // Load transaction stats
      const transactionResponse = await fetch('/api/transactions/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 1, pageSize: 1 }),
      });

      let totalEmails = 0;
      let totalTransactions = 0;

      if (emailResponse.ok) {
        const emailData = await emailResponse.json();
        totalEmails = emailData.total || 0;
      }

      if (transactionResponse.ok) {
        const transactionData = await transactionResponse.json();
        totalTransactions = transactionData.total || 0;
      }

      setStats({
        totalEmails,
        totalTransactions,
        totalConnections: connectionsData?.connections?.length || 0,
        recentActivity: [
          {
            id: '1',
            type: 'connection',
            description: 'Gmail account connected',
            timestamp: new Date().toISOString(),
          },
          {
            id: '2',
            type: 'email',
            description: `${totalEmails} emails synced`,
            timestamp: new Date().toISOString(),
          },
        ],
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleConnect = () => {
    window.location.href = '/api/gmail/connect';
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <Layout title="Finance Buddy - Loading...">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Finance Buddy...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Unauthenticated homepage
  if (!user) {
    return (
      <Layout
        title="Finance Buddy - Gmail Financial Email Automation"
        description="Automate your financial email collection with Gmail OAuth integration"
      >
        <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Hero Section */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h1 style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '1rem',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Finance Buddy
              </h1>

              <p style={{
                fontSize: '1.25rem',
                color: '#6b7280',
                marginBottom: '2rem',
                lineHeight: '1.6'
              }}>
                Automate your financial email collection with secure Gmail OAuth integration.<br/>
                Sync, organize, and manage financial emails with advanced filtering and search.
              </p>

              {/* Sign In/Up Buttons */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                marginBottom: '3rem'
              }}>
                <a
                  href="/auth"
                  style={{
                    padding: '0.75rem 2rem',
                    backgroundColor: '#9333ea',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    fontSize: '1.1rem',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 6px rgba(147, 51, 234, 0.25)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#7e22ce';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(147, 51, 234, 0.35)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#9333ea';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(147, 51, 234, 0.25)';
                  }}
                >
                  Sign In
                </a>

                <a
                  href="/auth"
                  style={{
                    padding: '0.75rem 2rem',
                    backgroundColor: 'white',
                    color: '#9333ea',
                    textDecoration: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    fontSize: '1.1rem',
                    border: '2px solid #9333ea',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#9333ea';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = '#9333ea';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Sign Up
                </a>
              </div>
            </div>

            {/* Features Section */}
            <div style={{
              background: '#f8fafc',
              padding: '2rem',
              borderRadius: '1rem',
              marginBottom: '2rem'
            }}>
              <h2 style={{ color: '#1f2937', marginBottom: '1.5rem', textAlign: 'center' }}>
                What you'll get with Finance Buddy
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔐</div>
                  <h3 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>Secure OAuth Integration</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                    Connect multiple Gmail accounts with industry-standard OAuth security
                  </p>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📧</div>
                  <h3 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>Smart Email Sync</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                    Manual sync with date ranges, sender filters, and intelligent deduplication
                  </p>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                  <h3 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>Advanced Search</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                    Powerful filtering and search capabilities for financial email management
                  </p>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚙️</div>
                  <h3 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>Admin Tools</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                    Comprehensive testing dashboard and system health monitoring
                  </p>
                </div>
              </div>
            </div>

            {/* Security & Privacy */}
            <div style={{
              background: '#ecfdf5',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #d1fae5'
            }}>
              <h3 style={{ color: '#065f46', marginBottom: '0.5rem' }}>🛡️ Security & Privacy</h3>
              <p style={{ color: '#047857', margin: 0, fontSize: '0.9rem' }}>
                Your data is protected with Row Level Security (RLS), secure cookie authentication,
                and OAuth-only access. We never store your Gmail passwords.
              </p>
            </div>
          </div>
        </main>
      </Layout>
    );
  }

  // Authenticated homepage
  return (
    <Layout
      title="Finance Buddy - Dashboard"
      description="Finance Buddy dashboard with overview and quick actions"
    >
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user.email}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Here's what's happening with your financial email automation
            </p>
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
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Emails
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {loadingStats ? '...' : stats.totalEmails.toLocaleString()}
                      </dd>
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
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Transactions
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {loadingStats ? '...' : stats.totalTransactions.toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🔗</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Connected Accounts
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {loadingStats ? '...' : stats.totalConnections}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleConnect}
                  className="w-full btn-primary text-left flex items-center"
                >
                  <span className="mr-2">🔗</span>
                  Connect Gmail Account
                </button>
                <a
                  href="/admin"
                  className="w-full btn-secondary text-left flex items-center"
                >
                  <span className="mr-2">⚙️</span>
                  Manage Connections
                </a>
                <a
                  href="/emails"
                  className="w-full btn-secondary text-left flex items-center"
                >
                  <span className="mr-2">📧</span>
                  Browse Emails
                </a>
                <a
                  href="/transactions"
                  className="w-full btn-secondary text-left flex items-center"
                >
                  <span className="mr-2">💰</span>
                  Review Transactions
                </a>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Connection Status</h3>
              {connections.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">No Gmail accounts connected</p>
                  <button
                    onClick={handleConnect}
                    className="btn-primary"
                  >
                    Connect Your First Account
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {connections.map((connection) => (
                    <div key={connection.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{connection.email_address}</p>
                        <p className="text-xs text-gray-500">
                          Last sync: {connection.last_sync_at ? new Date(connection.last_sync_at).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Connected
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Features Overview */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Available Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <span className="text-2xl mb-2 block">🔐</span>
                <h4 className="font-medium text-gray-900">Secure OAuth</h4>
                <p className="text-sm text-gray-500">Gmail integration with PKCE</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <span className="text-2xl mb-2 block">📧</span>
                <h4 className="font-medium text-gray-900">Email Sync</h4>
                <p className="text-sm text-gray-500">Manual sync with idempotency</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <span className="text-2xl mb-2 block">🔍</span>
                <h4 className="font-medium text-gray-900">Advanced Search</h4>
                <p className="text-sm text-gray-500">Powerful filtering capabilities</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <span className="text-2xl mb-2 block">💰</span>
                <h4 className="font-medium text-gray-900">Transaction Extraction</h4>
                <p className="text-sm text-gray-500">Automated financial data parsing</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <span className="text-2xl mb-2 block">🔧</span>
                <h4 className="font-medium text-gray-900">Admin Tools</h4>
                <p className="text-sm text-gray-500">System health monitoring</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <span className="text-2xl mb-2 block">🛡️</span>
                <h4 className="font-medium text-gray-900">RLS Security</h4>
                <p className="text-sm text-gray-500">Row-level security protection</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
