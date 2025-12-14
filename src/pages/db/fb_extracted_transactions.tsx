import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import {
  ExtractedTransactionPublic,
  TransactionSearchRequest,
  PaginatedResponse,
  TransactionDirection
} from '@/types';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';

interface TransactionFilters {
  date_from?: string;
  date_to?: string;
  google_user_id?: string;
  direction?: TransactionDirection;
  category?: string;
  merchant?: string;
  min_amount?: number;
  max_amount?: number;
  min_confidence?: number;
}

const TransactionWorkbenchPage: NextPage = () => {
  const [transactions, setTransactions] = useState<ExtractedTransactionPublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState<TransactionFilters>({
    date_from: '',
    date_to: '',
    google_user_id: '',
    direction: undefined,
    category: '',
    merchant: '',
    min_amount: undefined,
    max_amount: undefined,
    min_confidence: undefined,
  });
  const [selectedTransaction, setSelectedTransaction] = useState<ExtractedTransactionPublic | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);

  const searchTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const searchRequest: TransactionSearchRequest = {
        ...filters,
        page,
        pageSize: pagination.pageSize,
        sort: 'desc',
      };

      // Remove empty filters
      Object.keys(searchRequest).forEach(key => {
        if (searchRequest[key as keyof TransactionSearchRequest] === '' || 
            searchRequest[key as keyof TransactionSearchRequest] === undefined) {
          delete searchRequest[key as keyof TransactionSearchRequest];
        }
      });

      const response = await fetch('/api/transactions/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchRequest),
      });

      if (response.ok) {
        const data: PaginatedResponse<ExtractedTransactionPublic> = await response.json();
        setTransactions(data.items);
        setPagination({
          page: data.page,
          pageSize: data.pageSize,
          total: data.total,
          totalPages: data.totalPages,
          hasNext: data.hasNext,
          hasPrev: data.hasPrev,
        });
      } else {
        console.error('Search failed:', response.statusText);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchTransactions();
  }, []);

  const handleFilterChange = (key: keyof TransactionFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({
      ...prev,
      pageSize: newPageSize,
      page: 1, // Reset to first page when changing page size
    }));
  };

  // Effect to trigger search when page size changes
  useEffect(() => {
    // Only trigger search if page size has been changed from initial load
    if (transactions.length > 0) { // Only if we have loaded transactions before
      searchTransactions(1); // Always go to page 1 when page size changes
    }
  }, [pagination.pageSize]);

  const handleSearch = () => {
    searchTransactions(1);
  };

  const handlePageChange = (newPage: number) => {
    searchTransactions(newPage);
  };

  const handleSelectTransaction = (transactionId: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions.map(txn => txn.id)));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedTransactions.size === 0) return;
    
    console.log(`Performing ${action} on ${selectedTransactions.size} transactions`);
    // TODO: Implement bulk actions API
    alert(`${action} action would be performed on ${selectedTransactions.size} transactions`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatAmount = (amount?: number, currency?: string) => {
    if (amount === undefined || amount === null) return 'N/A';
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
    return formatted;
  };

  const getDirectionColor = (direction?: TransactionDirection) => {
    switch (direction) {
      case 'debit': return 'text-red-600';
      case 'credit': return 'text-green-600';
      default: return 'text-[#cbd5e1]';
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'bg-[#2d1b4e]/30 text-gray-800';
    if (confidence >= 0.8) return 'bg-[#10b981]/10 text-[#10b981]';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-[#ef4444]/10 text-[#ef4444]';
  };

  return (
    <ProtectedRoute>
      <Layout 
        title="Transaction Workbench - Finance Buddy"
        description="Advanced transaction review and management workbench"
      >
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#f8fafc]">Transaction Workbench</h1>
              <p className="mt-1 text-sm text-gray-500">
                Advanced transaction review with confidence scoring and bulk operations
              </p>
            </div>

            {/* Filters */}
            <div className="bg-[#1a1625] shadow rounded-lg mb-6">
              <div className="px-6 py-4 border-b border-[#2d1b4e]">
                <h3 className="text-lg font-medium text-[#f8fafc]">Filters</h3>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-1">From Date</label>
                    <input
                      type="date"
                      value={filters.date_from || ''}
                      onChange={(e) => handleFilterChange('date_from', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-1">To Date</label>
                    <input
                      type="date"
                      value={filters.date_to || ''}
                      onChange={(e) => handleFilterChange('date_to', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-1">Direction</label>
                    <select
                      value={filters.direction || ''}
                      onChange={(e) => handleFilterChange('direction', e.target.value)}
                      className="input-field"
                    >
                      <option value="">All</option>
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-1">Category</label>
                    <input
                      type="text"
                      value={filters.category || ''}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      placeholder="Transaction category"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-1">Merchant</label>
                    <input
                      type="text"
                      value={filters.merchant || ''}
                      onChange={(e) => handleFilterChange('merchant', e.target.value)}
                      placeholder="Merchant name"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-1">Min Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={filters.min_amount || ''}
                      onChange={(e) => handleFilterChange('min_amount', parseFloat(e.target.value))}
                      placeholder="0.00"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-1">Max Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={filters.max_amount || ''}
                      onChange={(e) => handleFilterChange('max_amount', parseFloat(e.target.value))}
                      placeholder="0.00"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-1">Min Confidence</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={filters.min_confidence || ''}
                      onChange={(e) => handleFilterChange('min_confidence', parseFloat(e.target.value))}
                      placeholder="0.0 - 1.0"
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Pagination Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-1">Page Number</label>
                    <input
                      type="number"
                      min="1"
                      value={pagination.page}
                      onChange={(e) => {
                        const newPage = parseInt(e.target.value) || 1;
                        if (newPage >= 1) {
                          handlePageChange(newPage);
                        }
                      }}
                      className="input-field"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-1">Page Size</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={pagination.pageSize}
                      onChange={(e) => handlePageSizeChange(parseInt(e.target.value) || 10)}
                      className="input-field"
                      placeholder="50"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="text-sm text-gray-500">
                      {pagination.total} total transactions
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-between">
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedTransactions.size > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">
                    {selectedTransactions.size} transaction(s) selected
                  </span>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleBulkAction('approve')}
                      className="btn-secondary text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleBulkAction('reject')}
                      className="btn-secondary text-sm"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleBulkAction('re-extract')}
                      className="btn-secondary text-sm"
                    >
                      Re-Extract
                    </button>
                    <button
                      onClick={() => handleBulkAction('export')}
                      className="btn-secondary text-sm"
                    >
                      Export
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Grid */}
            <div className="bg-[#1a1625] shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={transactions.length > 0 && selectedTransactions.size === transactions.length}
                          onChange={handleSelectAll}
                          className="rounded border-[#2d1b4e]"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Direction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Merchant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Confidence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#1a1625] divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedTransactions.has(transaction.id)}
                            onChange={() => handleSelectTransaction(transaction.id)}
                            className="rounded border-[#2d1b4e]"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#f8fafc]">
                          {formatDate(transaction.txn_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={getDirectionColor(transaction.direction)}>
                            {formatAmount(transaction.amount, transaction.currency)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#f8fafc]">
                          <span className={`capitalize ${getDirectionColor(transaction.direction)}`}>
                            {transaction.direction || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#f8fafc] max-w-xs truncate">
                          {transaction.merchant_name || transaction.merchant_normalized || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#f8fafc]">
                          {transaction.category || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConfidenceColor(transaction.confidence)}`}>
                            {transaction.confidence ? `${Math.round(transaction.confidence * 100)}%` : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowDrawer(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="bg-[#1a1625] px-4 py-3 border-t border-[#2d1b4e] sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-[#cbd5e1]">
                      Showing page {pagination.page} of {pagination.totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={!pagination.hasPrev}
                        className="btn-secondary disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={!pagination.hasNext}
                        className="btn-secondary disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transaction Details Drawer */}
        {showDrawer && selectedTransaction && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowDrawer(false)} />
            <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-[#1a1625] shadow-xl">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-6 border-b border-[#2d1b4e]">
                  <h2 className="text-lg font-medium text-[#f8fafc]">Transaction Details</h2>
                  <button
                    onClick={() => setShowDrawer(false)}
                    className="text-gray-400 hover:text-[#cbd5e1]"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-[#f8fafc] mb-2">Transaction Information</h3>
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Transaction Time</dt>
                          <dd className="text-sm text-[#f8fafc]">{formatDate(selectedTransaction.txn_time)}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Amount</dt>
                          <dd className={`text-sm font-medium ${getDirectionColor(selectedTransaction.direction)}`}>
                            {formatAmount(selectedTransaction.amount, selectedTransaction.currency)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Direction</dt>
                          <dd className={`text-sm capitalize ${getDirectionColor(selectedTransaction.direction)}`}>
                            {selectedTransaction.direction || 'N/A'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Currency</dt>
                          <dd className="text-sm text-[#f8fafc]">{selectedTransaction.currency || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Merchant Name</dt>
                          <dd className="text-sm text-[#f8fafc]">{selectedTransaction.merchant_name || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Merchant (Normalized)</dt>
                          <dd className="text-sm text-[#f8fafc]">{selectedTransaction.merchant_normalized || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Category</dt>
                          <dd className="text-sm text-[#f8fafc]">{selectedTransaction.category || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Account Hint</dt>
                          <dd className="text-sm text-[#f8fafc]">{selectedTransaction.account_hint || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Reference ID</dt>
                          <dd className="text-sm text-[#f8fafc] font-mono">{selectedTransaction.reference_id || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Location</dt>
                          <dd className="text-sm text-[#f8fafc]">{selectedTransaction.location || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Confidence Score</dt>
                          <dd>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConfidenceColor(selectedTransaction.confidence)}`}>
                              {selectedTransaction.confidence ? `${Math.round(selectedTransaction.confidence * 100)}%` : 'N/A'}
                            </span>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Extraction Version</dt>
                          <dd className="text-sm text-[#f8fafc]">{selectedTransaction.extraction_version || 'N/A'}</dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-[#f8fafc] mb-2">Metadata</h3>
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Email Row ID</dt>
                          <dd className="text-sm text-[#f8fafc] font-mono">{selectedTransaction.email_row_id}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Google User ID</dt>
                          <dd className="text-sm text-[#f8fafc] font-mono">{selectedTransaction.google_user_id}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Connection ID</dt>
                          <dd className="text-sm text-[#f8fafc] font-mono">{selectedTransaction.connection_id || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Created At</dt>
                          <dd className="text-sm text-[#f8fafc]">{formatDate(selectedTransaction.created_at)}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Updated At</dt>
                          <dd className="text-sm text-[#f8fafc]">{formatDate(selectedTransaction.updated_at)}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
};

export default TransactionWorkbenchPage;
