import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { EmailPublic, EmailSearchRequest, PaginatedResponse, EmailStatus } from '@finance-buddy/shared';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';

interface EmailFilters {
  date_from?: string;
  date_to?: string;
  email_address?: string;
  sender?: string;
  status?: EmailStatus;
  q?: string;
  db_only?: boolean;
}

const EmailWorkbenchPage: NextPage = () => {
  const [emails, setEmails] = useState<EmailPublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  // Helper function to format date as YYYY-MM-DD
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Calculate default dates
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  const [filters, setFilters] = useState<EmailFilters>({
    date_from: formatDate(sevenDaysAgo),
    date_to: formatDate(today),
    email_address: '',
    sender: '',
    status: undefined,
    q: '',
    db_only: true, // Default to database-only search
  });
  const [selectedEmail, setSelectedEmail] = useState<EmailPublic | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);

  const searchEmails = async (page = 1) => {
    setLoading(true);
    try {
      const searchRequest: EmailSearchRequest = {
        ...filters,
        page,
        pageSize: pagination.pageSize,
        sort: 'desc',
      };

      // Remove empty filters
      Object.keys(searchRequest).forEach(key => {
        if (searchRequest[key as keyof EmailSearchRequest] === '' || 
            searchRequest[key as keyof EmailSearchRequest] === undefined) {
          delete searchRequest[key as keyof EmailSearchRequest];
        }
      });

      const response = await fetch('/api/emails/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchRequest),
      });

      if (response.ok) {
        const data: PaginatedResponse<EmailPublic> = await response.json();
        setEmails(data.items);
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
    searchEmails();
  }, []);

  const handleFilterChange = (key: keyof EmailFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleBooleanFilterChange = (key: keyof EmailFilters, value: boolean) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({
      ...prev,
      pageSize: newPageSize,
      page: 1, // Reset to first page when changing page size
    }));
  };

  // Use useEffect to trigger search when page size changes
  useEffect(() => {
    // Only trigger search if page size has been changed from initial load
    if (emails.length > 0) { // Only if we have loaded emails before
      searchEmails(1); // Always go to page 1 when page size changes
    }
  }, [pagination.pageSize]);

  const handleSearch = () => {
    searchEmails(1);
  };

  const handlePageChange = (newPage: number) => {
    searchEmails(newPage);
  };

  const handleSelectEmail = (emailId: string) => {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(emailId)) {
      newSelected.delete(emailId);
    } else {
      newSelected.add(emailId);
    }
    setSelectedEmails(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedEmails.size === emails.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(emails.map(email => email.id)));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedEmails.size === 0) return;
    
    console.log(`Performing ${action} on ${selectedEmails.size} emails`);
    // TODO: Implement bulk actions API
    alert(`${action} action would be performed on ${selectedEmails.size} emails`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: EmailStatus) => {
    switch (status) {
      case 'Fetched': return 'bg-blue-100 text-blue-800';
      case 'Processed': return 'bg-green-100 text-green-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      case 'Invalid': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ProtectedRoute>
      <Layout 
        title="Email Workbench - Finance Buddy"
        description="Advanced email management and review workbench"
      >
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Email Workbench</h1>
              <p className="mt-1 text-sm text-gray-500">
                Advanced email management with bulk operations and detailed review
              </p>
            </div>

            {/* Filters */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Filters</h3>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <input
                      type="date"
                      value={filters.date_from || ''}
                      onChange={(e) => handleFilterChange('date_from', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                      type="date"
                      value={filters.date_to || ''}
                      onChange={(e) => handleFilterChange('date_to', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                    <input
                      type="email"
                      value={filters.email_address || ''}
                      onChange={(e) => handleFilterChange('email_address', e.target.value)}
                      placeholder="Gmail account"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sender</label>
                    <input
                      type="text"
                      value={filters.sender || ''}
                      onChange={(e) => handleFilterChange('sender', e.target.value)}
                      placeholder="From address"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={filters.status || ''}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="input-field"
                    >
                      <option value="">All</option>
                      <option value="Fetched">Fetched</option>
                      <option value="Processed">Processed</option>
                      <option value="Failed">Failed</option>
                      <option value="Invalid">Invalid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <input
                      type="text"
                      value={filters.q || ''}
                      onChange={(e) => handleFilterChange('q', e.target.value)}
                      placeholder="Subject, content..."
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Pagination Controls and Database Toggle */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Page Number</label>
                    <select
                      value={pagination.page}
                      onChange={(e) => handlePageChange(parseInt(e.target.value))}
                      className="input-field"
                    >
                      {Array.from({ length: Math.min(pagination.totalPages, 50) }, (_, i) => i + 1).map(pageNum => (
                        <option key={pageNum} value={pageNum}>
                          Page {pageNum}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Page Size</label>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Source</label>
                    <div className="flex items-center space-x-3 mt-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.db_only || false}
                          onChange={(e) => handleBooleanFilterChange('db_only', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Database Only</span>
                      </label>
                      <span className="text-xs text-gray-500">
                        {filters.db_only ? 'Searching local database only' : 'Will fetch from Gmail if needed'}
                      </span>
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
                  <div className="text-sm text-gray-500">
                    {pagination.total} total emails
                  </div>
                </div>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedEmails.size > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">
                    {selectedEmails.size} email(s) selected
                  </span>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleBulkAction('re-extract')}
                      className="btn-secondary text-sm"
                    >
                      Re-Extract
                    </button>
                    <button
                      onClick={() => handleBulkAction('mark-invalid')}
                      className="btn-secondary text-sm"
                    >
                      Mark Invalid
                    </button>
                    <button
                      onClick={() => handleBulkAction('set-fetched')}
                      className="btn-secondary text-sm"
                    >
                      Set Fetched
                    </button>
                    <button
                      onClick={() => handleBulkAction('redact-body')}
                      className="btn-secondary text-sm"
                    >
                      Redact Body
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Email Grid */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={emails.length > 0 && selectedEmails.size === emails.length}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        From
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Account
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {emails.map((email) => (
                      <tr key={email.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedEmails.has(email.id)}
                            onChange={() => handleSelectEmail(email.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(email.internal_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {email.from_address || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {email.subject || 'No Subject'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(email.status)}`}>
                            {email.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {email.email_address}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedEmail(email);
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
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
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

        {/* Email Details Drawer */}
        {showDrawer && selectedEmail && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowDrawer(false)} />
            <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Email Details</h2>
                  <button
                    onClick={() => setShowDrawer(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Basic Information</h3>
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Message ID</dt>
                          <dd className="text-sm text-gray-900 font-mono">{selectedEmail.message_id}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Thread ID</dt>
                          <dd className="text-sm text-gray-900 font-mono">{selectedEmail.thread_id}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Internal Date</dt>
                          <dd className="text-sm text-gray-900">{formatDate(selectedEmail.internal_date)}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Status</dt>
                          <dd>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedEmail.status)}`}>
                              {selectedEmail.status}
                            </span>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">From</dt>
                          <dd className="text-sm text-gray-900">{selectedEmail.from_address || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Account</dt>
                          <dd className="text-sm text-gray-900">{selectedEmail.email_address}</dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Subject</h3>
                      <p className="text-sm text-gray-900">{selectedEmail.subject || 'No Subject'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Snippet</h3>
                      <p className="text-sm text-gray-900">{selectedEmail.snippet || 'No snippet available'}</p>
                    </div>

                    {selectedEmail.error_reason && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Error Reason</h3>
                        <p className="text-sm text-red-600">{selectedEmail.error_reason}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Timestamps</h3>
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Created At</dt>
                          <dd className="text-sm text-gray-900">{formatDate(selectedEmail.created_at)}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Updated At</dt>
                          <dd className="text-sm text-gray-900">{formatDate(selectedEmail.updated_at)}</dd>
                        </div>
                        {selectedEmail.processed_at && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Processed At</dt>
                            <dd className="text-sm text-gray-900">{formatDate(selectedEmail.processed_at)}</dd>
                          </div>
                        )}
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

export default EmailWorkbenchPage;
