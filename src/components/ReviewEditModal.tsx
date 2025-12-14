import React, { useState, useEffect } from 'react';
import { ReviewTransaction } from '@/pages/review_route';
import LoadingScreen from './LoadingScreen';

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
  const [emailBody, setEmailBody] = useState<string | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    // Fetch email body when modal opens
    if (transaction.email_row_id) {
      fetchEmailBody(transaction.email_row_id);
    }
  }, [transaction.email_row_id]);

  const fetchEmailBody = async (emailRowId: string) => {
    try {
      setLoadingEmail(true);
      const response = await fetch(`/api/emails/${emailRowId}`);
      if (response.ok) {
        const data = await response.json();
        setEmailBody(data.plain_body || null);
      }
    } catch (error) {
      console.error('Error fetching email body:', error);
    } finally {
      setLoadingEmail(false);
    }
  };

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
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-[#1a1625] rounded-[var(--radius-lg)] shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-[#2d1b4e] max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-[#0f0a1a]/95 backdrop-blur-sm border-b border-[#2d1b4e] px-6 py-4 rounded-t-xl z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#6b4ce6] to-[#8b5cf6] rounded-[var(--radius-md)] flex items-center justify-center shadow-[0_0_15px_rgba(107,76,230,0.3)]">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 id="modal-title" className="text-xl sm:text-2xl font-bold text-[#f8fafc]">
                  Edit Transaction
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#2d1b4e]/30 p-2 rounded-[var(--radius-md)] transition-all duration-200"
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
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6 sm:space-y-8">
            {/* Primary Section */}
            <section>
              <h3 className="text-base sm:text-lg font-semibold text-[#f8fafc] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#6b4ce6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Primary Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Amount */}
                <div>
                  <label htmlFor="amount" className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 uppercase tracking-wide">
                    Amount *
                  </label>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={e => handleChange('amount', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0f0a1a] border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#f8fafc] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] transition-all duration-200"
                    required
                  />
                </div>

                {/* Currency */}
                <div>
                  <label htmlFor="currency" className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 uppercase tracking-wide">
                    Currency
                  </label>
                  <input
                    id="currency"
                    type="text"
                    value={formData.currency || ''}
                    onChange={e => handleChange('currency', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0f0a1a] border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#f8fafc] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] transition-all duration-200"
                    placeholder="INR"
                  />
                </div>

                {/* Direction */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 uppercase tracking-wide">
                    Direction *
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleChange('direction', 'debit')}
                      className={`flex-1 px-4 py-2.5 rounded-[var(--radius-md)] font-medium transition-all duration-200 ${
                        formData.direction === 'debit'
                          ? 'bg-[#ef4444] text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] border border-[#ef4444]'
                          : 'bg-[#2d1b4e]/30 text-[#cbd5e1] hover:bg-[#2d1b4e]/50 border border-[#2d1b4e] hover:border-[#ef4444]/50'
                      }`}
                    >
                      Debit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('direction', 'credit')}
                      className={`flex-1 px-4 py-2.5 rounded-[var(--radius-md)] font-medium transition-all duration-200 ${
                        formData.direction === 'credit'
                          ? 'bg-[#10b981] text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-[#10b981]'
                          : 'bg-[#2d1b4e]/30 text-[#cbd5e1] hover:bg-[#2d1b4e]/50 border border-[#2d1b4e] hover:border-[#10b981]/50'
                      }`}
                    >
                      Credit
                    </button>
                  </div>
                </div>

                {/* Date/Time */}
                <div>
                  <label htmlFor="txn_time" className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 uppercase tracking-wide">
                    Date/Time *
                  </label>
                  <input
                    id="txn_time"
                    type="datetime-local"
                    value={formData.txn_time ? formData.txn_time.slice(0, 16) : ''}
                    onChange={e => handleChange('txn_time', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0f0a1a] border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#f8fafc] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] transition-all duration-200"
                    required
                  />
                </div>

                {/* Merchant Name */}
                <div>
                  <label htmlFor="merchant_name" className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 uppercase tracking-wide">
                    Merchant Name
                  </label>
                  <input
                    id="merchant_name"
                    type="text"
                    value={formData.merchant_name || ''}
                    onChange={e => handleChange('merchant_name', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0f0a1a] border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#f8fafc] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] transition-all duration-200"
                    maxLength={200}
                  />
                </div>

                {/* Merchant Normalized */}
                <div>
                  <label htmlFor="merchant_normalized" className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 uppercase tracking-wide">
                    Merchant (Normalized)
                  </label>
                  <input
                    id="merchant_normalized"
                    type="text"
                    value={formData.merchant_normalized || ''}
                    onChange={e => handleChange('merchant_normalized', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0f0a1a] border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#f8fafc] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] transition-all duration-200"
                    maxLength={200}
                  />
                </div>

                {/* Category */}
                <div className="md:col-span-2">
                  <label htmlFor="category" className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 uppercase tracking-wide">
                    Category
                  </label>
                  <input
                    id="category"
                    type="text"
                    value={formData.category || ''}
                    onChange={e => handleChange('category', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0f0a1a] border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#f8fafc] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] transition-all duration-200"
                    placeholder="e.g., Food, Transport, Shopping"
                    maxLength={200}
                  />
                </div>
              </div>
            </section>

            {/* Account Section */}
            <section>
              <h3 className="text-base sm:text-lg font-semibold text-[#f8fafc] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#6b4ce6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Account Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="account_hint" className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 uppercase tracking-wide">
                    Account Hint
                  </label>
                  <input
                    id="account_hint"
                    type="text"
                    value={formData.account_hint || ''}
                    onChange={e => handleChange('account_hint', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0f0a1a] border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#f8fafc] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] transition-all duration-200"
                    placeholder="e.g., HDFC ****1234"
                  />
                </div>
                <div>
                  <label htmlFor="account_type" className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 uppercase tracking-wide">
                    Account Type
                  </label>
                  <input
                    id="account_type"
                    type="text"
                    value={formData.account_type || ''}
                    onChange={e => handleChange('account_type', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0f0a1a] border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#f8fafc] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] transition-all duration-200"
                    placeholder="e.g., Savings, Credit Card"
                  />
                </div>
              </div>
            </section>

            {/* Source Section */}
            <section>
              <h3 className="text-base sm:text-lg font-semibold text-[#f8fafc] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#6b4ce6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Source Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reference_id" className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 uppercase tracking-wide">
                    Reference ID
                  </label>
                  <input
                    id="reference_id"
                    type="text"
                    value={formData.reference_id || ''}
                    onChange={e => handleChange('reference_id', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0f0a1a] border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#f8fafc] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="location" className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 uppercase tracking-wide">
                    Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={formData.location || ''}
                    onChange={e => handleChange('location', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0f0a1a] border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#f8fafc] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] transition-all duration-200"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 uppercase tracking-wide">
                    Email Row ID (Read-only)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.email_row_id}
                      readOnly
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0f0a1a]/50 border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#94a3b8] cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formData.email_row_id)}
                      className="px-3 py-2 text-[#cbd5e1] hover:text-[#f8fafc] hover:bg-[#2d1b4e]/30 rounded-[var(--radius-md)] transition-all duration-200"
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
              <h3 className="text-base sm:text-lg font-semibold text-[#f8fafc] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#6b4ce6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Meta Information
              </h3>
              <div className="space-y-4">
                {/* Confidence */}
                <div>
                  <label htmlFor="confidence" className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 uppercase tracking-wide">
                    Confidence (0-1)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      id="confidence"
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={formData.confidence || 0}
                      onChange={e => handleChange('confidence', e.target.value)}
                      className="flex-1 h-2 bg-[#2d1b4e] rounded-[var(--radius-md)] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#6b4ce6] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(107,76,230,0.5)]"
                    />
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={formData.confidence || 0}
                      onChange={e => handleChange('confidence', e.target.value)}
                      className="w-20 px-3 py-2 bg-[#0f0a1a] border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#f8fafc] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] transition-all duration-200"
                    />
                  </div>
                </div>

                {/* AI Notes (Read-only) */}
                <div>
                  <label htmlFor="ai_notes" className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 uppercase tracking-wide">
                    AI Notes (Read-only)
                  </label>
                  <textarea
                    id="ai_notes"
                    value={formData.ai_notes || 'No AI notes available'}
                    readOnly
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0f0a1a]/50 border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#94a3b8] resize-none cursor-not-allowed"
                  />
                </div>

                {/* User Notes */}
                <div>
                  <label htmlFor="user_notes" className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 uppercase tracking-wide">
                    User Notes
                  </label>
                  <textarea
                    id="user_notes"
                    value={formData.user_notes || ''}
                    onChange={e => handleChange('user_notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0f0a1a] border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#f8fafc] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] resize-none transition-all duration-200"
                    placeholder="Add your notes here..."
                  />
                </div>
              </div>
            </section>

            {/* Read-only System Fields */}
            <section>
              <h3 className="text-base sm:text-lg font-semibold text-[#f8fafc] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#6b4ce6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                System Information (Read-only)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 uppercase tracking-wide">ID</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.id}
                      readOnly
                      className="flex-1 px-3 py-2 bg-[#0f0a1a]/50 border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#94a3b8] text-xs sm:text-sm cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formData.id)}
                      className="px-3 py-2 text-[#cbd5e1] hover:text-[#f8fafc] hover:bg-[#2d1b4e]/30 rounded-[var(--radius-md)] transition-all duration-200"
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
                  <label className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 uppercase tracking-wide">Google User ID</label>
                  <input
                    type="text"
                    value={formData.google_user_id}
                    readOnly
                    className="w-full px-3 py-2 bg-[#0f0a1a]/50 border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#94a3b8] text-xs sm:text-sm cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 uppercase tracking-wide">Connection ID</label>
                  <input
                    type="text"
                    value={formData.connection_id || 'N/A'}
                    readOnly
                    className="w-full px-3 py-2 bg-[#0f0a1a]/50 border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#94a3b8] text-xs sm:text-sm cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 uppercase tracking-wide">Extraction Version</label>
                  <input
                    type="text"
                    value={formData.extraction_version || 'N/A'}
                    readOnly
                    className="w-full px-3 py-2 bg-[#0f0a1a]/50 border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#94a3b8] text-xs sm:text-sm cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 uppercase tracking-wide">Created At</label>
                  <input
                    type="text"
                    value={new Date(formData.created_at).toLocaleString()}
                    readOnly
                    className="w-full px-3 py-2 bg-[#0f0a1a]/50 border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#94a3b8] text-xs sm:text-sm cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 uppercase tracking-wide">Updated At</label>
                  <input
                    type="text"
                    value={new Date(formData.updated_at).toLocaleString()}
                    readOnly
                    className="w-full px-3 py-2 bg-[#0f0a1a]/50 border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#94a3b8] text-xs sm:text-sm cursor-not-allowed"
                  />
                </div>
              </div>
            </section>

            {/* Email Body Section */}
            <section>
              <h3 className="text-base sm:text-lg font-semibold text-[#f8fafc] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#6b4ce6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Original Email Body
              </h3>

              {loadingEmail ? (
                <LoadingScreen message="Loading email body..." fullScreen={false} size="sm" />
              ) : emailBody ? (
                <div className="bg-[#0f0a1a] border border-[#2d1b4e] rounded-[var(--radius-md)] p-4 max-h-96 overflow-y-auto">
                  <div
                    className="prose prose-sm max-w-none text-[#cbd5e1] whitespace-pre-wrap [&_a]:text-[#6b4ce6] [&_a:hover]:text-[#8b5cf6]"
                    dangerouslySetInnerHTML={{ __html: emailBody }}
                  />
                </div>
              ) : (
                <div className="bg-[#0f0a1a] border border-[#2d1b4e] rounded-[var(--radius-md)] p-4 text-center">
                  <svg className="w-12 h-12 mx-auto mb-2 text-[#2d1b4e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-[#94a3b8]">No email body available</p>
                </div>
              )}
            </section>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-[#2d1b4e]">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border border-[#2d1b4e] text-[#cbd5e1] font-medium rounded-[var(--radius-md)] hover:bg-[#2d1b4e]/30 hover:border-[#6b4ce6]/50 focus:outline-none focus:ring-2 focus:ring-[#6b4ce6] focus:ring-offset-2 focus:ring-offset-[#1a1625] transition-all duration-200"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#6b4ce6] text-white font-medium rounded-[var(--radius-md)] hover:bg-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#6b4ce6] focus:ring-offset-2 focus:ring-offset-[#1a1625] transition-all duration-200 shadow-[0_0_15px_rgba(107,76,230,0.3)] hover:shadow-[0_0_20px_rgba(107,76,230,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewEditModal;

