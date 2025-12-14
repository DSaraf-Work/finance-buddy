import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import LoadingScreen from '@/components/LoadingScreen';
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

// Helper function to get start of current month
const getDefaultStartDate = () => {
  const date = new Date();
  date.setDate(1); // First day of current month
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
    sort: 'desc' as 'asc' | 'desc',
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
        sort: filters.sort || 'desc', // Use filter sort or default to newest first
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
      sort: 'desc',
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
      <ProtectedRoute>
        <Layout title="Transactions - Finance Buddy" description="View and manage your transactions">
          <LoadingScreen message="Loading transactions..." />
        </Layout>
      </ProtectedRoute>
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
            className="px-4 py-2 bg-blue-600 text-white rounded-[var(--radius-md)] hover:bg-blue-700 transition-colors"
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
        {/* Purple + Slate Gray Background */}
        <div className="min-h-screen bg-[var(--color-bg-app)] py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8 sm:mb-12">
              <div className="flex items-center justify-between pb-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-2">
                    Transactions
                  </h1>
                  <p className="text-sm sm:text-base text-[var(--color-text-secondary)]">
                    Track and manage your financial activity
                  </p>
                </div>
              </div>
            </div>

            {/* Section 1: Sticky Stats Bar - Always visible */}
            <TransactionStats
              total={stats.total}
              totalAmount={stats.totalAmount}
              avgConfidence={stats.avgConfidence}
              loading={loading}
            />

            {/* Section 2: Filters - Distinct background with spacing */}
            <div className="mb-6 sm:mb-8">
              <div className="bg-[#0F1014] rounded-[var(--radius-lg)] p-4 sm:p-6 border border-[var(--color-border)]/50 shadow-[var(--shadow-lg)]">
                <TransactionFilters
                  filters={filters}
                  categories={categories}
                  onFilterChange={setFilters}
                  onSearch={handleApplyFilters}
                  onReset={handleClearFilters}
                  loading={filterLoading}
                />
              </div>
            </div>

            {/* Section 3: Transactions List - Clear separation */}
            <div className="mt-6 sm:mt-8">
              {/* Section Header */}
              {!loading && transactions.length > 0 && (
                <div className="flex items-center justify-between mb-4 sm:mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-[#5D5FEF] to-[#888BFF] rounded-full"></div>
                    <h2 className="text-base sm:text-lg font-semibold text-[var(--color-text-primary)]">
                      Transactions
                    </h2>
                    <span className="text-xs sm:text-sm text-[var(--color-text-muted)] ml-1">
                      ({transactions.length} {transactions.length === 1 ? 'result' : 'results'})
                    </span>
                  </div>
                </div>
              )}

              {loading ? (
                <TransactionListSkeleton count={10} />
              ) : transactions.length === 0 ? (
                <TransactionEmptyState onRefresh={() => searchTransactions()} />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
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
            </div>

        {/* Pagination Controls */}
        {transactions.length > 0 && (
          <nav
            className="mt-10 sm:mt-12 bg-[var(--color-bg-primary)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-sm)] border border-[var(--color-border)]"
            aria-label="Transaction pagination"
          >
            {/* Purple Top Border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5D5FEF] to-[#888BFF] rounded-t-2xl"></div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Pagination Info */}
              <div className="flex items-center gap-6">
                <span className="text-sm text-[var(--color-text-secondary)]" aria-live="polite">
                  <span className="text-[var(--color-text-primary)] font-semibold">{pagination.total}</span> transactions
                </span>
                <div className="h-4 w-px bg-[var(--color-border)]"></div>
                <span className="text-sm text-[var(--color-text-secondary)]" aria-current="page">
                  Page <span className="text-[var(--color-text-primary)] font-semibold">{pagination.page}</span> of <span className="text-[var(--color-text-primary)] font-semibold">{pagination.totalPages}</span>
                </span>
              </div>

              {/* Pagination Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-card)] border-2 border-[var(--color-border)] rounded-[var(--radius-lg)] hover:border-[var(--color-accent-primary)] hover:text-[var(--color-accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--color-border)] disabled:hover:text-[var(--color-text-secondary)] transition-all duration-300"
                  aria-label="Go to previous page"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </span>
                </button>

                {/* Current Page Indicator */}
                <div className="px-4 py-2.5 bg-gradient-to-r from-[#5D5FEF] to-[#888BFF] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]">
                  <span className="text-sm font-bold text-white">
                    {pagination.page}
                  </span>
                </div>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-card)] border-2 border-[var(--color-border)] rounded-[var(--radius-lg)] hover:border-[var(--color-accent-primary)] hover:text-[var(--color-accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--color-border)] disabled:hover:text-[var(--color-text-secondary)] transition-all duration-300"
                  aria-label="Go to next page"
                >
                  <span className="flex items-center gap-2">
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>
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
