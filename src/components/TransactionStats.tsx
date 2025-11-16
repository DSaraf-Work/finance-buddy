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
      <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-bg-secondary rounded-xl border border-border p-3 sm:p-4 md:p-5 lg:p-6 animate-pulse">
            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-bg-elevated rounded-lg mb-2 sm:mb-3 md:mb-4"></div>
            <div className="h-2 sm:h-3 bg-bg-elevated rounded w-16 sm:w-20 mb-1 sm:mb-2"></div>
            <div className="h-6 sm:h-7 md:h-8 bg-bg-elevated rounded w-20 sm:w-24 mb-0.5 sm:mb-1"></div>
            <div className="h-2 bg-bg-elevated rounded w-12 sm:w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-12">
      <div className="group bg-bg-secondary rounded-xl border border-border p-3 sm:p-4 md:p-5 lg:p-6 hover:border-brand-primary hover:shadow-[0_0_20px_rgba(107,76,230,0.2)] transition-all duration-300">
        <div className="flex items-start justify-between mb-2 sm:mb-3 md:mb-4">
          <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center ring-1 ring-brand-primary/20">
            <svg className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[#a78bfa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
        </div>
        <p className="text-[10px] sm:text-xs font-medium text-text-muted tracking-wide uppercase mb-1 sm:mb-2">
          Total
        </p>
        <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light text-text-primary mb-0.5 sm:mb-1 tracking-tight">
          {total.toLocaleString()}
        </p>
        <p className="text-[10px] sm:text-xs text-text-secondary">
          Transactions
        </p>
      </div>

      <div className="group bg-bg-secondary rounded-xl border border-border p-3 sm:p-4 md:p-5 lg:p-6 hover:border-[#10b981] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all duration-300">
        <div className="flex items-start justify-between mb-2 sm:mb-3 md:mb-4">
          <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-accent-emerald/10 rounded-lg flex items-center justify-center ring-1 ring-[#10b981]/20">
            <svg className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-accent-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <p className="text-[10px] sm:text-xs font-medium text-text-muted tracking-wide uppercase mb-1 sm:mb-2">
          Amount
        </p>
        <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light text-text-primary mb-0.5 sm:mb-1 tracking-tight">
          {formatCurrency(totalAmount)}
        </p>
        <p className="text-[10px] sm:text-xs text-text-secondary">
          Total value
        </p>
      </div>

      <div className="group bg-bg-secondary rounded-xl border border-border p-3 sm:p-4 md:p-5 lg:p-6 hover:border-[#ec4899] hover:shadow-[0_0_20px_rgba(236,72,153,0.2)] transition-all duration-300">
        <div className="flex items-start justify-between mb-2 sm:mb-3 md:mb-4">
          <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-accent-pink/10 rounded-lg flex items-center justify-center ring-1 ring-[#ec4899]/20">
            <svg className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[#ec4899]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <p className="text-[10px] sm:text-xs font-medium text-text-muted tracking-wide uppercase mb-1 sm:mb-2">
          Confidence
        </p>
        <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light text-text-primary mb-0.5 sm:mb-1 tracking-tight">
          {Math.round(avgConfidence * 100)}%
        </p>
        <p className="text-[10px] sm:text-xs text-text-secondary">
          AI accuracy
        </p>
      </div>
    </div>
  );
});

export default TransactionStats;

