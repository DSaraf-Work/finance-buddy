import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { PubSubDetailedView } from '@/components/gmail/PubSubDetailedView';

interface MetricsData {
  success: boolean;
  timestamp: string;
  performance: {
    avgProcessingTime?: number;
    totalProcessed?: number;
  };
  recentErrors: Array<{
    timestamp: string;
    error: string;
    email?: string;
  }>;
  subscriptions: {
    total: number;
    active: number;
    expired: number;
    failed: number;
  };
  webhooks: {
    total: number;
    successful: number;
    failed: number;
    totalMessages: number;
  };
  connections: {
    total: number;
    watchEnabled: number;
    watchDisabled: number;
  };
}

interface MigrationStatus {
  success: boolean;
  totalConnections: number;
  watchEnabled: number;
  watchDisabled: number;
  percentageMigrated: number;
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}

function QuickActionCard({ title, description, icon, onClick }: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left"
    >
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </button>
  );
}

export default function GmailPubSubDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [user, router]);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      setError(null);

      // Fetch all data in parallel
      const [metricsRes, connectionsRes, logsRes, auditRes] = await Promise.all([
        fetch('/api/gmail/watch/metrics'),
        fetch('/api/gmail/watch/connections'),
        fetch('/api/gmail/watch/webhook-logs?limit=50'),
        fetch('/api/admin/gmail-webhook-audit?limit=100'),
      ]);

      const metricsData = await metricsRes.json();
      const connectionsData = await connectionsRes.json();
      const logsData = await logsRes.json();
      const auditData = await auditRes.json();

      setMetrics(metricsData);
      setConnections(connectionsData.connections || []);
      setWebhookLogs(logsData.logs || []);
      setAuditLogs(auditData.logs || []);

      setRefreshing(false);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setRefreshing(false);
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gmail Pub/Sub Dashboard</h1>
              <p className="mt-2 text-gray-600">Real-time monitoring and management</p>
            </div>
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {refreshing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}
          {metrics && (
            <p className="mt-2 text-sm text-gray-500">
              Last updated: {new Date(metrics.timestamp).toLocaleString()}
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <QuickActionCard
            title="Test Webhook"
            description="Send a test notification"
            icon="🧪"
            onClick={() => {/* TODO */}}
          />
          <QuickActionCard
            title="View Logs"
            description="Check recent webhook logs"
            icon="📋"
            onClick={() => {/* TODO */}}
          />
          <QuickActionCard
            title="Refresh Watches"
            description="Renew expiring subscriptions"
            icon="🔄"
            onClick={() => {/* TODO */}}
          />
        </div>

        {/* Stats Grid */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Connections */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Connections</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.connections.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <span className="text-green-600">✓ {metrics.connections.watchEnabled} enabled</span>
                <span className="text-gray-500">○ {metrics.connections.watchDisabled} disabled</span>
              </div>
            </div>

            {/* Subscriptions */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Watch Subscriptions</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.subscriptions.total}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <span className="text-green-600">✓ {metrics.subscriptions.active} active</span>
                <span className="text-red-500">✗ {metrics.subscriptions.expired} expired</span>
              </div>
            </div>

            {/* Webhooks */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Webhooks Processed</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.webhooks.total}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <span className="text-green-600">✓ {metrics.webhooks.successful} success</span>
                <span className="text-red-500">✗ {metrics.webhooks.failed} failed</span>
              </div>
            </div>

            {/* Messages */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New Messages</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.webhooks.totalMessages}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Synced via Pub/Sub
              </div>
            </div>
          </div>
        )}

        {/* Detailed View */}
        <div className="mt-8">
          <PubSubDetailedView
            connections={connections}
            webhookLogs={webhookLogs}
            auditLogs={auditLogs}
            onRefresh={fetchData}
          />
        </div>
      </div>
    </div>
  );
}

