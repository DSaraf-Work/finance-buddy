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
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading transactions...</p>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Transaction Review</h1>
            <p className="text-gray-600 mt-2">
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
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date/Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Merchant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confidence
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        No transactions found. Try adjusting your filters.
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-12 text-center text-gray-500">
                No transactions found. Try adjusting your filters.
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

