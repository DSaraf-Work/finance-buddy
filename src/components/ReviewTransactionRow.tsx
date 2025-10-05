import React from 'react';
import { ReviewTransaction } from '@/pages/review_route';

interface ReviewTransactionRowProps {
  transaction: ReviewTransaction;
  onEdit: (transaction: ReviewTransaction) => void;
  isMobile?: boolean;
}

const ReviewTransactionRow: React.FC<ReviewTransactionRowProps> = ({
  transaction,
  onEdit,
  isMobile = false,
}) => {
  // Format date/time
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format amount with currency and direction
  const formatAmount = (amount: string, currency: string | null, direction: string | null) => {
    const numAmount = parseFloat(amount);
    const currencySymbol = currency === 'INR' ? '₹' : currency || '';
    const prefix = direction === 'credit' ? '+' : '-';
    const colorClass = direction === 'credit' ? 'text-green-600' : 'text-red-600';

    return (
      <span className={`font-semibold ${colorClass}`}>
        {prefix} {currencySymbol}{numAmount.toFixed(2)}
      </span>
    );
  };

  // Format confidence
  const formatConfidence = (confidence: string | null) => {
    if (!confidence) return null;
    const conf = parseFloat(confidence);
    return (
      <span
        className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full"
        style={{
          backgroundColor: '#F4FBEB',
          color: '#2CA02C',
          border: '1px solid #D6ECB5',
        }}
      >
        {(conf * 100).toFixed(0)}%
      </span>
    );
  };

  // Format category chip
  const formatCategory = (category: string | null) => {
    if (!category) return <span className="text-gray-400">Uncategorized</span>;
    return (
      <span
        className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full"
        style={{
          backgroundColor: '#EAF4FF',
          color: '#3B82F6',
          border: '1px solid #D2E4FF',
        }}
      >
        {category}
      </span>
    );
  };

  // Format account
  const formatAccount = (hint: string | null, type: string | null) => {
    if (!hint && !type) return <span className="text-gray-400">N/A</span>;
    return (
      <span className="text-sm text-gray-700">
        {hint || 'Unknown'} {type && `• ${type}`}
      </span>
    );
  };

  // Format merchant with secondary info
  const formatMerchant = () => {
    const merchant = transaction.merchant_normalized || transaction.merchant_name || 'Unknown';
    const secondary = [transaction.reference_id, transaction.location]
      .filter(Boolean)
      .join(' • ');

    return (
      <div>
        <div className="font-medium text-gray-900">{merchant}</div>
        {secondary && <div className="text-xs text-gray-500 mt-0.5">{secondary}</div>}
      </div>
    );
  };

  if (isMobile) {
    // Mobile Card Layout
    return (
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.08)' }}
      >
        {/* First Line: Merchant + Category + Amount */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0 mr-3">
            <div className="font-medium text-gray-900 truncate">
              {transaction.merchant_normalized || transaction.merchant_name || 'Unknown'}
            </div>
            <div className="mt-1">{formatCategory(transaction.category)}</div>
          </div>
          <div className="text-right">
            {formatAmount(transaction.amount, transaction.currency, transaction.direction)}
          </div>
        </div>

        {/* Second Line: Date/Time • Account • Confidence */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <div className="flex items-center space-x-2">
            <span>{formatDateTime(transaction.txn_time)}</span>
            <span>•</span>
            <span>{transaction.account_hint || 'N/A'}</span>
          </div>
          {formatConfidence(transaction.confidence)}
        </div>

        {/* Third Line: Reference • Location + Edit Button */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            {[transaction.reference_id, transaction.location].filter(Boolean).join(' • ') ||
              'No additional info'}
          </div>
          <button
            onClick={() => onEdit(transaction)}
            className="ml-2 px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
            aria-label={`Edit transaction ${transaction.id}`}
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  // Desktop Table Row
  return (
    <tr className="hover:bg-gray-50 transition-colors" style={{ height: '60px' }}>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatDateTime(transaction.txn_time)}
      </td>
      <td className="px-6 py-4 text-sm">{formatMerchant()}</td>
      <td className="px-6 py-4 whitespace-nowrap">{formatCategory(transaction.category)}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {formatAccount(transaction.account_hint, transaction.account_type)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {formatConfidence(transaction.confidence)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {formatAmount(transaction.amount, transaction.currency, transaction.direction)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
        <button
          onClick={() => onEdit(transaction)}
          className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
          aria-label={`Edit transaction ${transaction.id}`}
        >
          Edit
        </button>
      </td>
    </tr>
  );
};

export default ReviewTransactionRow;

