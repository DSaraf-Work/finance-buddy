import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { EmailPublic, EmailSearchRequest, PaginatedResponse, EmailStatus, GmailConnectionPublic } from '@/types';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import LoadingScreen from '@/components/LoadingScreen';

interface EmailFilters {
  date_from?: string;
  date_to?: string;
  email_addresses?: string[]; // Changed to array for multi-select
  sender?: string;
  status?: EmailStatus;
  q?: string;
  db_only?: boolean;
}

const EmailsPage: NextPage = () => {
  const [emails, setEmails] = useState<EmailPublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<GmailConnectionPublic[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [bankAccountTypes, setBankAccountTypes] = useState<string[]>([]);
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

  // Helper functions to get default dates (entire current month)
  const getDefaultStartDate = () => {
    const date = new Date();
    // Set to first day of current month
    date.setDate(1);
    return formatDateForInput(date);
  };

  const getDefaultEndDate = () => {
    const date = new Date();
    // Set to last day of current month
    date.setMonth(date.getMonth() + 1);
    date.setDate(0);
    return formatDateForInput(date);
  };

  const [filters, setFilters] = useState<EmailFilters>({
    date_from: getDefaultStartDate(),
    date_to: getDefaultEndDate(),
    email_addresses: [], // Will be populated with available connections
    sender: '', // Will be populated with user's bank account types
    status: undefined,
    q: '',
    db_only: false, // Default to database-only search
  });
  const [selectedEmail, setSelectedEmail] = useState<EmailPublic | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalEmail, setStatusModalEmail] = useState<EmailPublic | null>(null);
  const [newStatus, setNewStatus] = useState<'REJECT' | 'UNREJECT'>('REJECT');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [processingEmails, setProcessingEmails] = useState<Set<string>>(new Set());
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // Fetch bank account types
  const fetchBankAccountTypes = async () => {
    try {
      const response = await fetch('/api/admin/config/bank-account-types');
      if (response.ok) {
        const data = await response.json();
        const accountTypes = data.accountTypes || [];
        setBankAccountTypes(accountTypes);

        // Set default sender filter to user's bank account types
        if (accountTypes.length > 0) {
          setFilters(prev => ({
            ...prev,
            sender: accountTypes.join(',')
          }));
        }
      } else {
        console.error('Failed to fetch bank account types');
      }
    } catch (error) {
      console.error('Error fetching bank account types:', error);
    }
  };

  // Fetch Gmail connections
  const fetchConnections = async () => {
    setLoadingConnections(true);
    try {
      const response = await fetch('/api/gmail/connections');
      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections);

        // Set default email addresses to all available connections
        if (data.connections.length > 0) {
          const allEmails = data.connections.map((conn: GmailConnectionPublic) => conn.email_address);
          setFilters(prev => ({
            ...prev,
            email_addresses: allEmails // Default to all connections
          }));
        }
      } else {
        console.error('Failed to fetch connections');
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoadingConnections(false);
    }
  };

  // Load connections and bank account types on component mount
  useEffect(() => {
    fetchConnections();
    fetchBankAccountTypes();
  }, []);

  const searchEmails = async (page: number = 1, customFilters?: typeof filters, ignoreDefaults: boolean = false) => {
    setLoading(true);
    try {
      // Use custom filters if provided, otherwise use current filters
      const activeFilters = customFilters || filters;

      // If multiple email addresses are selected, we need to search each one sequentially
      const emailAddresses = activeFilters.email_addresses || [];

      if (emailAddresses.length === 0) {
        console.warn('No email addresses selected for search');
        setEmails([]);
        setPagination(prev => ({ ...prev, total: 0, totalPages: 0, hasNext: false, hasPrev: false }));
        return;
      }

      let allEmails: EmailPublic[] = [];
      let totalCount = 0;

      // Search each email address sequentially
      for (const emailAddress of emailAddresses) {
        // Handle multiple senders by splitting comma-separated values
        const senders = activeFilters.sender ? activeFilters.sender.split(',').map(s => s.trim()) : [];

        // If multiple senders, search each sender separately for this email address
        if (senders.length > 1) {
          for (const sender of senders) {
            const searchRequest: EmailSearchRequest & { ignore_defaults?: boolean } = {
              ...activeFilters,
              email_address: emailAddress, // Use single email address for each request
              sender: sender, // Use single sender for each request
              page,
              pageSize: pagination.pageSize,
              sort: 'desc', // Default to newest-to-oldest
              ignore_defaults: ignoreDefaults, // Add ignore_defaults parameter
            };

            // Remove empty filters and email_addresses array (use email_address instead)
            delete (searchRequest as any).email_addresses;
            Object.keys(searchRequest).forEach(key => {
              if (key !== 'ignore_defaults' &&
                  (searchRequest[key as keyof (EmailSearchRequest & { ignore_defaults?: boolean })] === '' ||
                   searchRequest[key as keyof (EmailSearchRequest & { ignore_defaults?: boolean })] === undefined)) {
                delete searchRequest[key as keyof (EmailSearchRequest & { ignore_defaults?: boolean })];
              }
            });

            console.log(`🔍 Searching emails for ${emailAddress} from ${sender}:`, searchRequest);

            const response = await fetch('/api/emails/search', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(searchRequest),
            });

            if (response.ok) {
              const data: PaginatedResponse<EmailPublic> = await response.json();
              allEmails.push(...data.items);
              totalCount += data.total;
              console.log(`✅ Found ${data.items.length} emails for ${emailAddress} from ${sender} (total: ${data.total})`);
            } else {
              console.error(`❌ Search failed for ${emailAddress} from ${sender}:`, response.statusText);
            }
          }
        } else {
          // Single sender or no sender filter
          const searchRequest: EmailSearchRequest & { ignore_defaults?: boolean } = {
            ...activeFilters,
            email_address: emailAddress, // Use single email address for each request
            page,
            pageSize: pagination.pageSize,
            sort: 'desc', // Default to newest-to-oldest
            ignore_defaults: ignoreDefaults, // Add ignore_defaults parameter
          };

          // Remove empty filters and email_addresses array (use email_address instead)
          delete (searchRequest as any).email_addresses;
          Object.keys(searchRequest).forEach(key => {
            if (key !== 'ignore_defaults' &&
                (searchRequest[key as keyof (EmailSearchRequest & { ignore_defaults?: boolean })] === '' ||
                 searchRequest[key as keyof (EmailSearchRequest & { ignore_defaults?: boolean })] === undefined)) {
              delete searchRequest[key as keyof (EmailSearchRequest & { ignore_defaults?: boolean })];
            }
          });

          console.log(`🔍 Searching emails for ${emailAddress}:`, searchRequest);

          const response = await fetch('/api/emails/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(searchRequest),
          });

          if (response.ok) {
            const data: PaginatedResponse<EmailPublic> = await response.json();
            allEmails.push(...data.items);
            totalCount += data.total;
            console.log(`✅ Found ${data.items.length} emails for ${emailAddress} (total: ${data.total})`);
          } else if (response.status === 401) {
            // Handle re-authentication required
            const errorData = await response.json();
            if (errorData.requiresReauth) {
              alert(`⚠️ ${errorData.message}\n\nPlease go to Settings to reconnect your Gmail account.`);
              setLoading(false);
              return;
            }
            console.error(`❌ Search failed for ${emailAddress}:`, response.statusText);
          } else {
            console.error(`❌ Search failed for ${emailAddress}:`, response.statusText);
          }
        }
      }

      // Sort all emails by internal_date (newest first)
      allEmails.sort((a, b) => {
        const dateA = new Date(a.internal_date || 0).getTime();
        const dateB = new Date(b.internal_date || 0).getTime();
        return dateB - dateA; // Descending order (newest first)
      });

      // Apply pagination to the combined results
      const startIndex = (page - 1) * pagination.pageSize;
      const endIndex = startIndex + pagination.pageSize;
      const paginatedEmails = allEmails.slice(startIndex, endIndex);

      setEmails(paginatedEmails);
      setPagination({
        page,
        pageSize: pagination.pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pagination.pageSize),
        hasNext: endIndex < allEmails.length,
        hasPrev: page > 1,
      });

      console.log(`🎯 Final results: ${paginatedEmails.length} emails shown, ${totalCount} total across ${emailAddresses.length} connections`);

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

  const handleEmailAddressChange = (emailAddress: string, isSelected: boolean) => {
    setFilters(prev => {
      const currentAddresses = prev.email_addresses || [];
      if (isSelected) {
        // Add email address if not already present
        if (!currentAddresses.includes(emailAddress)) {
          return { ...prev, email_addresses: [...currentAddresses, emailAddress] };
        }
      } else {
        // Remove email address
        return { ...prev, email_addresses: currentAddresses.filter(addr => addr !== emailAddress) };
      }
      return prev;
    });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({
      ...prev,
      pageSize: newPageSize,
      page: 1, // Reset to first page when changing page size
    }));
    // Don't automatically trigger search - user must click Search button
  };

  const handleSearch = () => {
    searchEmails(1);
  };

  const handlePageChange = (newPage: number) => {
    // Just update the page number, don't trigger search
    setPagination(prev => ({
      ...prev,
      page: newPage,
    }));
    // Don't automatically trigger search - user must click Search button
  };

  const openEmailDrawer = (email: EmailPublic) => {
    setSelectedEmail(email);
    setShowDrawer(true);
  };

  const closeEmailDrawer = () => {
    setShowDrawer(false);
    setSelectedEmail(null);
  };

  const handleProcessEmail = async (email: EmailPublic, silent: boolean = false) => {
    // Add email to processing set
    setProcessingEmails(prev => new Set(prev).add(email.id));

    try {
      const response = await fetch(`/api/emails/${email.id}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Silently update the email status in the current list
        setEmails(prevEmails =>
          prevEmails.map(e =>
            e.id === email.id
              ? { ...e, status: 'Processed' as any }
              : e
          )
        );

        // Only show success alert if not silent
        if (!silent) {
          // Show success message without refreshing the entire list
          console.log(`✅ Email processed successfully: ${email.id}`);
        }
      } else {
        const error = await response.json();
        // Always show error alerts
        alert(`Failed to process email: ${error.error}`);
      }
    } catch (error) {
      console.error('Process email error:', error);
      // Always show error alerts
      alert('Failed to process email');
    } finally {
      // Remove email from processing set
      setProcessingEmails(prev => {
        const newSet = new Set(prev);
        newSet.delete(email.id);
        return newSet;
      });
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
      case 'Fetched': return 'bg-[var(--color-info)]/20 text-[var(--color-info)]';
      case 'Processed': return 'bg-[var(--color-income)]/20 text-[var(--color-income)]';
      case 'Failed': return 'bg-[var(--color-expense)]/20 text-[var(--color-expense)]';
      case 'Invalid': return 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]';
      case 'NON_TRANSACTIONAL': return 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]';
      case 'REJECT': return 'bg-[var(--color-expense)]/20 text-[var(--color-expense)]';
      // Derived statuses from backend
      case 'FETCHED': return 'bg-[var(--color-info)]/20 text-[var(--color-info)]';
      case 'PROCESSED': return 'bg-[var(--color-income)]/20 text-[var(--color-income)]';
      case 'REJECTED': return 'bg-[var(--color-expense)]/20 text-[var(--color-expense)]';
      default: return 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]';
    }
  };

  // Get All Fetched - Search and display FETCHED emails only (no processing)
  const handleGetAllFetched = async () => {
    try {
      const emailAddresses = filters.email_addresses || [];

      if (emailAddresses.length === 0) {
        alert('Please select at least one account to search for FETCHED emails.');
        return;
      }

      console.log(`🔍 Setting filters to show FETCHED emails across ${emailAddresses.length} account(s)`);

      // Update filters to show FETCHED emails and clear sender restrictions
      const updatedFilters: EmailFilters = {
        ...filters,
        status: 'Fetched' as EmailStatus, // Set status filter to Fetched
        sender: '', // Clear sender filter to bypass default restrictions
        q: '', // Clear search query
        date_from: '', // Clear date filters to show all FETCHED emails
        date_to: '',
      };

      // Update the filters state
      setFilters(updatedFilters);

      // Reset to page 1 when applying new filters
      const newPagination = {
        ...pagination,
        page: 1
      };
      setPagination(newPagination);

      // Trigger a search with the updated filters and ignore defaults
      // This will use the existing searchEmails function which handles multiple accounts properly
      console.log(`🔍 Searching for FETCHED emails with updated filters`);
      await searchEmails(1, updatedFilters, true); // Search page 1 with new filters and ignore defaults

    } catch (error) {
      console.error('Get All Fetched error:', error);
      alert('Failed to search for FETCHED emails');
    }
  };

  const handleBulkProcess = async () => {
    setBatchProcessing(true);
    setBatchProgress({ current: 0, total: 0 });

    try {
      // Get all FETCHED emails from current table view (already aggregated from all selected connections)
      const fetchedEmails = emails.filter(email =>
        email.status === 'Fetched' || (email.status as string) === 'FETCHED'
      );

      if (fetchedEmails.length === 0) {
        alert('No FETCHED emails in current view to process.');
        return;
      }

      const selectedAccounts = filters.email_addresses?.length || 0;
      console.log(`🔄 Bulk processing ${fetchedEmails.length} emails from current view (across ${selectedAccounts} connections)`);
      setBatchProgress({ current: 0, total: fetchedEmails.length });

      // Process each email sequentially
      for (let i = 0; i < fetchedEmails.length; i++) {
        setBatchProgress({ current: i + 1, total: fetchedEmails.length });
        await handleProcessEmail(fetchedEmails[i], true); // Silent processing
      }

      // Refresh the email list
      searchEmails(pagination.page);
      alert(`Successfully processed ${fetchedEmails.length} emails from ${selectedAccounts} connections!`);
    } catch (error) {
      console.error('Bulk processing error:', error);
      alert('Failed to process emails in bulk');
    } finally {
      setBatchProcessing(false);
      setBatchProgress({ current: 0, total: 0 });
    }
  };

  return (
    <ProtectedRoute>
      <Layout
        title="Finance Buddy - Email Management"
        description="Manage and review Gmail emails"
      >
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#6b4ce6] to-[#8b5cf6] rounded-[var(--radius-lg)] flex items-center justify-center shadow-[0_0_20px_rgba(107,76,230,0.3)]">
                      <span className="text-xl sm:text-2xl">📧</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)]">Email Management</h1>
                  </div>
                  <p className="mt-1 text-sm sm:text-base text-[var(--color-text-secondary)]">
                    Review and manage Gmail emails from connected accounts
                  </p>
                </div>
                <div className="text-sm text-[var(--color-text-muted)]">
                  {pagination.total} total emails
                </div>
              </div>
            </div>
          {/* Filters */}
          <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] border border-[var(--color-border)] p-6 mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--color-accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Date From</label>
                <input
                  type="date"
                  value={filters.date_from || ''}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Date To</label>
                <input
                  type="date"
                  value={filters.date_to || ''}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Accounts <span className="text-red-500">*</span>
                  <span className="text-xs text-[var(--color-text-muted)] ml-1">
                    ({filters.email_addresses?.length || 0} selected)
                  </span>
                </label>
                {loadingConnections ? (
                  <div className="input-field bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]">Loading connections...</div>
                ) : connections.length === 0 ? (
                  <div className="input-field bg-[var(--color-expense)]/10 text-[var(--color-expense)]">No Gmail connections found</div>
                ) : (
                  <div className="relative">
                    <div className="input-field min-h-[2.5rem] max-h-24 overflow-y-auto">
                      {connections.map((connection) => (
                        <label key={connection.id} className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            checked={filters.email_addresses?.includes(connection.email_address) || false}
                            onChange={(e) => handleEmailAddressChange(connection.email_address, e.target.checked)}
                            className="rounded border-[var(--color-border)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                          />
                          <span className="text-sm text-[var(--color-text-secondary)]">{connection.email_address}</span>
                        </label>
                      ))}
                    </div>
                    {filters.email_addresses?.length === 0 && (
                      <div className="text-xs text-red-500 mt-1">Please select at least one account</div>
                    )}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Status</label>
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
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Sender</label>
                <input
                  type="text"
                  value={filters.sender || ''}
                  onChange={(e) => handleFilterChange('sender', e.target.value)}
                  placeholder="sender@example.com"
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Search Query</label>
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
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Page Number</label>
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
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Page Size</label>
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
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Data Source</label>
                <div className="flex items-center space-x-3 mt-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.db_only || false}
                      onChange={(e) => handleBooleanFilterChange('db_only', e.target.checked)}
                      className="h-4 w-4 text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)] border-[var(--color-border)] rounded"
                    />
                    <span className="ml-2 text-sm text-[var(--color-text-secondary)]">Database Only</span>
                  </label>
                  <span className="text-xs text-[var(--color-text-muted)]">
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

                  // Reset to all available connections
                  const allEmails = connections.map(conn => conn.email_address);

                  setFilters({
                    date_from: formatDateForInput(sevenDaysAgo),
                    date_to: formatDateForInput(today),
                    email_addresses: allEmails, // Reset to all connections
                    sender: 'alerts@dcbbank.com,alerts@hdfcbank.net,alerts@yes.bank.in', // Multiple default senders
                    status: undefined,
                    q: '',
                    db_only: false,
                  });
                  searchEmails(1);
                }}
                className="btn-secondary"
              >
                Clear Filters
              </button>

              <button
                onClick={handleGetAllFetched}
                disabled={batchProcessing || loading}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  batchProcessing || loading
                    ? 'bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed'
                    : 'bg-[var(--color-income)] text-[var(--color-text-primary)] hover:bg-[var(--color-income)]'
                }`}
              >
                {batchProcessing && batchProgress.total > 0
                  ? `Processing Batch ${batchProgress.current} of ${batchProgress.total}...`
                  : 'Get All Fetched'
                }
              </button>

              <button
                onClick={handleBulkProcess}
                disabled={batchProcessing || loading}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  batchProcessing || loading
                    ? 'bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed'
                    : 'bg-[var(--color-accent-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent-hover)]'
                }`}
              >
                {batchProcessing && batchProgress.total > 0 && batchProgress.current <= emails.length
                  ? `Processing ${batchProgress.current} of ${batchProgress.total}...`
                  : 'Bulk Process'
                }
              </button>
            </div>
          </div>

          {/* Email Grid */}
          <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-border)]">
              <h2 className="text-lg font-medium text-[var(--color-text-primary)]">Emails</h2>
            </div>
            
            {loading ? (
              <div className="px-6 py-8">
                <LoadingScreen message="Loading emails..." fullScreen={false} size="md" />
              </div>
            ) : emails.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="text-[var(--color-text-muted)]">No emails found. Try adjusting your filters.</div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[var(--color-bg-elevated)]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                          From
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                          Account
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                          Remarks
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider sticky right-0 bg-[var(--color-bg-elevated)]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-[var(--color-bg-card)] divide-y divide-[var(--color-border)]">
                      {emails.map((email) => (
                        <tr key={email.id} className="hover:bg-[var(--color-bg-elevated)]">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">
                            {formatDateTime(email.internal_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">
                            <div className="truncate max-w-xs" title={email.from_address || 'N/A'}>
                              {email.from_address || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--color-text-primary)]">
                            <div className="truncate max-w-md" title={email.subject || 'No Subject'}>
                              {email.subject || 'No Subject'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {(email.status === 'Processed' || (email.status as string) === 'PROCESSED') && email.fb_extracted_transactions && email.fb_extracted_transactions.length > 0 ? (
                              <button
                                onClick={() => {
                                  const txnId = email.fb_extracted_transactions![0].id;
                                  navigator.clipboard.writeText(txnId);
                                  alert(`Transaction ID copied: ${txnId}`);
                                }}
                                className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(email.status)}`}
                                title="Click to copy transaction ID"
                              >
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {email.status}
                              </button>
                            ) : (
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(email.status)}`}>
                                {(email.status === 'Processed' || (email.status as string) === 'PROCESSED') && (
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {email.status}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">
                            <div className="truncate max-w-xs" title={email.email_address}>
                              {email.email_address}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--color-text-primary)]">
                            <div className="truncate max-w-xs" title={email.remarks || 'No remarks'}>
                              {email.remarks || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium sticky right-0 bg-[var(--color-bg-card)]">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => openEmailDrawer(email)}
                                className="text-[var(--color-accent-primary)] hover:text-[var(--color-accent-hover)] transition-colors duration-200"
                                title="View Details"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                </svg>
                              </button>

                              {(email.status === 'Fetched' || (email.status as string) === 'FETCHED') && (
                                <button
                                  onClick={() => handleProcessEmail(email)}
                                  disabled={processingEmails.has(email.id)}
                                  className={`${
                                    processingEmails.has(email.id)
                                      ? 'text-[var(--color-accent-primary)] cursor-not-allowed'
                                      : 'text-green-600 hover:text-green-900'
                                  } transition-colors duration-200`}
                                  title={processingEmails.has(email.id) ? "Processing..." : "Process Email with AI"}
                                >
                                  {processingEmails.has(email.id) ? (
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                  )}
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
                                  className="text-[var(--color-accent-primary)] hover:text-[var(--color-accent-hover)]"
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
                <div className="px-6 py-4 border-t border-[var(--color-border)] flex items-center justify-between">
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                    {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrev}
                      className="px-3 py-1 border border-[var(--color-border)] rounded text-sm disabled:opacity-50 bg-[var(--color-bg-card)] text-[var(--color-text-primary)]"
                    >
                      Previous
                    </button>
                    
                    <span className="px-3 py-1 text-sm">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNext}
                      className="px-3 py-1 border border-[var(--color-border)] rounded text-sm disabled:opacity-50 bg-[var(--color-bg-card)] text-[var(--color-text-primary)]"
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
            <div className="absolute inset-0 bg-[var(--color-bg-app)]/50" onClick={closeEmailDrawer}></div>
            <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-[var(--color-bg-card)] shadow-[var(--shadow-xl)]">
              <div className="flex flex-col h-full">
                <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
                  <h2 className="text-lg font-medium text-[var(--color-text-primary)]">Email Details</h2>
                  <button
                    onClick={closeEmailDrawer}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
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
                      <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Basic Information</h3>
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-[var(--color-text-muted)]">Message ID</dt>
                          <dd className="text-sm text-[var(--color-text-primary)] font-mono">{selectedEmail.message_id}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-[var(--color-text-muted)]">Thread ID</dt>
                          <dd className="text-sm text-[var(--color-text-primary)] font-mono">{selectedEmail.thread_id}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-[var(--color-text-muted)]">Internal Date</dt>
                          <dd className="text-sm text-[var(--color-text-primary)]">{formatDateTime(selectedEmail.internal_date)}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-[var(--color-text-muted)]">Status</dt>
                          <dd>
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedEmail.status)}`}>
                              {(selectedEmail.status === 'Processed' || (selectedEmail.status as string) === 'PROCESSED') && (
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                              {selectedEmail.status}
                            </span>
                          </dd>
                        </div>
                      </dl>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Email Headers</h3>
                      <dl className="space-y-3">
                        <div>
                          <dt className="text-sm font-medium text-[var(--color-text-muted)]">From</dt>
                          <dd className="text-sm text-[var(--color-text-primary)]">{selectedEmail.from_address || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-[var(--color-text-muted)]">To</dt>
                          <dd className="text-sm text-[var(--color-text-primary)]">
                            {selectedEmail.to_addresses?.join(', ') || 'N/A'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-[var(--color-text-muted)]">Subject</dt>
                          <dd className="text-sm text-[var(--color-text-primary)]">{selectedEmail.subject || 'No Subject'}</dd>
                        </div>
                      </dl>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Snippet</h3>
                      <div className="bg-[var(--color-bg-elevated)] rounded p-3 text-sm text-[var(--color-text-secondary)]">
                        {selectedEmail.snippet || 'No snippet available'}
                      </div>
                    </div>
                    
                    {selectedEmail.error_reason && (
                      <div>
                        <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Error Reason</h3>
                        <div className="bg-[var(--color-expense)]/10 border border-[var(--color-expense)]/30 rounded p-3 text-sm text-[var(--color-expense)]">
                          {selectedEmail.error_reason}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Timestamps</h3>
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-sm font-medium text-[var(--color-text-muted)]">Created At</dt>
                          <dd className="text-sm text-[var(--color-text-primary)]">{formatDateTime(selectedEmail.created_at)}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-[var(--color-text-muted)]">Updated At</dt>
                          <dd className="text-sm text-[var(--color-text-primary)]">{formatDateTime(selectedEmail.updated_at)}</dd>
                        </div>
                        {selectedEmail.processed_at && (
                          <div>
                            <dt className="text-sm font-medium text-[var(--color-text-muted)]">Processed At</dt>
                            <dd className="text-sm text-[var(--color-text-primary)]">{formatDateTime(selectedEmail.processed_at)}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4 border-t border-[var(--color-border)] flex gap-3">
                  {selectedEmail && (selectedEmail.status === 'Fetched' || (selectedEmail.status as string) === 'FETCHED') && (
                    <button
                      onClick={() => {
                        handleProcessEmail(selectedEmail);
                        closeEmailDrawer();
                      }}
                      disabled={processingEmails.has(selectedEmail.id)}
                      className={`btn-primary ${
                        processingEmails.has(selectedEmail.id)
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      } flex items-center gap-2`}
                    >
                      {processingEmails.has(selectedEmail.id) ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          </svg>
                          Process with AI
                        </>
                      )}
                    </button>
                  )}
                  {selectedEmail && (selectedEmail.status !== 'REJECT') && (
                    <button
                      onClick={() => {
                        handleRejectEmail(selectedEmail);
                        closeEmailDrawer();
                      }}
                      className="px-4 py-2 bg-[var(--color-expense)] text-[var(--color-text-primary)] rounded hover:bg-[var(--color-expense)]"
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
              <div className="fixed inset-0 bg-[var(--color-bg-app)]/50" onClick={closeStatusModal}></div>
              <div className="relative bg-[var(--color-bg-card)] rounded-[var(--radius-md)] shadow-[var(--shadow-xl)] max-w-md w-full">
                <div className="px-6 py-4 border-b border-[var(--color-border)]">
                  <h3 className="text-lg font-medium text-[var(--color-text-primary)]">
                    {newStatus === 'UNREJECT' ? 'Unreject Email' : 'Reject Email'}
                  </h3>
                </div>

                <div className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      Email Subject
                    </label>
                    <p className="text-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)] p-2 rounded">
                      {statusModalEmail.subject || 'No Subject'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      Action
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as 'REJECT' | 'UNREJECT')}
                      className="w-full border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] bg-[var(--color-bg-app)] text-[var(--color-text-primary)]"
                    >
                      <option value="REJECT">Reject Email</option>
                      <option value="UNREJECT">Unreject Email</option>
                    </select>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      Note: Status is now automatically derived. Use the Process button (⚙️) to process emails with AI.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      {newStatus === 'UNREJECT' ? 'Unreject Reason' : 'Rejection Reason'}
                    </label>
                    <textarea
                      value={statusRemarks}
                      onChange={(e) => setStatusRemarks(e.target.value)}
                      rows={3}
                      className="w-full border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] bg-[var(--color-bg-app)] text-[var(--color-text-primary)]"
                      placeholder={newStatus === 'UNREJECT' ? 'Enter reason for unrejecting this email...' : 'Enter reason for rejecting this email...'}
                    />
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    onClick={closeStatusModal}
                    className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)] hover:bg-[var(--color-border)] rounded-[var(--radius-md)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStatusUpdate}
                    className={`px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] rounded-[var(--radius-md)] ${
                      newStatus === 'UNREJECT'
                        ? 'bg-[var(--color-income)] hover:bg-[var(--color-income)]'
                        : 'bg-[var(--color-expense)] hover:bg-[var(--color-expense)]'
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
      </Layout>
    </ProtectedRoute>
  );
};

export default EmailsPage;
