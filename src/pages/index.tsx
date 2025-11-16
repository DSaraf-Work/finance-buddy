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
      <div className="min-h-screen bg-white py-12">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          {/* Welcome Header - Minimalist */}
          <div className="mb-16">
            <div className="flex items-end justify-between border-b border-gray-200 pb-6">
              <div>
                <p className="text-sm font-medium text-gray-500 tracking-wide uppercase mb-2">
                  Dashboard
                </p>
                <h1 className="text-4xl font-light text-gray-900 tracking-tight">
                  Welcome back
                </h1>
              </div>
              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <span className="text-xs font-medium text-gray-600 tracking-wide">ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Stats Cards - Minimalist */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {/* Total Emails Card */}
            <div className="group">
              <div className="border-l-2 border-gray-900 pl-6 py-4 hover:border-gray-600 transition-colors duration-200">
                <p className="text-xs font-medium text-gray-500 tracking-widest uppercase mb-3">
                  Emails
                </p>
                <p className="text-5xl font-extralight text-gray-900 mb-2 tracking-tight">
                  {loadingStats ? (
                    <span className="text-gray-300">—</span>
                  ) : (
                    stats.totalEmails.toLocaleString()
                  )}
                </p>
                <p className="text-xs text-gray-400 tracking-wide">
                  Synced from Gmail
                </p>
              </div>
            </div>

            {/* Total Transactions Card */}
            <div className="group">
              <div className="border-l-2 border-gray-900 pl-6 py-4 hover:border-gray-600 transition-colors duration-200">
                <p className="text-xs font-medium text-gray-500 tracking-widest uppercase mb-3">
                  Transactions
                </p>
                <p className="text-5xl font-extralight text-gray-900 mb-2 tracking-tight">
                  {loadingStats ? (
                    <span className="text-gray-300">—</span>
                  ) : (
                    stats.totalTransactions.toLocaleString()
                  )}
                </p>
                <p className="text-xs text-gray-400 tracking-wide">
                  AI-extracted
                </p>
              </div>
            </div>

            {/* Connected Accounts Card */}
            <div className="group">
              <div className="border-l-2 border-gray-900 pl-6 py-4 hover:border-gray-600 transition-colors duration-200">
                <p className="text-xs font-medium text-gray-500 tracking-widest uppercase mb-3">
                  Accounts
                </p>
                <p className="text-5xl font-extralight text-gray-900 mb-2 tracking-tight">
                  {loadingStats ? (
                    <span className="text-gray-300">—</span>
                  ) : (
                    stats.totalConnections
                  )}
                </p>
                <p className="text-xs text-gray-400 tracking-wide">
                  Connected
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Connection Status - Minimalist */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            {/* Quick Actions - Minimalist */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 tracking-widest uppercase mb-6">
                Actions
              </h3>
              <div className="space-y-1">
                <button
                  onClick={handleConnect}
                  className="group w-full text-left py-4 px-6 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-gray-900 tracking-wide">Connect Gmail Account</span>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <a
                  href="/admin"
                  className="group w-full block py-4 px-6 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-gray-900 tracking-wide">Manage Connections</span>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                <a
                  href="/emails"
                  className="group w-full block py-4 px-6 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-gray-900 tracking-wide">Browse Emails</span>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                <a
                  href="/transactions"
                  className="group w-full block py-4 px-6 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-gray-900 tracking-wide">Review Transactions</span>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                <button
                  onClick={handleCheckPriorityEmails}
                  disabled={checkingPriorityEmails}
                  className="group w-full text-left py-4 px-6 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                  <span className="text-sm font-medium text-gray-900 tracking-wide">
                    {checkingPriorityEmails ? 'Checking Priority Emails...' : 'Check Priority Emails'}
                  </span>
                  {checkingPriorityEmails ? (
                    <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Priority Email Result - Minimalist */}
              {priorityEmailResult && (
                <div className={`mt-8 border-l-2 pl-6 py-4 ${
                  priorityEmailResult.success
                    ? 'border-emerald-500'
                    : 'border-red-500'
                }`}>
                  <p className={`text-xs font-medium tracking-widest uppercase mb-3 ${
                    priorityEmailResult.success ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {priorityEmailResult.success ? 'Success' : 'Error'}
                  </p>
                  {priorityEmailResult.success && priorityEmailResult.result && (
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-gray-500 tracking-wide">Emails Found</span>
                        <span className="text-sm font-medium text-gray-900">{priorityEmailResult.result.emailsFound}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-gray-500 tracking-wide">Processed</span>
                        <span className="text-sm font-medium text-gray-900">{priorityEmailResult.result.emailsProcessed}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-gray-500 tracking-wide">Connections</span>
                        <span className="text-sm font-medium text-gray-900">{priorityEmailResult.result.connectionsProcessed}</span>
                      </div>
                    </div>
                  )}
                  {priorityEmailResult.error && (
                    <p className="text-xs text-red-600 tracking-wide">
                      {priorityEmailResult.error}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Connection Status - Minimalist */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 tracking-widest uppercase mb-6">
                Connections
              </h3>
              {connections.length === 0 ? (
                <div className="border border-gray-200 py-12 text-center">
                  <p className="text-sm text-gray-500 mb-6 tracking-wide">No accounts connected</p>
                  <button
                    onClick={handleConnect}
                    className="inline-block text-xs font-medium text-gray-900 tracking-widest uppercase border-b-2 border-gray-900 hover:border-gray-600 transition-colors duration-150 pb-1"
                  >
                    Connect Account
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {connections.map((connection) => (
                    <div
                      key={connection.id}
                      className="group py-4 px-6 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 tracking-wide">{connection.email_address}</p>
                          <p className="text-xs text-gray-400 mt-1 tracking-wide">
                            {connection.last_sync_at ? new Date(connection.last_sync_at).toLocaleDateString() : 'Never synced'}
                          </p>
                        </div>
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Features Overview - Minimalist */}
          <div className="border-t border-gray-200 pt-16">
            <h3 className="text-sm font-medium text-gray-500 tracking-widest uppercase mb-12">
              Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
              <div className="group">
                <h4 className="text-sm font-medium text-gray-900 tracking-wide mb-2">Secure OAuth</h4>
                <p className="text-xs text-gray-500 leading-relaxed tracking-wide">
                  Gmail integration with industry-standard PKCE security
                </p>
              </div>

              <div className="group">
                <h4 className="text-sm font-medium text-gray-900 tracking-wide mb-2">Smart Email Sync</h4>
                <p className="text-xs text-gray-500 leading-relaxed tracking-wide">
                  Manual sync with date ranges and intelligent deduplication
                </p>
              </div>

              <div className="group">
                <h4 className="text-sm font-medium text-gray-900 tracking-wide mb-2">Advanced Search</h4>
                <p className="text-xs text-gray-500 leading-relaxed tracking-wide">
                  Powerful filtering and search capabilities
                </p>
              </div>

              <div className="group">
                <h4 className="text-sm font-medium text-gray-900 tracking-wide mb-2">AI Extraction</h4>
                <p className="text-xs text-gray-500 leading-relaxed tracking-wide">
                  Automated financial transaction data parsing
                </p>
              </div>

              <div className="group">
                <h4 className="text-sm font-medium text-gray-900 tracking-wide mb-2">Admin Tools</h4>
                <p className="text-xs text-gray-500 leading-relaxed tracking-wide">
                  Comprehensive system health monitoring
                </p>
              </div>

              <div className="group">
                <h4 className="text-sm font-medium text-gray-900 tracking-wide mb-2">RLS Security</h4>
                <p className="text-xs text-gray-500 leading-relaxed tracking-wide">
                  Row-level security data protection
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
