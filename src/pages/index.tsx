import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import LoadingScreen from '@/components/LoadingScreen';
import { GmailConnectionPublic, ConnectionsResponse } from '@/types';
import {
  DashboardStyles,
  StatCard,
  QuickActions,
  ConnectedAccounts,
  RecentTransactions
} from '@/components/dashboard';

interface DashboardStats {
  totalEmails: number;
  totalTransactions: number;
  totalConnections: number;
}

const HomePage: NextPage = () => {
  const { user, loading, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmails: 0,
    totalTransactions: 0,
    totalConnections: 0,
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
        <LoadingScreen message="Loading Finance Buddy..." />
      </Layout>
    );
  }

  // Unauthenticated homepage
  if (!user) {
    return (
      <Layout
        title="Finance Buddy - Smart Financial Management"
        description="Track and manage your financial transactions with AI-powered insights"
      >
        <DashboardStyles />
        <main style={{
          minHeight: 'calc(100vh - 72px)',
          background: '#09090B',
          padding: '40px 20px',
        }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Hero Section */}
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h1 style={{
                fontSize: '48px',
                fontWeight: '700',
                color: '#FAFAFA',
                marginBottom: '16px',
                fontFamily: 'Outfit, sans-serif',
                letterSpacing: '-1px',
              }}>
                Finance Buddy
              </h1>
              <p style={{
                fontSize: '18px',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '32px',
                lineHeight: '1.6',
                fontFamily: 'Outfit, sans-serif',
              }}>
                Track and manage your financial transactions with AI-powered insights.<br/>
                Secure Gmail OAuth integration for automatic transaction extraction.
              </p>

              {/* Sign In/Up Buttons */}
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <a
                  href="/auth"
                  style={{
                    padding: '12px 32px',
                    background: '#6366F1',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#FAFAFA',
                    textDecoration: 'none',
                    fontSize: '15px',
                    fontWeight: '600',
                    fontFamily: 'Outfit, sans-serif',
                    boxShadow: '0 0 32px rgba(99, 102, 241, 0.35)',
                    display: 'inline-block',
                    transition: 'opacity 0.2s ease-out',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Sign In
                </a>
                <a
                  href="/auth"
                  style={{
                    padding: '12px 32px',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    color: '#FAFAFA',
                    textDecoration: 'none',
                    fontSize: '15px',
                    fontWeight: '600',
                    fontFamily: 'Outfit, sans-serif',
                    display: 'inline-block',
                    transition: 'all 0.2s ease-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#6366F1';
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  Sign Up
                </a>
              </div>
            </div>

            {/* Features Grid */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '40px',
              marginBottom: '32px',
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#FAFAFA',
                textAlign: 'center',
                marginBottom: '32px',
                fontFamily: 'Outfit, sans-serif',
              }}>
                What you'll get with Finance Buddy
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔐</div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#FAFAFA',
                    marginBottom: '8px',
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                    Secure OAuth
                  </h3>
                  <p style={{
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontFamily: 'Outfit, sans-serif',
                    lineHeight: '1.5',
                  }}>
                    Connect Gmail with industry-standard OAuth security
                  </p>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>📧</div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#FAFAFA',
                    marginBottom: '8px',
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                    Smart Email Sync
                  </h3>
                  <p style={{
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontFamily: 'Outfit, sans-serif',
                    lineHeight: '1.5',
                  }}>
                    Manual sync with intelligent deduplication
                  </p>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#FAFAFA',
                    marginBottom: '8px',
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                    Advanced Search
                  </h3>
                  <p style={{
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontFamily: 'Outfit, sans-serif',
                    lineHeight: '1.5',
                  }}>
                    Powerful filtering for transaction management
                  </p>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚙️</div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#FAFAFA',
                    marginBottom: '8px',
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                    Admin Tools
                  </h3>
                  <p style={{
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontFamily: 'Outfit, sans-serif',
                    lineHeight: '1.5',
                  }}>
                    Comprehensive system monitoring
                  </p>
                </div>
              </div>
            </div>

            {/* Security & Privacy */}
            <div style={{
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#22C55E',
                marginBottom: '8px',
                fontFamily: 'Outfit, sans-serif',
              }}>
                🛡️ Security & Privacy
              </h3>
              <p style={{
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontFamily: 'Outfit, sans-serif',
                lineHeight: '1.5',
              }}>
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
      <DashboardStyles />
      <div style={{
        minHeight: 'calc(100vh - 72px)',
        background: '#09090B',
        padding: '32px 20px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Welcome Header */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              paddingBottom: '20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              <div>
                <p style={{
                  fontSize: '11px',
                  fontWeight: '500',
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                  fontFamily: 'Outfit, sans-serif',
                }}>
                  Dashboard
                </p>
                <h1 style={{
                  fontSize: '36px',
                  fontWeight: '600',
                  color: '#FAFAFA',
                  fontFamily: 'Outfit, sans-serif',
                  letterSpacing: '-0.5px',
                }}>
                  Welcome back
                </h1>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  background: '#22C55E',
                  borderRadius: '50%',
                  animation: 'pulse 2s ease-in-out infinite',
                }}/>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '500',
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontFamily: 'Outfit, sans-serif',
                }}>
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '40px',
          }}>
            <StatCard
              icon={
                <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              iconColor="#6366F1"
              iconBg="rgba(99, 102, 241, 0.12)"
              label="Emails"
              value={stats.totalEmails}
              subtitle="Synced from Gmail"
              loading={loadingStats}
              hoverColor="#6366F1"
            />
            <StatCard
              icon={
                <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              iconColor="#22C55E"
              iconBg="rgba(34, 197, 94, 0.12)"
              label="Transactions"
              value={stats.totalTransactions}
              subtitle="AI-extracted"
              loading={loadingStats}
              hoverColor="#22C55E"
            />
            <StatCard
              icon={
                <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              }
              iconColor="#4285F4"
              iconBg="rgba(66, 133, 244, 0.12)"
              label="Accounts"
              value={stats.totalConnections}
              subtitle="Connected"
              loading={loadingStats}
              hoverColor="#4285F4"
            />
          </div>

          {/* Recent Transactions Section */}
          <div style={{ marginBottom: '40px' }}>
            <RecentTransactions limit={5} />
          </div>

          {/* Quick Actions & Connection Status */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '20px',
            marginBottom: '40px',
          }}>
            <QuickActions
              actions={[
                { label: 'Connect Gmail Account', onClick: handleConnect },
                { label: 'Manage Connections', href: '/admin' },
                { label: 'Browse Emails', href: '/emails' },
                { label: 'Review Transactions', href: '/transactions' },
                {
                  label: checkingPriorityEmails ? 'Checking...' : 'Check Priority Emails',
                  onClick: handleCheckPriorityEmails,
                  disabled: checkingPriorityEmails,
                  loading: checkingPriorityEmails,
                },
              ]}
              priorityResult={priorityEmailResult}
            />
            <ConnectedAccounts
              connections={connections}
              onConnect={handleConnect}
            />
          </div>

          {/* Features Overview */}
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '40px',
          }}>
            <h3 style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#6366F1',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '32px',
              fontFamily: 'Outfit, sans-serif',
            }}>
              Features
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '20px',
            }}>
              {[
                { emoji: '🔒', title: 'Secure OAuth', desc: 'Gmail integration with PKCE security', color: '#6366F1' },
                { emoji: '🔄', title: 'Smart Sync', desc: 'Manual sync with deduplication', color: '#22C55E' },
                { emoji: '🔍', title: 'Advanced Search', desc: 'Powerful filtering capabilities', color: '#6366F1' },
                { emoji: '💡', title: 'AI Extraction', desc: 'Automated transaction parsing', color: '#F59E0B' },
                { emoji: '⚙️', title: 'Admin Tools', desc: 'System health monitoring', color: '#06B6D4' },
                { emoji: '🛡️', title: 'RLS Security', desc: 'Row-level data protection', color: '#8B5CF6' },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="feature-card"
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = feature.color;
                    e.currentTarget.style.background = `${feature.color}10`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: `${feature.color}15`,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                    fontSize: '20px',
                  }}>
                    {feature.emoji}
                  </div>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#FAFAFA',
                    marginBottom: '4px',
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                    {feature.title}
                  </h4>
                  <p style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontFamily: 'Outfit, sans-serif',
                    lineHeight: '1.4',
                  }}>
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;