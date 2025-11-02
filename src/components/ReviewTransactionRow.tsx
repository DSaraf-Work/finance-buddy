import React, { useState } from 'react';
import { ReviewTransaction } from '@/pages/review_route';

interface ReviewTransactionRowProps {
  transaction: ReviewTransaction;
  onEdit: (transaction: ReviewTransaction) => void;
  onReject: (transaction: ReviewTransaction, notes: string) => void;
  isMobile?: boolean;
}

const ReviewTransactionRow: React.FC<ReviewTransactionRowProps> = ({
  transaction,
  onEdit,
  onReject,
  isMobile = false,
}) => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  // Format date/time
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format amount with currency and direction
  const formatAmount = (amount: string, currency: string | null, direction: string | null) => {
    const numAmount = parseFloat(amount);
    const currencySymbol = currency === 'INR' ? '₹' : currency || '';
    const prefix = direction === 'credit' ? '+' : '-';
    const colorClass = direction === 'credit' ? 'text-green-600' : 'text-red-600';

    return (
      <span className={`font-semibold ${colorClass}`}>
        {prefix} {currencySymbol}{numAmount.toFixed(2)}
      </span>
    );
  };

  // Format confidence
  const formatConfidence = (confidence: string | null) => {
    if (!confidence) return null;
    const conf = parseFloat(confidence);
    return (
      <span
        className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full"
        style={{
          backgroundColor: '#F4FBEB',
          color: '#2CA02C',
          border: '1px solid #D6ECB5',
        }}
      >
        {(conf * 100).toFixed(0)}%
      </span>
    );
  };

  // Format category chip
  const formatCategory = (category: string | null) => {
    if (!category) return <span className="text-gray-400">Uncategorized</span>;
    return (
      <span
        className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full"
        style={{
          backgroundColor: '#EAF4FF',
          color: '#3B82F6',
          border: '1px solid #D2E4FF',
        }}
      >
        {category}
      </span>
    );
  };

  // Format account
  const formatAccount = (hint: string | null, type: string | null) => {
    if (!hint && !type) return <span className="text-gray-400">N/A</span>;
    return (
      <span className="text-sm text-gray-700">
        {hint || 'Unknown'} {type && `• ${type}`}
      </span>
    );
  };

  // Format merchant with secondary info
  const formatMerchant = () => {
    const merchant = transaction.merchant_normalized || transaction.merchant_name || 'Unknown';
    const secondary = [transaction.reference_id, transaction.location]
      .filter(Boolean)
      .join(' • ');

    return (
      <div>
        <div className="font-medium text-gray-900">{merchant}</div>
        {secondary && <div className="text-xs text-gray-500 mt-0.5">{secondary}</div>}
      </div>
    );
  };

  // Format status badge
  const formatStatus = (status: string) => {
    const statusConfig = {
      REVIEW: { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A', label: 'Review' },
      APPROVED: { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0', label: 'Approved' },
      REJECTED: { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA', label: 'Rejected' },
      INVALID: { bg: '#E5E7EB', color: '#374151', border: '#D1D5DB', label: 'Invalid' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.REVIEW;

    return (
      <span
        className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full"
        style={{
          backgroundColor: config.bg,
          color: config.color,
          border: `1px solid ${config.border}`,
        }}
      >
        {config.label}
      </span>
    );
  };

  const handleRejectClick = () => {
    setShowRejectModal(true);
  };

  const handleRejectConfirm = () => {
    onReject(transaction, rejectNotes);
    setShowRejectModal(false);
    setRejectNotes('');
  };

  const handleRejectCancel = () => {
    setShowRejectModal(false);
    setRejectNotes('');
  };

  if (isMobile) {
    // Mobile Card Layout
    return (
      <>
        <div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.08)' }}
        >
          {/* First Line: Merchant + Category + Amount */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0 mr-3">
              <div className="font-medium text-gray-900 truncate">
                {transaction.merchant_normalized || transaction.merchant_name || 'Unknown'}
              </div>
              <div className="mt-1 flex items-center space-x-2">
                {formatCategory(transaction.category)}
                {formatStatus(transaction.status)}
              </div>
            </div>
            <div className="text-right">
              {formatAmount(transaction.amount, transaction.currency, transaction.direction)}
            </div>
          </div>

          {/* Second Line: Date/Time • Account • Confidence */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <div className="flex items-center space-x-2">
              <span>{formatDateTime(transaction.txn_time)}</span>
              <span>•</span>
              <span>{transaction.account_hint || 'N/A'}</span>
            </div>
            {formatConfidence(transaction.confidence)}
          </div>

          {/* Third Line: Reference • Location + Action Buttons */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div>
              {[transaction.reference_id, transaction.location].filter(Boolean).join(' • ') ||
                'No additional info'}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEdit(transaction)}
                className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                aria-label={`Edit transaction ${transaction.id}`}
              >
                Edit
              </button>
              {transaction.status !== 'REJECTED' && (
                <button
                  onClick={handleRejectClick}
                  className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  aria-label={`Reject transaction ${transaction.id}`}
                >
                  Reject
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Transaction</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for rejecting this transaction:
              </p>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="e.g., Not a real expense, duplicate transaction, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4"
                rows={4}
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleRejectCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  Reject Transaction
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop Table Row
  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors" style={{ height: '60px' }}>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {formatDateTime(transaction.txn_time)}
        </td>
        <td className="px-6 py-4 text-sm">{formatMerchant()}</td>
        <td className="px-6 py-4 whitespace-nowrap">{formatCategory(transaction.category)}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          {formatAccount(transaction.account_hint, transaction.account_type)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {formatConfidence(transaction.confidence)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          {formatAmount(transaction.amount, transaction.currency, transaction.direction)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-center">
          {formatStatus(transaction.status)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => onEdit(transaction)}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              aria-label={`Edit transaction ${transaction.id}`}
            >
              Edit
            </button>
            {transaction.status !== 'REJECTED' && (
              <button
                onClick={handleRejectClick}
                className="text-red-600 hover:text-red-700 font-medium transition-colors"
                aria-label={`Reject transaction ${transaction.id}`}
              >
                Reject
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Reject Modal */}
      {showRejectModal && (
        <tr>
          <td colSpan={8}>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Transaction</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Please provide a reason for rejecting this transaction:
                </p>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="e.g., Not a real expense, duplicate transaction, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4"
                  rows={4}
                />
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleRejectCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectConfirm}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                  >
                    Reject Transaction
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default ReviewTransactionRow;

