import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';

interface RejectedEmail {
  id: string;
  user_id: string;
  google_user_id: string;
  connection_id: string;
  email_row_id: string;
  rejection_reason: string;
  rejection_type: string;
  error_details?: any;
  rejected_at: string;
  status: 'REVIEW' | 'INVALID';
  created_at: string;
  updated_at: string;
  fb_emails: {
    id: string;
    subject: string;
    from_address: string;
    snippet: string;
    internal_date: string;
    email_address: string;
  };
}

export default function RejectedEmailsPage() {
  const [rejectedEmails, setRejectedEmails] = useState<RejectedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<'REVIEW' | 'INVALID'>('REVIEW');
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const fetchRejectedEmails = async (status: 'REVIEW' | 'INVALID' = 'REVIEW') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/rejected-emails?status=${status}`);
      if (response.ok) {
        const data = await response.json();
        setRejectedEmails(data.rejectedEmails);
      } else {
        console.error('Failed to fetch rejected emails');
      }
    } catch (error) {
      console.error('Error fetching rejected emails:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRejectedEmails(selectedStatus);
  }, [selectedStatus]);

  const handleStatusChange = async (id: string, newStatus: 'REVIEW' | 'INVALID') => {
    setProcessingIds(prev => new Set(prev).add(id));
    
    try {
      const response = await fetch(`/api/rejected-emails/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Remove from current list since it moved to different status
        setRejectedEmails(prev => prev.filter(email => email.id !== id));
      } else {
        const error = await response.json();
        alert(`Failed to update status: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rejected email record?')) {
      return;
    }

    setProcessingIds(prev => new Set(prev).add(id));
    
    try {
      const response = await fetch(`/api/rejected-emails/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete' })
      });

      if (response.ok) {
        setRejectedEmails(prev => prev.filter(email => email.id !== id));
      } else {
        const error = await response.json();
        alert(`Failed to delete: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <ProtectedRoute>
      <Layout
        title="Finance Buddy - Rejected Emails Management"
        description="Manage rejected emails"
      >
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-airbnb-text-primary">Rejected Emails Management</h1>
            <p className="mt-2 text-airbnb-text-secondary">Review and manage rejected emails</p>
          </div>

          {/* Status Filter */}
          <div className="mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => setSelectedStatus('REVIEW')}
                className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-airbnb-md font-medium transition-colors min-h-[44px] ${
                  selectedStatus === 'REVIEW'
                    ? 'bg-airbnb-red text-airbnb-white'
                    : 'bg-airbnb-gray-light text-airbnb-text-secondary hover:bg-airbnb-gray-hover'
                }`}
              >
                Review ({rejectedEmails.length})
              </button>
              <button
                onClick={() => setSelectedStatus('INVALID')}
                className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-airbnb-md font-medium transition-colors min-h-[44px] ${
                  selectedStatus === 'INVALID'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-airbnb-text-secondary hover:bg-gray-300'
                }`}
              >
                Invalid
              </button>
            </div>
          </div>

          {/* Rejected Emails Table */}
          <div className="bg-airbnb-white rounded-airbnb-md shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-airbnb-border-light">
              <h2 className="text-lg font-medium text-airbnb-text-primary">
                {selectedStatus === 'REVIEW' ? 'Emails Under Review' : 'Invalid Emails'}
              </h2>
            </div>
            
            {loading ? (
              <div className="px-6 py-8 text-center">
                <div className="text-gray-500">Loading rejected emails...</div>
              </div>
            ) : rejectedEmails.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="text-gray-500">No {selectedStatus.toLowerCase()} emails found.</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rejection Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rejected At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-airbnb-white divide-y divide-gray-200">
                    {rejectedEmails.map((rejectedEmail) => (
                      <tr key={rejectedEmail.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-airbnb-text-primary">
                            {rejectedEmail.fb_emails.subject || 'No Subject'}
                          </div>
                          <div className="text-sm text-gray-500">
                            From: {rejectedEmail.fb_emails.from_address}
                          </div>
                          <div className="text-sm text-gray-500">
                            Account: {rejectedEmail.fb_emails.email_address}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-airbnb-text-primary">
                            <span className="font-medium">Type:</span> {rejectedEmail.rejection_type}
                          </div>
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">Reason:</span> {rejectedEmail.rejection_reason}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-airbnb-text-primary">
                          {formatDateTime(rejectedEmail.rejected_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {selectedStatus === 'REVIEW' ? (
                              <button
                                onClick={() => handleStatusChange(rejectedEmail.id, 'INVALID')}
                                disabled={processingIds.has(rejectedEmail.id)}
                                className={`px-3 py-1 rounded text-xs font-medium ${
                                  processingIds.has(rejectedEmail.id)
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-red-50 text-red-700 hover:bg-red-200'
                                }`}
                              >
                                Mark Invalid
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(rejectedEmail.id, 'REVIEW')}
                                disabled={processingIds.has(rejectedEmail.id)}
                                className={`px-3 py-1 rounded text-xs font-medium ${
                                  processingIds.has(rejectedEmail.id)
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                }`}
                              >
                                Move to Review
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleDelete(rejectedEmail.id)}
                              disabled={processingIds.has(rejectedEmail.id)}
                              className={`px-3 py-1 rounded text-xs font-medium ${
                                processingIds.has(rejectedEmail.id)
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-airbnb-gray-light/30 text-gray-800 hover:bg-gray-200'
                              }`}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
