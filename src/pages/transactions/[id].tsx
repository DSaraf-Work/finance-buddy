// Transaction Detail Page

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface Transaction {
  id: string;
  user_id: string;
  google_user_id: string;
  connection_id: string | null;
  email_row_id: string;
  txn_time: string | null;
  amount: number | null;
  currency: string | null;
  direction: 'debit' | 'credit' | null;
  merchant_name: string | null;
  merchant_normalized: string | null;
  category: string | null;
  account_hint: string | null;
  reference_id: string | null;
  location: string | null;
  account_type: string | null;
  transaction_type: 'Dr' | 'Cr' | null;
  ai_notes: string | null;
  user_notes: string | null;
  confidence: number | null;
  extraction_version: string | null;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
  updated_at: string;
  email: {
    id: string;
    from_address: string;
    subject: string;
    snippet: string;
    internal_date: string;
    plain_body: string;
  };
}

export default function TransactionDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Partial<Transaction>>({});

  useEffect(() => {
    if (id) {
      fetchTransaction();
    }
  }, [id]);

  const fetchTransaction = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/transactions/${id}`);
      if (!res.ok) {
        throw new Error('Failed to fetch transaction');
      }
      const data = await res.json();
      setTransaction(data.transaction);
      setEditedData(data.transaction);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedData),
      });

      if (!res.ok) {
        throw new Error('Failed to save changes');
      }

      const data = await res.json();
      setTransaction(data.transaction);
      setEditing(false);
      
      alert('Transaction updated successfully!');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete transaction');
      }

      alert('Transaction deleted successfully!');
      router.push('/transactions');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (amount === null) return 'N/A';
    return `${currency || 'INR'} ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getConfidenceColor = (confidence: number | null) => {
    if (confidence === null) return 'gray';
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.5) return 'yellow';
    return 'red';
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-[#10b981]/10 text-[#10b981]',
      rejected: 'bg-[#ef4444]/10 text-[#ef4444]',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-[#cbd5e1]">Loading transaction...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-[var(--radius-md)] p-6">
          <h2 className="text-xl font-semibold text-[#ef4444]">Error</h2>
          <p className="mt-2 text-red-600">{error || 'Transaction not found'}</p>
          <button
            onClick={() => router.push('/transactions')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-[var(--radius-md)] hover:bg-red-700"
          >
            Back to Transactions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-[#cbd5e1]">
          <a href="/" className="hover:text-blue-600">Home</a>
          {' > '}
          <a href="/transactions" className="hover:text-blue-600">Transactions</a>
          {' > '}
          <span className="text-[#f8fafc]">{transaction.id.substring(0, 8)}...</span>
        </nav>

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#f8fafc]">
              Transaction Details
            </h1>
            <p className="mt-2 text-[#cbd5e1]">
              View and edit transaction information
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(transaction.status)}`}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </span>
            {!editing ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-[#6b4ce6] text-white rounded-[var(--radius-md)] hover:bg-[#8b5cf6] font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-[var(--radius-md)] hover:bg-red-700 font-medium"
                >
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-[var(--radius-md)] hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditedData(transaction);
                  }}
                  className="px-4 py-2 bg-gray-300 text-[#cbd5e1] rounded-[var(--radius-md)] hover:bg-gray-400 font-medium"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transaction Summary Card */}
            <div className="bg-[#1a1625] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] p-6">
              <h2 className="text-xl font-semibold text-[#f8fafc] mb-4">
                Transaction Summary
              </h2>
              
              {/* Amount - Large Display */}
              <div className="mb-6 text-center py-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-[var(--radius-md)]">
                <p className="text-sm text-[#cbd5e1] mb-2">Amount</p>
                {editing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <input
                      type="text"
                      value={editedData.currency || 'INR'}
                      onChange={(e) => setEditedData({ ...editedData, currency: e.target.value })}
                      className="w-20 px-3 py-2 border border-[#2d1b4e] rounded-[var(--radius-md)]"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={editedData.amount || ''}
                      onChange={(e) => setEditedData({ ...editedData, amount: parseFloat(e.target.value) })}
                      className="w-40 px-3 py-2 border border-[#2d1b4e] rounded-[var(--radius-md)] text-3xl font-bold"
                    />
                  </div>
                ) : (
                  <p className="text-4xl font-bold text-[#f8fafc]">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                )}
              </div>

              {/* Merchant and Date */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
                    Merchant
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={editedData.merchant_name || ''}
                      onChange={(e) => setEditedData({ ...editedData, merchant_name: e.target.value })}
                      className="w-full px-3 py-2 border border-[#2d1b4e] rounded-[var(--radius-md)]"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-[#f8fafc]">
                      {transaction.merchant_name || 'N/A'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
                    Date
                  </label>
                  {editing ? (
                    <input
                      type="datetime-local"
                      value={editedData.txn_time ? new Date(editedData.txn_time).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setEditedData({ ...editedData, txn_time: new Date(e.target.value).toISOString() })}
                      className="w-full px-3 py-2 border border-[#2d1b4e] rounded-[var(--radius-md)]"
                    />
                  ) : (
                    <p className="text-lg text-[#f8fafc]">
                      {formatDate(transaction.txn_time)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* AI Confidence */}
            <div className="bg-[#1a1625] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] p-6">
              <h3 className="text-lg font-semibold text-[#f8fafc] mb-3">
                AI Confidence
              </h3>
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full bg-${getConfidenceColor(transaction.confidence)}-500`}
                      style={{ width: `${(transaction.confidence || 0) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="ml-3 text-lg font-semibold text-[#f8fafc]">
                  {((transaction.confidence || 0) * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Source Email */}
            <div className="bg-[#1a1625] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] p-6">
              <h3 className="text-lg font-semibold text-[#f8fafc] mb-3">
                Source Email
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-[#cbd5e1]">From:</span>
                  <p className="text-[#f8fafc]">{transaction.email.from_address}</p>
                </div>
                <div>
                  <span className="font-medium text-[#cbd5e1]">Subject:</span>
                  <p className="text-[#f8fafc]">{transaction.email.subject}</p>
                </div>
                <div>
                  <span className="font-medium text-[#cbd5e1]">Date:</span>
                  <p className="text-[#f8fafc]">{formatDate(transaction.email.internal_date)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

