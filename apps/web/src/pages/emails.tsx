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
  db_only?: boolean;
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
  // Helper function to format date as YYYY-MM-DD
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Calculate default dates
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  const [filters, setFilters] = useState<EmailFilters>({
    date_from: formatDateForInput(sevenDaysAgo),
    date_to: formatDateForInput(today),
    email_address: '',
    sender: '',
    status: undefined,
    q: '',
    db_only: true, // Default to database-only search
  });
  const [selectedEmail, setSelectedEmail] = useState<EmailPublic | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalEmail, setStatusModalEmail] = useState<EmailPublic | null>(null);
  const [newStatus, setNewStatus] = useState<'REJECT' | 'UNREJECT'>('REJECT');
  const [statusRemarks, setStatusRemarks] = useState('');

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

  const openEmailDrawer = (email: EmailPublic) => {
    setSelectedEmail(email);
    setShowDrawer(true);
  };

  const closeEmailDrawer = () => {
    setShowDrawer(false);
    setSelectedEmail(null);
  };

  const handleProcessEmail = async (email: EmailPublic) => {
    try {
      const response = await fetch(`/api/emails/${email.id}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refresh the emails list
        searchEmails(pagination.page);
        alert('Email processed successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to process email: ${error.error}`);
      }
    } catch (error) {
      console.error('Process email error:', error);
      alert('Failed to process email');
    }
  };

  const handleRejectEmail = async (email: EmailPublic) => {
    try {
      const response = await fetch(`/api/emails/${email.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          reason: 'Non-transactional email',
          remarks: 'Manually rejected by user',
        }),
      });

      if (response.ok) {
        // Refresh the emails list
        searchEmails(pagination.page);
        alert('Email rejected successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to reject email: ${error.error}`);
      }
    } catch (error) {
      console.error('Reject email error:', error);
      alert('Failed to reject email');
    }
  };

  const openStatusModal = (email: EmailPublic) => {
    setStatusModalEmail(email);
    // If email is already rejected, default to unreject, otherwise reject
    // For now, assume all emails can be rejected (we'll fix this after the build)
    setNewStatus('REJECT');
    setStatusRemarks('');
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setStatusModalEmail(null);
    setNewStatus('REJECT');
    setStatusRemarks('');
  };

  const handleStatusUpdate = async () => {
    if (!statusModalEmail) return;

    try {
      // For the new derived status system, we only support reject/unreject actions
      if (newStatus === 'REJECT') {
        const response = await fetch(`/api/emails/${statusModalEmail.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'reject',
            reason: statusRemarks || 'Manual rejection',
            remarks: statusRemarks,
          }),
        });

        if (response.ok) {
          searchEmails(pagination.page);
          closeStatusModal();
          alert('Email rejected successfully!');
        } else {
          const error = await response.json();
          alert(`Failed to reject email: ${error.error}`);
        }
      } else if (newStatus === 'UNREJECT') {
        const response = await fetch(`/api/emails/${statusModalEmail.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'unreject',
            reason: statusRemarks || 'Manual unreject',
            remarks: statusRemarks,
          }),
        });

        if (response.ok) {
          searchEmails(pagination.page);
          closeStatusModal();
          alert('Email unrejected successfully!');
        } else {
          const error = await response.json();
          alert(`Failed to unreject email: ${error.error}`);
        }
      } else {
        // For other status changes, we need to process the email
        alert('Status updates are now automatic. Use the Process button to process emails with AI.');
        closeStatusModal();
      }
    } catch (error) {
      console.error('Status update error:', error);
      alert('Failed to update status');
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: EmailStatus | string) => {
    switch (status) {
      case 'Fetched': return 'bg-blue-100 text-blue-800';
      case 'Processed': return 'bg-green-100 text-green-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      case 'Invalid': return 'bg-gray-100 text-gray-800';
      case 'NON_TRANSACTIONAL': return 'bg-yellow-100 text-yellow-800';
      case 'REJECT': return 'bg-red-100 text-red-800';
      // Derived statuses from backend
      case 'FETCHED': return 'bg-blue-100 text-blue-800';
      case 'PROCESSED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
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
                  <option value="REJECT">Rejected</option>
                  <option value="Fetched">Fetched (Legacy)</option>
                  <option value="Processed">Processed (Legacy)</option>
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

            {/* Pagination Controls and Database Toggle */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                  placeholder="10"
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
                  // Reset to default values including default dates
                  const today = new Date();
                  const sevenDaysAgo = new Date();
                  sevenDaysAgo.setDate(today.getDate() - 7);

                  setFilters({
                    date_from: formatDateForInput(sevenDaysAgo),
                    date_to: formatDateForInput(today),
                    email_address: '',
                    sender: '',
                    status: undefined,
                    q: '',
                    db_only: true,
                  });
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
                          Remarks
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {emails.map((email) => (
                        <tr key={email.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDateTime(email.internal_date)}
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
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="truncate max-w-xs" title={email.remarks || 'No remarks'}>
                              {email.remarks || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium sticky right-0 bg-white">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => openEmailDrawer(email)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Details"
                              >
                                👁️
                              </button>

                              {(email.status === 'Fetched') && (
                                <button
                                  onClick={() => handleProcessEmail(email)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Process Email with AI"
                                >
                                  ⚙️
                                </button>
                              )}

                              {(email.status !== 'REJECT') && (
                                <button
                                  onClick={() => handleRejectEmail(email)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Reject Email"
                                >
                                  ❌
                                </button>
                              )}

                              {(email.status === 'REJECT') && (
                                <button
                                  onClick={() => openStatusModal(email)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Unreject Email"
                                >
                                  🔄
                                </button>
                              )}
                            </div>
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
                          <dd className="text-sm text-gray-900">{formatDateTime(selectedEmail.internal_date)}</dd>
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
                          <dd className="text-sm text-gray-900">{formatDateTime(selectedEmail.created_at)}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Updated At</dt>
                          <dd className="text-sm text-gray-900">{formatDateTime(selectedEmail.updated_at)}</dd>
                        </div>
                        {selectedEmail.processed_at && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Processed At</dt>
                            <dd className="text-sm text-gray-900">{formatDateTime(selectedEmail.processed_at)}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
                  {selectedEmail && (selectedEmail.status === 'Fetched') && (
                    <button
                      onClick={() => {
                        handleProcessEmail(selectedEmail);
                        closeEmailDrawer();
                      }}
                      className="btn-primary"
                    >
                      Process with AI
                    </button>
                  )}
                  {selectedEmail && (selectedEmail.status !== 'REJECT') && (
                    <button
                      onClick={() => {
                        handleRejectEmail(selectedEmail);
                        closeEmailDrawer();
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Reject Email
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Update Modal */}
        {showStatusModal && statusModalEmail && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeStatusModal}></div>
              <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    {newStatus === 'UNREJECT' ? 'Unreject Email' : 'Reject Email'}
                  </h3>
                </div>

                <div className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Subject
                    </label>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {statusModalEmail.subject || 'No Subject'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Action
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as 'REJECT' | 'UNREJECT')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="REJECT">Reject Email</option>
                      <option value="UNREJECT">Unreject Email</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Note: Status is now automatically derived. Use the Process button (⚙️) to process emails with AI.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {newStatus === 'UNREJECT' ? 'Unreject Reason' : 'Rejection Reason'}
                    </label>
                    <textarea
                      value={statusRemarks}
                      onChange={(e) => setStatusRemarks(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={newStatus === 'UNREJECT' ? 'Enter reason for unrejecting this email...' : 'Enter reason for rejecting this email...'}
                    />
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    onClick={closeStatusModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStatusUpdate}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                      newStatus === 'UNREJECT'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {newStatus === 'UNREJECT' ? 'Unreject Email' : 'Reject Email'}
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
