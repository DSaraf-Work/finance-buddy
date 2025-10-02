import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { 
  ExtractedTransactionPublic, 
  TransactionSearchRequest, 
  PaginatedResponse, 
  TransactionDirection 
} from '@finance-buddy/shared';

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

const TransactionsPage: NextPage = () => {
  const [transactions, setTransactions] = useState<ExtractedTransactionPublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
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

  const searchTransactions = async (page: number = 1) => {
    setLoading(true);
    try {
      const searchRequest: TransactionSearchRequest = {
        ...filters,
        page,
        pageSize: pagination.pageSize,
        sort: 'asc',
      };

      // Remove empty filters
      Object.keys(searchRequest).forEach(key => {
        const value = searchRequest[key as keyof TransactionSearchRequest];
        if (value === '' || value === undefined || value === null) {
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

  const handleSearch = () => {
    searchTransactions(1);
  };

  const handlePageChange = (newPage: number) => {
    searchTransactions(newPage);
  };

  const openTransactionDrawer = (transaction: ExtractedTransactionPublic) => {
    setSelectedTransaction(transaction);
    setShowDrawer(true);
  };

  const closeTransactionDrawer = () => {
    setShowDrawer(false);
    setSelectedTransaction(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
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
      case 'debit': return 'bg-red-100 text-red-800';
      case 'credit': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'bg-gray-100 text-gray-800';
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <>
      <Head>
        <title>Finance Buddy - Transaction Management</title>
        <meta name="description" content="Review and manage extracted financial transactions" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Transaction Management</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Review and manage extracted financial transactions from emails
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {pagination.total} total transactions
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                <input
                  type="date"
                  value={filters.date_from || ''}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                <input
                  type="date"
                  value={filters.date_to || ''}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                <select
                  value={filters.direction || ''}
                  onChange={(e) => handleFilterChange('direction', e.target.value)}
                  className="input-field"
                >
                  <option value="">All Directions</option>
                  <option value="debit">Debit</option>
                  <option value="credit">Credit</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Confidence</label>
                <select
                  value={filters.min_confidence || ''}
                  onChange={(e) => handleFilterChange('min_confidence', parseFloat(e.target.value))}
                  className="input-field"
                >
                  <option value="">Any Confidence</option>
                  <option value="0.8">High (≥80%)</option>
                  <option value="0.6">Medium (≥60%)</option>
                  <option value="0.4">Low (≥40%)</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  placeholder="e.g., food, transport"
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Merchant</label>
                <input
                  type="text"
                  value={filters.merchant || ''}
                  onChange={(e) => handleFilterChange('merchant', e.target.value)}
                  placeholder="Search merchant name"
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google User ID</label>
                <input
                  type="text"
                  value={filters.google_user_id || ''}
                  onChange={(e) => handleFilterChange('google_user_id', e.target.value)}
                  placeholder="Filter by account"
                  className="input-field"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={filters.max_amount || ''}
                  onChange={(e) => handleFilterChange('max_amount', parseFloat(e.target.value))}
                  placeholder="1000.00"
                  className="input-field"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
              
              <button
                onClick={() => {
                  setFilters({});
                  searchTransactions(1);
                }}
                className="btn-secondary"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Transaction Grid */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Transactions</h2>
            </div>
            
            {loading ? (
              <div className="px-6 py-8 text-center">
                <div className="text-gray-500">Loading transactions...</div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No extracted transactions match your current filters. This is normal for L1 implementation as transaction extraction is planned for L2+.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
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
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(transaction.txn_time)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {formatAmount(transaction.amount, transaction.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDirectionColor(transaction.direction)}`}>
                              {transaction.direction || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="truncate max-w-xs" title={transaction.merchant_name || 'N/A'}>
                              {transaction.merchant_name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.category || 'Uncategorized'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConfidenceColor(transaction.confidence)}`}>
                              {transaction.confidence ? `${Math.round(transaction.confidence * 100)}%` : 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => openTransactionDrawer(transaction)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              View
                            </button>
                            <button className="text-gray-600 hover:text-gray-900 mr-3">
                              Edit
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              Approve
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                    {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrev}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                    >
                      Previous
                    </button>
                    
                    <span className="px-3 py-1 text-sm">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNext}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Transaction Detail Drawer */}
        {showDrawer && selectedTransaction && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={closeTransactionDrawer}></div>
            <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl">
              <div className="flex flex-col h-full">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Transaction Details</h2>
                  <button
                    onClick={closeTransactionDrawer}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Transaction Information</h3>
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Transaction ID</dt>
                          <dd className="text-sm text-gray-900 font-mono">{selectedTransaction.id}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Email Row ID</dt>
                          <dd className="text-sm text-gray-900 font-mono">{selectedTransaction.email_row_id}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Transaction Time</dt>
                          <dd className="text-sm text-gray-900">{formatDate(selectedTransaction.txn_time)}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Amount</dt>
                          <dd className="text-sm text-gray-900 font-semibold">
                            {formatAmount(selectedTransaction.amount, selectedTransaction.currency)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Direction</dt>
                          <dd>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDirectionColor(selectedTransaction.direction)}`}>
                              {selectedTransaction.direction || 'Unknown'}
                            </span>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Confidence</dt>
                          <dd>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConfidenceColor(selectedTransaction.confidence)}`}>
                              {selectedTransaction.confidence ? `${Math.round(selectedTransaction.confidence * 100)}%` : 'N/A'}
                            </span>
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Merchant Information</h3>
                      <dl className="space-y-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Merchant Name</dt>
                          <dd className="text-sm text-gray-900">{selectedTransaction.merchant_name || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Normalized Merchant</dt>
                          <dd className="text-sm text-gray-900">{selectedTransaction.merchant_normalized || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Category</dt>
                          <dd className="text-sm text-gray-900">{selectedTransaction.category || 'Uncategorized'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Location</dt>
                          <dd className="text-sm text-gray-900">{selectedTransaction.location || 'N/A'}</dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Additional Details</h3>
                      <dl className="space-y-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Account Hint</dt>
                          <dd className="text-sm text-gray-900">{selectedTransaction.account_hint || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Reference ID</dt>
                          <dd className="text-sm text-gray-900 font-mono">{selectedTransaction.reference_id || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Extraction Version</dt>
                          <dd className="text-sm text-gray-900">{selectedTransaction.extraction_version || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Google User ID</dt>
                          <dd className="text-sm text-gray-900 font-mono">{selectedTransaction.google_user_id}</dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Timestamps</h3>
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Created At</dt>
                          <dd className="text-sm text-gray-900">{formatDate(selectedTransaction.created_at)}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Updated At</dt>
                          <dd className="text-sm text-gray-900">{formatDate(selectedTransaction.updated_at)}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
                  <button className="btn-primary">Edit Transaction</button>
                  <button className="btn-secondary">Re-Extract</button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    Approve
                  </button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TransactionsPage;
