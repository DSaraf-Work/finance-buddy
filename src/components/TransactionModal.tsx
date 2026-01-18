import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@/pages/transactions';
import InteractiveKeywordSelector from './InteractiveKeywordSelector';
import LoadingScreen from './LoadingScreen';
import SplitwiseDropdown from './SplitwiseDropdown';
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
// Icons
import {
  Pencil,
  Calculator,
  Building2,
  FileText,
  Mail,
  StickyNote,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  ChevronDown,
  Users,
} from 'lucide-react';
// Phase 1, 2 & 3 Components
import { SubTransactionList, SubTransactionEditor } from '@/components/sub-transactions';
import { ReceiptSection } from '@/components/receipts';
import { RefundStatusSection, RefundLinkSection, RefundSuggestionsModal } from '@/components/refunds';
import { isSubTransactionsEnabled, isReceiptParsingEnabled, isSmartRefundsEnabled } from '@/lib/features/flags';
import type { SubTransactionPublic, SubTransactionValidation, CreateSubTransactionInput } from '@/types/sub-transactions';
import type { ReceiptPublic, ReceiptItemPublic } from '@/types/receipts';
import type { RefundStatus, RefundLinkPublic } from '@/types/refunds';

interface TransactionModalProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTransaction: Transaction) => void;
}

