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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border-l-2 border-gray-200 pl-6 py-4 animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-24 mb-3"></div>
            <div className="h-10 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
      <div className="group">
        <div className="border-l-2 border-gray-900 pl-6 py-4 hover:border-gray-600 transition-colors duration-200">
          <p className="text-xs font-medium text-gray-500 tracking-widest uppercase mb-3">
            Total
          </p>
          <p className="text-5xl font-extralight text-gray-900 mb-2 tracking-tight">
            {total.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 tracking-wide">
            Transactions
          </p>
        </div>
      </div>

      <div className="group">
        <div className="border-l-2 border-gray-900 pl-6 py-4 hover:border-gray-600 transition-colors duration-200">
          <p className="text-xs font-medium text-gray-500 tracking-widest uppercase mb-3">
            Amount
          </p>
          <p className="text-5xl font-extralight text-gray-900 mb-2 tracking-tight">
            {formatCurrency(totalAmount)}
          </p>
          <p className="text-xs text-gray-400 tracking-wide">
            Total value
          </p>
        </div>
      </div>

      <div className="group">
        <div className="border-l-2 border-gray-900 pl-6 py-4 hover:border-gray-600 transition-colors duration-200">
          <p className="text-xs font-medium text-gray-500 tracking-widest uppercase mb-3">
            Confidence
          </p>
          <p className="text-5xl font-extralight text-gray-900 mb-2 tracking-tight">
            {Math.round(avgConfidence * 100)}%
          </p>
          <p className="text-xs text-gray-400 tracking-wide">
            AI accuracy
          </p>
        </div>
      </div>
    </div>
  );
});

export default TransactionStats;

