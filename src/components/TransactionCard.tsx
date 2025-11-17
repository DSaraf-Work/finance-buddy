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
      case 'REVIEW': return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
      case 'APPROVED': return 'bg-green-100 text-green-700 border border-green-300';
      case 'INVALID': return 'bg-gray-100 text-gray-700 border border-gray-300';
      case 'REJECTED': return 'bg-red-100 text-red-700 border border-red-300';
      default: return 'bg-blue-100 text-blue-700 border border-blue-300';
    }
  };

  const getDirectionColor = (direction?: string | null) => {
    switch (direction) {
      case 'debit': return 'text-[#ef4444]';
      case 'credit': return 'text-[#10b981]';
      default: return 'text-[#cbd5e1]';
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

  // Get vibrant card color based on category
  const getCardColor = (category?: string | null) => {
    switch (category?.toLowerCase()) {
      case 'food':
      case 'dining':
        return 'from-orange-500 to-red-500';
      case 'transport':
      case 'travel':
        return 'from-blue-500 to-cyan-500';
      case 'shopping':
        return 'from-pink-500 to-purple-500';
      case 'bills':
      case 'utilities':
        return 'from-yellow-500 to-orange-500';
      case 'finance':
        return 'from-green-500 to-emerald-500';
      case 'entertainment':
        return 'from-purple-500 to-indigo-500';
      case 'health':
        return 'from-red-500 to-pink-500';
      default:
        return 'from-violet-500 to-purple-500';
    }
  };

  return (
    <article
      className="group relative bg-white rounded-2xl p-5 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="article"
      aria-label={`Transaction: ${transaction.merchant_name || 'Unknown Merchant'}, ${formatAmount(transaction.amount, transaction.currency)}`}
    >
      {/* Colorful Top Border */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getCardColor(transaction.category)}`}></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header with Icon and Status */}
        <div className="flex items-start justify-between mb-4">
          {/* Category Icon */}
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getCardColor(transaction.category)} flex items-center justify-center shadow-lg`}>
            <div className="text-white">
              {getCategoryIcon(transaction.category)}
            </div>
          </div>

          {/* Status Badge */}
          {transaction.status && (
            <span className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg ${getStatusColor(transaction.status)}`}>
              {transaction.status}
            </span>
          )}
        </div>

        {/* Merchant Name */}
        <div className="mb-3">
          <h3 className="text-base font-bold text-slate-900 truncate mb-1">
            {transaction.merchant_name || 'Unknown Merchant'}
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDate(transaction.txn_time)}</span>
          </div>
        </div>

        {/* Category and Account Tags */}
        <div className="flex flex-wrap items-center gap-2 text-xs mb-4">
          {transaction.category && (
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg capitalize font-medium">
              {transaction.category}
            </span>
          )}
          {transaction.account_hint && (
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg truncate max-w-[140px]">
              {transaction.account_hint}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-200 mb-4"></div>

        {/* Amount and Edit Button */}
        <div className="flex items-center justify-between gap-3">
          {/* Amount */}
          <div className="flex-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 font-semibold">Amount</p>
            <div className={`text-xl font-bold ${getDirectionColor(transaction.direction)} truncate`}>
              {transaction.direction === 'debit' && '-'}
              {formatAmount(transaction.amount, transaction.currency)}
            </div>
          </div>

          {/* Edit Button */}
          <a
            href={`/transactions/edit/${transaction.id}`}
            className={`px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-r ${getCardColor(transaction.category)} rounded-xl hover:shadow-lg transition-all duration-300 flex-shrink-0`}
            aria-label={`Edit transaction for ${transaction.merchant_name}`}
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </span>
          </a>
        </div>
      </div>
    </article>
  );
});

export default TransactionCard;

