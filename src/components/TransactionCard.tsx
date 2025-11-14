import { Transaction, TransactionStatus } from '@/pages/transactions';

interface TransactionCardProps {
  transaction: Transaction;
  onQuickEdit: () => void;
  onStatusUpdate: (status: TransactionStatus) => void;
}

export default function TransactionCard({ transaction, onQuickEdit, onStatusUpdate }: TransactionCardProps) {
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
    switch (category?.toLowerCase()) {
      case 'food': return '🍽️';
      case 'transport': return '🚗';
      case 'shopping': return '🛍️';
      case 'bills': return '📄';
      case 'finance': return '🏦';
      case 'entertainment': return '🎬';
      case 'health': return '🏥';
      default: return '💳';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        {/* Left side - Icon and details */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {/* Category Icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl flex items-center justify-center text-2xl">
            {getCategoryIcon(transaction.category)}
          </div>

          {/* Transaction Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {transaction.merchant_name || 'Unknown Merchant'}
              </h3>
              <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(transaction.status)}`}>
                {transaction.status}
              </span>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(transaction.txn_time)}</span>
              </div>

              {transaction.category && (
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="capitalize font-medium">{transaction.category}</span>
                </div>
              )}

              {transaction.confidence && (
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{Math.round(parseFloat(transaction.confidence) * 100)}% confidence</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Amount and actions */}
        <div className="flex items-center space-x-6 flex-shrink-0">
          {/* Amount */}
          <div className="text-right">
            <div className={`text-2xl font-bold ${getDirectionColor(transaction.direction)}`}>
              {transaction.direction === 'debit' && '-'}
              {formatAmount(transaction.amount, transaction.currency)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {transaction.account_hint || 'No account'}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Quick Edit (Modal) */}
            <button
              onClick={onQuickEdit}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="Quick edit"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            {/* Full Edit (New Tab) */}
            <a
              href={`/transactions/edit/${transaction.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
              title="Full edit in new tab"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

