import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Database } from '@/types/database';

type EmailProcessed = Database['public']['Tables']['fb_emails_processed']['Row'];
type EmailFetched = Database['public']['Tables']['fb_emails_fetched']['Row'];

interface TransactionEditData extends EmailProcessed {
  email_fetched?: EmailFetched;
}

export default function TransactionEditPage() {
  const router = useRouter();
  const { id } = router.query;

  const [email, setEmail] = useState<TransactionEditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<EmailProcessed>>({});

  useEffect(() => {
    if (id) {
      fetchEmail();
    }
  }, [id]);

  const fetchEmail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/emails/processed/${id}`);

      if (!res.ok) {
        throw new Error('Failed to fetch email');
      }

      const data = await res.json();
      setEmail(data);
      setFormData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/emails/processed/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Failed to save changes');
      }

      const data = await res.json();
      setEmail(data);

      alert('Email updated successfully!');
      router.push('/transactions');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof EmailProcessed, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout title="Loading..." description="Loading transaction details">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading transaction...</p>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error || !email) {
    return (
      <ProtectedRoute>
        <Layout title="Error" description="Failed to load transaction">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-800 font-medium">Error: {error || 'Transaction not found'}</p>
              <button
                onClick={() => router.push('/transactions')}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Back to Transactions
              </button>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout
        title="Edit Transaction"
        description="Edit extracted transaction details"
      >
        <div className="min-h-screen bg-gray-50">
          {/* Mobile-optimized Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 lg:px-8 py-6 sm:py-8 shadow-lg">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push('/transactions')}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
                    Edit Transaction
                  </h1>
                  <p className="mt-1 text-blue-100 text-xs sm:text-sm truncate">
                    Update transaction details
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 pb-32 space-y-4 sm:space-y-6">
            {/* Transaction Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Transaction Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Amount */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount || ''}
                    onChange={(e) => handleChange('amount', parseFloat(e.target.value))}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="0.00"
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.currency || 'INR'}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>

                {/* Direction */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Direction
                  </label>
                  <select
                    value={formData.direction || ''}
                    onChange={(e) => handleChange('direction', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select direction</option>
                    <option value="debit">Debit</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>

                {/* Transaction Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.txn_time ? new Date(formData.txn_time).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleChange('txn_time', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Merchant Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Merchant Name
                  </label>
                  <input
                    type="text"
                    value={formData.merchant_name || ''}
                    onChange={(e) => handleChange('merchant_name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter merchant name"
                  />
                </div>

                {/* Merchant Normalized */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Merchant Normalized
                  </label>
                  <input
                    type="text"
                    value={formData.merchant_normalized || ''}
                    onChange={(e) => handleChange('merchant_normalized', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Normalized merchant name"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Transaction category"
                  />
                </div>

                {/* Transaction Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Type
                  </label>
                  <input
                    type="text"
                    value={formData.transaction_type || ''}
                    onChange={(e) => handleChange('transaction_type', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., UPI, Card, etc."
                  />
                </div>

                {/* Reference ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference ID
                  </label>
                  <input
                    type="text"
                    value={formData.reference_id || ''}
                    onChange={(e) => handleChange('reference_id', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Transaction reference"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Transaction location"
                  />
                </div>
              </div>
            </div>


            {/* Account Details Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Account Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Account Hint */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Hint
                  </label>
                  <input
                    type="text"
                    value={formData.account_hint || ''}
                    onChange={(e) => handleChange('account_hint', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Last 4 digits"
                  />
                </div>

                {/* Account Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Type
                  </label>
                  <select
                    value={formData.account_type || ''}
                    onChange={(e) => handleChange('account_type', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select account type</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="DEBIT_CARD">Debit Card</option>
                    <option value="BANK_ACCOUNT">Bank Account</option>
                    <option value="UPI">UPI</option>
                    <option value="WALLET">Wallet</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Confidence & Status Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Confidence & Status
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Confidence */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confidence Score
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={formData.confidence || 0}
                      onChange={(e) => handleChange('confidence', parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-gray-700 w-16 text-right">
                      {((formData.confidence || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status || 'pending'}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Extraction Version */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Extraction Version
                  </label>
                  <input
                    type="text"
                    value={formData.extraction_version || ''}
                    onChange={(e) => handleChange('extraction_version', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    placeholder="AI extraction version"
                  />
                </div>
              </div>
            </div>

            {/* Notes Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Notes
              </h2>

              <div className="space-y-6">
                {/* AI Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI Notes
                  </label>
                  <textarea
                    value={formData.ai_notes || ''}
                    onChange={(e) => handleChange('ai_notes', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    placeholder="AI-generated notes and observations"
                  />
                </div>

                {/* User Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Notes
                  </label>
                  <textarea
                    value={formData.user_notes || ''}
                    onChange={(e) => handleChange('user_notes', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add your own notes here..."
                  />
                </div>
              </div>
            </div>

            {/* Email Body Card */}
            {email.email_fetched && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Related Email Body
                </h2>

                <div className="space-y-4">
                  {/* Email Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-500">From</p>
                      <p className="text-sm text-gray-900">{email.email_fetched.from_address || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Subject</p>
                      <p className="text-sm text-gray-900">{email.email_fetched.subject || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date</p>
                      <p className="text-sm text-gray-900">
                        {email.email_fetched.internal_date
                          ? new Date(email.email_fetched.internal_date).toLocaleString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Message ID</p>
                      <p className="text-sm text-gray-900 font-mono truncate">
                        {email.email_fetched.message_id}
                      </p>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Email Content</p>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                        {email.email_fetched.plain_body || 'No email body available'}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Floating Action Buttons */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between space-x-4">
                <button
                  onClick={() => router.push('/transactions')}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                >
                  ← Back to Transactions
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

