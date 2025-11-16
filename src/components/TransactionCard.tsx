import { memo } from 'react';
import { Transaction, TransactionStatus } from '@/pages/transactions';

interface TransactionCardProps {
  transaction: Transaction;
  onQuickEdit: () => void;
  onStatusUpdate: (status: TransactionStatus) => void;
}

const TransactionCard = memo(function TransactionCard({ transaction, onQuickEdit, onStatusUpdate }: TransactionCardProps) {
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatAmount = (amount?: string | null, currency?: string | null) => {
    if (!amount) return 'N/A';
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
    }).format(numAmount);
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case 'REVIEW': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'INVALID': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDirectionColor = (direction?: string | null) => {
    switch (direction) {
      case 'debit': return 'text-red-600';
      case 'credit': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getCategoryIcon = (category?: string | null) => {
    const iconClass = "w-6 h-6";
    switch (category?.toLowerCase()) {
      case 'food':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'transport':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case 'shopping':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        );
      case 'bills':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'finance':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'entertainment':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
        );
      case 'health':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onQuickEdit();
    }
  };

  return (
    <article
      className="border-b border-gray-200 py-6 hover:bg-gray-50 transition-colors duration-150"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="article"
      aria-label={`Transaction: ${transaction.merchant_name || 'Unknown Merchant'}, ${formatAmount(transaction.amount, transaction.currency)}`}
    >
      <div className="flex items-start justify-between gap-6">
        {/* Left side - Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 mb-2">
            <h3 className="text-base font-medium text-gray-900 truncate">
              {transaction.merchant_name || 'Unknown Merchant'}
            </h3>
            <span className="text-xs text-gray-400 tracking-wide">
              {formatDate(transaction.txn_time)}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500 tracking-wide">
            {transaction.category && (
              <span className="capitalize">{transaction.category}</span>
            )}
            {transaction.account_hint && (
              <span>{transaction.account_hint}</span>
            )}
          </div>
        </div>

        {/* Right side - Amount and Edit */}
        <div className="flex items-center gap-6 flex-shrink-0">
          {/* Amount */}
          <div className="text-right">
            <div className={`text-lg font-light ${getDirectionColor(transaction.direction)}`}>
              {transaction.direction === 'debit' && '-'}
              {formatAmount(transaction.amount, transaction.currency)}
            </div>
          </div>

          {/* Edit Link */}
          <a
            href={`/transactions/edit/${transaction.id}`}
            className="text-xs font-medium text-gray-900 tracking-widest uppercase border-b-2 border-gray-900 hover:border-gray-600 transition-colors pb-1"
            aria-label={`Edit transaction for ${transaction.merchant_name}`}
          >
            Edit
          </a>
        </div>
      </div>
    </article>
  );
});

export default TransactionCard;

