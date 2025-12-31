import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import TransactionModal from '@/components/TransactionModal';
import { ToastContainer } from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import BackToTop from '@/components/BackToTop';
import { Button } from '@/components/ui/button';
import {
  TxnList,
  TxnListHeader,
  TxnLoadingSkeleton,
  TxnEmptyState,
  TxnErrorState,
} from '@/components/transactions';
import { TransactionFilterModal, TransactionFilters } from '@/components/transactions/TransactionFilterModal';
import { GroupedTransactions } from '@/components/transactions/TxnList';
import { format } from 'date-fns';

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

// Helper to format date header with the requested format: "1 Jan, Thurs"
const formatDateHeader = (dateStr: string | null) => {
  if (!dateStr) return 'Unknown Date';
  const date = new Date(dateStr);

  if (isToday(date)) {
    return 'Today';
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }

  // Format as "1 Jan, Thurs"
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  return `${day} ${month}, ${weekday}`;
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

  // Filter state
  const [filters, setFilters] = useState<TransactionFilters>({
    dateFrom: undefined,
    dateTo: undefined,
    paymentMode: 'all',
  });

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

  const searchTransactions = async (page: number = 1, resetPage: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      // Build search request with filters
      const searchRequest: any = {
        page,
        pageSize: pagination.pageSize,
        sort: 'desc', // Always sort by date descending
      };

      // Add payment mode filter
      if (filters.paymentMode === 'credit') searchRequest.direction = 'credit';
      if (filters.paymentMode === 'debit') searchRequest.direction = 'debit';

      // Add date range filters if provided
      if (filters.dateFrom) {
        searchRequest.startDate = format(filters.dateFrom, 'yyyy-MM-dd');
      }
      if (filters.dateTo) {
        // Add end of day for dateTo
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        searchRequest.endDate = format(endDate, "yyyy-MM-dd'T'HH:mm:ss");
      }

      const response = await fetch('/api/transactions/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(searchRequest),
      });

      if (!response.ok) throw new Error('Failed to search transactions');

      const data = await response.json();
      if (data.success) {
        if (resetPage || page === 1) {
          setTransactions(data.transactions || []);
        } else {
          // Append for load more
          setTransactions(prev => [...prev, ...(data.transactions || [])]);
        }
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

    // First, sort transactions by date descending
    const sortedTransactions = [...transactions].sort((a, b) => {
      const dateA = a.txn_time ? new Date(a.txn_time).getTime() : 0;
      const dateB = b.txn_time ? new Date(b.txn_time).getTime() : 0;
      return dateB - dateA; // Descending order
    });

    sortedTransactions.forEach(t => {
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

  // Handle filter application
  const handleApplyFilters = useCallback(async (newFilters: TransactionFilters) => {
    setFilters(newFilters);
    // Search will be triggered by the useEffect below
  }, []);

  // Handle filter clearing
  const handleClearFilters = useCallback(() => {
    setFilters({
      dateFrom: undefined,
      dateTo: undefined,
      paymentMode: 'all',
    });
    // Search will be triggered by the useEffect below
  }, []);

  // Effect to re-search when filters change
  useEffect(() => {
    if (user) {
      searchTransactions(1, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.dateFrom, filters.dateTo, filters.paymentMode, user]);

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

  const handleTransactionClick = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  }, []);

  return (
    <ProtectedRoute>
      <Layout title="Transactions" description="Your financial activity">
        <Head>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
        </Head>

        <div
          className="min-h-screen bg-[#09090B] text-[#FAFAFA]"
          style={{
            fontFamily: '"Outfit", -apple-system, sans-serif',
            maxWidth: '430px',
            margin: '0 auto',
            position: 'relative'
          }}
        >
          {/* Main Content - listContainer - padding 8px (matching /txn) */}
          <main style={{ padding: '8px' }}>
            <TxnListHeader
              title="Transactions"
              count={pagination.total}
              filterButton={
                <TransactionFilterModal
                  filters={filters}
                  onApplyFilters={handleApplyFilters}
                  onClearFilters={handleClearFilters}
                  totalCount={pagination.total}
                />
              }
            />

            {loading && <TxnLoadingSkeleton count={8} />}
            {error && !loading && <TxnErrorState error={error} onRetry={() => searchTransactions(1, true)} />}
            {!loading && !error && transactions.length === 0 && <TxnEmptyState />}
            {!loading && !error && transactions.length > 0 && (
              <TxnList
                groupedTransactions={groupedTransactions}
                onTransactionClick={handleTransactionClick}
              />
            )}

            {/* Load More */}
            {!loading && pagination.page < pagination.totalPages && (
              <div className="flex justify-center mt-6">
                <Button
                  onClick={() => searchTransactions(pagination.page + 1, false)}
                  variant="outline"
                  size="lg"
                  className="min-w-[150px] bg-[#18181B] border-[#27272A] text-[#FAFAFA] hover:bg-[#27272A]"
                >
                  Load More
                </Button>
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
