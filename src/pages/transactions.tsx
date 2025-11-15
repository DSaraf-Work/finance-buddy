import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import TransactionRow from '@/components/TransactionRow';
import TransactionModal from '@/components/TransactionModal';
import TransactionStats from '@/components/TransactionStats';
import TransactionFilters from '@/components/TransactionFilters';
import TransactionCard from '@/components/TransactionCard';
import { TransactionListSkeleton } from '@/components/TransactionSkeleton';
import TransactionEmptyState from '@/components/TransactionEmptyState';
import { ToastContainer } from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import BackToTop from '@/components/BackToTop';

export type TransactionStatus = 'REVIEW' | 'APPROVED' | 'INVALID' | 'REJECTED';

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
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
}

// Helper function to get date 4 days ago
const getDefaultStartDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 4);
  return date.toISOString().split('T')[0];
};

// Helper function to get today's date
const getDefaultEndDate = () => {
  return new Date().toISOString().split('T')[0];
};

export default function TransactionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    avgConfidence: 0,
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  });

  // Filter state
  const [filters, setFilters] = useState({
    date_from: getDefaultStartDate(),
    date_to: getDefaultEndDate(),
    status: '' as TransactionStatus | '',
    direction: '' as 'debit' | 'credit' | '',
    category: '',
    merchant: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
      return;
    }

    if (user) {
      searchTransactions();
      loadCategories();
    }
  }, [user, authLoading, router]);

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/admin/config/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Use default categories if fetch fails
      setCategories(['food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'education', 'travel', 'finance', 'other']);
    }
  };

  const searchTransactions = async (page: number = pagination.page) => {
    try {
      setLoading(true);
      setError(null);

      // Build search request
      const searchRequest: any = {
        page,
        pageSize: pagination.pageSize,
        sort: 'desc', // Newest first
      };

      // Add filters if they have values
      if (filters.date_from) searchRequest.date_from = filters.date_from;
      if (filters.date_to) searchRequest.date_to = filters.date_to;
      if (filters.status) searchRequest.status = filters.status;
      if (filters.direction) searchRequest.direction = filters.direction;
      if (filters.category) searchRequest.category = filters.category;
      if (filters.merchant) searchRequest.merchant = filters.merchant;

      console.log('🔍 Searching transactions:', searchRequest);

      const response = await fetch('/api/transactions/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(searchRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search transactions');
      }

      const data = await response.json();

      if (data.success) {
        setTransactions(data.transactions || []);
        setPagination({
          page: data.page,
          pageSize: data.pageSize,
          total: data.total,
          totalPages: data.totalPages,
        });

        // Calculate stats from current page
        const totalAmount = data.transactions.reduce((sum: number, t: Transaction) =>
          sum + parseFloat(t.amount || '0'), 0
        );
        const avgConfidence = data.transactions.length > 0
          ? data.transactions.reduce((sum: number, t: Transaction) =>
              sum + parseFloat(t.confidence || '0'), 0
            ) / data.transactions.length
          : 0;

        setStats({
          total: data.total,
          totalAmount,
          avgConfidence,
        });
      } else {
        throw new Error(data.error || 'Failed to search transactions');
      }

    } catch (err: any) {
      console.error('Error searching transactions:', err);
      setError(err.message || 'Failed to search transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = useCallback(async (transactionId: string, newStatus: TransactionStatus) => {
    try {
      const response = await fetch('/api/transactions/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ transactionId, status: newStatus }),
      });

      if (response.ok) {
        console.log('✅ Status updated successfully');
        // Update the transaction status in local state without reloading
        setTransactions(prevTransactions =>
          prevTransactions.map(t =>
            t.id === transactionId ? { ...t, status: newStatus } : t
          )
        );
        success(`Status updated to ${newStatus}`);
      } else {
        const error = await response.json();
        console.error('❌ Status update failed:', error);
        showError(`Status update failed: ${error.error}`);
      }
    } catch (error) {
      console.error('❌ Status update error:', error);
      showError('Status update failed. Please try again.');
    }
  }, [success, showError]);

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
        await searchTransactions();

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
          ai_notes: updatedTransaction.ai_notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update transaction');
      }

      const data = await response.json();

      if (data.success) {
        // Update the transaction in the local state without reloading the page
        setTransactions(prevTransactions =>
          prevTransactions.map(t =>
            t.id === updatedTransaction.id ? { ...t, ...updatedTransaction } : t
          )
        );

        // Recalculate stats with updated transaction
        const updatedTransactions = transactions.map(t =>
          t.id === updatedTransaction.id ? { ...t, ...updatedTransaction } : t
        );
        const totalAmount = updatedTransactions.reduce((sum: number, t: Transaction) =>
          sum + parseFloat(t.amount || '0'), 0
        );
        const avgConfidence = updatedTransactions.length > 0
          ? updatedTransactions.reduce((sum: number, t: Transaction) =>
              sum + parseFloat(t.confidence || '0'), 0
            ) / updatedTransactions.length
          : 0;

        setStats({
          total: pagination.total,
          totalAmount,
          avgConfidence,
        });

        setIsModalOpen(false);
        setSelectedTransaction(null);
        alert('Transaction updated successfully!');
      } else {
        throw new Error(data.error || 'Failed to update transaction');
      }
    } catch (err: any) {
      console.error('Error updating transaction:', err);
      setError(err.message || 'Failed to update transaction');
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    searchTransactions(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
    searchTransactions(1);
  };

  // Filter handlers
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = async () => {
    setFilterLoading(true);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 when filters change
    await searchTransactions(1);
    setFilterLoading(false);
  };

  const handleClearFilters = () => {
    setFilters({
      date_from: getDefaultStartDate(),
      date_to: getDefaultEndDate(),
      status: '',
      direction: '',
      category: '',
      merchant: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    // Manually trigger search after clearing filters
    setTimeout(() => searchTransactions(1), 0);
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
            onClick={() => searchTransactions()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <Layout
        title="Finance Buddy - Transactions"
        description="AI-extracted financial transactions with smart insights"
      >
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-xl flex-shrink-0">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transactions</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1 hidden sm:block">AI-extracted financial transactions with smart insights</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    onClick={() => searchTransactions()}
                    disabled={loading}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] text-sm sm:text-base"
                    aria-label="Refresh transactions"
                  >
                    <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {loading ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <TransactionStats
              total={stats.total}
              totalAmount={stats.totalAmount}
              avgConfidence={stats.avgConfidence}
              loading={loading}
            />

            {/* Filters */}
            <TransactionFilters
              filters={filters}
              categories={categories}
              onFilterChange={setFilters}
              onSearch={handleApplyFilters}
              onReset={handleClearFilters}
              loading={filterLoading}
            />

            {/* Transactions List */}
            {loading ? (
              <TransactionListSkeleton count={10} />
            ) : transactions.length === 0 ? (
              <TransactionEmptyState onRefresh={() => searchTransactions()} />
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    onQuickEdit={() => openTransactionModal(transaction)}
                    onStatusUpdate={(status) => handleStatusUpdate(transaction.id, status)}
                  />
                ))}
              </div>
            )}

        {/* Pagination Controls */}
        {transactions.length > 0 && (
          <nav
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mt-6"
            aria-label="Transaction pagination"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span aria-live="polite">
                  {pagination.total} total transactions
                </span>
                <span aria-current="page">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="page-size" className="text-sm text-gray-600">
                    Page size:
                  </label>
                  <input
                    id="page-size"
                    type="number"
                    min="1"
                    max="100"
                    value={pagination.pageSize}
                    onChange={(e) => handlePageSizeChange(parseInt(e.target.value) || 25)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Items per page"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                    aria-label="Go to previous page"
                  >
                    Previous
                  </button>
                  <label htmlFor="page-number" className="sr-only">
                    Page number
                  </label>
                  <input
                    id="page-number"
                    type="number"
                    min="1"
                    max={pagination.totalPages}
                    value={pagination.page}
                    onChange={(e) => handlePageChange(parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Current page number"
                  />
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                    aria-label="Go to next page"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </nav>
        )}
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

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Back to Top Button */}
      <BackToTop />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
