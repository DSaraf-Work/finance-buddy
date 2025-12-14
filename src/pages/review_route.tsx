import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import ReviewTransactionRow from '@/components/ReviewTransactionRow';
import ReviewEditModal from '@/components/ReviewEditModal';
import ReviewFilters from '@/components/ReviewFilters';

export interface ReviewTransaction {
  id: string;
  user_id: string;
  google_user_id: string;
  connection_id: string | null;
  email_row_id: string;
  txn_time: string | null;
  amount: string;
  currency: string | null;
  direction: 'debit' | 'credit' | null;
  merchant_name: string | null;
  merchant_normalized: string | null;
  category: string | null;
  account_hint: string | null;
  account_type: string | null;
  reference_id: string | null;
  location: string | null;
  confidence: string | null;
  ai_notes: string | null;
  user_notes: string | null;
  extraction_version: string | null;
  status: 'REVIEW' | 'APPROVED' | 'INVALID' | 'REJECTED';
  created_at: string;
  updated_at: string;
}

// Date range presets
const getDateRange = (preset: string): { start: string; end: string } => {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  let start = end;

  switch (preset) {
    case 'today':
      start = end;
      break;
    case '7d':
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      start = sevenDaysAgo.toISOString().split('T')[0];
      break;
    case '30d':
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      start = thirtyDaysAgo.toISOString().split('T')[0];
      break;
    case 'thisMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      break;
    default:
      start = end;
  }

  return { start, end };
};

export default function ReviewRoutePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<ReviewTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<ReviewTransaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter state
  const [datePreset, setDatePreset] = useState('30d');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Newest first by default
  const [searchKeyword, setSearchKeyword] = useState('');

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

      // Determine date range
      const dateRange = datePreset === 'custom' 
        ? customDateRange 
        : getDateRange(datePreset);

      // Build query parameters
      const params = new URLSearchParams({
        start: dateRange.start,
        end: dateRange.end,
        sort: sortOrder,
      });

      if (searchKeyword) {
        params.append('q', searchKeyword);
      }

      const response = await fetch(`/api/review_route/transactions?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (transaction: ReviewTransaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleReject = async (transaction: ReviewTransaction, notes: string) => {
    try {
      const response = await fetch(`/api/review_route/transactions/${transaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'REJECTED',
          user_notes: notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject transaction');
      }

      // Refresh transactions
      await fetchTransactions();
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      setError('Failed to reject transaction. Please try again.');
    }
  };

  const handleSave = async (updatedTransaction: ReviewTransaction) => {
    try {
      const response = await fetch(`/api/review_route/transactions/${updatedTransaction.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTransaction),
      });

      if (!response.ok) {
        throw new Error('Failed to update transaction');
      }

      // Update local state
      setTransactions(prev =>
        prev.map(t => (t.id === updatedTransaction.id ? updatedTransaction : t))
      );

      setIsModalOpen(false);
      setSelectedTransaction(null);
    } catch (err) {
      console.error('Error updating transaction:', err);
      alert('Failed to update transaction');
    }
  };

  const handleFilterChange = () => {
    fetchTransactions();
  };

  if (authLoading || loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center min-h-screen bg-[#0f0a1a]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b4ce6] mx-auto"></div>
              <p className="mt-4 text-[#cbd5e1]">Loading transactions...</p>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#6b4ce6] to-[#8b5cf6] rounded-[var(--radius-lg)] flex items-center justify-center shadow-[0_0_20px_rgba(107,76,230,0.3)]">
                <span className="text-xl sm:text-2xl">✅</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#f8fafc]">Transaction Review</h1>
            </div>
            <p className="text-[#cbd5e1] mt-2 text-sm sm:text-base">
              Review and manage your extracted transactions
            </p>
          </div>

          {/* Filters */}
          <ReviewFilters
            datePreset={datePreset}
            setDatePreset={setDatePreset}
            customDateRange={customDateRange}
            setCustomDateRange={setCustomDateRange}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            searchKeyword={searchKeyword}
            setSearchKeyword={setSearchKeyword}
            onFetch={handleFilterChange}
          />

          {/* Error State */}
          {error && (
            <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] px-4 py-3 rounded-[var(--radius-lg)] mb-6 flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Desktop Table */}
          <div className="hidden md:block bg-[#1a1625] rounded-[var(--radius-lg)] shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-[#2d1b4e] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-[#0f0a1a]/50 sticky top-0 border-b border-[#2d1b4e]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                      Date/Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                      Merchant
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                      Confidence
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[#1a1625]">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <svg className="w-16 h-16 text-[#2d1b4e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-[#94a3b8]">No transactions found. Try adjusting your filters.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    transactions.map(transaction => (
                      <ReviewTransactionRow
                        key={transaction.id}
                        transaction={transaction}
                        onEdit={handleEdit}
                        onReject={handleReject}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {transactions.length === 0 ? (
              <div className="bg-[#1a1625] rounded-[var(--radius-lg)] shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-[#2d1b4e] px-6 py-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-16 h-16 text-[#2d1b4e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-[#94a3b8]">No transactions found. Try adjusting your filters.</p>
                </div>
              </div>
            ) : (
              transactions.map(transaction => (
                <ReviewTransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  onEdit={handleEdit}
                  onReject={handleReject}
                  isMobile
                />
              ))
            )}
          </div>

          {/* Edit Modal */}
          {isModalOpen && selectedTransaction && (
            <ReviewEditModal
              transaction={selectedTransaction}
              onSave={handleSave}
              onClose={() => {
                setIsModalOpen(false);
                setSelectedTransaction(null);
              }}
            />
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

