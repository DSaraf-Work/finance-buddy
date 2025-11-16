import { useState } from 'react';
import { Transaction, TransactionStatus } from '@/pages/transactions';

interface TransactionRowProps {
  transaction: Transaction;
  onEdit: () => void;
  onReExtract?: (transactionId: string) => void;
  onStatusUpdate?: (transactionId: string, newStatus: TransactionStatus) => void;
}

export default function TransactionRow({ transaction, onEdit, onReExtract, onStatusUpdate }: TransactionRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReExtracting, setIsReExtracting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleReExtract = async () => {
    if (!onReExtract) return;

    setIsReExtracting(true);
    try {
      await onReExtract(transaction.id);
    } finally {
      setIsReExtracting(false);
    }
  };

  const handleStatusUpdate = async (newStatus: TransactionStatus) => {
    if (!onStatusUpdate) return;

    setIsUpdatingStatus(true);
    try {
      await onStatusUpdate(transaction.id, newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case 'REVIEW': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED': return 'bg-[#10b981]/10 text-[#10b981] border-green-200';
      case 'INVALID': return 'bg-[#2d1b4e]/30 text-gray-800 border-[#2d1b4e]';
      case 'REJECTED': return 'bg-[#ef4444]/10 text-[#ef4444] border-red-200';
      default: return 'bg-[#2d1b4e]/30 text-gray-800 border-[#2d1b4e]';
    }
  };

  const getStatusLabel = (status: TransactionStatus) => {
    switch (status) {
      case 'REVIEW': return 'Review';
      case 'APPROVED': return 'Approved';
      case 'INVALID': return 'Invalid';
      case 'REJECTED': return 'Rejected';
      default: return status;
    }
  };

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

  const getDirectionColor = (direction?: string | null) => {
    switch (direction) {
      case 'debit': return 'bg-[#ef4444]/10 text-[#ef4444] border-red-200';
      case 'credit': return 'bg-[#10b981]/10 text-[#10b981] border-green-200';
      case 'transfer': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-[#2d1b4e]/30 text-gray-800 border-[#2d1b4e]';
    }
  };

  const getConfidenceColor = (confidence?: string | null) => {
    if (!confidence) return 'bg-[#2d1b4e]/30 text-gray-800';
    const conf = parseFloat(confidence);
    if (conf >= 0.8) return 'bg-[#10b981]/10 text-[#10b981]';
    if (conf >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-[#ef4444]/10 text-[#ef4444]';
  };

  const getCategoryIcon = (category?: string | null) => {
    switch (category?.toLowerCase()) {
      case 'food':
        return '🍽️';
      case 'transport':
        return '🚗';
      case 'shopping':
        return '🛍️';
      case 'bills':
        return '📄';
      case 'finance':
        return '🏦';
      case 'entertainment':
        return '🎬';
      case 'health':
        return '🏥';
      default:
        return '💳';
    }
  };

  return (
    <div className={`transition-all duration-300 ${isExpanded ? 'bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md' : 'bg-[#1a1625] hover:bg-gray-50'}`}>
      {/* Main Row */}
      <div className="px-8 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-6 flex-1">
          {/* Category Icon */}
          <div className="text-3xl p-2 bg-[#2d1b4e]/30 rounded-xl hover:bg-gray-200 transition-colors">
            {getCategoryIcon(transaction.category)}
          </div>

          {/* Transaction Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-4 mb-2">
              <h3 className="text-lg font-semibold text-[#f8fafc] truncate">
                {transaction.merchant_name || 'Unknown Merchant'}
              </h3>
              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border-2 ${getDirectionColor(transaction.direction)}`}>
                {transaction.direction || 'unknown'}
              </span>
              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border-2 ${getStatusColor(transaction.status)}`}>
                {getStatusLabel(transaction.status)}
              </span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-[#cbd5e1]">
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
              {transaction.ai_notes && (
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <div className="flex space-x-1">
                    {transaction.ai_notes.split(',').slice(0, 3).map((note, index) => (
                      <span key={index} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        {note.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="text-right">
            <div className="text-2xl font-bold text-[#f8fafc] mb-1">
              {formatAmount(transaction.amount, transaction.currency)}
            </div>
            <div className="flex items-center justify-end space-x-2">
              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getConfidenceColor(transaction.confidence)}`}>
                {transaction.confidence ? `${Math.round(parseFloat(transaction.confidence) * 100)}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-6">
          <button
            onClick={onEdit}
            className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-xl transition-all duration-200 transform hover:scale-105"
            title="Edit transaction"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {onReExtract && (
            <button
              onClick={handleReExtract}
              disabled={isReExtracting}
              className={`p-3 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                isReExtracting
                  ? 'text-gray-400 bg-[#2d1b4e]/30 cursor-not-allowed'
                  : 'text-gray-400 hover:text-purple-600 hover:bg-purple-100'
              }`}
              title="Re-extract with AI"
            >
              {isReExtracting ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              )}
            </button>
          )}

          {/* Status Action Buttons */}
          {onStatusUpdate && (
            <>
              {transaction.status !== 'APPROVED' && (
                <button
                  onClick={() => handleStatusUpdate('APPROVED')}
                  disabled={isUpdatingStatus}
                  className={`p-3 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                    isUpdatingStatus
                      ? 'text-gray-400 bg-[#2d1b4e]/30 cursor-not-allowed'
                      : 'text-gray-400 hover:text-green-600 hover:bg-[#10b981]/10'
                  }`}
                  title="Approve transaction"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              )}

              {transaction.status !== 'REJECTED' && (
                <button
                  onClick={() => handleStatusUpdate('REJECTED')}
                  disabled={isUpdatingStatus}
                  className={`p-3 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                    isUpdatingStatus
                      ? 'text-gray-400 bg-[#2d1b4e]/30 cursor-not-allowed'
                      : 'text-gray-400 hover:text-red-600 hover:bg-[#ef4444]/10'
                  }`}
                  title="Reject transaction"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {transaction.status !== 'INVALID' && (
                <button
                  onClick={() => handleStatusUpdate('INVALID')}
                  disabled={isUpdatingStatus}
                  className={`p-3 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                    isUpdatingStatus
                      ? 'text-gray-400 bg-[#2d1b4e]/30 cursor-not-allowed'
                      : 'text-gray-400 hover:text-[#cbd5e1] hover:bg-gray-200'
                  }`}
                  title="Mark as invalid"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </button>
              )}

              {transaction.status !== 'REVIEW' && (
                <button
                  onClick={() => handleStatusUpdate('REVIEW')}
                  disabled={isUpdatingStatus}
                  className={`p-3 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                    isUpdatingStatus
                      ? 'text-gray-400 bg-[#2d1b4e]/30 cursor-not-allowed'
                      : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-100'
                  }`}
                  title="Mark for review"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              )}
            </>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-3 rounded-xl transition-all duration-200 transform hover:scale-105 ${
              isExpanded
                ? 'text-blue-600 bg-blue-100 shadow-md'
                : 'text-gray-400 hover:text-[#cbd5e1] hover:bg-gray-100'
            }`}
            title={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-8 pb-8 border-t border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="pt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Transaction Details */}
            <div className="bg-[#1a1625] rounded-xl p-6 shadow-sm">
              <h4 className="text-lg font-semibold text-[#f8fafc] mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Transaction Details
              </h4>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-[#cbd5e1]">Reference ID</dt>
                  <dd className="text-sm text-[#f8fafc] font-mono bg-[#0f0a1a]/50 px-2 py-1 rounded mt-1">{transaction.reference_id || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[#cbd5e1]">Account Hint</dt>
                  <dd className="text-sm text-[#f8fafc] mt-1">{transaction.account_hint || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[#cbd5e1]">Location</dt>
                  <dd className="text-sm text-[#f8fafc] mt-1">{transaction.location || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[#cbd5e1]">Account Type</dt>
                  <dd className="text-sm text-[#f8fafc] mt-1">
                    {transaction.account_type ? (
                      <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                        {transaction.account_type.replace(/_/g, ' ')}
                      </span>
                    ) : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[#cbd5e1]">Transaction Type</dt>
                  <dd className="text-sm text-[#f8fafc] mt-1">
                    {transaction.transaction_type ? (
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        transaction.transaction_type === 'Dr'
                          ? 'bg-[#ef4444]/10 text-red-700'
                          : 'bg-[#10b981]/10 text-green-700'
                      }`}>
                        {transaction.transaction_type === 'Dr' ? 'Dr (Debit)' : 'Cr (Credit)'}
                      </span>
                    ) : 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Merchant Info */}
            <div className="bg-[#1a1625] rounded-xl p-6 shadow-sm">
              <h4 className="text-lg font-semibold text-[#f8fafc] mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Merchant Info
              </h4>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-[#cbd5e1]">Original Name</dt>
                  <dd className="text-sm text-[#f8fafc] mt-1">{transaction.merchant_name || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[#cbd5e1]">Normalized</dt>
                  <dd className="text-sm text-[#f8fafc] mt-1">{transaction.merchant_normalized || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[#cbd5e1]">Category</dt>
                  <dd className="text-sm text-[#f8fafc] capitalize mt-1">{transaction.category || 'Uncategorized'}</dd>
                </div>
              </dl>
            </div>

            {/* AI & User Notes */}
            <div className="bg-[#1a1625] rounded-xl p-6 shadow-sm">
              <h4 className="text-lg font-semibold text-[#f8fafc] mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Notes
              </h4>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-[#cbd5e1]">AI Keywords</dt>
                  <dd className="mt-2">
                    {transaction.ai_notes ? (
                      <div className="flex flex-wrap gap-2">
                        {transaction.ai_notes.split(',').map((note, index) => (
                          <span
                            key={index}
                            className="inline-block px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full font-medium"
                          >
                            {note.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-sm">No AI notes available</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[#cbd5e1]">User Notes</dt>
                  <dd className="text-sm text-[#f8fafc] mt-1">
                    {transaction.user_notes || (
                      <span className="text-gray-400 italic">No user notes</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Metadata & Actions */}
          <div className="mt-8 pt-6 border-t border-blue-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6 text-sm text-[#cbd5e1]">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Confidence: {transaction.confidence ? `${Math.round(parseFloat(transaction.confidence) * 100)}%` : 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span>Version: {transaction.extraction_version}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Created: {formatDate(transaction.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
                  Re-extract
                </button>
                <button className="px-4 py-2 text-sm font-medium text-green-600 bg-[#10b981]/10 rounded-lg hover:bg-green-200 transition-colors">
                  Approve
                </button>
                <button className="px-4 py-2 text-sm font-medium text-red-600 bg-[#ef4444]/10 rounded-lg hover:bg-red-200 transition-colors">
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
