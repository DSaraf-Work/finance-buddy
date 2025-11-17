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
          <div key={i} className="bg-[#15161A] rounded-xl border border-[#2A2C35] p-3 sm:p-4 md:p-5 lg:p-6 animate-pulse">
            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-[#1E2026] rounded-lg mb-2 sm:mb-3 md:mb-4"></div>
            <div className="h-2 sm:h-3 bg-[#1E2026] rounded w-16 sm:w-20 mb-1 sm:mb-2"></div>
            <div className="h-6 sm:h-7 md:h-8 bg-[#1E2026] rounded w-20 sm:w-24 mb-0.5 sm:mb-1"></div>
            <div className="h-2 bg-[#1E2026] rounded w-12 sm:w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-10 sm:mb-12">
      {/* Total Transactions Card */}
      <div className="relative bg-[#15161A] rounded-2xl p-6 hover:shadow-2xl hover:shadow-[#5D5FEF]/10 transition-all duration-300 overflow-hidden border border-[#2A2C35]">
        {/* Purple Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5D5FEF] to-[#888BFF]"></div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5D5FEF] to-[#888BFF] flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>
          <p className="text-xs font-semibold text-[#6F7280] tracking-wider uppercase mb-2">
            Total Transactions
          </p>
          <p className="text-4xl font-bold text-[#F0F1F5] mb-1 tracking-tight">
            {total.toLocaleString()}
          </p>
          <p className="text-sm text-[#B2B4C2]">
            All time
          </p>
        </div>
      </div>

      {/* Total Amount Card */}
      <div className="relative bg-[#15161A] rounded-2xl p-6 hover:shadow-2xl hover:shadow-[#4ECF9E]/10 transition-all duration-300 overflow-hidden border border-[#2A2C35]">
        {/* Green Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#4ECF9E]"></div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#4ECF9E] flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs font-semibold text-[#6F7280] tracking-wider uppercase mb-2">
            Total Amount
          </p>
          <p className="text-4xl font-bold text-[#F0F1F5] mb-1 tracking-tight">
            {formatCurrency(totalAmount)}
          </p>
          <p className="text-sm text-[#B2B4C2]">
            Combined value
          </p>
        </div>
      </div>

      {/* AI Confidence Card */}
      <div className="relative bg-[#15161A] rounded-2xl p-6 hover:shadow-2xl hover:shadow-[#6C85FF]/10 transition-all duration-300 overflow-hidden border border-[#2A2C35]">
        {/* Blue Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#6C85FF]"></div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#6C85FF] flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs font-semibold text-[#6F7280] tracking-wider uppercase mb-2">
            AI Confidence
          </p>
          <p className="text-4xl font-bold text-[#F0F1F5] mb-1 tracking-tight">
            {Math.round(avgConfidence * 100)}%
          </p>
          <p className="text-sm text-[#B2B4C2]">
            Accuracy score
          </p>
        </div>
      </div>
    </div>
  );
});

export default TransactionStats;

