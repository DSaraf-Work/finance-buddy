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
      case 'REVIEW': return 'bg-[var(--color-info)]/10 text-[var(--color-info)] border border-[var(--color-info)]/30';
      case 'APPROVED': return 'bg-[var(--color-income)]/10 text-[var(--color-income)] border border-[var(--color-income)]/30';
      case 'INVALID': return 'bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)] border border-[var(--color-text-muted)]/30';
      case 'REJECTED': return 'bg-[var(--color-expense)]/10 text-[var(--color-expense)] border border-[var(--color-expense)]/30';
      default: return 'bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] border border-[var(--color-accent-primary)]/30';
    }
  };

  const getDirectionColor = (direction?: string | null) => {
    switch (direction) {
      case 'debit': return 'text-[var(--color-expense)]';
      case 'credit': return 'text-[var(--color-income)]';
      default: return 'text-[var(--color-text-secondary)]';
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

  // Get palette-aligned card color based on category - Midnight Blue Wealth Theme
  // Using flat colors only (no gradients per theme requirements)
  const getCardColor = (category?: string | null) => {
    switch (category?.toLowerCase()) {
      case 'food':
      case 'dining':
        return 'bg-[var(--color-expense)]';
      case 'transport':
      case 'travel':
        return 'bg-[var(--color-info)]';
      case 'shopping':
        return 'bg-[var(--color-accent-primary)]';
      case 'bills':
      case 'utilities':
        return 'bg-[var(--color-info)]';
      case 'finance':
        return 'bg-[var(--color-income)]';
      case 'entertainment':
        return 'bg-[var(--color-accent-primary)]';
      case 'health':
        return 'bg-[var(--color-warning)]';
      default:
        return 'bg-[var(--color-accent-primary)]';
    }
  };

  return (
    <article
      className="group relative bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] p-4 hover:shadow-[var(--shadow-lg)] active:scale-[0.98] transition-all duration-200 overflow-hidden border border-[var(--color-border)] shadow-[var(--shadow-sm)] cursor-pointer"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={onQuickEdit}
      role="button"
      aria-label={`Transaction: ${transaction.merchant_name || 'Unknown Merchant'}, ${formatAmount(transaction.amount, transaction.currency)}`}
    >
      {/* Category-based Left Border - More Prominent */}
      <div className={`absolute top-0 left-0 bottom-0 w-1 ${getCardColor(transaction.category)}`}></div>

      {/* Content */}
      <div className="relative z-10 pl-2">
        {/* Header: Icon, Merchant, Status - Single Row */}
        <div className="flex items-center gap-3 mb-3">
          {/* Category Icon - Smaller, More Compact */}
          <div className={`w-9 h-9 rounded-[var(--radius-md)] ${getCardColor(transaction.category)} flex items-center justify-center shadow-[var(--shadow-sm)] flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
            <div className="text-[var(--color-text-primary)]">
              {getCategoryIcon(transaction.category)}
            </div>
          </div>

          {/* Merchant Name and Date - Stacked */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] truncate leading-tight">
              {transaction.merchant_name || 'Unknown Merchant'}
            </h3>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 truncate">
              {formatDate(transaction.txn_time)}
            </p>
          </div>

          {/* Status Badge - Compact */}
          {transaction.status && (
            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-[var(--radius-md)] ${getStatusColor(transaction.status)} flex-shrink-0 uppercase tracking-wide`}>
              {transaction.status}
            </span>
          )}
        </div>

        {/* Amount - Large and Prominent */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${getDirectionColor(transaction.direction)} tracking-tight`}>
              {transaction.direction === 'debit' && '−'}
              {transaction.direction === 'credit' && '+'}
              {formatAmount(transaction.amount, transaction.currency)}
            </span>
          </div>
        </div>

        {/* Footer: Category, Account, Edit - Compact Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Tags - Inline, Compact */}
          <div className="flex items-center gap-1.5 text-[10px] flex-1 min-w-0">
            {transaction.category && (
              <span className="px-2 py-0.5 bg-[var(--color-bg-elevated)]/50 text-[var(--color-text-secondary)] rounded-[var(--radius-md)] capitalize font-medium truncate">
                {transaction.category}
              </span>
            )}
            {transaction.account_hint && (
              <span className="px-2 py-0.5 bg-[var(--color-bg-elevated)]/50 text-[var(--color-text-muted)] rounded-[var(--radius-md)] truncate max-w-[80px]">
                {transaction.account_hint}
              </span>
            )}
          </div>

          {/* Edit Button - Icon Only, Floating */}
          <a
            href={`/transactions/edit/${transaction.id}`}
            onClick={(e) => e.stopPropagation()}
            className="w-8 h-8 flex items-center justify-center text-[var(--color-text-primary)] bg-[var(--color-accent-primary)] rounded-[var(--radius-md)] hover:shadow-[var(--shadow-md)] hover:bg-[var(--color-accent-hover)] active:scale-95 transition-all duration-200 flex-shrink-0 group-hover:scale-110"
            aria-label={`Edit transaction for ${transaction.merchant_name}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </a>
        </div>
      </div>

      {/* Hover Indicator - Subtle Glow */}
      <div className="absolute inset-0 bg-[var(--color-accent-primary)]/0 group-hover:bg-[var(--color-accent-primary)]/5 transition-all duration-300 pointer-events-none rounded-[var(--radius-lg)]"></div>
    </article>
  );
});

export default TransactionCard;

