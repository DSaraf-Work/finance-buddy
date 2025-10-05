import React, { useState, useEffect } from 'react';
import { ReviewTransaction } from '@/pages/review_route';

interface ReviewEditModalProps {
  transaction: ReviewTransaction;
  onSave: (transaction: ReviewTransaction) => void;
  onClose: () => void;
}

const ReviewEditModal: React.FC<ReviewEditModalProps> = ({
  transaction,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<ReviewTransaction>(transaction);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleChange = (field: keyof ReviewTransaction, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          style={{ borderRadius: '18px' }}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl z-10">
            <div className="flex items-center justify-between">
              <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
                Edit Transaction
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {/* Primary Section */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Amount */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={e => handleChange('amount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Currency */}
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <input
                    id="currency"
                    type="text"
                    value={formData.currency || ''}
                    onChange={e => handleChange('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="INR"
                  />
                </div>

                {/* Direction */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Direction *
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleChange('direction', 'debit')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        formData.direction === 'debit'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Debit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('direction', 'credit')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        formData.direction === 'credit'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Credit
                    </button>
                  </div>
                </div>

                {/* Date/Time */}
                <div>
                  <label htmlFor="txn_time" className="block text-sm font-medium text-gray-700 mb-1">
                    Date/Time *
                  </label>
                  <input
                    id="txn_time"
                    type="datetime-local"
                    value={formData.txn_time ? formData.txn_time.slice(0, 16) : ''}
                    onChange={e => handleChange('txn_time', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Merchant Name */}
                <div>
                  <label htmlFor="merchant_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Merchant Name
                  </label>
                  <input
                    id="merchant_name"
                    type="text"
                    value={formData.merchant_name || ''}
                    onChange={e => handleChange('merchant_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={200}
                  />
                </div>

                {/* Merchant Normalized */}
                <div>
                  <label htmlFor="merchant_normalized" className="block text-sm font-medium text-gray-700 mb-1">
                    Merchant (Normalized)
                  </label>
                  <input
                    id="merchant_normalized"
                    type="text"
                    value={formData.merchant_normalized || ''}
                    onChange={e => handleChange('merchant_normalized', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={200}
                  />
                </div>

                {/* Category */}
                <div className="md:col-span-2">
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    id="category"
                    type="text"
                    value={formData.category || ''}
                    onChange={e => handleChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Food, Transport, Shopping"
                    maxLength={200}
                  />
                </div>
              </div>
            </section>

            {/* Account Section */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="account_hint" className="block text-sm font-medium text-gray-700 mb-1">
                    Account Hint
                  </label>
                  <input
                    id="account_hint"
                    type="text"
                    value={formData.account_hint || ''}
                    onChange={e => handleChange('account_hint', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., HDFC ****1234"
                  />
                </div>
                <div>
                  <label htmlFor="account_type" className="block text-sm font-medium text-gray-700 mb-1">
                    Account Type
                  </label>
                  <input
                    id="account_type"
                    type="text"
                    value={formData.account_type || ''}
                    onChange={e => handleChange('account_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Savings, Credit Card"
                  />
                </div>
              </div>
            </section>

            {/* Source Section */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Source Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reference_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Reference ID
                  </label>
                  <input
                    id="reference_id"
                    type="text"
                    value={formData.reference_id || ''}
                    onChange={e => handleChange('reference_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={formData.location || ''}
                    onChange={e => handleChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Row ID (Read-only)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={formData.email_row_id}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formData.email_row_id)}
                      className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      aria-label="Copy email row ID"
                      title="Copy to clipboard"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Meta Section */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Meta Information</h3>
              <div className="space-y-4">
                {/* Confidence */}
                <div>
                  <label htmlFor="confidence" className="block text-sm font-medium text-gray-700 mb-1">
                    Confidence (0-1)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      id="confidence"
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={formData.confidence || 0}
                      onChange={e => handleChange('confidence', e.target.value)}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={formData.confidence || 0}
                      onChange={e => handleChange('confidence', e.target.value)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* AI Notes (Read-only) */}
                <div>
                  <label htmlFor="ai_notes" className="block text-sm font-medium text-gray-700 mb-1">
                    AI Notes (Read-only)
                  </label>
                  <textarea
                    id="ai_notes"
                    value={formData.ai_notes || 'No AI notes available'}
                    readOnly
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 resize-none"
                  />
                </div>

                {/* User Notes */}
                <div>
                  <label htmlFor="user_notes" className="block text-sm font-medium text-gray-700 mb-1">
                    User Notes
                  </label>
                  <textarea
                    id="user_notes"
                    value={formData.user_notes || ''}
                    onChange={e => handleChange('user_notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Add your notes here..."
                  />
                </div>
              </div>
            </section>

            {/* Read-only System Fields */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information (Read-only)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={formData.id}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formData.id)}
                      className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      aria-label="Copy ID"
                      title="Copy to clipboard"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Google User ID</label>
                  <input
                    type="text"
                    value={formData.google_user_id}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Connection ID</label>
                  <input
                    type="text"
                    value={formData.connection_id || 'N/A'}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Extraction Version</label>
                  <input
                    type="text"
                    value={formData.extraction_version || 'N/A'}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                  <input
                    type="text"
                    value={new Date(formData.created_at).toLocaleString()}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Updated At</label>
                  <input
                    type="text"
                    value={new Date(formData.updated_at).toLocaleString()}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 text-sm"
                  />
                </div>
              </div>
            </section>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewEditModal;

