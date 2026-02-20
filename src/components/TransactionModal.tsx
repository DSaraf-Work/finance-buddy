import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@/pages/transactions';
import InteractiveKeywordSelector from './InteractiveKeywordSelector';
import LoadingScreen from './LoadingScreen';
import SplitwiseDropdown from './SplitwiseDropdown';
import {
  SubTransactionEditor,
  SubTransactionList,
} from '@/components/sub-transactions';
import type {
  SubTransactionPublic,
  SubTransactionValidation,
  CreateSubTransactionInput,
  SubTransactionListResponse,
} from '@/types/sub-transactions';
import {
  Pencil,
  Store,
  FileText,
  Mail,
  StickyNote,
  Layers,
  ChevronDown,
  Wand2,
  Loader2,
  Users,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ModalToast } from '@/components/ui/modal-toast';

interface TransactionModalProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTransaction: Transaction) => void;
  onTransactionUpdated?: (updatedTransaction: Transaction) => void;
}

export default function TransactionModal({ transaction, isOpen, onClose, onSave, onTransactionUpdated }: TransactionModalProps) {
  const [formData, setFormData] = useState<Transaction>(transaction);
  const [isLoading, setIsLoading] = useState(false);
  const [emailData, setEmailData] = useState<{ body: string | null; subject: string | null; from: string | null } | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [isReExtracting, setIsReExtracting] = useState(false);
  const [accountTypes, setAccountTypes] = useState<string[]>(['OTHER']);
  const [splitwiseMessage, setSplitwiseMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [reExtractMessage, setReExtractMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [splitwiseStatus, setSplitwiseStatus] = useState<'checking' | 'exists' | 'none'>('none');
  const [splitwiseParticipants, setSplitwiseParticipants] = useState<string[]>([]);

  // Sub-transaction state
  const [showSplitEditor, setShowSplitEditor] = useState(false);
  const [subTransactions, setSubTransactions] = useState<SubTransactionPublic[]>([]);
  const [subTransactionValidation, setSubTransactionValidation] = useState<SubTransactionValidation | null>(null);
  const [subTransactionsLoading, setSubTransactionsLoading] = useState(false);
  const [subTransactionsExpanded, setSubTransactionsExpanded] = useState(false);
  const [splitError, setSplitError] = useState<string | null>(null);
  const [splitLoading, setSplitLoading] = useState(false);

  useEffect(() => {
    setFormData(transaction);
    if (isOpen && transaction.email_row_id) {
      fetchEmailBody(transaction.email_row_id);
    }
  }, [transaction, isOpen]);

  // Check Splitwise expense status when modal opens
  useEffect(() => {
    const checkSplitwiseExpense = async () => {
      if (!isOpen || !transaction.splitwise_expense_id) {
        setSplitwiseStatus('none');
        setSplitwiseParticipants([]);
        return;
      }

      setSplitwiseStatus('checking');
      try {
        const response = await fetch(`/api/splitwise/expense/${transaction.splitwise_expense_id}`);
        const data = await response.json();

        if (response.ok && data.exists) {
          setSplitwiseStatus('exists');
          setSplitwiseParticipants(data.splitWith || []);
        } else {
          setSplitwiseStatus('none');
          setSplitwiseParticipants([]);
        }
      } catch (error) {
        console.error('Error checking Splitwise expense:', error);
        setSplitwiseStatus('none');
        setSplitwiseParticipants([]);
      }
    };

    checkSplitwiseExpense();
  }, [isOpen, transaction.splitwise_expense_id]);

  // Load sub-transactions when modal opens
  const fetchSubTransactions = useCallback(async () => {
    if (!transaction.id) return;

    setSubTransactionsLoading(true);
    try {
      const response = await fetch(`/api/transactions/${transaction.id}/sub-transactions`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        // API returns { success, data: { items, count, validation } }
        const data: SubTransactionListResponse = result.data || result;
        setSubTransactions(data.items || []);
        setSubTransactionValidation(data.validation || null);
        // Auto-expand if there are sub-transactions
        if (data.items && data.items.length > 0) {
          setSubTransactionsExpanded(true);
        }
      }
    } catch (error) {
      console.error('Error fetching sub-transactions:', error);
    } finally {
      setSubTransactionsLoading(false);
    }
  }, [transaction.id]);

  // Load sub-transactions when modal opens
  useEffect(() => {
    if (isOpen && transaction.id) {
      fetchSubTransactions();
    } else {
      // Reset state when modal closes
      setSubTransactions([]);
      setSubTransactionValidation(null);
      setSubTransactionsExpanded(false);
    }
  }, [isOpen, transaction.id, fetchSubTransactions]);

  // Handle creating sub-transactions
  const handleCreateSubTransactions = useCallback(async (items: CreateSubTransactionInput[]) => {
    if (!transaction.id) return;

    setSplitLoading(true);
    setSplitError(null);

    try {
      const response = await fetch(`/api/transactions/${transaction.id}/sub-transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items }),
      });

      if (response.ok) {
        await fetchSubTransactions();
        setShowSplitEditor(false);
        // Notify parent list to show badge immediately (before page reload)
        if (onTransactionUpdated) {
          onTransactionUpdated({ ...transaction, sub_transaction_count: items.length });
        }
      } else {
        const error = await response.json();
        setSplitError(error.error || 'Failed to create sub-transactions');
      }
    } catch (error) {
      console.error('Error creating sub-transactions:', error);
      setSplitError('Failed to create sub-transactions. Please try again.');
    } finally {
      setSplitLoading(false);
    }
  }, [transaction.id, fetchSubTransactions]);

  // Handle deleting a sub-transaction
  const handleDeleteSubTransaction = useCallback(async (subId: string) => {
    if (!transaction.id) return;

    try {
      const response = await fetch(`/api/transactions/${transaction.id}/sub-transactions/${subId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchSubTransactions();
      } else {
        console.error('Failed to delete sub-transaction');
      }
    } catch (error) {
      console.error('Error deleting sub-transaction:', error);
    }
  }, [transaction.id, fetchSubTransactions]);

  const fetchEmailBody = async (emailRowId: string) => {
    try {
      setLoadingEmail(true);
      const response = await fetch(`/api/emails/${emailRowId}`);
      if (response.ok) {
        const data = await response.json();
        const body = data.plain_body || data.snippet || null;
        setEmailData({
          body,
          subject: data.subject || null,
          from: data.from_address || null,
        });
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

  // Handler for when Splitwise expense is created
  const handleSplitwiseExpenseCreated = async (expenseId: string) => {
    try {
      const response = await fetch(`/api/transactions/${formData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ splitwise_expense_id: expenseId }),
      });

      if (response.ok) {
        const updatedTransaction = { ...formData, splitwise_expense_id: expenseId };
        setFormData(updatedTransaction);
        setSplitwiseStatus('exists');
        // Use onTransactionUpdated to update the list without closing the modal or triggering a full save
        onTransactionUpdated?.(updatedTransaction);
      } else {
        console.error('Failed to save Splitwise expense ID to transaction');
      }
    } catch (error) {
      console.error('Error saving Splitwise expense ID:', error);
    }
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
          const enums: string[] = [];

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

          const customResponse = await fetch('/api/admin/config/custom-account-types', {
            method: 'GET',
            credentials: 'include',
          });

          if (customResponse.ok) {
            const customData = await customResponse.json();
            enums.push(...(customData.customAccountTypes || []));
          }

          enums.push('OTHER');
          const uniqueEnums = Array.from(new Set(enums));
          setAccountTypes(uniqueEnums);
        }
      } catch (error) {
        console.error('Error fetching account types:', error);
      }
    };

    if (isOpen) {
      fetchAccountTypes();
    }
  }, [isOpen]);

  const handleReExtract = async () => {
    if (!transaction.id) {
      setReExtractMessage({ type: 'error', text: 'Transaction ID is missing' });
      setTimeout(() => setReExtractMessage(null), 5000);
      return;
    }

    setIsReExtracting(true);
    setReExtractMessage({ type: 'info', text: 'Re-extracting transaction with AI...' });

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
        if (result.transaction) {
          setFormData(prev => ({
            ...prev,
            ...result.transaction,
          }));
        }
        const confidence = result.extractionResult?.confidence || result.transaction?.confidence;
        setReExtractMessage({
          type: 'success',
          text: `Re-extraction completed! Confidence: ${confidence ? Math.round(parseFloat(confidence) * 100) : 'N/A'}%`
        });
        setTimeout(() => setReExtractMessage(null), 5000);
      } else {
        const error = await response.json();
        setReExtractMessage({ type: 'error', text: `Re-extraction failed: ${error.error}` });
        setTimeout(() => setReExtractMessage(null), 5000);
      }
    } catch (error) {
      console.error('Error re-extracting transaction:', error);
      setReExtractMessage({ type: 'error', text: 'Failed to re-extract transaction. Please try again.' });
      setTimeout(() => setReExtractMessage(null), 5000);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="flex flex-col bg-card border-border overflow-hidden sm:max-w-4xl sm:max-h-[90vh]"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 pt-4 pb-3 px-6 border-b border-border">
          <DialogTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" />
            Edit Transaction
          </DialogTitle>
          <DialogDescription className="sr-only">
            Edit transaction details, split into sub-transactions, or add notes.
          </DialogDescription>
        </DialogHeader>

        {/* Splitwise Message Toast */}
        {splitwiseMessage && (
          <ModalToast
            type={splitwiseMessage.type}
            message={splitwiseMessage.text}
            onDismiss={() => setSplitwiseMessage(null)}
          />
        )}

        {/* Re-extract Message Toast */}
        {reExtractMessage && (
          <ModalToast
            type={reExtractMessage.type}
            message={reExtractMessage.text}
            loading={reExtractMessage.type === 'info' && isReExtracting}
            onDismiss={reExtractMessage.type !== 'info' ? () => setReExtractMessage(null) : undefined}
          />
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6 space-y-6">
            {/* Transaction Details Section */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-primary" />
                  Transaction Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="txn-time">Transaction Date</Label>
                    <Input
                      id="txn-time"
                      type="datetime-local"
                      value={formData.txn_time ? new Date(formData.txn_time).toISOString().slice(0, 16) : ''}
                      onChange={(e) => handleInputChange('txn_time', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount || ''}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency || ''}
                      onValueChange={(value) => handleInputChange('currency', value)}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="Select Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="direction">Direction</Label>
                    <Select
                      value={formData.direction || ''}
                      onValueChange={(value) => handleInputChange('direction', value)}
                    >
                      <SelectTrigger id="direction">
                        <SelectValue placeholder="Select Direction" />
                      </SelectTrigger>
                      <SelectContent>
                        {directions.map(direction => (
                          <SelectItem key={direction} value={direction}>
                            {direction.charAt(0).toUpperCase() + direction.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Merchant Information Section */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Store className="w-5 h-5 mr-2 text-green-400" />
                  Merchant Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="merchant-name">Merchant Name</Label>
                    <Input
                      id="merchant-name"
                      type="text"
                      value={formData.merchant_name || ''}
                      onChange={(e) => handleInputChange('merchant_name', e.target.value)}
                      placeholder="e.g., Starbucks Coffee #123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="merchant-normalized">Normalized Merchant</Label>
                    <Input
                      id="merchant-normalized"
                      type="text"
                      value={formData.merchant_normalized || ''}
                      onChange={(e) => handleInputChange('merchant_normalized', e.target.value)}
                      placeholder="e.g., Starbucks"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category || ''}
                      onValueChange={(value) => handleInputChange('category', value)}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="e.g., New York, NY"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Details Section */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-purple-400" />
                  Additional Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reference-id">Reference ID</Label>
                    <Input
                      id="reference-id"
                      type="text"
                      value={formData.reference_id || ''}
                      onChange={(e) => handleInputChange('reference_id', e.target.value)}
                      placeholder="e.g., TXN123456"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-hint">Account Hint</Label>
                    <Input
                      id="account-hint"
                      type="text"
                      value={formData.account_hint || ''}
                      onChange={(e) => handleInputChange('account_hint', e.target.value)}
                      placeholder="e.g., ****1234"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-type">Account Type</Label>
                    <Select
                      value={formData.account_type || ''}
                      onValueChange={(value) => handleInputChange('account_type', value)}
                    >
                      <SelectTrigger id="account-type">
                        <SelectValue placeholder="Select Account Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {accountTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transaction-type">Transaction Type</Label>
                    <Select
                      value={formData.transaction_type || ''}
                      onValueChange={(value) => handleInputChange('transaction_type', value)}
                    >
                      <SelectTrigger id="transaction-type">
                        <SelectValue placeholder="Select Transaction Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {transactionTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type === 'Dr' ? 'Dr (Debit)' : 'Cr (Credit)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sub-Transactions Section - Collapsible */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader
                className="cursor-pointer select-none"
                onClick={() => setSubTransactionsExpanded(!subTransactionsExpanded)}
              >
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <Layers className="w-5 h-5 mr-2 text-primary" />
                    Sub-Transactions
                    {subTransactions.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-primary/15 text-primary">
                        {subTransactions.length}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${subTransactionsExpanded ? 'rotate-180' : ''}`}
                  />
                </CardTitle>
              </CardHeader>
              {subTransactionsExpanded && (
                <CardContent>
                  <SubTransactionList
                    items={subTransactions}
                    validation={subTransactionValidation || undefined}
                    loading={subTransactionsLoading}
                    onDelete={handleDeleteSubTransaction}
                    onAdd={() => setShowSplitEditor(true)}
                    currency={formData.currency === 'INR' ? '₹' : formData.currency === 'USD' ? '$' : formData.currency || '₹'}
                    defaultExpanded={true}
                  />
                </CardContent>
              )}
            </Card>

            {/* Email Body Section - Collapsible */}
            {transaction.email_row_id && (
              <Card className="bg-card/50 border-border/50">
                <CardHeader
                  className="cursor-pointer select-none"
                  onClick={() => setEmailExpanded(!emailExpanded)}
                >
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 mr-2 text-primary" />
                      Source Email
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${emailExpanded ? 'rotate-180' : ''}`}
                    />
                  </CardTitle>
                </CardHeader>
                {emailExpanded && (
                  <CardContent>
                    {loadingEmail ? (
                      <LoadingScreen message="Loading email..." fullScreen={false} size="sm" />
                    ) : emailData ? (
                      <div className="space-y-3">
                        {emailData.body ? (
                          <div className="bg-background border border-border rounded-xl p-4 max-h-80 overflow-y-auto">
                            <div
                              className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap text-xs leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: emailData.body }}
                            />
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No email body content available.</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Failed to load email.</p>
                    )}
                  </CardContent>
                )}
              </Card>
            )}

            {/* Notes Section - Collapsible */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader
                className="cursor-pointer select-none"
                onClick={() => setNotesExpanded(!notesExpanded)}
              >
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <StickyNote className="w-5 h-5 mr-2 text-amber-400" />
                    Notes & Comments
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${notesExpanded ? 'rotate-180' : ''}`}
                  />
                </CardTitle>
              </CardHeader>
              {notesExpanded && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-notes">Your Notes</Label>
                    <Textarea
                      id="user-notes"
                      value={formData.user_notes || ''}
                      onChange={(e) => handleInputChange('user_notes', e.target.value)}
                      placeholder="Add your personal notes about this transaction..."
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ai-notes">Transaction Keywords</Label>
                    <InteractiveKeywordSelector
                      value={formData.ai_notes || ''}
                      onChange={(value) => handleInputChange('ai_notes', value)}
                      merchantName={formData.merchant_name || undefined}
                      transactionAmount={formData.amount ? parseFloat(formData.amount.toString()) : undefined}
                      placeholder="Select keywords to categorize this transaction..."
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Select relevant keywords to help categorize and search for this transaction.
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Splitwise Status Banner - shows when expense is linked */}
          {(splitwiseStatus === 'exists' || splitwiseStatus === 'checking') && (
            <div className="shrink-0 px-6 py-2.5 bg-emerald-500/10 border-t border-emerald-500/20 flex items-center gap-2">
              {splitwiseStatus === 'checking' ? (
                <>
                  <Loader2 className="h-4 w-4 text-emerald-400 animate-spin" />
                  <span className="text-sm text-emerald-400">Checking Splitwise...</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-sm text-emerald-400">
                    Split with {splitwiseParticipants.length > 0
                      ? splitwiseParticipants.join(', ')
                      : 'others'}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Footer - Sticky at bottom */}
          <div className="shrink-0 px-6 py-4 border-t border-border bg-card flex items-center justify-between">
            {/* Left side - Action icons */}
            <div className="flex items-center gap-3">
              {/* Split Transaction Button */}
              {formData.amount && parseFloat(formData.amount.toString()) > 0 && subTransactions.length === 0 && (
                <button
                  type="button"
                  onClick={() => setShowSplitEditor(true)}
                  title="Split into sub-transactions"
                  className="w-10 h-10 flex items-center justify-center bg-primary/10 hover:bg-primary/20 rounded-full transition-colors"
                >
                  <Layers className="h-5 w-5 text-primary" />
                </button>
              )}
              {formData.amount && parseFloat(formData.amount.toString()) > 0 && (
                <SplitwiseDropdown
                  transactionAmount={parseFloat(formData.amount)}
                  transactionDescription={formData.merchant_name || formData.merchant_normalized || 'Expense'}
                  transactionDate={formData.txn_time?.split('T')[0]}
                  currencyCode={formData.currency || 'INR'}
                  iconOnly={true}
                  transactionId={formData.id}
                  existingExpenseId={formData.splitwise_expense_id}
                  disabled={splitwiseStatus === 'exists' || splitwiseStatus === 'checking'}
                  onExpenseCreated={handleSplitwiseExpenseCreated}
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
              <button
                type="button"
                onClick={handleReExtract}
                disabled={isReExtracting}
                title="Re-extract with AI"
                className="w-10 h-10 flex items-center justify-center bg-muted hover:bg-muted/80 rounded-full transition-colors disabled:opacity-50"
              >
                {isReExtracting ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : (
                  <Wand2 className="w-5 h-5 text-primary" />
                )}
              </button>
            </div>

            {/* Right side - Cancel & Save */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-success hover:bg-success/90 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>

      {/* Sub-Transaction Editor Modal — nested inside outer Dialog so Radix tracks the stack correctly */}
      <SubTransactionEditor
        isOpen={showSplitEditor}
        onClose={() => {
          setShowSplitEditor(false);
          setSplitError(null);
        }}
        onSubmit={handleCreateSubTransactions}
        parentAmount={formData.amount ? parseFloat(formData.amount.toString()) : null}
        currency={formData.currency === 'INR' ? '₹' : formData.currency === 'USD' ? '$' : formData.currency || '₹'}
        loading={splitLoading}
        error={splitError}
      />
    </Dialog>
  );
}
