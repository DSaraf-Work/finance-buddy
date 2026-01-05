import { useState, useEffect } from 'react';
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

  useEffect(() => {
    setFormData(transaction);
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
      <DialogContent className="flex flex-col bg-card border-border overflow-hidden sm:max-w-4xl sm:max-h-[90vh]">
        <DialogHeader className="shrink-0 pt-4 pb-2">
          <DialogTitle className="sr-only">Edit Transaction</DialogTitle>
          <div className="flex items-center gap-3 flex-wrap">
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
            <Button
              type="button"
              onClick={handleReExtract}
              disabled={isReExtracting}
              variant="outline"
              size="sm"
              title="Re-extract transaction data using AI"
            >
              {isReExtracting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
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
            </Button>
          </div>
        </DialogHeader>

        {/* Splitwise Message Toast */}
        {splitwiseMessage && (
          <div className={`px-4 py-3 flex items-center justify-between ${
            splitwiseMessage.type === 'success'
              ? 'bg-success/20 border-b border-success/30'
              : 'bg-destructive/20 border-b border-destructive/30'
          }`}>
            <div className="flex items-center">
              {splitwiseMessage.type === 'success' ? (
                <svg className="w-5 h-5 text-success mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-destructive mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className={`text-sm ${splitwiseMessage.type === 'success' ? 'text-success' : 'text-destructive'}`}>
                {splitwiseMessage.text}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSplitwiseMessage(null)}
              className={splitwiseMessage.type === 'success' ? 'text-success hover:text-success/80' : 'text-destructive hover:text-destructive/80'}
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Re-extract Message Toast */}
        {reExtractMessage && (
          <div className={`px-4 py-3 flex items-center justify-between ${
            reExtractMessage.type === 'success'
              ? 'bg-success/20 border-b border-success/30'
              : reExtractMessage.type === 'info'
              ? 'bg-primary/20 border-b border-primary/30'
              : 'bg-destructive/20 border-b border-destructive/30'
          }`}>
            <div className="flex items-center">
              {reExtractMessage.type === 'success' ? (
                <svg className="w-5 h-5 text-success mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : reExtractMessage.type === 'info' ? (
                <svg className="w-5 h-5 text-primary mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5 text-destructive mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
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
                className={
                  reExtractMessage.type === 'success' ? 'text-success hover:text-success/80' :
                  'text-destructive hover:text-destructive/80'
                }
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
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
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
                  <svg className="w-5 h-5 mr-2 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
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
                  <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
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

            {/* Email Body Section - Collapsible */}
            {transaction.email_row_id && (
              <Card className="bg-card/50 border-border/50">
                <CardHeader
                  className="cursor-pointer select-none"
                  onClick={() => setEmailExpanded(!emailExpanded)}
                >
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Source Email
                    </div>
                    <svg
                      className={`w-5 h-5 text-muted-foreground transition-transform ${emailExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </CardTitle>
                </CardHeader>
                {emailExpanded && (
                  <CardContent>
                    {loadingEmail ? (
                      <LoadingScreen message="Loading email..." fullScreen={false} size="sm" />
                    ) : emailData ? (
                      <div className="space-y-3">
                        {/* Email metadata */}
                        {(emailData.subject || emailData.from) && (
                          <div className="space-y-1 text-sm border-b border-border/50 pb-3">
                            {emailData.subject && (
                              <p className="text-foreground font-medium">{emailData.subject}</p>
                            )}
                            {emailData.from && (
                              <p className="text-muted-foreground text-xs">From: {emailData.from}</p>
                            )}
                          </div>
                        )}
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
            <Card className="bg-card/50 border-border/50">
              <CardHeader
                className="cursor-pointer select-none"
                onClick={() => setNotesExpanded(!notesExpanded)}
              >
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Notes & Comments
                  </div>
                  <svg
                    className={`w-5 h-5 text-muted-foreground transition-transform ${notesExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
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

          {/* Footer - Sticky at bottom */}
          <div className="shrink-0 px-6 py-4 border-t border-border bg-card flex justify-end gap-3">
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
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}