export default function TransactionModal({ transaction, isOpen, onClose, onSave }: TransactionModalProps) {
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
  // Phase 1: Sub-transactions state
  const [subTransactions, setSubTransactions] = useState<SubTransactionPublic[]>([]);
  const [subTransactionValidation, setSubTransactionValidation] = useState<SubTransactionValidation | null>(null);
  const [subTransactionLoading, setSubTransactionLoading] = useState(false);
  const [showSubTransactionEditor, setShowSubTransactionEditor] = useState(false);
  const [subTransactionError, setSubTransactionError] = useState<string | null>(null);

  // Phase 2 & 3 state
  const [receipt, setReceipt] = useState<ReceiptPublic | null>(null);
  const [receiptItems, setReceiptItems] = useState<ReceiptItemPublic[]>([]);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [refundStatus, setRefundStatus] = useState<RefundStatus | null>(null);
  const [refundLinks, setRefundLinks] = useState<RefundLinkPublic[]>([]);
  const [refundLoading, setRefundLoading] = useState(false);
  const [showRefundSuggestions, setShowRefundSuggestions] = useState(false);

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
          // Expense doesn't exist or was deleted
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

  // Fetch sub-transaction data when modal opens (Phase 1)
  useEffect(() => {
    const fetchSubTransactions = async () => {
      if (!isOpen || !transaction.id || !isSubTransactionsEnabled()) {
        setSubTransactions([]);
        setSubTransactionValidation(null);
        return;
      }

      setSubTransactionLoading(true);
      try {
        const response = await fetch(`/api/transactions/${transaction.id}/sub-transactions`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            setSubTransactions(data.data.sub_transactions || []);
            setSubTransactionValidation(data.data.validation || null);
          }
        }
      } catch (error) {
        console.error('Error fetching sub-transactions:', error);
      } finally {
        setSubTransactionLoading(false);
      }
    };

    fetchSubTransactions();
  }, [isOpen, transaction.id]);

  // Fetch receipt data when modal opens (Phase 2)
  useEffect(() => {
    const fetchReceiptData = async () => {
      if (!isOpen || !transaction.id || !isReceiptParsingEnabled()) {
        setReceipt(null);
        setReceiptItems([]);
        return;
      }

      setReceiptLoading(true);
      try {
        const response = await fetch(`/api/transactions/${transaction.id}/receipts`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.data?.receipts?.[0]) {
            setReceipt(data.data.receipts[0]);
            // Fetch items if receipt exists and is completed
            if (data.data.receipts[0].parsing_status === 'completed') {
              const itemsRes = await fetch(
                `/api/transactions/${transaction.id}/receipts/${data.data.receipts[0].id}`,
                { credentials: 'include' }
              );
              if (itemsRes.ok) {
                const itemsData = await itemsRes.json();
                setReceiptItems(itemsData.data?.items || []);
              }
            }
          } else {
            setReceipt(null);
            setReceiptItems([]);
          }
        }
      } catch (error) {
        console.error('Error fetching receipt:', error);
      } finally {
        setReceiptLoading(false);
      }
    };

    fetchReceiptData();
  }, [isOpen, transaction.id]);

  // Fetch refund data when modal opens (Phase 3)
  useEffect(() => {
    const fetchRefundData = async () => {
      if (!isOpen || !transaction.id || !isSmartRefundsEnabled()) {
        setRefundStatus(null);
        setRefundLinks([]);
        return;
      }

      setRefundLoading(true);
      try {
        const response = await fetch(`/api/transactions/${transaction.id}/refunds`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            setRefundStatus(data.data.status);
            setRefundLinks(data.data.links || []);
          }
        }
      } catch (error) {
        console.error('Error fetching refund data:', error);
      } finally {
        setRefundLoading(false);
      }
    };

    fetchRefundData();
  }, [isOpen, transaction.id]);

  const fetchEmailBody = async (emailRowId: string) => {
    try {
      setLoadingEmail(true);
      const response = await fetch(`/api/emails/${emailRowId}`);
      if (response.ok) {
        const data = await response.json();
        // Use plain_body, fallback to snippet
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
      // Update transaction with expense ID in the database
      const response = await fetch(`/api/transactions/${formData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ splitwise_expense_id: expenseId }),
      });

      if (response.ok) {
        // Update local state
        const updatedTransaction = { ...formData, splitwise_expense_id: expenseId };
        setFormData(updatedTransaction);
        setSplitwiseStatus('exists');
        // Notify parent to update the transaction list
        onSave(updatedTransaction);
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
        // Use result.transaction which contains all the updated fields from the database
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

  // Sub-transaction handlers (Phase 1)
  const handleCreateSubTransactions = useCallback(async (items: CreateSubTransactionInput[]) => {
    setSubTransactionError(null);
    setSubTransactionLoading(true);
    try {
      const response = await fetch(`/api/transactions/${transaction.id}/sub-transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create sub-transactions');
      }

      const data = await response.json();
      setSubTransactions(data.data?.sub_transactions || []);
      setSubTransactionValidation(data.data?.validation || null);
      setShowSubTransactionEditor(false);
    } catch (error: any) {
      console.error('Error creating sub-transactions:', error);
      setSubTransactionError(error.message);
      throw error;
    } finally {
      setSubTransactionLoading(false);
    }
  }, [transaction.id]);

  const handleDeleteSubTransaction = useCallback(async (subId: string) => {
    try {
      const response = await fetch(`/api/transactions/${transaction.id}/sub-transactions/${subId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // Refresh the list
        const refreshResponse = await fetch(`/api/transactions/${transaction.id}/sub-transactions`, {
          credentials: 'include',
        });
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setSubTransactions(data.data?.sub_transactions || []);
          setSubTransactionValidation(data.data?.validation || null);
        }
      }
    } catch (error) {
      console.error('Error deleting sub-transaction:', error);
    }
  }, [transaction.id]);

  const handleDeleteAllSubTransactions = useCallback(async () => {
    try {
      const response = await fetch(`/api/transactions/${transaction.id}/sub-transactions`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setSubTransactions([]);
        setSubTransactionValidation(null);
      }
    } catch (error) {
      console.error('Error deleting all sub-transactions:', error);
    }
  }, [transaction.id]);

  // Receipt handlers (Phase 2)
  const handleReceiptUploadComplete = useCallback(async (receiptId: string) => {
    // Refresh receipt data
    try {
      const response = await fetch(
        `/api/transactions/${transaction.id}/receipts/${receiptId}`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setReceipt(data.data?.receipt);
        setReceiptItems(data.data?.items || []);
      }
    } catch (error) {
      console.error('Error fetching uploaded receipt:', error);
    }
  }, [transaction.id]);

  const handleReceiptParse = useCallback(async (receiptId: string) => {
    try {
      const response = await fetch(
        `/api/transactions/${transaction.id}/receipts/${receiptId}/parse`,
        { method: 'POST', credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setReceipt(data.data?.receipt);
        setReceiptItems(data.data?.items || []);
      }
    } catch (error) {
      console.error('Error parsing receipt:', error);
    }
  }, [transaction.id]);

  const handleReceiptDelete = useCallback(async (receiptId: string) => {
    try {
      const response = await fetch(
        `/api/transactions/${transaction.id}/receipts/${receiptId}`,
        { method: 'DELETE', credentials: 'include' }
      );
      if (response.ok) {
        setReceipt(null);
        setReceiptItems([]);
      }
    } catch (error) {
      console.error('Error deleting receipt:', error);
    }
  }, [transaction.id]);

  // Refund handlers (Phase 3)
  const handleRefundUnlink = useCallback(async (linkId: string) => {
    try {
      const response = await fetch(
        `/api/transactions/${transaction.id}/refunds/${linkId}`,
        { method: 'DELETE', credentials: 'include' }
      );
      if (response.ok) {
        // Refresh refund data
        const refreshResponse = await fetch(`/api/transactions/${transaction.id}/refunds`, {
          credentials: 'include',
        });
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setRefundStatus(data.data?.status);
          setRefundLinks(data.data?.links || []);
        }
      }
    } catch (error) {
      console.error('Error unlinking refund:', error);
    }
  }, [transaction.id]);

  const handleRefundLink = useCallback(async (
    originalId: string,
    isSubTransaction: boolean,
    allocatedAmount: number,
    confidenceScore: number,
    matchReasons: string[]
  ) => {
    try {
      const response = await fetch(`/api/transactions/${originalId}/refunds/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          refund_transaction_id: transaction.id,
          allocated_amount: allocatedAmount,
          refund_type: 'full',
          match_method: 'ai_suggestion',
          match_confidence_score: confidenceScore,
          match_reasons: matchReasons,
          is_sub_transaction: isSubTransaction,
        }),
      });
      if (response.ok) {
        // Refresh refund data
        const refreshResponse = await fetch(`/api/transactions/${transaction.id}/refunds`, {
          credentials: 'include',
        });
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setRefundStatus(data.data?.status);
          setRefundLinks(data.data?.links || []);
        }
      }
    } catch (error) {
      console.error('Error linking refund:', error);
      throw error;
    }
  }, [transaction.id]);

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
      >
        <DialogHeader className="shrink-0 pt-4 pb-3 px-6 border-b border-border/50">
          <DialogTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Pencil className="w-4 h-4 text-primary" />
            </div>
            Edit Transaction
          </DialogTitle>
        </DialogHeader>

        {/* Splitwise Message Toast */}
        {splitwiseMessage && (
          <div className={`px-4 py-3 flex items-center justify-between animate-in slide-in-from-top-2 duration-300 ${
            splitwiseMessage.type === 'success'
              ? 'bg-success/10 border-b border-success/20'
              : 'bg-destructive/10 border-b border-destructive/20'
          }`}>
            <div className="flex items-center gap-2">
              {splitwiseMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : (
                <XCircle className="w-4 h-4 text-destructive" />
              )}
              <span className={`text-sm ${splitwiseMessage.type === 'success' ? 'text-success' : 'text-destructive'}`}>
                {splitwiseMessage.text}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSplitwiseMessage(null)}
              className={`h-7 px-2 ${splitwiseMessage.type === 'success' ? 'text-success hover:text-success/80 hover:bg-success/10' : 'text-destructive hover:text-destructive/80 hover:bg-destructive/10'}`}
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Re-extract Message Toast */}
        {reExtractMessage && (
          <div className={`px-4 py-3 flex items-center justify-between animate-in slide-in-from-top-2 duration-300 ${
            reExtractMessage.type === 'success'
              ? 'bg-success/10 border-b border-success/20'
              : reExtractMessage.type === 'info'
              ? 'bg-primary/10 border-b border-primary/20'
              : 'bg-destructive/10 border-b border-destructive/20'
          }`}>
            <div className="flex items-center gap-2">
              {reExtractMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : reExtractMessage.type === 'info' ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 text-destructive" />
              )}
              <span className={`text-sm ${
                reExtractMessage.type === 'success' ? 'text-success' :
                reExtractMessage.type === 'info' ? 'text-primary' :
                'text-destructive'
              }`}>
                {reExtractMessage.text}
              </span>
            </div>
            {reExtractMessage.type !== 'info' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReExtractMessage(null)}
                className={`h-7 px-2 ${
                  reExtractMessage.type === 'success' ? 'text-success hover:text-success/80 hover:bg-success/10' :
                  'text-destructive hover:text-destructive/80 hover:bg-destructive/10'
                }`}
              >
                Dismiss
              </Button>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6 space-y-6">
            {/* Transaction Details Section */}
            <Card className="bg-card/50 border-border/50 overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calculator className="w-4 h-4 text-primary" />
                  </div>
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
            <Card className="bg-card/50 border-border/50 overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-success" />
                  </div>
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
            <Card className="bg-card/50 border-border/50 overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-purple-400" />
                  </div>
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

            {/* Sub-Transactions Section - Phase 1 */}
            {isSubTransactionsEnabled() && (
              <Card className="bg-card/50 border-border/50 overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-medium flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                        </svg>
                      </div>
                      Split Transaction
                    </div>
                    {subTransactions.length === 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSubTransactionEditor(true)}
                        className="h-8 text-xs"
                      >
                        Split Now
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SubTransactionList
                    items={subTransactions}
                    validation={subTransactionValidation || undefined}
                    loading={subTransactionLoading}
                    currency={formData.currency === 'INR' ? '₹' : formData.currency === 'USD' ? '$' : formData.currency || '₹'}
                    onAdd={() => setShowSubTransactionEditor(true)}
                    onDelete={handleDeleteSubTransaction}
                    defaultExpanded={subTransactions.length > 0}
                  />
                </CardContent>
              </Card>
            )}

            {/* Receipt Section - Phase 2 */}
            {isReceiptParsingEnabled() && (
              <ReceiptSection
                transactionId={transaction.id}
                receipt={receipt}
                items={receiptItems}
                loading={receiptLoading}
                currency={formData.currency === 'INR' ? '₹' : formData.currency === 'USD' ? '$' : formData.currency || '₹'}
                onUploadComplete={handleReceiptUploadComplete}
                onParse={handleReceiptParse}
                onDelete={handleReceiptDelete}
                defaultCollapsed={!receipt}
              />
            )}

            {/* Refund Section - Phase 3 */}
            {isSmartRefundsEnabled() && formData.direction === 'debit' && refundStatus && (
              <RefundStatusSection
                status={refundStatus}
                currency={formData.currency === 'INR' ? '₹' : formData.currency === 'USD' ? '$' : formData.currency || '₹'}
                onUnlink={handleRefundUnlink}
                loading={refundLoading}
                defaultCollapsed={refundStatus.refund_count === 0}
              />
            )}

            {/* Refund Links Section - Phase 3 (for credit transactions) */}
            {isSmartRefundsEnabled() && formData.direction === 'credit' && (
              <RefundLinkSection
                transactionId={transaction.id}
                transactionAmount={parseFloat(formData.amount?.toString() || '0')}
                links={refundLinks}
                currency={formData.currency === 'INR' ? '₹' : formData.currency === 'USD' ? '$' : formData.currency || '₹'}
                onUnlink={handleRefundUnlink}
                onFindMatches={() => setShowRefundSuggestions(true)}
                loading={refundLoading}
                defaultCollapsed={refundLinks.length === 0}
              />
            )}

            {/* Email Body Section - Collapsible */}
            {transaction.email_row_id && (
              <Card className="bg-card/50 border-border/50 overflow-hidden">
                <CardHeader
                  className="cursor-pointer select-none hover:bg-muted/20 transition-colors"
                  onClick={() => setEmailExpanded(!emailExpanded)}
                >
                  <CardTitle className="text-base font-medium flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-primary" />
                      </div>
                      Source Email
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${emailExpanded ? 'rotate-180' : ''}`}
                    />
                  </CardTitle>
                </CardHeader>
                {emailExpanded && (
                  <CardContent>
                    {loadingEmail ? (
                      <LoadingScreen message="Loading email..." fullScreen={false} size="sm" />
                    ) : emailData ? (
                      <div className="space-y-3">
                        {/* Email body */}
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
            <Card className="bg-card/50 border-border/50 overflow-hidden">
              <CardHeader
                className="cursor-pointer select-none hover:bg-muted/20 transition-colors"
                onClick={() => setNotesExpanded(!notesExpanded)}
              >
                <CardTitle className="text-base font-medium flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <StickyNote className="w-4 h-4 text-orange-400" />
                    </div>
                    Notes & Comments
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${notesExpanded ? 'rotate-180' : ''}`}
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
            <div className="shrink-0 px-6 py-2.5 bg-success/10 border-t border-success/20 flex items-center gap-2">
              {splitwiseStatus === 'checking' ? (
                <>
                  <Loader2 className="h-4 w-4 text-success animate-spin" />
                  <span className="text-sm text-success">Checking Splitwise...</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 text-success shrink-0" />
                  <span className="text-sm text-success">
                    Split with {splitwiseParticipants.length > 0
                      ? splitwiseParticipants.join(', ')
                      : 'others'}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Footer - Sticky at bottom */}
          <div className="shrink-0 px-6 py-4 border-t border-border/50 bg-card/80 backdrop-blur-sm flex items-center justify-between">
            {/* Left side - Action icons */}
            <div className="flex items-center gap-2">
              {formData.amount && parseFloat(formData.amount) > 0 && (
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
                className="w-10 h-10 flex items-center justify-center bg-muted/50 hover:bg-primary/10 hover:text-primary rounded-xl transition-all duration-200 disabled:opacity-50 group"
              >
                {isReExtracting ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </button>
            </div>

            {/* Right side - Cancel & Save */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-success hover:bg-success/90 text-white min-w-[80px] transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

      {/* Refund Suggestions Modal - Phase 3 */}
      {isSmartRefundsEnabled() && (
        <RefundSuggestionsModal
          isOpen={showRefundSuggestions}
          onClose={() => setShowRefundSuggestions(false)}
          transactionId={transaction.id}
          transactionAmount={parseFloat(formData.amount?.toString() || '0')}
          transactionMerchant={formData.merchant_name || formData.merchant_normalized || undefined}
          currency={formData.currency === 'INR' ? '₹' : formData.currency === 'USD' ? '$' : formData.currency || '₹'}
          onLink={handleRefundLink}
          linkedOriginalIds={new Set(refundLinks.map(l => l.original_transaction_id || l.original_sub_transaction_id || ''))}
        />
      )}

      {/* Sub-Transaction Editor Modal - Phase 1 */}
      {isSubTransactionsEnabled() && (
        <SubTransactionEditor
          isOpen={showSubTransactionEditor}
          onClose={() => setShowSubTransactionEditor(false)}
          onSubmit={handleCreateSubTransactions}
          parentAmount={formData.amount ? parseFloat(formData.amount.toString()) : null}
          currency={formData.currency === 'INR' ? '₹' : formData.currency === 'USD' ? '$' : formData.currency || '₹'}
          loading={subTransactionLoading}
          error={subTransactionError}
        />
      )}
    </Dialog>
  );
}