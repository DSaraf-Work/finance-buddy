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
      <div className="min-h-screen bg-[#0f0a1a] py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header - Dark Purple Theme */}
          <div className="mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between pb-4 sm:pb-6 border-b border-[#2d1b4e]">
              <div>
                <p className="text-xs sm:text-sm font-medium text-[#a78bfa] tracking-wide uppercase mb-2">
                  Dashboard
                </p>
                <h1 className="text-3xl sm:text-4xl font-light text-[#f8fafc] tracking-tight">
                  Welcome back
                </h1>
              </div>
              <div className="flex items-center space-x-2 mt-3 sm:mt-0">
                <div className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-[#cbd5e1] tracking-wide">ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Stats Cards - Dark Purple Theme */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
            {/* Total Emails Card */}
            <div className="group bg-[#1a1625] rounded-xl border border-[#2d1b4e] p-5 sm:p-6 hover:border-[#6b4ce6] hover:shadow-[0_0_20px_rgba(107,76,230,0.2)] transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-[#6b4ce6]/10 rounded-lg flex items-center justify-center ring-1 ring-[#6b4ce6]/20">
                  <svg className="w-5 h-5 text-[#a78bfa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs font-medium text-[#94a3b8] tracking-wide uppercase mb-2">
                Emails
              </p>
              <p className="text-3xl sm:text-4xl font-light text-[#f8fafc] mb-1 tracking-tight">
                {loadingStats ? (
                  <span className="text-[#64748b]">—</span>
                ) : (
                  stats.totalEmails.toLocaleString()
                )}
              </p>
              <p className="text-xs text-[#cbd5e1]">
                Synced from Gmail
              </p>
            </div>

            {/* Total Transactions Card */}
            <div className="group bg-[#1a1625] rounded-xl border border-[#2d1b4e] p-5 sm:p-6 hover:border-[#10b981] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-[#10b981]/10 rounded-lg flex items-center justify-center ring-1 ring-[#10b981]/20">
                  <svg className="w-5 h-5 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs font-medium text-[#94a3b8] tracking-wide uppercase mb-2">
                Transactions
              </p>
              <p className="text-3xl sm:text-4xl font-light text-[#f8fafc] mb-1 tracking-tight">
                {loadingStats ? (
                  <span className="text-[#64748b]">—</span>
                ) : (
                  stats.totalTransactions.toLocaleString()
                )}
              </p>
              <p className="text-xs text-[#cbd5e1]">
                AI-extracted
              </p>
            </div>

            {/* Connected Accounts Card */}
            <div className="group bg-[#1a1625] rounded-xl border border-[#2d1b4e] p-5 sm:p-6 hover:border-[#ec4899] hover:shadow-[0_0_20px_rgba(236,72,153,0.2)] transition-all duration-300 sm:col-span-2 lg:col-span-1">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-[#ec4899]/10 rounded-lg flex items-center justify-center ring-1 ring-[#ec4899]/20">
                  <svg className="w-5 h-5 text-[#ec4899]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
              </div>
              <p className="text-xs font-medium text-[#94a3b8] tracking-wide uppercase mb-2">
                Accounts
              </p>
              <p className="text-3xl sm:text-4xl font-light text-[#f8fafc] mb-1 tracking-tight">
                {loadingStats ? (
                  <span className="text-[#64748b]">—</span>
                ) : (
                  stats.totalConnections
                )}
              </p>
              <p className="text-xs text-[#cbd5e1]">
                Connected
              </p>
            </div>
          </div>

          {/* Quick Actions & Connection Status - Dark Purple Theme */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {/* Quick Actions */}
            <div className="bg-[#1a1625] rounded-xl border border-[#2d1b4e] p-5 sm:p-6">
              <h3 className="text-xs sm:text-sm font-medium text-[#a78bfa] tracking-wide uppercase mb-4 sm:mb-6">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={handleConnect}
                  className="group w-full text-left py-3 px-4 rounded-lg border border-[#2d1b4e] hover:border-[#6b4ce6] hover:bg-[#6b4ce6]/10 transition-all duration-200 flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-[#f8fafc]">Connect Gmail Account</span>
                  <svg className="w-4 h-4 text-[#94a3b8] group-hover:text-[#a78bfa] group-hover:translate-x-0.5 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <a
                  href="/admin"
                  className="group w-full block py-3 px-4 rounded-lg border border-[#2d1b4e] hover:border-[#6b4ce6] hover:bg-[#6b4ce6]/10 transition-all duration-200 flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-[#f8fafc]">Manage Connections</span>
                  <svg className="w-4 h-4 text-[#94a3b8] group-hover:text-[#a78bfa] group-hover:translate-x-0.5 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                <a
                  href="/emails"
                  className="group w-full block py-3 px-4 rounded-lg border border-[#2d1b4e] hover:border-[#6b4ce6] hover:bg-[#6b4ce6]/10 transition-all duration-200 flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-[#f8fafc]">Browse Emails</span>
                  <svg className="w-4 h-4 text-[#94a3b8] group-hover:text-[#a78bfa] group-hover:translate-x-0.5 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                <a
                  href="/transactions"
                  className="group w-full block py-3 px-4 rounded-lg border border-[#2d1b4e] hover:border-[#6b4ce6] hover:bg-[#6b4ce6]/10 transition-all duration-200 flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-[#f8fafc]">Review Transactions</span>
                  <svg className="w-4 h-4 text-[#94a3b8] group-hover:text-[#a78bfa] group-hover:translate-x-0.5 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                <button
                  onClick={handleCheckPriorityEmails}
                  disabled={checkingPriorityEmails}
                  className="group w-full text-left py-3 px-4 rounded-lg border border-[#2d1b4e] hover:border-[#6b4ce6] hover:bg-[#6b4ce6]/10 transition-all duration-200 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[#2d1b4e] disabled:hover:bg-transparent"
                >
                  <span className="text-sm font-medium text-[#f8fafc]">
                    {checkingPriorityEmails ? 'Checking...' : 'Check Priority Emails'}
                  </span>
                  {checkingPriorityEmails ? (
                    <svg className="animate-spin h-4 w-4 text-[#a78bfa]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-[#94a3b8] group-hover:text-[#a78bfa] group-hover:translate-x-0.5 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Priority Email Result */}
              {priorityEmailResult && (
                <div className={`mt-6 rounded-lg p-4 ${
                  priorityEmailResult.success
                    ? 'bg-emerald-50 border border-emerald-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-xs font-medium tracking-wide uppercase mb-3 ${
                    priorityEmailResult.success ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {priorityEmailResult.success ? '✓ Success' : '✕ Error'}
                  </p>
                  {priorityEmailResult.success && priorityEmailResult.result && (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <span className="text-xs text-gray-600">Found</span>
                        <p className="text-lg font-semibold text-gray-900">{priorityEmailResult.result.emailsFound}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">Processed</span>
                        <p className="text-lg font-semibold text-gray-900">{priorityEmailResult.result.emailsProcessed}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">Connections</span>
                        <p className="text-lg font-semibold text-gray-900">{priorityEmailResult.result.connectionsProcessed}</p>
                      </div>
                    </div>
                  )}
                  {priorityEmailResult.error && (
                    <p className="text-xs text-red-700">
                      {priorityEmailResult.error}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Connection Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
              <h3 className="text-xs sm:text-sm font-medium text-blue-600 tracking-wide uppercase mb-4 sm:mb-6">
                Connected Accounts
              </h3>
              {connections.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">No accounts connected</p>
                  <button
                    onClick={handleConnect}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Connect Account
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {connections.map((connection) => (
                    <div
                      key={connection.id}
                      className="group p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{connection.email_address}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {connection.last_sync_at ? new Date(connection.last_sync_at).toLocaleDateString() : 'Never synced'}
                            </p>
                          </div>
                        </div>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Features Overview */}
          <div className="border-t border-gray-200 pt-12 sm:pt-16">
            <h3 className="text-xs sm:text-sm font-medium text-blue-600 tracking-wide uppercase mb-8 sm:mb-12">
              Features
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="group p-5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Secure OAuth</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Gmail integration with industry-standard PKCE security
                </p>
              </div>

              <div className="group p-5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Smart Email Sync</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Manual sync with date ranges and intelligent deduplication
                </p>
              </div>

              <div className="group p-5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Advanced Search</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Powerful filtering and search capabilities
                </p>
              </div>

              <div className="group p-5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">AI Extraction</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Automated financial transaction data parsing
                </p>
              </div>

              <div className="group p-5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200">
                <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Admin Tools</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Comprehensive system health monitoring
                </p>
              </div>

              <div className="group p-5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200">
                <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">RLS Security</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
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
