import { useState, useEffect } from 'react';
import { Transaction } from '@/pages/transactions';
import InteractiveKeywordSelector from './InteractiveKeywordSelector';
import LoadingScreen from './LoadingScreen';
import SplitwiseDropdown from './SplitwiseDropdown';

interface TransactionModalProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTransaction: Transaction) => void;
}

export default function TransactionModal({ transaction, isOpen, onClose, onSave }: TransactionModalProps) {
  const [formData, setFormData] = useState<Transaction>(transaction);
  const [isLoading, setIsLoading] = useState(false);
  const [emailBody, setEmailBody] = useState<string | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [isReExtracting, setIsReExtracting] = useState(false);
  const [accountTypes, setAccountTypes] = useState<string[]>(['OTHER']); // Default fallback, will be populated from DB
  const [splitwiseMessage, setSplitwiseMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setFormData(transaction);

    // Fetch email body when modal opens
    if (isOpen && transaction.email_row_id) {
      fetchEmailBody(transaction.email_row_id);
    }
  }, [transaction, isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof Transaction, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Fetch user's account types on mount
  useEffect(() => {
    const fetchAccountTypes = async () => {
      try {
        const response = await fetch('/api/admin/config/bank-account-types', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Fetched account types:', data);

          // Generate account type enums from the fetched data
          const enums: string[] = [];

          // Generate account type enums from email addresses
          for (const email of data.accountTypes || []) {
            const match = email.match(/@([^.]+)/);
            if (match) {
              const bankName = match[1].toUpperCase();
              enums.push(`${bankName}_DEBIT`);
              enums.push(`${bankName}_CREDIT`);
              enums.push(`${bankName}_BANK`);
              enums.push(bankName);
            }
          }

          // Fetch and add custom account types from database
          const customResponse = await fetch('/api/admin/config/custom-account-types', {
            method: 'GET',
            credentials: 'include',
          });

          if (customResponse.ok) {
            const customData = await customResponse.json();
            console.log('✅ Fetched custom account types:', customData);
            enums.push(...(customData.customAccountTypes || []));
          }

          // Add OTHER as fallback
          enums.push('OTHER');

          // Remove duplicates and set
          const uniqueEnums = Array.from(new Set(enums));
          console.log('✅ Final account type enums:', uniqueEnums);
          setAccountTypes(uniqueEnums);
        }
      } catch (error) {
        console.error('Error fetching account types:', error);
        // Keep default account types on error
      }
    };

    if (isOpen) {
      fetchAccountTypes();
    }
  }, [isOpen]);

  const handleReExtract = async () => {
    if (!transaction.id) {
      alert('Transaction ID is missing');
      return;
    }

    if (!confirm('Re-extract this transaction with AI? This will overwrite the current data with fresh AI extraction.')) {
      return;
    }

    setIsReExtracting(true);

    try {
      const response = await fetch('/api/transactions/re-extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ transactionId: transaction.id }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Re-extraction successful:', result);

        // Update form data with re-extracted values
        setFormData(prev => ({
          ...prev,
          ...result.extractionResult,
          confidence: result.extractionResult.confidence,
        }));

        // Show success message
        alert(`Re-extraction completed! Confidence: ${Math.round(result.extractionResult.confidence * 100)}%`);
      } else {
        const error = await response.json();
        console.error('❌ Re-extraction failed:', error);
        alert(`Re-extraction failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Error re-extracting transaction:', error);
      alert('Failed to re-extract transaction. Please try again.');
    } finally {
      setIsReExtracting(false);
    }
  };

  const [categories, setCategories] = useState<string[]>([
    'food', 'transport', 'shopping', 'bills', 'entertainment',
    'health', 'education', 'travel', 'finance', 'other'
  ]);

  // Load categories from database
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch('/api/admin/config/categories');
        if (res.ok) {
          const data = await res.json();
          if (data.categories && data.categories.length > 0) {
            setCategories(data.categories);
          }
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  const directions = ['debit', 'credit', 'transfer'];

  const transactionTypes = ['Dr', 'Cr'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-[var(--color-bg-app)]/50 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        ></div>

        {/* This element is to trick the browser into centering the modal contents. */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal */}
        <div className="relative inline-block align-bottom bg-[var(--color-bg-card)] rounded-[var(--radius-md)] text-left overflow-hidden shadow-[var(--shadow-xl)] transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-[var(--color-bg-card)] px-6 py-4 border-b border-[var(--color-border)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 id="modal-title" className="text-lg font-semibold text-[var(--color-text-primary)]">
                  Edit Transaction
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  Update transaction details and add your notes
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {/* Splitwise Button */}
                {formData.amount && parseFloat(formData.amount) > 0 && (
                  <SplitwiseDropdown
                    transactionAmount={parseFloat(formData.amount)}
                    transactionDescription={formData.merchant_name || formData.merchant_normalized || 'Expense'}
                    transactionDate={formData.txn_time?.split('T')[0]}
                    currencyCode={formData.currency || 'INR'}
                    onSuccess={() => {
                      setSplitwiseMessage({ type: 'success', text: 'Expense split created on Splitwise!' });
                      setTimeout(() => setSplitwiseMessage(null), 5000);
                    }}
                    onError={(error) => {
                      setSplitwiseMessage({ type: 'error', text: error });
                      setTimeout(() => setSplitwiseMessage(null), 5000);
                    }}
                  />
                )}
                {/* Re-extract with AI Button */}
                <button
                  type="button"
                  onClick={handleReExtract}
                  disabled={isReExtracting}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-accent-primary)] border border-transparent rounded-[var(--radius-md)] hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Re-extract transaction data using AI"
                >
                  {isReExtracting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Re-extracting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Re-extract with AI
                    </>
                  )}
                </button>
                {/* Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-[var(--radius-md)] bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-2"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Splitwise Message Toast */}
          {splitwiseMessage && (
            <div className={`px-4 py-3 flex items-center justify-between ${
              splitwiseMessage.type === 'success'
                ? 'bg-emerald-500/20 border-b border-emerald-500/30'
                : 'bg-red-500/20 border-b border-red-500/30'
            }`}>
              <div className="flex items-center">
                {splitwiseMessage.type === 'success' ? (
                  <svg className="w-5 h-5 text-emerald-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className={`text-sm ${splitwiseMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {splitwiseMessage.text}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSplitwiseMessage(null)}
                className={`text-sm ${splitwiseMessage.type === 'success' ? 'text-emerald-400 hover:text-emerald-300' : 'text-red-400 hover:text-red-300'}`}
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-[var(--color-bg-card)]">
            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-8">
                {/* Transaction Details Section */}
                <div className="bg-[var(--color-bg-app)]/50 rounded-[var(--radius-md)] p-6">
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-[var(--color-accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Transaction Details
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Transaction Date
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.txn_time ? new Date(formData.txn_time).toISOString().slice(0, 16) : ''}
                        onChange={(e) => handleInputChange('txn_time', e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] transition-colors bg-[var(--color-bg-app)] text-[var(--color-text-primary)]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.amount || ''}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] transition-colors bg-[var(--color-bg-app)] text-[var(--color-text-primary)]"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Currency
                      </label>
                      <select
                        value={formData.currency || ''}
                        onChange={(e) => handleInputChange('currency', e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] transition-colors bg-[var(--color-bg-app)] text-[var(--color-text-primary)]"
                      >
                        <option value="">Select Currency</option>
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Direction
                      </label>
                      <select
                        value={formData.direction || ''}
                        onChange={(e) => handleInputChange('direction', e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] transition-colors bg-[var(--color-bg-app)] text-[var(--color-text-primary)]"
                      >
                        <option value="">Select Direction</option>
                        {directions.map(direction => (
                          <option key={direction} value={direction}>
                            {direction.charAt(0).toUpperCase() + direction.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Merchant Information Section */}
                <div className="bg-[#0f0a1a]/50 rounded-[var(--radius-md)] p-6">
                  <h4 className="text-lg font-semibold text-[#f8fafc] mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Merchant Information
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Merchant Name
                      </label>
                      <input
                        type="text"
                        value={formData.merchant_name || ''}
                        onChange={(e) => handleInputChange('merchant_name', e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] transition-colors bg-[var(--color-bg-app)] text-[var(--color-text-primary)]"
                        placeholder="e.g., Starbucks Coffee #123"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Normalized Merchant
                      </label>
                      <input
                        type="text"
                        value={formData.merchant_normalized || ''}
                        onChange={(e) => handleInputChange('merchant_normalized', e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] transition-colors bg-[var(--color-bg-app)] text-[var(--color-text-primary)]"
                        placeholder="e.g., Starbucks"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Category
                      </label>
                      <select
                        value={formData.category || ''}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] transition-colors bg-[var(--color-bg-app)] text-[var(--color-text-primary)]"
                      >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.location || ''}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] transition-colors bg-[var(--color-bg-app)] text-[var(--color-text-primary)]"
                        placeholder="e.g., New York, NY"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Details Section */}
                <div className="bg-[#0f0a1a]/50 rounded-[var(--radius-md)] p-6">
                  <h4 className="text-lg font-semibold text-[#f8fafc] mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Additional Details
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Reference ID
                      </label>
                      <input
                        type="text"
                        value={formData.reference_id || ''}
                        onChange={(e) => handleInputChange('reference_id', e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] transition-colors bg-[var(--color-bg-app)] text-[var(--color-text-primary)]"
                        placeholder="e.g., TXN123456"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Account Hint
                      </label>
                      <input
                        type="text"
                        value={formData.account_hint || ''}
                        onChange={(e) => handleInputChange('account_hint', e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] transition-colors bg-[var(--color-bg-app)] text-[var(--color-text-primary)]"
                        placeholder="e.g., ****1234"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Account Type
                      </label>
                      <select
                        value={formData.account_type || ''}
                        onChange={(e) => handleInputChange('account_type', e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] transition-colors bg-[var(--color-bg-app)] text-[var(--color-text-primary)]"
                      >
                        <option value="">Select Account Type</option>
                        {accountTypes.map(type => (
                          <option key={type} value={type}>
                            {type.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Transaction Type
                      </label>
                      <select
                        value={formData.transaction_type || ''}
                        onChange={(e) => handleInputChange('transaction_type', e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] transition-colors bg-[var(--color-bg-app)] text-[var(--color-text-primary)]"
                      >
                        <option value="">Select Transaction Type</option>
                        {transactionTypes.map(type => (
                          <option key={type} value={type}>
                            {type === 'Dr' ? 'Dr (Debit)' : 'Cr (Credit)'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="bg-[#0f0a1a]/50 rounded-[var(--radius-md)] p-6">
                  <h4 className="text-lg font-semibold text-[#f8fafc] mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Notes & Comments
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#cbd5e1] mb-3">
                        Transaction Keywords
                      </label>
                      <InteractiveKeywordSelector
                        value={formData.ai_notes || ''}
                        onChange={(value) => handleInputChange('ai_notes', value)}
                        merchantName={formData.merchant_name || undefined}
                        transactionAmount={formData.amount ? parseFloat(formData.amount.toString()) : undefined}
                        placeholder="Select keywords to categorize this transaction..."
                      />
                      <p className="text-xs text-[var(--color-text-muted)] mt-2">
                        Select relevant keywords to help categorize and search for this transaction. Smart suggestions are provided based on the merchant.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Your Notes
                      </label>
                      <textarea
                        value={formData.user_notes || ''}
                        onChange={(e) => handleInputChange('user_notes', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-[#2d1b4e] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                        placeholder="Add your personal notes about this transaction..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Body Section */}
            <div className="bg-[#0f0a1a]/50 rounded-[var(--radius-md)] p-6">
              <h4 className="text-lg font-semibold text-[#f8fafc] mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-[var(--color-accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Original Email Body
              </h4>

              {loadingEmail ? (
                <LoadingScreen message="Loading email body..." fullScreen={false} size="sm" />
              ) : emailBody ? (
                <div className="bg-[#1a1625] border border-[#2d1b4e] rounded-[var(--radius-md)] p-4 max-h-96 overflow-y-auto">
                  <div
                    className="prose prose-sm max-w-none text-[#cbd5e1] whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: emailBody }}
                  />
                </div>
              ) : (
                <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 text-center text-[var(--color-text-muted)]">
                  <svg className="w-12 h-12 mx-auto mb-2 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p>No email body available</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-[#0f0a1a]/50 px-6 py-4 border-t border-[#2d1b4e]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-[#cbd5e1]">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-[var(--color-accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Confidence: {formData.confidence ? `${Math.round(parseFloat(formData.confidence) * 100)}%` : 'N/A'}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Last updated: {formData.updated_at ? new Date(formData.updated_at).toLocaleDateString() : 'Never'}
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-[#cbd5e1] bg-[#1a1625] border border-[#2d1b4e] rounded-[var(--radius-md)] hover:bg-[#0f0a1a]/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-accent-primary)] border border-transparent rounded-[var(--radius-md)] hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[var(--color-text-primary)]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
