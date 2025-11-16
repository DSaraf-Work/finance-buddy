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
          <div key={i} className="bg-[#1a1625] rounded-xl border border-[#2d1b4e] p-3 sm:p-4 md:p-5 lg:p-6 animate-pulse">
            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-[#2d1b4e] rounded-lg mb-2 sm:mb-3 md:mb-4"></div>
            <div className="h-2 sm:h-3 bg-[#2d1b4e] rounded w-16 sm:w-20 mb-1 sm:mb-2"></div>
            <div className="h-6 sm:h-7 md:h-8 bg-[#2d1b4e] rounded w-20 sm:w-24 mb-0.5 sm:mb-1"></div>
            <div className="h-2 bg-[#2d1b4e] rounded w-12 sm:w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-10 sm:mb-12">
      {/* Total Transactions Card */}
      <div className="group relative bg-gradient-to-br from-[#1a1625] to-[#0f0a1a] rounded-2xl border border-[#2d1b4e] p-6 hover:border-[#6b4ce6] hover:shadow-2xl hover:shadow-[#6b4ce6]/20 transition-all duration-500 overflow-hidden">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#6b4ce6]/0 to-[#8b5cf6]/0 group-hover:from-[#6b4ce6]/10 group-hover:to-[#8b5cf6]/10 transition-all duration-500"></div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6b4ce6] to-[#8b5cf6] flex items-center justify-center shadow-lg shadow-[#6b4ce6]/30 group-hover:shadow-[#6b4ce6]/50 transition-all duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#6b4ce6] to-[#8b5cf6] animate-pulse"></div>
          </div>
          <p className="text-xs font-semibold text-[#94a3b8] tracking-wider uppercase mb-2">
            Total Transactions
          </p>
          <p className="text-4xl font-bold text-white mb-1 tracking-tight">
            {total.toLocaleString()}
          </p>
          <p className="text-sm text-[#a78bfa]">
            All time
          </p>
        </div>
      </div>

      {/* Total Amount Card */}
      <div className="group relative bg-gradient-to-br from-[#1a1625] to-[#0f0a1a] rounded-2xl border border-[#2d1b4e] p-6 hover:border-[#10b981] hover:shadow-2xl hover:shadow-[#10b981]/20 transition-all duration-500 overflow-hidden">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#10b981]/0 to-[#059669]/0 group-hover:from-[#10b981]/10 group-hover:to-[#059669]/10 transition-all duration-500"></div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center shadow-lg shadow-[#10b981]/30 group-hover:shadow-[#10b981]/50 transition-all duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#10b981] to-[#059669] animate-pulse"></div>
          </div>
          <p className="text-xs font-semibold text-[#94a3b8] tracking-wider uppercase mb-2">
            Total Amount
          </p>
          <p className="text-4xl font-bold text-white mb-1 tracking-tight">
            {formatCurrency(totalAmount)}
          </p>
          <p className="text-sm text-[#10b981]">
            Combined value
          </p>
        </div>
      </div>

      {/* AI Confidence Card */}
      <div className="group relative bg-gradient-to-br from-[#1a1625] to-[#0f0a1a] rounded-2xl border border-[#2d1b4e] p-6 hover:border-[#ec4899] hover:shadow-2xl hover:shadow-[#ec4899]/20 transition-all duration-500 overflow-hidden">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#ec4899]/0 to-[#db2777]/0 group-hover:from-[#ec4899]/10 group-hover:to-[#db2777]/10 transition-all duration-500"></div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ec4899] to-[#db2777] flex items-center justify-center shadow-lg shadow-[#ec4899]/30 group-hover:shadow-[#ec4899]/50 transition-all duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#ec4899] to-[#db2777] animate-pulse"></div>
          </div>
          <p className="text-xs font-semibold text-[#94a3b8] tracking-wider uppercase mb-2">
            AI Confidence
          </p>
          <p className="text-4xl font-bold text-white mb-1 tracking-tight">
            {Math.round(avgConfidence * 100)}%
          </p>
          <p className="text-sm text-[#ec4899]">
            Accuracy score
          </p>
        </div>
      </div>
    </div>
  );
});

export default TransactionStats;

