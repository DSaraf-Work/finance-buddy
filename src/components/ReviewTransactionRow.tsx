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
    const colorClass = direction === 'credit' ? 'text-[#10b981]' : 'text-[#ef4444]';

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
      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30">
        {(conf * 100).toFixed(0)}%
      </span>
    );
  };

  // Format category chip
  const formatCategory = (category: string | null) => {
    if (!category) return <span className="text-[#94a3b8]">Uncategorized</span>;
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-[#6b4ce6]/10 text-[#a78bfa] border border-[#6b4ce6]/30">
        {category}
      </span>
    );
  };

  // Format account
  const formatAccount = (hint: string | null, type: string | null) => {
    if (!hint && !type) return <span className="text-[#94a3b8]">N/A</span>;
    return (
      <span className="text-sm text-[#cbd5e1]">
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
        <div className="font-medium text-[#f8fafc]">{merchant}</div>
        {secondary && <div className="text-xs text-[#94a3b8] mt-0.5">{secondary}</div>}
      </div>
    );
  };

  // Format status badge
  const formatStatus = (status: string) => {
    const statusConfig = {
      REVIEW: { bg: 'bg-[var(--color-warning)]/10', color: 'text-[var(--color-warning)]', border: 'border-[var(--color-warning)]/30', label: 'Review' },
      APPROVED: { bg: 'bg-[#10b981]/10', color: 'text-[#10b981]', border: 'border-[#10b981]/30', label: 'Approved' },
      REJECTED: { bg: 'bg-[#ef4444]/10', color: 'text-[#ef4444]', border: 'border-[#ef4444]/30', label: 'Rejected' },
      INVALID: { bg: 'bg-[#94a3b8]/10', color: 'text-[#94a3b8]', border: 'border-[#94a3b8]/30', label: 'Invalid' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.REVIEW;

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.color} border ${config.border}`}>
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
    // Mobile Card Layout - Dark Purple Theme
    return (
      <>
        <div className="bg-[#1a1625] rounded-[var(--radius-lg)] shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-[#2d1b4e] p-4 hover:border-[#6b4ce6] hover:shadow-[0_0_20px_rgba(107,76,230,0.2)] transition-all duration-300">
          {/* First Line: Merchant + Category + Amount */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0 mr-3">
              <div className="font-medium text-[#f8fafc] truncate text-sm sm:text-base">
                {transaction.merchant_normalized || transaction.merchant_name || 'Unknown'}
              </div>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {formatCategory(transaction.category)}
                {formatStatus(transaction.status)}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {formatAmount(transaction.amount, transaction.currency, transaction.direction)}
            </div>
          </div>

          {/* Second Line: Date/Time • Account • Confidence */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-[#cbd5e1] mb-3 pb-3 border-b border-[#2d1b4e]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDateTime(transaction.txn_time)}
              </span>
              <span className="text-[#2d1b4e]">•</span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {transaction.account_hint || 'N/A'}
              </span>
            </div>
            {formatConfidence(transaction.confidence)}
          </div>

          {/* Third Line: Reference • Location + Action Buttons */}
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-[#94a3b8] truncate flex-1">
              {[transaction.reference_id, transaction.location].filter(Boolean).join(' • ') ||
                'No additional info'}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onEdit(transaction)}
                className="px-3 py-1.5 text-xs font-medium text-[#a78bfa] hover:text-[#6b4ce6] hover:bg-[#6b4ce6]/10 rounded-[var(--radius-md)] border border-[#2d1b4e] hover:border-[#6b4ce6] transition-all duration-200"
                aria-label={`Edit transaction ${transaction.id}`}
              >
                Edit
              </button>
              {transaction.status !== 'REJECTED' && (
                <button
                  onClick={handleRejectClick}
                  className="px-3 py-1.5 text-xs font-medium text-[#ef4444] hover:text-[#dc2626] hover:bg-[#ef4444]/10 rounded-[var(--radius-md)] border border-[#2d1b4e] hover:border-[#ef4444] transition-all duration-200"
                  aria-label={`Reject transaction ${transaction.id}`}
                >
                  Reject
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reject Modal - Dark Purple Theme */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1625] rounded-[var(--radius-lg)] shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-[#2d1b4e] p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#ef4444]/10 rounded-[var(--radius-md)] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#ef4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#f8fafc]">Reject Transaction</h3>
              </div>
              <p className="text-sm text-[#cbd5e1] mb-4">
                Please provide a reason for rejecting this transaction:
              </p>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="e.g., Not a real expense, duplicate transaction, etc."
                className="w-full px-4 py-3 bg-[#0f0a1a] border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#f8fafc] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#ef4444] focus:border-[#ef4444] mb-4 resize-none transition-all duration-200"
                rows={4}
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleRejectCancel}
                  className="px-4 py-2 text-sm font-medium text-[#cbd5e1] bg-[#2d1b4e]/30 hover:bg-[#2d1b4e]/50 rounded-[var(--radius-md)] border border-[#2d1b4e] hover:border-[#6b4ce6]/50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#ef4444] hover:bg-[#dc2626] rounded-[var(--radius-md)] shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all duration-200"
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

  // Desktop Table Row - Dark Purple Theme
  return (
    <>
      <tr className="hover:bg-[#2d1b4e]/20 transition-all duration-200 border-b border-[#2d1b4e]" style={{ height: '60px' }}>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#cbd5e1]">
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
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => onEdit(transaction)}
              className="px-3 py-1.5 text-[#a78bfa] hover:text-[#6b4ce6] hover:bg-[#6b4ce6]/10 font-medium rounded-[var(--radius-md)] border border-transparent hover:border-[#6b4ce6] transition-all duration-200"
              aria-label={`Edit transaction ${transaction.id}`}
            >
              Edit
            </button>
            {transaction.status !== 'REJECTED' && (
              <button
                onClick={handleRejectClick}
                className="px-3 py-1.5 text-[#ef4444] hover:text-[#dc2626] hover:bg-[#ef4444]/10 font-medium rounded-[var(--radius-md)] border border-transparent hover:border-[#ef4444] transition-all duration-200"
                aria-label={`Reject transaction ${transaction.id}`}
              >
                Reject
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Reject Modal - Dark Purple Theme */}
      {showRejectModal && (
        <tr>
          <td colSpan={8}>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[#1a1625] rounded-[var(--radius-lg)] shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-[#2d1b4e] p-6 max-w-md w-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#ef4444]/10 rounded-[var(--radius-md)] flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#ef4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[#f8fafc]">Reject Transaction</h3>
                </div>
                <p className="text-sm text-[#cbd5e1] mb-4">
                  Please provide a reason for rejecting this transaction:
                </p>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="e.g., Not a real expense, duplicate transaction, etc."
                  className="w-full px-4 py-3 bg-[#0f0a1a] border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#f8fafc] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#ef4444] focus:border-[#ef4444] mb-4 resize-none transition-all duration-200"
                  rows={4}
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleRejectCancel}
                    className="px-4 py-2 text-sm font-medium text-[#cbd5e1] bg-[#2d1b4e]/30 hover:bg-[#2d1b4e]/50 rounded-[var(--radius-md)] border border-[#2d1b4e] hover:border-[#6b4ce6]/50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectConfirm}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#ef4444] hover:bg-[#dc2626] rounded-[var(--radius-md)] shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all duration-200"
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

