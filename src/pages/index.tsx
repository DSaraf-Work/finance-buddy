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
  const [checkingPriorityEmails, setCheckingPriorityEmails] = useState(false);
  const [priorityEmailResult, setPriorityEmailResult] = useState<any>(null);

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

  const handleCheckPriorityEmails = async () => {
    setCheckingPriorityEmails(true);
    setPriorityEmailResult(null);

    try {
      const response = await fetch('/api/priority-emails/trigger', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setPriorityEmailResult(data);
        // Reload dashboard data to show new transactions
        await loadDashboardData();
      } else {
        setPriorityEmailResult({
          success: false,
          error: data.error || 'Failed to check priority emails',
        });
      }
    } catch (error: any) {
      console.error('Failed to check priority emails:', error);
      setPriorityEmailResult({
        success: false,
        error: error.message || 'Failed to check priority emails',
      });
    } finally {
      setCheckingPriorityEmails(false);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header - Enhanced */}
          <div className="mb-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Welcome back!
                </h1>
                <p className="mt-2 text-base text-gray-600">
                  {user.email}
                </p>
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">All Systems Operational</span>
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Here's your financial automation overview
            </p>
          </div>

          {/* Stats Cards - Enhanced with gradients and better visual hierarchy */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Total Emails Card */}
            <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full"></div>
              <div className="relative p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Total Emails
                    </p>
                    <p className="mt-3 text-4xl font-bold text-gray-900">
                      {loadingStats ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        stats.totalEmails.toLocaleString()
                      )}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      Synced from Gmail
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl">📧</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Transactions Card */}
            <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full"></div>
              <div className="relative p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Transactions
                    </p>
                    <p className="mt-3 text-4xl font-bold text-gray-900">
                      {loadingStats ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        stats.totalTransactions.toLocaleString()
                      )}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      AI-extracted
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl">💰</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Connected Accounts Card */}
            <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full"></div>
              <div className="relative p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Accounts
                    </p>
                    <p className="mt-3 text-4xl font-bold text-gray-900">
                      {loadingStats ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        stats.totalConnections
                      )}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      Gmail connected
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl">🔗</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Connection Status - Side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* Quick Actions - Enhanced */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
                <span className="text-2xl">⚡</span>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleConnect}
                  className="group w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3.5 px-5 rounded-xl transition-all duration-200 flex items-center justify-between shadow-md hover:shadow-lg"
                >
                  <div className="flex items-center">
                    <span className="text-xl mr-3">🔗</span>
                    <span>Connect Gmail Account</span>
                  </div>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <a
                  href="/admin"
                  className="group w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3.5 px-5 rounded-xl transition-all duration-200 flex items-center justify-between border-2 border-gray-200 hover:border-gray-300"
                >
                  <div className="flex items-center">
                    <span className="text-xl mr-3">⚙️</span>
                    <span>Manage Connections</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                <a
                  href="/emails"
                  className="group w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3.5 px-5 rounded-xl transition-all duration-200 flex items-center justify-between border-2 border-gray-200 hover:border-gray-300"
                >
                  <div className="flex items-center">
                    <span className="text-xl mr-3">📧</span>
                    <span>Browse Emails</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                <a
                  href="/transactions"
                  className="group w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3.5 px-5 rounded-xl transition-all duration-200 flex items-center justify-between border-2 border-gray-200 hover:border-gray-300"
                >
                  <div className="flex items-center">
                    <span className="text-xl mr-3">💰</span>
                    <span>Review Transactions</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                <button
                  onClick={handleCheckPriorityEmails}
                  disabled={checkingPriorityEmails}
                  className="group w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3.5 px-5 rounded-xl transition-all duration-200 flex items-center justify-between shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="flex items-center">
                    <span className="text-xl mr-3">🚀</span>
                    <span>{checkingPriorityEmails ? 'Checking...' : 'Check Priority Emails'}</span>
                  </div>
                  {checkingPriorityEmails && (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                </button>
              </div>

              {/* Priority Email Result - Enhanced */}
              {priorityEmailResult && (
                <div className={`mt-6 rounded-xl overflow-hidden ${
                  priorityEmailResult.success
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200'
                    : 'bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200'
                }`}>
                  <div className="p-5">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          priorityEmailResult.success ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          <span className="text-xl">
                            {priorityEmailResult.success ? '✓' : '✕'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className={`font-bold text-lg ${
                          priorityEmailResult.success ? 'text-green-900' : 'text-red-900'
                        }`}>
                          {priorityEmailResult.success ? 'Check Complete!' : 'Check Failed'}
                        </h4>
                        {priorityEmailResult.success && priorityEmailResult.result && (
                          <div className="mt-3 grid grid-cols-2 gap-3">
                            <div className="bg-white/60 rounded-lg p-3">
                              <p className="text-xs text-gray-600 font-medium">Emails Found</p>
                              <p className="text-2xl font-bold text-gray-900">{priorityEmailResult.result.emailsFound}</p>
                            </div>
                            <div className="bg-white/60 rounded-lg p-3">
                              <p className="text-xs text-gray-600 font-medium">Processed</p>
                              <p className="text-2xl font-bold text-gray-900">{priorityEmailResult.result.emailsProcessed}</p>
                            </div>
                            <div className="bg-white/60 rounded-lg p-3">
                              <p className="text-xs text-gray-600 font-medium">Marked Read</p>
                              <p className="text-2xl font-bold text-gray-900">{priorityEmailResult.result.emailsMarkedRead}</p>
                            </div>
                            <div className="bg-white/60 rounded-lg p-3">
                              <p className="text-xs text-gray-600 font-medium">Connections</p>
                              <p className="text-2xl font-bold text-gray-900">{priorityEmailResult.result.connectionsProcessed}</p>
                            </div>
                          </div>
                        )}
                        {priorityEmailResult.error && (
                          <p className="mt-3 text-sm text-red-700 bg-white/60 rounded-lg p-3">
                            {priorityEmailResult.error}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Connection Status - Enhanced */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Connected Accounts</h3>
                <span className="text-2xl">🔗</span>
              </div>
              {connections.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">📭</span>
                  </div>
                  <p className="text-gray-600 font-medium mb-2">No accounts connected</p>
                  <p className="text-sm text-gray-500 mb-6">Connect your first Gmail account to get started</p>
                  <button
                    onClick={handleConnect}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <span className="mr-2">🔗</span>
                    Connect Your First Account
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {connections.map((connection) => (
                    <div
                      key={connection.id}
                      className="group relative bg-gradient-to-r from-gray-50 to-blue-50/30 hover:from-blue-50 hover:to-indigo-50 rounded-xl p-4 transition-all duration-200 border border-gray-200 hover:border-blue-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                            <span className="text-lg">📧</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{connection.email_address}</p>
                            <p className="text-xs text-gray-500 flex items-center mt-1">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Last sync: {connection.last_sync_at ? new Date(connection.last_sync_at).toLocaleDateString() : 'Never'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Features Overview - Enhanced with better visual design */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Powerful Features</h3>
              <p className="text-gray-600">Everything you need to manage your financial emails</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-100 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
                <div className="absolute top-4 right-4 w-12 h-12 bg-blue-500/10 rounded-full"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">🔐</span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Secure OAuth</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">Gmail integration with industry-standard PKCE security</p>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border-2 border-emerald-100 hover:border-emerald-300 transition-all duration-300 hover:shadow-lg">
                <div className="absolute top-4 right-4 w-12 h-12 bg-emerald-500/10 rounded-full"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">📧</span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Smart Email Sync</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">Manual sync with date ranges and intelligent deduplication</p>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-100 hover:border-purple-300 transition-all duration-300 hover:shadow-lg">
                <div className="absolute top-4 right-4 w-12 h-12 bg-purple-500/10 rounded-full"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Advanced Search</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">Powerful filtering and search capabilities</p>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border-2 border-amber-100 hover:border-amber-300 transition-all duration-300 hover:shadow-lg">
                <div className="absolute top-4 right-4 w-12 h-12 bg-amber-500/10 rounded-full"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">💰</span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">AI Extraction</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">Automated financial transaction data parsing</p>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-cyan-50 to-sky-50 p-6 rounded-xl border-2 border-cyan-100 hover:border-cyan-300 transition-all duration-300 hover:shadow-lg">
                <div className="absolute top-4 right-4 w-12 h-12 bg-cyan-500/10 rounded-full"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">🔧</span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Admin Tools</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">Comprehensive system health monitoring</p>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-rose-50 to-red-50 p-6 rounded-xl border-2 border-rose-100 hover:border-rose-300 transition-all duration-300 hover:shadow-lg">
                <div className="absolute top-4 right-4 w-12 h-12 bg-rose-500/10 rounded-full"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">🛡️</span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">RLS Security</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">Row-level security data protection</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
