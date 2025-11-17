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
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-[#15161A] rounded-xl border border-[#2A2C35] p-4 animate-pulse">
            <div className="flex items-center gap-3 pl-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1E2026] rounded-lg flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-2 bg-[#1E2026] rounded w-16"></div>
                <div className="h-6 bg-[#1E2026] rounded w-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
      {/* Total Transactions Card - Compact */}
      <div className="relative bg-[#15161A] rounded-xl p-4 hover:shadow-lg transition-all duration-200 overflow-hidden border border-[#2A2C35]">
        {/* Purple Left Border */}
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-[#5D5FEF] to-[#888BFF]"></div>

        {/* Content - Horizontal Layout */}
        <div className="relative z-10 flex items-center gap-3 pl-2">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-[#5D5FEF] to-[#888BFF] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs font-medium text-[#6F7280] mb-0.5">
              Transactions
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#F0F1F5] tracking-tight truncate">
              {total.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Total Amount Card - Compact */}
      <div className="relative bg-[#15161A] rounded-xl p-4 hover:shadow-lg transition-all duration-200 overflow-hidden border border-[#2A2C35]">
        {/* Green Left Border */}
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#4ECF9E]"></div>

        {/* Content - Horizontal Layout */}
        <div className="relative z-10 flex items-center gap-3 pl-2">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#4ECF9E] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs font-medium text-[#6F7280] mb-0.5">
              Total Amount
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#F0F1F5] tracking-tight truncate">
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TransactionStats;

