import { memo } from 'react';
import { Transaction, TransactionStatus } from '@/pages/transactions';

interface TransactionCardProps {
  transaction: Transaction;
  onQuickEdit: () => void;
  onStatusUpdate: (status: TransactionStatus) => void;
}

const TransactionCard = memo(function TransactionCard({ transaction, onQuickEdit, onStatusUpdate }: TransactionCardProps) {
  const formatAmount = (amount?: string | null, currency?: string | null) => {
    if (!amount) return 'N/A';
    const numAmount = Math.abs(parseFloat(amount));
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(numAmount);
  };

  const isExpense = transaction.direction === 'debit';
  const amountPrefix = isExpense ? '-' : '+';
  // Use theme semantic colors
  const amountColor = isExpense ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-income)]';

  const getStatusStyle = (status: TransactionStatus) => {
    switch (status) {
      case 'REVIEW': return 'bg-[var(--color-warning)]/20 text-[var(--color-warning)] border-[var(--color-warning)]/30';
      case 'APPROVED': return 'bg-[var(--color-income)]/20 text-[var(--color-income)] border-[var(--color-income)]/30';
      case 'INVALID': return 'bg-[var(--color-text-disabled)]/20 text-[var(--color-text-disabled)] border-[var(--color-text-disabled)]/30';
      case 'REJECTED': return 'bg-[var(--color-expense)]/20 text-[var(--color-expense)] border-[var(--color-expense)]/30';
      default: return 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]';
    }
  };

  const getStatusLabel = (status: TransactionStatus) => {
    if (status === 'APPROVED') return 'COMPLETED';
    return status;
  };

  const getCategoryIcon = (category?: string | null) => {
    const iconClass = "w-6 h-6 text-[var(--color-text-primary)]";
    // Using simple shapes/emojis for now to match the design vibe, but keeping the SVG paths for cleaner look
    // Design uses: Coffee cup for Food, Bank for Income, Cart for Shopping
    switch (category?.toLowerCase()) {
      case 'food': case 'dining':
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 1v3M10 1v3M14 1v3" />
          </svg>
        );
      case 'income': case 'salary':
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
          </svg>
        );
      case 'shopping':
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'transport':
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case 'utilities':
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        // Default Card icon
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
    }
  };

  const getIconBgColor = (category?: string | null) => {
    switch (category?.toLowerCase()) {
      case 'food': return 'bg-[var(--color-accent-primary)]';
      case 'income': return 'bg-[var(--color-income)]';
      case 'shopping': return 'bg-[var(--color-chart-3)]';
      case 'utilities': return 'bg-[var(--color-warning)]';
      case 'transport': return 'bg-[var(--color-accent-primary)]';
      default: return 'bg-[var(--color-text-muted)]';
    }
  };

  return (
    <div
      onClick={onQuickEdit}
      className="bg-[var(--color-bg-card)] rounded-2xl p-4 flex items-center justify-between hover:bg-[var(--color-bg-elevated)] transition-colors cursor-pointer group mb-3 border border-[var(--color-border)]"
    >
      <div className="flex items-center gap-4">
        {/* Icon Circle */}
        <div className={`w-12 h-12 rounded-full ${getIconBgColor(transaction.category)} bg-opacity-20 flex items-center justify-center`}>
          {/* Inner Circle for contrast if needed, or just icon */}
          <div className={`w-12 h-12 rounded-full ${getIconBgColor(transaction.category)} bg-opacity-20 flex items-center justify-center`}>
            {getCategoryIcon(transaction.category)}
          </div>
        </div>

        {/* Text Content */}
        <div className="flex flex-col">
          <span className="text-[var(--color-text-primary)] font-semibold text-[15px]">
            {transaction.merchant_name || 'Unknown Merchant'}
          </span>
          <span className="text-[var(--color-text-muted)] text-sm">
            {transaction.category || 'Uncategorized'}
          </span>

          {/* Payment Method / Account Hint line */}
          <div className="flex items-center gap-1.5 mt-1">
            <svg className="w-3.5 h-3.5 text-[var(--color-text-disabled)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 4H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H3V6h18v12zm-4-6h2v2h-2zm-4 0h2v2h-2z" />
            </svg>
            <span className="text-[var(--color-text-disabled)] text-xs">
              {transaction.account_type
                ? `${transaction.account_type.replace(/_/g, ' ')} ${transaction.account_hint ? `•••• ${transaction.account_hint.slice(-4)}` : ''}`
                : 'Card •••• 0000'}
            </span>
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex flex-col items-end gap-2">
        <span className={`${amountColor} font-bold text-[15px]`}>
          {amountPrefix}{formatAmount(transaction.amount, transaction.currency)}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onQuickEdit(); }}
          className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${getStatusStyle(transaction.status)} uppercase border`}
        >
          {getStatusLabel(transaction.status)}
        </button>
      </div>
    </div>
  );
});

export default TransactionCard;

