import { memo } from 'react';

interface TransactionStatsProps {
  total: number;
  totalAmount: number;
  avgConfidence: number;
  loading?: boolean;
}

const TransactionStats = memo(function TransactionStats({ total, totalAmount, avgConfidence, loading = false }: TransactionStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    {
      label: 'Total Transactions',
      value: total.toLocaleString(),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Total Amount',
      value: formatCurrency(totalAmount),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      label: 'Avg Confidence',
      value: `${Math.round(avgConfidence * 100)}%`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
  ];

  if (loading) {
    return (
      <div className="sticky top-0 z-40 bg-[var(--color-bg-app)]/95 backdrop-blur-md border-b border-[var(--color-border)] mb-4">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:py-3.5 animate-pulse">
          {/* Skeleton 1 */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[var(--color-bg-card)] rounded-[var(--radius-md)] flex-shrink-0"></div>
            <div className="flex-1 space-y-1.5">
              <div className="h-2 bg-[var(--color-bg-card)] rounded w-16"></div>
              <div className="h-4 bg-[var(--color-bg-card)] rounded w-20"></div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-10 w-px bg-[var(--color-border)]"></div>

          {/* Skeleton 2 */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[var(--color-bg-card)] rounded-[var(--radius-md)] flex-shrink-0"></div>
            <div className="flex-1 space-y-1.5">
              <div className="h-2 bg-[var(--color-bg-card)] rounded w-16"></div>
              <div className="h-4 bg-[var(--color-bg-card)] rounded w-20"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-40 bg-[var(--color-bg-app)]/95 backdrop-blur-md border-b border-[var(--color-border)] mb-4">
      {/* Ultra-Compact Sticky Stats Bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:py-3.5">
        {/* Total Transactions - Inline */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[var(--radius-md)] bg-gradient-to-br from-[#5D5FEF] to-[#888BFF] flex items-center justify-center flex-shrink-0 shadow-[var(--shadow-sm)]">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs font-medium text-[var(--color-text-muted)] leading-tight">
              Transactions
            </p>
            <p className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] tracking-tight truncate">
              {total.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-10 w-px bg-[var(--color-border)] flex-shrink-0"></div>

        {/* Total Amount - Inline */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[var(--radius-md)] bg-[var(--color-income)] flex items-center justify-center flex-shrink-0 shadow-[var(--shadow-sm)]">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs font-medium text-[var(--color-text-muted)] leading-tight">
              Total Amount
            </p>
            <p className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] tracking-tight truncate">
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TransactionStats;

