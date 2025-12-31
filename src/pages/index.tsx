import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import LoadingScreen from '@/components/LoadingScreen';
import { GmailConnectionPublic, ConnectionsResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
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
        <main className="min-h-[calc(100vh-72px)] bg-background py-10 px-5">
          <div className="max-w-[900px] mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-[60px]">
              <h1 className="text-5xl font-bold text-foreground mb-4 tracking-tight">
                Finance Buddy
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Track and manage your financial transactions with AI-powered insights.<br/>
                Secure Gmail OAuth integration for automatic transaction extraction.
              </p>

              {/* Sign In/Up Buttons */}
              <div className="flex gap-4 justify-center">
                <Link href="/auth">
                  <Button className="px-8 py-6 text-base font-semibold shadow-[0_0_32px_rgba(99,102,241,0.35)]">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button variant="outline" className="px-8 py-6 text-base font-semibold">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </div>

            {/* Features Grid */}
            <Card className="bg-card/50 border-border/50 p-10 mb-8">
              <h2 className="text-2xl font-semibold text-foreground text-center mb-8">
                What you'll get with Finance Buddy
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-4xl mb-3">🔐</div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    Secure OAuth
                  </h3>
                  <p className="text-[13px] text-muted-foreground/80 leading-relaxed">
                    Connect Gmail with industry-standard OAuth security
                  </p>
                </div>

                <div className="text-center">
                  <div className="text-4xl mb-3">📧</div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    Smart Email Sync
                  </h3>
                  <p className="text-[13px] text-muted-foreground/80 leading-relaxed">
                    Manual sync with intelligent deduplication
                  </p>
                </div>

                <div className="text-center">
                  <div className="text-4xl mb-3">🔍</div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    Advanced Search
                  </h3>
                  <p className="text-[13px] text-muted-foreground/80 leading-relaxed">
                    Powerful filtering for transaction management
                  </p>
                </div>

                <div className="text-center">
                  <div className="text-4xl mb-3">⚙️</div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    Admin Tools
                  </h3>
                  <p className="text-[13px] text-muted-foreground/80 leading-relaxed">
                    Comprehensive system monitoring
                  </p>
                </div>
              </div>
            </Card>

            {/* Security & Privacy */}
            <Card className="bg-success/10 border-success/30 p-5">
              <h3 className="text-base font-semibold text-success mb-2">
                🛡️ Security & Privacy
              </h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Your data is protected with Row Level Security (RLS), secure cookie authentication,
                and OAuth-only access. We never store your Gmail passwords.
              </p>
            </Card>
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
      <div className="min-h-[calc(100vh-72px)] bg-background py-8 px-5">
        <div className="max-w-[1200px] mx-auto">
          {/* Welcome Header */}
          <div className="mb-10">
            <div className="flex items-end justify-between pb-5 border-b border-border/50">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-wider mb-2">
                  Dashboard
                </p>
                <h1 className="text-4xl font-semibold text-foreground tracking-tight">
                  Welcome back
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                <span className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-wider">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
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
          <div className="mb-10">
            <RecentTransactions limit={5} />
          </div>

          {/* Quick Actions & Connection Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
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
          <div className="border-t border-border/50 pt-10">
            <h3 className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-8">
              Features
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
              {[
                { emoji: '🔒', title: 'Secure OAuth', desc: 'Gmail integration with PKCE security', color: '#6366F1' },
                { emoji: '🔄', title: 'Smart Sync', desc: 'Manual sync with deduplication', color: '#22C55E' },
                { emoji: '🔍', title: 'Advanced Search', desc: 'Powerful filtering capabilities', color: '#6366F1' },
                { emoji: '💡', title: 'AI Extraction', desc: 'Automated transaction parsing', color: '#F59E0B' },
                { emoji: '⚙️', title: 'Admin Tools', desc: 'System health monitoring', color: '#06B6D4' },
                { emoji: '🛡️', title: 'RLS Security', desc: 'Row-level data protection', color: '#8B5CF6' },
              ].map((feature, index) => (
                <Card
                  key={index}
                  className="p-5 border-border/50 hover:border-primary cursor-pointer transition-all duration-300 group"
                  style={{
                    ['--feature-color' as any]: feature.color
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = feature.color;
                    e.currentTarget.style.background = `${feature.color}10`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '';
                    e.currentTarget.style.background = '';
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-3 text-xl"
                    style={{
                      background: `${feature.color}15`
                    }}
                  >
                    {feature.emoji}
                  </div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">
                    {feature.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                    {feature.desc}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;