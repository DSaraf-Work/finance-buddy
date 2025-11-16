// Auto-Sync Settings Page - Manage Gmail auto-sync configuration

import { useState, useEffect } from 'react';

interface Connection {
  id: string;
  email_address: string;
  auto_sync_enabled: boolean;
  auto_sync_interval_minutes: number;
  last_auto_sync_at: string | null;
}

export default function AutoSyncSettingsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      // You'll need to create this endpoint
      const res = await fetch('/api/gmail/connections');
      const data = await res.json();
      setConnections(data.connections || []);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoSync = async (connectionId: string, enabled: boolean) => {
    setUpdating(connectionId);
    try {
      const res = await fetch('/api/gmail/auto-sync/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection_id: connectionId,
          enabled: enabled,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to toggle auto-sync');
      }

      // Update local state
      setConnections(prev =>
        prev.map(conn =>
          conn.id === connectionId
            ? { ...conn, auto_sync_enabled: enabled }
            : conn
        )
      );

      alert(`Auto-sync ${enabled ? 'enabled' : 'disabled'} successfully!`);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setUpdating(null);
    }
  };

  const testCron = async () => {
    if (!confirm('This will trigger the auto-sync cron job manually. Continue?')) {
      return;
    }

    try {
      const cronSecret = prompt('Enter CRON_SECRET:');
      if (!cronSecret) return;

      const res = await fetch('/api/cron/gmail-auto-sync', {
        headers: {
          'Authorization': `Bearer ${cronSecret}`,
        },
      });

      const data = await res.json();
      
      if (res.ok) {
        alert(`Cron test successful!\n\nResults:\n${JSON.stringify(data, null, 2)}`);
      } else {
        alert(`Cron test failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f8fafc]">Auto-Sync Settings</h1>
          <p className="mt-2 text-[#cbd5e1]">
            Manage automatic email synchronization for your Gmail accounts
          </p>
        </div>

        {/* Test Cron Button */}
        <div className="mb-6">
          <button
            onClick={testCron}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            🧪 Test Cron Job Manually
          </button>
          <p className="mt-2 text-sm text-[#cbd5e1]">
            Manually trigger the auto-sync cron job to test the system
          </p>
        </div>

        {/* Info Box */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How Auto-Sync Works</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Runs automatically every 15 minutes</li>
            <li>• Fetches new emails from Gmail</li>
            <li>• Processes emails with AI to extract transactions</li>
            <li>• Creates notifications for each transaction</li>
            <li>• You can view and edit transactions from notifications</li>
          </ul>
        </div>

        {/* Connections List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-[#cbd5e1]">Loading connections...</p>
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-12 bg-[#1a1625] rounded-lg shadow">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-4 text-[#cbd5e1]">No Gmail connections found</p>
            <p className="mt-2 text-sm text-gray-500">
              Connect a Gmail account first to enable auto-sync
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map(connection => (
              <div
                key={connection.id}
                className="bg-[#1a1625] rounded-lg shadow p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#f8fafc]">
                      {connection.email_address}
                    </h3>
                    <div className="mt-2 space-y-1 text-sm text-[#cbd5e1]">
                      <p>
                        <span className="font-medium">Status:</span>{' '}
                        <span
                          className={
                            connection.auto_sync_enabled
                              ? 'text-green-600 font-semibold'
                              : 'text-gray-500'
                          }
                        >
                          {connection.auto_sync_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </p>
                      <p>
                        <span className="font-medium">Interval:</span>{' '}
                        {connection.auto_sync_interval_minutes} minutes
                      </p>
                      <p>
                        <span className="font-medium">Last Sync:</span>{' '}
                        {formatDate(connection.last_auto_sync_at)}
                      </p>
                    </div>
                  </div>

                  <div className="ml-4">
                    <button
                      onClick={() =>
                        toggleAutoSync(
                          connection.id,
                          !connection.auto_sync_enabled
                        )
                      }
                      disabled={updating === connection.id}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        connection.auto_sync_enabled
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {updating === connection.id
                        ? 'Updating...'
                        : connection.auto_sync_enabled
                        ? 'Disable Auto-Sync'
                        : 'Enable Auto-Sync'}
                    </button>
                  </div>
                </div>

                {connection.auto_sync_enabled && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-[#10b981]">
                      ✅ Auto-sync is active. New emails will be automatically
                      synced and processed every 15 minutes.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Cron Schedule Info */}
        <div className="mt-8 bg-[#2d1b4e]/30 rounded-lg p-4">
          <h3 className="font-semibold text-[#f8fafc] mb-2">Cron Schedule</h3>
          <div className="text-sm text-[#cbd5e1] space-y-1">
            <p>
              <span className="font-medium">Schedule:</span> Every 15 minutes
            </p>
            <p>
              <span className="font-medium">Cron Expression:</span>{' '}
              <code className="bg-[#1a1625] px-2 py-1 rounded">0 23 * * *</code>
            </p>
            <p>
              <span className="font-medium">Timezone:</span> UTC
            </p>
            <p className="mt-2 text-[#cbd5e1]">
              The cron job runs automatically on Vercel. You can also trigger it
              manually using the test button above.
            </p>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">
            🔧 Developer Info
          </h3>
          <div className="text-sm text-yellow-800 space-y-1">
            <p>
              <span className="font-medium">Cron Endpoint:</span>{' '}
              <code className="bg-[#1a1625] px-2 py-1 rounded">
                /api/cron/gmail-auto-sync
              </code>
            </p>
            <p>
              <span className="font-medium">Required Header:</span>{' '}
              <code className="bg-[#1a1625] px-2 py-1 rounded">
                Authorization: Bearer CRON_SECRET
              </code>
            </p>
            <p className="mt-2">
              Make sure <code className="bg-[#1a1625] px-1 rounded">CRON_SECRET</code>{' '}
              is set in your environment variables.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

