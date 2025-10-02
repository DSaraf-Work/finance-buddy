import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { EmailPublic, EmailSearchRequest, PaginatedResponse, EmailStatus } from '@finance-buddy/shared';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface EmailFilters {
  date_from?: string;
  date_to?: string;
  email_address?: string;
  sender?: string;
  status?: EmailStatus;
  q?: string;
}

const EmailsPage: NextPage = () => {
  const [emails, setEmails] = useState<EmailPublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState<EmailFilters>({
    date_from: '',
    date_to: '',
    email_address: '',
    sender: '',
    status: undefined,
    q: '',
  });
  const [selectedEmail, setSelectedEmail] = useState<EmailPublic | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);

  const searchEmails = async (page: number = 1) => {
    setLoading(true);
    try {
      const searchRequest: EmailSearchRequest = {
        ...filters,
        page,
        pageSize: pagination.pageSize,
        sort: 'asc',
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

  const handleSearch = () => {
    searchEmails(1);
  };

  const handlePageChange = (newPage: number) => {
    searchEmails(newPage);
  };

  const openEmailDrawer = (email: EmailPublic) => {
    setSelectedEmail(email);
    setShowDrawer(true);
  };

  const closeEmailDrawer = () => {
    setShowDrawer(false);
    setSelectedEmail(null);
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
      <Head>
        <title>Finance Buddy - Email Management</title>
        <meta name="description" content="Manage and review Gmail emails" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Email Management</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Review and manage Gmail emails from connected accounts
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {pagination.total} total emails
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                <input
                  type="email"
                  value={filters.email_address || ''}
                  onChange={(e) => handleFilterChange('email_address', e.target.value)}
                  placeholder="user@gmail.com"
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
                  <option value="">All Statuses</option>
                  <option value="Fetched">Fetched</option>
                  <option value="Processed">Processed</option>
                  <option value="Failed">Failed</option>
                  <option value="Invalid">Invalid</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sender</label>
                <input
                  type="text"
                  value={filters.sender || ''}
                  onChange={(e) => handleFilterChange('sender', e.target.value)}
                  placeholder="sender@example.com"
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Query</label>
                <input
                  type="text"
                  value={filters.q || ''}
                  onChange={(e) => handleFilterChange('q', e.target.value)}
                  placeholder="Search in subject and snippet..."
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
                  searchEmails(1);
                }}
                className="btn-secondary"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Email Grid */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Emails</h2>
            </div>
            
            {loading ? (
              <div className="px-6 py-8 text-center">
                <div className="text-gray-500">Loading emails...</div>
              </div>
            ) : emails.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="text-gray-500">No emails found. Try adjusting your filters.</div>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(email.internal_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="truncate max-w-xs" title={email.from_address || 'N/A'}>
                              {email.from_address || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="truncate max-w-md" title={email.subject || 'No Subject'}>
                              {email.subject || 'No Subject'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(email.status)}`}>
                              {email.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="truncate max-w-xs" title={email.email_address}>
                              {email.email_address}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => openEmailDrawer(email)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              View
                            </button>
                            <button className="text-gray-600 hover:text-gray-900 mr-3">
                              Re-Extract
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              Mark Invalid
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

        {/* Email Detail Drawer */}
        {showDrawer && selectedEmail && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={closeEmailDrawer}></div>
            <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl">
              <div className="flex flex-col h-full">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Email Details</h2>
                  <button
                    onClick={closeEmailDrawer}
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
                      </dl>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Email Headers</h3>
                      <dl className="space-y-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">From</dt>
                          <dd className="text-sm text-gray-900">{selectedEmail.from_address || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">To</dt>
                          <dd className="text-sm text-gray-900">
                            {selectedEmail.to_addresses?.join(', ') || 'N/A'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Subject</dt>
                          <dd className="text-sm text-gray-900">{selectedEmail.subject || 'No Subject'}</dd>
                        </div>
                      </dl>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Snippet</h3>
                      <div className="bg-gray-50 rounded p-3 text-sm text-gray-700">
                        {selectedEmail.snippet || 'No snippet available'}
                      </div>
                    </div>
                    
                    {selectedEmail.error_reason && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Error Reason</h3>
                        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                          {selectedEmail.error_reason}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Timestamps</h3>
                      <dl className="space-y-2">
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
                
                <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
                  <button className="btn-primary">Re-Extract</button>
                  <button className="btn-secondary">Set Fetched</button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                    Mark Invalid
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default EmailsPage;
