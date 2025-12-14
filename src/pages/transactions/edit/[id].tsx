import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import LoadingScreen from '@/components/LoadingScreen';
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
          <LoadingScreen message="Loading transaction details..." />
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error || !email) {
    return (
      <ProtectedRoute>
        <Layout title="Error" description="Failed to load transaction">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-red-50 border border-red-200 rounded-[var(--radius-md)] p-6 text-center">
              <p className="text-red-800 font-medium">Error: {error || 'Transaction not found'}</p>
              <button
                onClick={() => router.push('/transactions')}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-[var(--radius-md)] hover:bg-red-700"
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
            <div className="bg-[var(--color-income)] text-white px-6 py-3 rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">{toastMessage}</span>
            </div>
          </div>
        )}

        {showErrorToast && (
          <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
            <div className="bg-[var(--color-expense)] text-white px-6 py-3 rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="font-medium">{toastMessage}</span>
            </div>
          </div>
        )}

        <div className="min-h-screen bg-[var(--color-bg-app)]">
          {/* Modern Header with Purple Gradient */}
          <div className="bg-gradient-to-r from-[#5D5FEF] to-[#888BFF] text-white px-4 sm:px-6 lg:px-8 py-6 sm:py-8 shadow-[var(--shadow-lg)]">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => router.push('/transactions')}
                    className="p-2 hover:bg-white/20 rounded-[var(--radius-md)] transition-colors flex-shrink-0"
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
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-[var(--radius-md)] transition-colors text-sm font-medium disabled:opacity-50"
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
            <div className="bg-[var(--color-bg-primary)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-[var(--color-text-primary)] mb-4 sm:mb-6 flex items-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-[var(--color-accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Transaction Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* 1. Amount with Currency Symbol - PRIMARY */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 sm:mb-2">
                    Amount <span className="text-[var(--color-expense)]">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] font-medium">
                      {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'GBP' ? '£' : '₹'}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount || ''}
                      onChange={(e) => handleChange('amount', parseFloat(e.target.value))}
                      className={`w-full pl-8 pr-4 py-2.5 sm:py-3 text-base bg-[var(--color-bg-card)] border ${validationErrors.amount ? 'border-[var(--color-expense)]' : 'border-[var(--color-border)]'} rounded-[var(--radius-lg)] text-[var(--color-text-primary)] placeholder-[#6F7280] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[var(--color-accent-primary)] transition-all`}
                      placeholder="0.00"
                    />
                  </div>
                  {validationErrors.amount && (
                    <p className="mt-1 text-xs text-[var(--color-expense)] flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {validationErrors.amount}
                    </p>
                  )}
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Currency <span className="text-[var(--color-expense)]">*</span>
                  </label>
                  <select
                    value={formData.currency || 'INR'}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className={`w-full px-4 py-2.5 sm:py-3 bg-[var(--color-bg-card)] border ${validationErrors.currency ? 'border-[var(--color-expense)]' : 'border-[var(--color-border)]'} rounded-[var(--radius-lg)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[var(--color-accent-primary)] transition-all`}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                  {validationErrors.currency && (
                    <p className="mt-1 text-xs text-[var(--color-expense)]">{validationErrors.currency}</p>
                  )}
                </div>

                {/* 2. Category - CLASSIFICATION */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Category
                    <span className="ml-2 text-xs text-[var(--color-text-muted)]">(Helps organize your transactions)</span>
                  </label>
                  <select
                    value={formData.category || ''}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-[var(--color-text-primary)] capitalize focus:ring-2 focus:ring-[#5D5FEF] focus:border-[var(--color-accent-primary)] transition-all"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat} className="capitalize">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Merchant Name */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Merchant Name <span className="text-[var(--color-expense)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.merchant_name || ''}
                    onChange={(e) => handleChange('merchant_name', e.target.value)}
                    className={`w-full px-4 py-2.5 sm:py-3 bg-[var(--color-bg-card)] border ${validationErrors.merchant_name ? 'border-[var(--color-expense)]' : 'border-[var(--color-border)]'} rounded-[var(--radius-lg)] text-[var(--color-text-primary)] placeholder-[#6F7280] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[var(--color-accent-primary)] transition-all`}
                    placeholder="Enter merchant name"
                  />
                  {validationErrors.merchant_name && (
                    <p className="mt-1 text-xs text-[var(--color-expense)]">{validationErrors.merchant_name}</p>
                  )}
                </div>

                {/* 4. Merchant Normalized */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Merchant (Normalized)
                    <span className="ml-2 text-xs text-[var(--color-text-muted)]">(Standardized merchant name)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.merchant_normalized || ''}
                    onChange={(e) => handleChange('merchant_normalized', e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-[var(--color-text-primary)] placeholder-[#6F7280] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[var(--color-accent-primary)] transition-all"
                    placeholder="Normalized merchant name"
                  />
                </div>

                {/* 5. Account Details - INTEGRATED */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Account Hint
                    <span className="ml-2 text-xs text-[var(--color-text-muted)]">(e.g., Last 4 digits)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.account_hint || ''}
                    onChange={(e) => handleChange('account_hint', e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-[var(--color-text-primary)] placeholder-[#6F7280] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[var(--color-accent-primary)] transition-all"
                    placeholder="e.g., ****1234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Account Type
                  </label>
                  <select
                    value={formData.account_type || ''}
                    onChange={(e) => handleChange('account_type', e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[var(--color-accent-primary)] transition-all"
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

                {/* 6. Type (Direction) */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Transaction Type
                    <span className="ml-2 text-xs text-[var(--color-text-muted)]">(Debit or Credit)</span>
                  </label>
                  <select
                    value={formData.direction || ''}
                    onChange={(e) => handleChange('direction', e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[var(--color-accent-primary)] transition-all"
                  >
                    <option value="">Select type</option>
                    <option value="debit">💸 Debit (Expense)</option>
                    <option value="credit">💰 Credit (Income)</option>
                  </select>
                </div>

                {/* 7. Keywords - IMPROVED */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[var(--color-accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span>Keywords</span>
                    <span className="text-xs text-[var(--color-text-muted)] font-normal">(Add tags to help find this transaction later)</span>
                  </label>
                  <div className="bg-[var(--color-bg-card)]/50 border border-[var(--color-border)] rounded-[var(--radius-lg)] p-3">
                    <InteractiveKeywordSelector
                      value={formData.ai_notes || ''}
                      onChange={(value) => handleChange('ai_notes', value)}
                      merchantName={formData.merchant_name || undefined}
                      transactionAmount={formData.amount ? parseFloat(formData.amount.toString()) : undefined}
                    />
                    <p className="mt-2 text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Examples: "groceries", "monthly", "urgent", "reimbursable"
                    </p>
                  </div>
                </div>

                {/* 8. Other Details - SECONDARY */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Transaction Date <span className="text-[var(--color-expense)]">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.txn_time ? new Date(formData.txn_time).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleChange('txn_time', e.target.value)}
                    className={`w-full px-4 py-2.5 sm:py-3 bg-[var(--color-bg-card)] border ${validationErrors.txn_time ? 'border-[var(--color-expense)]' : 'border-[var(--color-border)]'} rounded-[var(--radius-lg)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[var(--color-accent-primary)] transition-all`}
                  />
                  {validationErrors.txn_time && (
                    <p className="mt-1 text-xs text-[var(--color-expense)]">{validationErrors.txn_time}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Payment Method
                    <span className="ml-2 text-xs text-[var(--color-text-muted)]">(e.g., UPI, Card)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.transaction_type || ''}
                    onChange={(e) => handleChange('transaction_type', e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-[var(--color-text-primary)] placeholder-[#6F7280] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[var(--color-accent-primary)] transition-all"
                    placeholder="e.g., UPI, Credit Card"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Reference ID
                  </label>
                  <input
                    type="text"
                    value={formData.reference_id || ''}
                    onChange={(e) => handleChange('reference_id', e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-[var(--color-text-primary)] placeholder-[#6F7280] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[var(--color-accent-primary)] transition-all"
                    placeholder="Transaction reference"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-[var(--color-text-primary)] placeholder-[#6F7280] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[var(--color-accent-primary)] transition-all"
                    placeholder="Transaction location"
                  />
                </div>

                {/* User Notes - Full Width */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Personal Notes
                    <span className="ml-2 text-xs text-[var(--color-text-muted)]">(Private notes for yourself)</span>
                  </label>
                  <textarea
                    value={formData.user_notes || ''}
                    onChange={(e) => handleChange('user_notes', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-[var(--color-text-primary)] placeholder-[#6F7280] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[var(--color-accent-primary)] transition-all resize-none"
                    placeholder="Add your personal notes here..."
                  />
                </div>
              </div>
            </div>

            {/* Confidence & Status Card */}
            <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] p-6">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-[var(--radius-md)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-[var(--radius-md)] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    placeholder="AI extraction version"
                  />
                </div>
              </div>
            </div>

            {/* Notes Card */}
            <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] p-6">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-[var(--radius-md)] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-[var(--radius-md)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add your own notes here..."
                  />
                </div>
              </div>
            </div>

            {/* Email Body Card */}
            {email.email_fetched && (
              <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] p-6">
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
                    <div className="bg-gray-50 rounded-[var(--radius-md)] p-4 max-h-96 overflow-y-auto">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                        {email.email_fetched.plain_body || 'No email body available'}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Action Bar - Mobile Optimized with Safe Area */}
          <div className="fixed bottom-0 left-0 right-0 bg-[var(--color-bg-primary)]/95 backdrop-blur-md border-t border-[var(--color-border)] shadow-[0_-8px_32px_rgba(0,0,0,0.4)] z-50 pb-safe">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
              {/* Primary Actions - Prominent */}
              <div className="flex flex-col gap-3 mb-3">
                {/* Save Button - Primary Action (Top) */}
                <button
                  onClick={handleSave}
                  disabled={saving || reExtracting}
                  className="w-full min-h-[56px] px-6 py-4 bg-gradient-to-r from-[#5D5FEF] to-[#888BFF] text-white rounded-[var(--radius-lg)] hover:shadow-[var(--shadow-xl)] hover:shadow-[#5D5FEF]/40 active:scale-[0.98] font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-lg">Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-lg">Save Changes</span>
                    </>
                  )}
                </button>

                {/* Re-extract Button - Secondary Action */}
                <button
                  onClick={handleReExtract}
                  disabled={reExtracting || saving}
                  className="w-full min-h-[52px] px-6 py-3.5 bg-[var(--color-bg-card)] text-[var(--color-text-primary)] rounded-[var(--radius-lg)] hover:bg-[var(--color-border)] active:scale-[0.98] font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2.5 border border-[var(--color-border)] hover:border-[var(--color-accent-primary)]/50"
                  title="Re-extract transaction data from email using AI"
                >
                  {reExtracting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Re-extracting with AI...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span>Re-extract with AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* Back Button - Tertiary Action */}
              <button
                onClick={() => router.push('/transactions')}
                className="w-full min-h-[44px] px-4 py-2.5 bg-transparent text-[var(--color-text-secondary)] rounded-[var(--radius-md)] hover:bg-[var(--color-bg-card)] active:scale-[0.98] font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Transactions</span>
              </button>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

