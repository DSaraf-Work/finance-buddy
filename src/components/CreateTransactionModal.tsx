/**
 * CreateTransactionModal
 *
 * Dialog for manually creating a new transaction (no source email).
 * Creates a row in fb_emails_processed with is_manual=true.
 * Only requires Amount + Direction + Date — all other fields are optional.
 */

import { memo, useState, useCallback, useEffect } from 'react';
import { Loader2, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ModalToast } from '@/components/ui/modal-toast';
import type { Transaction } from '@/pages/transactions';

interface CreateTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the newly created transaction after successful save */
  onCreated: (transaction: Transaction) => void;
}

interface FormState {
  txn_time: string;
  amount: string;
  direction: 'debit' | 'credit';
  merchant_name: string;
  category: string;
  account_type: string;
  account_hint: string;
  currency: string;
  user_notes: string;
}

function todayLocalDatetime(): string {
  const now = new Date();
  // Format to datetime-local input value: "YYYY-MM-DDTHH:mm"
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

const EMPTY_FORM: FormState = {
  txn_time: '',
  amount: '',
  direction: 'debit',
  merchant_name: '',
  category: '',
  account_type: '',
  account_hint: '',
  currency: 'INR',
  user_notes: '',
};

const CATEGORIES = [
  'food', 'transport', 'groceries', 'shopping', 'entertainment',
  'utilities', 'health', 'education', 'travel', 'rent', 'salary',
  'investment', 'insurance', 'other',
];

export const CreateTransactionModal = memo(function CreateTransactionModal({
  isOpen,
  onClose,
  onCreated,
}: CreateTransactionModalProps) {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, txn_time: todayLocalDatetime() });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm({ ...EMPTY_FORM, txn_time: todayLocalDatetime() });
      setErrorMsg(null);
    }
  }, [isOpen]);

  const handleChange = useCallback(
    (field: keyof FormState, value: string) => {
      setForm(prev => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg(null);

      if (!form.amount || parseFloat(form.amount) <= 0) {
        setErrorMsg('Amount must be greater than 0');
        return;
      }
      if (!form.txn_time) {
        setErrorMsg('Date is required');
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            txn_time: new Date(form.txn_time).toISOString(),
            amount: parseFloat(form.amount),
            direction: form.direction,
            currency: form.currency,
            merchant_name: form.merchant_name || null,
            category: form.category || null,
            account_type: form.account_type || null,
            account_hint: form.account_hint || null,
            user_notes: form.user_notes || null,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create transaction');
        }

        onCreated(data.transaction as Transaction);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    },
    [form, onCreated]
  );

  const inputClass =
    'w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors';
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="flex flex-col bg-card border-border overflow-hidden sm:max-w-md sm:max-h-[90vh]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <DialogHeader className="shrink-0 px-6 pt-5 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <PenLine className="h-5 w-5 text-primary" />
            Add Transaction
          </DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <ModalToast type="error" message={errorMsg} className="border-b-0" />
        )}

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

            {/* Amount + Direction row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={labelClass}>Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    className={`${inputClass} pl-7 font-mono`}
                  />
                </div>
              </div>
              <div className="w-32">
                <label className={labelClass}>Direction *</label>
                <select
                  value={form.direction}
                  onChange={(e) => handleChange('direction', e.target.value as 'debit' | 'credit')}
                  className={inputClass}
                >
                  <option value="debit">Debit</option>
                  <option value="credit">Credit</option>
                </select>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className={labelClass}>Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={form.txn_time}
                onChange={(e) => handleChange('txn_time', e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Merchant */}
            <div>
              <label className={labelClass}>Merchant / Description</label>
              <input
                type="text"
                placeholder="e.g., Swiggy, Monthly rent"
                value={form.merchant_name}
                onChange={(e) => handleChange('merchant_name', e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Category */}
            <div>
              <label className={labelClass}>Category</label>
              <select
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className={inputClass}
              >
                <option value="">Select category…</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Account type + Account hint */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={labelClass}>Account</label>
                <input
                  type="text"
                  placeholder="e.g., HDFC Credit"
                  value={form.account_type}
                  onChange={(e) => handleChange('account_type', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="w-32">
                <label className={labelClass}>Last 4 digits</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="1234"
                  value={form.account_hint}
                  onChange={(e) => handleChange('account_hint', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                rows={2}
                placeholder="Optional note…"
                value={form.user_notes}
                onChange={(e) => handleChange('user_notes', e.target.value)}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="shrink-0 px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-end gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Saving…
                </>
              ) : (
                'Save Transaction'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

export default CreateTransactionModal;
