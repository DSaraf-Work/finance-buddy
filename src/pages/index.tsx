import { NextPage } from 'next';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import LoadingScreen from '@/components/LoadingScreen';
import { GmailConnectionPublic, ConnectionsResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import {
  Mail,
  CreditCard,
  Link2,
  ArrowRight,
  Shield,
  Zap,
  Search,
  BarChart3,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  StatCard,
  QuickActions,
  ConnectedAccounts,
  RecentTransactions,
  HeroCard,
} from '@/components/dashboard';

interface DashboardStats {
  totalEmails: number;
  totalTransactions: number;
  totalConnections: number;
  weeklySpending: number;
  lastWeekSpending: number;
}

interface Transaction {
  id: string;
  amount: number;
  transaction_date: string;
  transaction_type: string;
}

const HomePage: NextPage = () => {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmails: 0,
    totalTransactions: 0,
    totalConnections: 0,
    weeklySpending: 0,
    lastWeekSpending: 0,
  });
  const [connections, setConnections] = useState<GmailConnectionPublic[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Load dashboard data for authenticated users
  useEffect(() => {
    if (user && !loading) {
      loadDashboardData();
    }
  }, [user, loading]);

  // Calculate weekly spending from transactions
  const calculateWeeklySpending = (transactions: Transaction[]): { thisWeek: number; lastWeek: number } => {
    const now = new Date();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - 7);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

    let thisWeek = 0;
    let lastWeek = 0;

    transactions.forEach((txn) => {
      const txnDate = new Date(txn.transaction_date);
      const amount = Math.abs(txn.amount);

      // Only count debits (negative amounts or debit type)
      if (txn.amount < 0 || txn.transaction_type?.toLowerCase() === 'debit') {
        if (txnDate >= startOfThisWeek) {
          thisWeek += amount;
        } else if (txnDate >= startOfLastWeek && txnDate < startOfThisWeek) {
          lastWeek += amount;
        }
      }
    });

    return { thisWeek, lastWeek };
  };

  const loadDashboardData = async () => {
    setLoadingStats(true);
    try {
      // Load connections
      let connectionsData: ConnectionsResponse | null = null;
      const connectionsResponse = await fetch('/api/gmail/connections');
      if (connectionsResponse.ok) {
        connectionsData = await connectionsResponse.json();
        setConnections(connectionsData?.connections || []);

        // Get most recent sync time from connections
        if (connectionsData?.connections?.length) {
          const mostRecentSync = connectionsData.connections.reduce((latest, conn) => {
            const syncTime = conn.last_sync_at ? new Date(conn.last_sync_at) : null;
            if (!syncTime) return latest;
            if (!latest) return syncTime;
            return syncTime > latest ? syncTime : latest;
          }, null as Date | null);
          setLastSyncTime(mostRecentSync);
        }
      }

      // Load email stats
      const emailResponse = await fetch('/api/emails/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 1, pageSize: 1 }),
      });

      // Load transaction stats with last 14 days for weekly comparison
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const transactionResponse = await fetch('/api/transactions/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: 1,
          pageSize: 100,
          startDate: twoWeeksAgo.toISOString(),
          sortBy: 'transaction_date',
          sortOrder: 'desc',
        }),
      });

      let totalEmails = 0;
      let totalTransactions = 0;
      let weeklySpending = 0;
      let lastWeekSpending = 0;

      if (emailResponse.ok) {
        const emailData = await emailResponse.json();
        totalEmails = emailData.total || 0;
      }

      if (transactionResponse.ok) {
        const transactionData = await transactionResponse.json();
        totalTransactions = transactionData.total || 0;

        // Calculate weekly spending
        const spending = calculateWeeklySpending(transactionData.transactions || []);
        weeklySpending = spending.thisWeek;
        lastWeekSpending = spending.lastWeek;
      }

      setStats({
        totalEmails,
        totalTransactions,
        totalConnections: connectionsData?.connections?.length || 0,
        weeklySpending,
        lastWeekSpending,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/priority-emails/trigger', {
        method: 'POST',
      });

      if (response.ok) {
        // Reload dashboard data after sync
        await loadDashboardData();
        setLastSyncTime(new Date());
      }
    } catch (error) {
      console.error('Failed to sync:', error);
    } finally {
      setSyncing(false);
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

  // Unauthenticated homepage - Modern landing page
  if (!user) {
    return (
      <Layout
        title="Finance Buddy - Track Your Finances Automatically"
        description="AI-powered transaction extraction from your email. Secure. Private. Smart."
      >
        <main className="min-h-[calc(100vh-72px)] bg-background">
          {/* Hero Section */}
          <section className="relative overflow-hidden py-20 px-5">
            {/* Background gradient */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            </div>

            <div className="max-w-[1000px] mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">AI-Powered Finance Tracking</span>
              </div>

              {/* Main headline */}
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight leading-tight">
                Track Your Finances{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                  Automatically
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-[700px] mx-auto leading-relaxed">
                Connect your Gmail and let AI extract transactions from your emails.
                No manual entry. Complete privacy. Full control.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Link href="/auth">
                  <Button size="lg" className="px-8 py-6 text-base font-semibold gap-2 shadow-[0_0_32px_rgba(99,102,241,0.35)]">
                    Get Started Free
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button variant="outline" size="lg" className="px-8 py-6 text-base font-semibold">
                    Sign In
                  </Button>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground/80">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>Bank-grade Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span>Instant Setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span>100% Free</span>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="py-20 px-5 bg-card/30">
            <div className="max-w-[1000px] mx-auto">
              <div className="text-center mb-16">
                <p className="text-sm font-medium text-primary uppercase tracking-wider mb-3">
                  How It Works
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Three Simple Steps
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    step: '01',
                    icon: Link2,
                    title: 'Connect Gmail',
                    description: 'Securely link your Gmail account with OAuth 2.0. We never see your password.',
                    color: '#6366F1',
                  },
                  {
                    step: '02',
                    icon: Sparkles,
                    title: 'AI Extraction',
                    description: 'Our AI reads transaction emails and extracts amounts, dates, and merchants.',
                    color: '#F59E0B',
                  },
                  {
                    step: '03',
                    icon: BarChart3,
                    title: 'Track & Analyze',
                    description: 'View spending patterns, get insights, and take control of your finances.',
                    color: '#22C55E',
                  },
                ].map((item) => (
                  <Link key={item.step} href="/auth" className="group">
                    <Card
                      className="relative p-8 bg-card/50 border-border/50 hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 h-full"
                    >
                      <div
                        className="absolute top-6 right-6 text-4xl font-bold opacity-10 group-hover:opacity-20 transition-opacity"
                        style={{ color: item.color }}
                      >
                        {item.step}
                      </div>
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                        style={{ background: `${item.color}15` }}
                      >
                        <item.icon className="h-7 w-7" style={{ color: item.color }} />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-1 mt-4 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Get started <ChevronRight className="h-4 w-4" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* Features Bento Grid */}
          <section className="py-20 px-5">
            <div className="max-w-[1000px] mx-auto">
              <div className="text-center mb-16">
                <p className="text-sm font-medium text-primary uppercase tracking-wider mb-3">
                  Features
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Everything You Need
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Large feature card */}
                <Link href="/auth" className="group md:row-span-2">
                  <Card className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 h-full">
                    <Shield className="h-10 w-10 text-primary mb-6" />
                    <h3 className="text-2xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors">
                      Bank-Grade Security
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      Your data is protected with Row Level Security (RLS), OAuth-only authentication, and encrypted storage. We never store your Gmail password.
                    </p>
                    <ul className="space-y-3 mb-6">
                      {['OAuth 2.0 + PKCE', 'Row Level Security', 'Encrypted at Rest', 'No Password Storage'].map((item) => (
                        <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Try it now <ChevronRight className="h-4 w-4" />
                    </div>
                  </Card>
                </Link>

                {/* Small feature cards */}
                <Link href="/auth" className="group">
                  <Card className="p-6 bg-card/50 border-border/50 hover:border-amber-500/50 hover:-translate-y-1 transition-all duration-300 h-full">
                    <Zap className="h-8 w-8 text-amber-500 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-amber-500 transition-colors">
                      Smart Sync
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Intelligent deduplication ensures you never see duplicate transactions.
                    </p>
                  </Card>
                </Link>

                <Link href="/auth" className="group">
                  <Card className="p-6 bg-card/50 border-border/50 hover:border-cyan-500/50 hover:-translate-y-1 transition-all duration-300 h-full">
                    <Search className="h-8 w-8 text-cyan-500 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-cyan-500 transition-colors">
                      Advanced Search
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Filter by date, amount, merchant, category, and more.
                    </p>
                  </Card>
                </Link>

                <Link href="/auth" className="group md:col-span-2">
                  <Card className="p-6 bg-card/50 border-border/50 hover:border-green-500/50 hover:-translate-y-1 transition-all duration-300 h-full">
                    <div className="flex items-start gap-6">
                      <BarChart3 className="h-8 w-8 text-green-500 flex-shrink-0" />
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-green-500 transition-colors">
                          Reports & Insights
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Visualize your spending patterns with beautiful charts and get actionable insights to improve your financial health.
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="py-20 px-5 bg-card/30">
            <div className="max-w-[600px] mx-auto text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Ready to take control?
              </h2>
              <p className="text-muted-foreground mb-8">
                Join and start tracking your finances automatically.
              </p>
              <Link href="/auth">
                <Button size="lg" className="px-8 py-6 text-base font-semibold gap-2">
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </section>
        </main>
      </Layout>
    );
  }

  // Authenticated Dashboard - Revamped design
  return (
    <Layout
      title="Finance Buddy - Dashboard"
      description="Your personal finance dashboard"
    >
      <div className="min-h-[calc(100vh-72px)] bg-background py-6 px-5">
        <div className="max-w-[1200px] mx-auto">
          {/* Hero Card - Spending Summary */}
          <div className="mb-8">
            <HeroCard
              weeklySpending={stats.weeklySpending}
              lastWeekSpending={stats.lastWeekSpending}
              lastSyncTime={lastSyncTime}
              onSync={handleSync}
              syncing={syncing}
              loading={loadingStats}
              spendingHref="/transactions"
            />
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatCard
              icon={<Mail className="h-5 w-5" />}
              iconColor="#6366F1"
              iconBg="rgba(99, 102, 241, 0.12)"
              label="Emails"
              value={stats.totalEmails}
              subtitle="Synced from Gmail"
              loading={loadingStats}
              hoverColor="#6366F1"
              href="/emails"
            />
            <StatCard
              icon={<CreditCard className="h-5 w-5" />}
              iconColor="#22C55E"
              iconBg="rgba(34, 197, 94, 0.12)"
              label="Transactions"
              value={stats.totalTransactions}
              subtitle="AI-extracted"
              loading={loadingStats}
              hoverColor="#22C55E"
              href="/transactions"
            />
            <StatCard
              icon={<Link2 className="h-5 w-5" />}
              iconColor="#4285F4"
              iconBg="rgba(66, 133, 244, 0.12)"
              label="Accounts"
              value={stats.totalConnections}
              subtitle="Connected"
              loading={loadingStats}
              hoverColor="#4285F4"
              href="/admin"
            />
          </div>

          {/* Recent Transactions */}
          <div className="mb-8">
            <RecentTransactions limit={5} />
          </div>

          {/* Quick Actions & Connected Accounts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <QuickActions
              actions={[
                { label: 'Connect Gmail Account', onClick: handleConnect },
                { label: 'Browse Emails', href: '/emails' },
                { label: 'View All Transactions', href: '/transactions' },
                { label: 'View Reports', href: '/reports' },
              ]}
            />
            <ConnectedAccounts
              connections={connections}
              onConnect={handleConnect}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
