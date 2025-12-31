import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import LoadingScreen from '@/components/LoadingScreen';
import TransactionModal from '@/components/TransactionModal';
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

// Helper to check if a date is today
const isToday = (date: Date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

// Helper to check if a date is yesterday
const isYesterday = (date: Date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
};

// Helper to format date header
const formatDateHeader = (dateStr: string | null) => {
  if (!dateStr) return 'Unknown Date';
  const date = new Date(dateStr);

  if (isToday(date)) return `Today, ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  if (isYesterday(date)) return `Yesterday, ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); // "Sun, Oct 24"
};

type GroupedTransactions = {
  date: string; // YYYY-MM-DD for sorting
  header: string;
  transactions: Transaction[];
  total: number;
};

export default function TransactionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter state for Chips
  const [activeFilter, setActiveFilter] = useState<'All' | 'Income' | 'Expense'>('All');

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50, // Increased page size for better grouping
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
      return;
    }

    if (user) {
      searchTransactions();
    }
  }, [user, authLoading, router]);

  const searchTransactions = async (page: number = pagination.page) => {
    try {
      setLoading(true);
      setError(null);

      // Simple search request - defaulting to All/Desc
      // We will handle Income/Expense filtering client-side for smoother UI if list is small, 
      // but simpler to do server side for correctness with pagination.
      // Let's do server side filtering mapped to chips.

      const searchRequest: any = {
        page,
        pageSize: pagination.pageSize,
        sort: 'desc',
      };

      if (activeFilter === 'Income') searchRequest.direction = 'credit';
      if (activeFilter === 'Expense') searchRequest.direction = 'debit';
      if (searchQuery) searchRequest.merchant = searchQuery; // Simple fuzzy search on merchant

      const response = await fetch('/api/transactions/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(searchRequest),
      });

      if (!response.ok) throw new Error('Failed to search transactions');

      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions || []);
        setPagination({
          page: data.page,
          pageSize: data.pageSize,
          total: data.total,
          totalPages: data.totalPages,
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

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: GroupedTransactions } = {};

    transactions.forEach(t => {
      const dateVal = t.txn_time ? t.txn_time.split('T')[0] : 'unknown';
      if (!groups[dateVal]) {
        groups[dateVal] = {
          date: dateVal,
          header: formatDateHeader(t.txn_time),
          transactions: [],
          total: 0
        };
      }
      groups[dateVal].transactions.push(t);

      // Add signed amount
      const amount = parseFloat(t.amount || '0');
      // For expenses (debit), amount in DB is usually positive absolute value, direction is debit.
      // Layout logic: debit = negative for display sum.
      const signedAmount = t.direction === 'debit' ? -Math.abs(amount) : Math.abs(amount);
      groups[dateVal].total += signedAmount;
    });

    // Sort groups by date desc
    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions]);

  const handleStatusUpdate = useCallback(async (transactionId: string, newStatus: TransactionStatus) => {
    try {
      const response = await fetch('/api/transactions/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ transactionId, status: newStatus }),
      });

      if (response.ok) {
        setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, status: newStatus } : t));
        success(`Status updated to ${newStatus}`);
      } else {
        showError('Status update failed');
      }
    } catch (error) {
      showError('Status update failed');
    }
  }, [success, showError]);

  const handleTransactionUpdate = async (updatedTransaction: Transaction) => {
    // Re-use logic from previous implementation
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

      if (!response.ok) throw new Error('Failed to update');

      const data = await response.json();
      if (data.success) {
        setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? { ...t, ...updatedTransaction } : t));
        setIsModalOpen(false);
        setSelectedTransaction(null);
        success('Transaction updated');
      }
    } catch (err) {
      showError('Failed to update transaction');
    }
  };

  const handleFilterClick = (filter: 'All' | 'Income' | 'Expense') => {
    setActiveFilter(filter);
    // Trigger useEffect or call search immediately? 
    // Effect dependency activeFilter is needed or helper param
    // We didn't add activeFilter to dependency of searchTransactions effectively because it's wrapped in closure if not careful.
    // Better: update state, and use useEffect to search when activeFilter changes.
  };

  // Effect to re-search when filters change
  useEffect(() => {
    if (user) searchTransactions(1);
  }, [activeFilter, user]);

  return (
    <ProtectedRoute>
      <Layout title="Transactions" description="Your financial activity">
        <div className="min-h-screen bg-[var(--color-bg-app)] text-[var(--color-text-primary)] font-sans pb-20">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-[var(--color-bg-app)]/80 backdrop-blur-md border-b border-[var(--color-border)] px-4 py-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => router.back()} className="p-1 hover:bg-[var(--color-bg-elevated)] rounded-full transition-colors">
                    <svg className="w-5 h-5 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                  <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Transactions</h1>
                </div>
                <div className="flex items-center gap-4">
                  <button className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                  <button className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
                {['All', 'Income', 'Expense'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => handleFilterClick(filter as any)}
                    className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeFilter === filter
                        ? 'bg-[var(--color-accent-primary)] text-[var(--color-text-primary)]'
                        : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)] border border-[var(--color-border)]'
                      }`}
                  >
                    {filter === 'All' && <span className="mr-2">contents</span>}
                    {filter === 'All' && <svg className="inline-block w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                    {filter === 'Income' && <svg className="inline-block w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>}
                    {filter === 'Expense' && <svg className="inline-block w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>}
                    {filter}
                  </button>
                ))}
                <button className="px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)] border border-[var(--color-border)] flex items-center transition-colors">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Date
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-3xl mx-auto px-4 pt-6">
            {/* Recent Activity Header */}
            <div className="flex items-center justify-between mb-6 text-sm text-[var(--color-text-muted)] font-medium tracking-wide uppercase">
              <span>Recent Activity</span>
              <div className="flex items-center gap-1 bg-[var(--color-bg-card)] px-3 py-1.5 rounded-lg border border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-bg-elevated)] transition-colors">
                <span>Date: Newest</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {loading ? (
              <TransactionListSkeleton count={8} />
            ) : groupedTransactions.length === 0 ? (
              <TransactionEmptyState onRefresh={() => searchTransactions()} />
            ) : (
              groupedTransactions.map((group) => (
                <div key={group.date} className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[var(--color-text-secondary)] font-bold text-sm tracking-wide">{group.header}</h3>
                    <span className={`text-sm font-semibold px-2 py-1 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] ${group.total < 0 ? 'text-[var(--color-expense)]' : 'text-[var(--color-income)]'}`}>
                      {group.total < 0 ? '-' : '+'}${Math.abs(group.total).toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-0">
                    {group.transactions.map(txn => (
                      <TransactionCard
                        key={txn.id}
                        transaction={txn}
                        onQuickEdit={() => { setSelectedTransaction(txn); setIsModalOpen(true); }}
                        onStatusUpdate={(status) => handleStatusUpdate(txn.id, status)}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}

            {/* Pagination Load More (Simplified for infinite scroll feel later, but button for now) */}
            {!loading && groupedTransactions.length > 0 && pagination.page < pagination.totalPages && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => searchTransactions(pagination.page + 1)}
                  className="px-6 py-3 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-card)] text-[var(--color-text-primary)] rounded-xl font-medium transition-colors border border-[var(--color-border)]"
                >
                  Load More
                </button>
              </div>
            )}
          </main>

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

          <ToastContainer toasts={toasts} onRemove={removeToast} />
          <BackToTop />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
