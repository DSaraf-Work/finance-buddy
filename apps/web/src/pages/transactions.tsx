import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import TransactionRow from '@/components/TransactionRow';
import TransactionModal from '@/components/TransactionModal';

export interface Transaction {
  id: string;
  user_id: string;
  google_user_id: string;
  connection_id: string;
  email_row_id: string;
  txn_time: string | null;
  amount: string;
  currency: string | null;
  direction: 'debit' | 'credit' | 'transfer' | null;
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
  confidence: string;
  extraction_version: string;
  created_at: string;
  updated_at: string;
}

export default function TransactionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    avgConfidence: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
      return;
    }

    if (user) {
      fetchTransactions();
    }
  }, [user, authLoading, router]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/transactions', {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch transactions');
      }

      const data = await response.json();

      if (data.success) {
        setTransactions(data.transactions);
        setStats(data.stats);
      } else {
        throw new Error(data.error || 'Failed to fetch transactions');
      }

    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleReExtraction = async (transactionId: string) => {
    try {
      const response = await fetch('/api/transactions/re-extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ transactionId }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Re-extraction successful:', result);

        // Refresh transactions to show updated data
        await fetchTransactions();

        // Show success message
        alert(`Re-extraction completed! Confidence: ${Math.round(result.extractionResult.confidence * 100)}%`);
      } else {
        const error = await response.json();
        console.error('❌ Re-extraction failed:', error);
        alert(`Re-extraction failed: ${error.error}`);
      }
    } catch (error) {
      console.error('❌ Re-extraction error:', error);
      alert('Re-extraction failed. Please try again.');
    }
  };

  const handleTransactionUpdate = async (updatedTransaction: Transaction) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          id: updatedTransaction.id,
          txn_time: updatedTransaction.txn_time,
          amount: updatedTransaction.amount,
          currency: updatedTransaction.currency,
          direction: updatedTransaction.direction,
          merchant_name: updatedTransaction.merchant_name,
          merchant_normalized: updatedTransaction.merchant_normalized,
          category: updatedTransaction.category,
          account_hint: updatedTransaction.account_hint,
          reference_id: updatedTransaction.reference_id,
          location: updatedTransaction.location,
          account_type: updatedTransaction.account_type,
          transaction_type: updatedTransaction.transaction_type,
          user_notes: updatedTransaction.user_notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update transaction');
      }

      const data = await response.json();

      if (data.success) {
        // Update local state
        setTransactions(prev =>
          prev.map(t => t.id === updatedTransaction.id ? data.transaction : t)
        );

        setIsModalOpen(false);
        setSelectedTransaction(null);
      } else {
        throw new Error(data.error || 'Failed to update transaction');
      }
    } catch (err: any) {
      console.error('Error updating transaction:', err);
      setError(err.message || 'Failed to update transaction');
    }
  };

  const openTransactionModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchTransactions}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
                <p className="text-gray-600 mt-1">AI-extracted financial transactions with smart insights</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchTransactions}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Transactions</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{stats.total}</p>
                <p className="text-sm text-gray-500 mt-1">Processed transactions</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Amount</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">₹{stats.totalAmount.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">Transaction value</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Avg Confidence</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{stats.avgConfidence}%</p>
                <p className="text-sm text-gray-500 mt-1">AI accuracy</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
                  <p className="text-sm text-gray-600">Click to expand details or edit transactions</p>
                </div>
              </div>
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {transactions.length} transactions
              </div>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-300 text-8xl mb-6">💳</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No transactions found</h3>
              <p className="text-gray-600 mb-6">Process some emails to see transactions here.</p>
              <button
                onClick={fetchTransactions}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Refresh Transactions
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((transaction, index) => (
                <div
                  key={transaction.id}
                  className="transition-all duration-200 hover:bg-gray-50"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TransactionRow
                    transaction={transaction}
                    onEdit={() => openTransactionModal(transaction)}
                    onReExtract={handleReExtraction}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Modal */}
      {selectedTransaction && (
        <TransactionModal
          transaction={selectedTransaction}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTransaction(null);
          }}
          onSave={handleTransactionUpdate}
        />
      )}
    </div>
  );
}
