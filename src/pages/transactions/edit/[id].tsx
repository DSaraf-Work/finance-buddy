import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Database } from '@/types/database';
import InteractiveKeywordSelector from '@/components/InteractiveKeywordSelector';

type EmailProcessed = Database['public']['Tables']['fb_emails_processed']['Row'];
type EmailFetched = Database['public']['Tables']['fb_emails_fetched']['Row'];

interface TransactionEditData extends EmailProcessed {
  email_fetched?: EmailFetched;
}

interface ValidationErrors {
  [key: string]: string;
}

export default function TransactionEditPage() {
  const router = useRouter();
  const { id } = router.query;

  const [email, setEmail] = useState<TransactionEditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reExtracting, setReExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<EmailProcessed>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (id) {
      fetchEmail();
      loadCategories();
    }
  }, [id]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/admin/config/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || ['food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'education', 'travel', 'finance', 'other']);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories(['food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'education', 'travel', 'finance', 'other']);
    }
  };

  const fetchEmail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/emails/processed/${id}`);

      if (!res.ok) {
        throw new Error('Failed to fetch email');
      }

      const data = await res.json();
      setEmail(data);
      setFormData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const validateField = (field: keyof EmailProcessed, value: any): string | null => {
    switch (field) {
      case 'amount':
        if (!value || parseFloat(value) <= 0) {
          return 'Amount must be greater than 0';
        }
        break;
      case 'merchant_name':
        if (!value || value.trim().length === 0) {
          return 'Merchant name is required';
        }
        break;
      case 'currency':
        if (!value) {
          return 'Currency is required';
        }
        break;
      case 'txn_time':
        if (!value) {
          return 'Transaction date is required';
        }
        break;
    }
    return null;
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    const amountError = validateField('amount', formData.amount);
    if (amountError) errors.amount = amountError;

    const merchantError = validateField('merchant_name', formData.merchant_name);
    if (merchantError) errors.merchant_name = merchantError;

    const currencyError = validateField('currency', formData.currency);
    if (currencyError) errors.currency = currencyError;

    const dateError = validateField('txn_time', formData.txn_time);
    if (dateError) errors.txn_time = dateError;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const showToast = (message: string, isError: boolean = false) => {
    setToastMessage(message);
    if (isError) {
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    } else {
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showToast('Please fix validation errors before saving', true);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/emails/processed/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Failed to save changes');
      }

      const data = await res.json();
      setEmail(data);
      setHasUnsavedChanges(false);

      showToast('Transaction updated successfully!');

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/transactions');
      }, 1500);
    } catch (err: any) {
      showToast(`Error: ${err.message}`, true);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof EmailProcessed, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Real-time validation
    const error = validateField(field, value);
    if (error) {
      setValidationErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleReExtract = async () => {
    if (!email?.email_row_id) {
      alert('Cannot re-extract: Email row ID not found');
      return;
    }

    const confirmed = confirm(
      'This will re-extract transaction data from the email using AI. ' +
      'Your current unsaved changes will be lost. Continue?'
    );

    if (!confirmed) return;

    setReExtracting(true);
    try {
      const res = await fetch(`/api/emails/re-extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_row_id: email.email_row_id }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to re-extract transaction');
      }

      const data = await res.json();

      // Refresh the page data
      await fetchEmail();

      alert('Transaction re-extracted successfully!');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setReExtracting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout title="Loading..." description="Loading transaction details">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading transaction...</p>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error || !email) {
    return (
      <ProtectedRoute>
        <Layout title="Error" description="Failed to load transaction">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-800 font-medium">Error: {error || 'Transaction not found'}</p>
              <button
                onClick={() => router.push('/transactions')}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Back to Transactions
              </button>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout
        title="Edit Transaction"
        description="Edit extracted transaction details"
      >
        {/* Toast Notifications */}
        {showSuccessToast && (
          <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
            <div className="bg-[#4ECF9E] text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">{toastMessage}</span>
            </div>
          </div>
        )}

        {showErrorToast && (
          <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
            <div className="bg-[#F45C63] text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="font-medium">{toastMessage}</span>
            </div>
          </div>
        )}

        <div className="min-h-screen bg-[#0A0B0D]">
          {/* Modern Header with Purple Gradient */}
          <div className="bg-gradient-to-r from-[#5D5FEF] to-[#888BFF] text-white px-4 sm:px-6 lg:px-8 py-6 sm:py-8 shadow-lg">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => router.push('/transactions')}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                    aria-label="Back to transactions"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
                      Edit Transaction
                    </h1>
                    <p className="mt-1 text-white/80 text-xs sm:text-sm truncate">
                      {hasUnsavedChanges && '● Unsaved changes'}
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReExtract}
                    disabled={reExtracting}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                    title="Re-extract with AI"
                  >
                    {reExtracting ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Re-extracting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Re-extract
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 pb-32 space-y-4 sm:space-y-6">
            {/* Transaction Details Card */}
            <div className="bg-[#15161A] rounded-xl shadow-sm border border-[#2A2C35] p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-[#F0F1F5] mb-4 sm:mb-6 flex items-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-[#5D5FEF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Transaction Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Amount with Currency Symbol */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#B2B4C2] mb-1.5 sm:mb-2">
                    Amount <span className="text-[#F45C63]">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6F7280] font-medium">
                      {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'GBP' ? '£' : '₹'}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount || ''}
                      onChange={(e) => handleChange('amount', parseFloat(e.target.value))}
                      className={`w-full pl-8 pr-4 py-2.5 sm:py-3 text-base bg-[#1E2026] border ${validationErrors.amount ? 'border-[#F45C63]' : 'border-[#2A2C35]'} rounded-xl text-[#F0F1F5] placeholder-[#6F7280] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[#5D5FEF] transition-all`}
                      placeholder="0.00"
                    />
                  </div>
                  {validationErrors.amount && (
                    <p className="mt-1 text-xs text-[#F45C63] flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {validationErrors.amount}
                    </p>
                  )}
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-[#B2B4C2] mb-2">
                    Currency <span className="text-[#F45C63]">*</span>
                  </label>
                  <select
                    value={formData.currency || 'INR'}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className={`w-full px-4 py-2.5 sm:py-3 bg-[#1E2026] border ${validationErrors.currency ? 'border-[#F45C63]' : 'border-[#2A2C35]'} rounded-xl text-[#F0F1F5] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[#5D5FEF] transition-all`}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                  {validationErrors.currency && (
                    <p className="mt-1 text-xs text-[#F45C63]">{validationErrors.currency}</p>
                  )}
                </div>

                {/* Direction */}
                <div>
                  <label className="block text-sm font-medium text-[#B2B4C2] mb-2">
                    Type
                  </label>
                  <select
                    value={formData.direction || ''}
                    onChange={(e) => handleChange('direction', e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 bg-[#1E2026] border border-[#2A2C35] rounded-xl text-[#F0F1F5] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[#5D5FEF] transition-all"
                  >
                    <option value="">Select type</option>
                    <option value="debit">💸 Debit (Expense)</option>
                    <option value="credit">💰 Credit (Income)</option>
                  </select>
                </div>

                {/* Transaction Time */}
                <div>
                  <label className="block text-sm font-medium text-[#B2B4C2] mb-2">
                    Transaction Date <span className="text-[#F45C63]">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.txn_time ? new Date(formData.txn_time).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleChange('txn_time', e.target.value)}
                    className={`w-full px-4 py-2.5 sm:py-3 bg-[#1E2026] border ${validationErrors.txn_time ? 'border-[#F45C63]' : 'border-[#2A2C35]'} rounded-xl text-[#F0F1F5] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[#5D5FEF] transition-all`}
                  />
                  {validationErrors.txn_time && (
                    <p className="mt-1 text-xs text-[#F45C63]">{validationErrors.txn_time}</p>
                  )}
                </div>

                {/* Merchant Name */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#B2B4C2] mb-2">
                    Merchant Name <span className="text-[#F45C63]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.merchant_name || ''}
                    onChange={(e) => handleChange('merchant_name', e.target.value)}
                    className={`w-full px-4 py-2.5 sm:py-3 bg-[#1E2026] border ${validationErrors.merchant_name ? 'border-[#F45C63]' : 'border-[#2A2C35]'} rounded-xl text-[#F0F1F5] placeholder-[#6F7280] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[#5D5FEF] transition-all`}
                    placeholder="Enter merchant name"
                  />
                  {validationErrors.merchant_name && (
                    <p className="mt-1 text-xs text-[#F45C63]">{validationErrors.merchant_name}</p>
                  )}
                </div>

                {/* Category Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-[#B2B4C2] mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category || ''}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 bg-[#1E2026] border border-[#2A2C35] rounded-xl text-[#F0F1F5] capitalize focus:ring-2 focus:ring-[#5D5FEF] focus:border-[#5D5FEF] transition-all"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat} className="capitalize">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Merchant Normalized */}
                <div>
                  <label className="block text-sm font-medium text-[#B2B4C2] mb-2">
                    Merchant (Normalized)
                  </label>
                  <input
                    type="text"
                    value={formData.merchant_normalized || ''}
                    onChange={(e) => handleChange('merchant_normalized', e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 bg-[#1E2026] border border-[#2A2C35] rounded-xl text-[#F0F1F5] placeholder-[#6F7280] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[#5D5FEF] transition-all"
                    placeholder="Normalized merchant name"
                  />
                </div>

                {/* Transaction Type */}
                <div>
                  <label className="block text-sm font-medium text-[#B2B4C2] mb-2">
                    Transaction Type
                  </label>
                  <input
                    type="text"
                    value={formData.transaction_type || ''}
                    onChange={(e) => handleChange('transaction_type', e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 bg-[#1E2026] border border-[#2A2C35] rounded-xl text-[#F0F1F5] placeholder-[#6F7280] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[#5D5FEF] transition-all"
                    placeholder="e.g., UPI, Card, etc."
                  />
                </div>

                {/* Reference ID */}
                <div>
                  <label className="block text-sm font-medium text-[#B2B4C2] mb-2">
                    Reference ID
                  </label>
                  <input
                    type="text"
                    value={formData.reference_id || ''}
                    onChange={(e) => handleChange('reference_id', e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 bg-[#1E2026] border border-[#2A2C35] rounded-xl text-[#F0F1F5] placeholder-[#6F7280] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[#5D5FEF] transition-all"
                    placeholder="Transaction reference"
                  />
                </div>

                {/* Location */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#B2B4C2] mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 bg-[#1E2026] border border-[#2A2C35] rounded-xl text-[#F0F1F5] placeholder-[#6F7280] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[#5D5FEF] transition-all"
                    placeholder="Transaction location"
                  />
                </div>

                {/* Keywords Selector - Full Width */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#B2B4C2] mb-2">
                    Keywords
                    <span className="ml-2 text-xs text-[#6F7280]">(Optional - helps with categorization)</span>
                  </label>
                  <InteractiveKeywordSelector
                    selectedKeywords={formData.keywords || []}
                    onKeywordsChange={(keywords) => handleChange('keywords', keywords)}
                  />
                </div>

                {/* User Notes - Full Width */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#B2B4C2] mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.user_notes || ''}
                    onChange={(e) => handleChange('user_notes', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-[#1E2026] border border-[#2A2C35] rounded-xl text-[#F0F1F5] placeholder-[#6F7280] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[#5D5FEF] transition-all resize-none"
                    placeholder="Add your notes here..."
                  />
                </div>
              </div>
            </div>

            {/* Account Details Card */}
            <div className="bg-[#15161A] rounded-xl shadow-sm border border-[#2A2C35] p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-[#F0F1F5] mb-4 sm:mb-6 flex items-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-[#5D5FEF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Account Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Account Hint */}
                <div>
                  <label className="block text-sm font-medium text-[#B2B4C2] mb-2">
                    Account Hint
                  </label>
                  <input
                    type="text"
                    value={formData.account_hint || ''}
                    onChange={(e) => handleChange('account_hint', e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 bg-[#1E2026] border border-[#2A2C35] rounded-xl text-[#F0F1F5] placeholder-[#6F7280] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[#5D5FEF] transition-all"
                    placeholder="e.g., Last 4 digits"
                  />
                </div>

                {/* Account Type */}
                <div>
                  <label className="block text-sm font-medium text-[#B2B4C2] mb-2">
                    Account Type
                  </label>
                  <select
                    value={formData.account_type || ''}
                    onChange={(e) => handleChange('account_type', e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 bg-[#1E2026] border border-[#2A2C35] rounded-xl text-[#F0F1F5] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[#5D5FEF] transition-all"
                  >
                    <option value="">Select account type</option>
                    <option value="CREDIT_CARD">💳 Credit Card</option>
                    <option value="DEBIT_CARD">💳 Debit Card</option>
                    <option value="BANK_ACCOUNT">🏦 Bank Account</option>
                    <option value="UPI">📱 UPI</option>
                    <option value="WALLET">👛 Wallet</option>
                    <option value="OTHER">📋 Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Confidence & Status Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Confidence & Status
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Confidence */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confidence Score
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={formData.confidence || 0}
                      onChange={(e) => handleChange('confidence', parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-gray-700 w-16 text-right">
                      {((formData.confidence || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status || 'pending'}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Extraction Version */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Extraction Version
                  </label>
                  <input
                    type="text"
                    value={formData.extraction_version || ''}
                    onChange={(e) => handleChange('extraction_version', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    placeholder="AI extraction version"
                  />
                </div>
              </div>
            </div>

            {/* Notes Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Notes
              </h2>

              <div className="space-y-6">
                {/* AI Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI Notes
                  </label>
                  <textarea
                    value={formData.ai_notes || ''}
                    onChange={(e) => handleChange('ai_notes', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    placeholder="AI-generated notes and observations"
                  />
                </div>

                {/* User Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Notes
                  </label>
                  <textarea
                    value={formData.user_notes || ''}
                    onChange={(e) => handleChange('user_notes', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add your own notes here..."
                  />
                </div>
              </div>
            </div>

            {/* Email Body Card */}
            {email.email_fetched && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Related Email Body
                </h2>

                <div className="space-y-4">
                  {/* Email Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-500">From</p>
                      <p className="text-sm text-gray-900">{email.email_fetched.from_address || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Subject</p>
                      <p className="text-sm text-gray-900">{email.email_fetched.subject || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date</p>
                      <p className="text-sm text-gray-900">
                        {email.email_fetched.internal_date
                          ? new Date(email.email_fetched.internal_date).toLocaleString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Message ID</p>
                      <p className="text-sm text-gray-900 font-mono truncate">
                        {email.email_fetched.message_id}
                      </p>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Email Content</p>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                        {email.email_fetched.plain_body || 'No email body available'}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Floating Action Buttons */}
          <div className="fixed bottom-0 left-0 right-0 bg-[#1a1625] border-t border-[#2d1b4e] shadow-[0_-4px_20px_rgba(0,0,0,0.3)] z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <button
                  onClick={() => router.push('/transactions')}
                  className="px-6 py-3 bg-[#2d1b4e]/30 text-[#cbd5e1] rounded-lg hover:bg-[#2d1b4e]/50 hover:text-[#f8fafc] font-medium transition-all duration-200 border border-[#2d1b4e] hover:border-[#6b4ce6]/50"
                >
                  ← Back to Transactions
                </button>
                <button
                  onClick={handleReExtract}
                  disabled={reExtracting || saving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] text-white rounded-lg hover:from-[#db2777] hover:to-[#7c3aed] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] flex items-center justify-center gap-2"
                  title="Re-extract transaction data from email using AI"
                >
                  {reExtracting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Re-extracting...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      🤖 Re-extract with AI
                    </>
                  )}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || reExtracting}
                  className="flex-1 px-6 py-3 bg-[#6b4ce6] text-white rounded-lg hover:bg-[#8b5cf6] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_0_15px_rgba(107,76,230,0.3)] hover:shadow-[0_0_20px_rgba(107,76,230,0.5)] flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

