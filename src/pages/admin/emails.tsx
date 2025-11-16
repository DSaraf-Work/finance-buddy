// Admin Email Management Page
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';

interface WhitelistedSender {
  email: string;
}

interface RefreshStats {
  totalFetched: number;
  newEmails: number;
  updatedEmails: number;
  errors: string[];
}

export default function AdminEmailsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [whitelistedSenders, setWhitelistedSenders] = useState<string[]>([]);
  const [newSender, setNewSender] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [refreshStats, setRefreshStats] = useState<RefreshStats | null>(null);
  const [processingStats, setProcessingStats] = useState<{ total: number; processed: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadWhitelistedSenders();
  }, [user]);

  const loadWhitelistedSenders = async () => {
    try {
      const res = await fetch('/api/admin/config/whitelisted-senders');
      if (res.ok) {
        const data = await res.json();
        setWhitelistedSenders(data.senders || []);
      }
    } catch (error) {
      console.error('Failed to load whitelisted senders:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSender = async () => {
    if (!newSender.trim() || !newSender.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      const res = await fetch('/api/admin/config/whitelisted-senders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: newSender.trim().toLowerCase() }),
      });

      if (res.ok) {
        await loadWhitelistedSenders();
        setNewSender('');
      } else {
        const error = await res.json();
        alert(`Failed to add sender: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to add sender:', error);
      alert('Failed to add sender');
    }
  };

  const removeSender = async (sender: string) => {
    if (!confirm(`Remove ${sender} from whitelist?`)) return;

    try {
      const res = await fetch('/api/admin/config/whitelisted-senders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender }),
      });

      if (res.ok) {
        await loadWhitelistedSenders();
      } else {
        const error = await res.json();
        alert(`Failed to remove sender: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to remove sender:', error);
      alert('Failed to remove sender');
    }
  };

  const refreshEmails = async () => {
    if (!confirm('This will refresh emails from all connected Gmail accounts. Continue?')) return;

    setRefreshing(true);
    setRefreshStats(null);

    try {
      const res = await fetch('/api/admin/emails/refresh', {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setRefreshStats(data.stats);
        alert(`Refresh complete! Fetched ${data.stats.totalFetched} emails (${data.stats.newEmails} new, ${data.stats.updatedEmails} updated)`);
      } else {
        const error = await res.json();
        alert(`Refresh failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to refresh emails:', error);
      alert('Failed to refresh emails');
    } finally {
      setRefreshing(false);
    }
  };

  const processAllFetchedEmails = async () => {
    if (!confirm('This will process all fetched emails with AI. This may take a while. Continue?')) return;

    setProcessing(true);
    setProcessingStats(null);

    try {
      const res = await fetch('/api/admin/emails/process', {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setProcessingStats({ total: data.total, processed: 0 });
        alert(`Processing started! ${data.total} emails queued for processing. Check back later for results.`);
      } else {
        const error = await res.json();
        alert(`Processing failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to process emails:', error);
      alert('Failed to process emails');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0a1a]/50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-[#cbd5e1]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f8fafc]">Admin - Email Management</h1>
          <p className="mt-2 text-[#cbd5e1]">
            Manage whitelisted senders and process emails
          </p>
        </div>

        {/* Whitelisted Senders Section */}
        <div className="bg-[#1a1625] rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#f8fafc] mb-4">Whitelisted Senders</h2>
          
          {/* Add Sender Form */}
          <div className="flex gap-2 mb-4">
            <input
              type="email"
              value={newSender}
              onChange={(e) => setNewSender(e.target.value)}
              placeholder="Enter email address (e.g., alerts@bank.com)"
              className="flex-1 px-4 py-2 border border-[#2d1b4e] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addSender()}
            />
            <button
              onClick={addSender}
              className="px-6 py-2 bg-[#6b4ce6] text-white rounded-lg hover:bg-[#8b5cf6] font-medium"
            >
              Add Sender
            </button>
          </div>

          {/* Senders List */}
          <div className="space-y-2">
            {whitelistedSenders.length === 0 ? (
              <p className="text-gray-500 text-sm">No whitelisted senders configured</p>
            ) : (
              whitelistedSenders.map((sender) => (
                <div
                  key={sender}
                  className="flex items-center justify-between p-3 bg-[#0f0a1a]/50 rounded-lg"
                >
                  <span className="text-[#f8fafc] font-mono text-sm">{sender}</span>
                  <button
                    onClick={() => removeSender(sender)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Email Actions Section */}
        <div className="bg-[#1a1625] rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-[#f8fafc] mb-4">Email Actions</h2>

          <div className="space-y-4">
            {/* Refresh Emails Button */}
            <div className="border border-[#2d1b4e] rounded-lg p-4">
              <h3 className="font-semibold text-[#f8fafc] mb-2">Refresh Emails from Gmail</h3>
              <p className="text-sm text-[#cbd5e1] mb-3">
                Fetches new emails from all connected Gmail accounts for whitelisted senders
              </p>
              <button
                onClick={refreshEmails}
                disabled={refreshing}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {refreshing ? 'Refreshing...' : '🔄 Refresh Emails from Gmail'}
              </button>

              {refreshStats && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Refresh Results:</h4>
                  <ul className="text-sm text-[#10b981] space-y-1">
                    <li>✅ Total Fetched: {refreshStats.totalFetched}</li>
                    <li>🆕 New Emails: {refreshStats.newEmails}</li>
                    <li>🔄 Updated Emails: {refreshStats.updatedEmails}</li>
                    {refreshStats.errors.length > 0 && (
                      <li className="text-red-600">❌ Errors: {refreshStats.errors.length}</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Process All Fetched Emails Button */}
            <div className="border border-[#2d1b4e] rounded-lg p-4">
              <h3 className="font-semibold text-[#f8fafc] mb-2">Process All Fetched Emails</h3>
              <p className="text-sm text-[#cbd5e1] mb-3">
                Processes all fetched emails with AI to extract transactions (batch size: 10)
              </p>
              <button
                onClick={processAllFetchedEmails}
                disabled={processing}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Starting...' : '🤖 Process All Fetched Emails'}
              </button>

              {processingStats && (
                <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Processing Started:</h4>
                  <p className="text-sm text-purple-800">
                    {processingStats.total} emails queued for AI processing
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

