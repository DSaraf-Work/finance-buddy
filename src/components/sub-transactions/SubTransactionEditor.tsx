/**
 * SubTransactionEditor
 *
 * Modal component for creating and editing sub-transactions.
 * Supports bulk creation with dynamic row addition/removal.
 *
 * Uses shadcn/ui Dialog for consistent modal styling across the app.
 */

import { memo, useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { SUB_TRANSACTION_LIMITS } from '@/types/sub-transactions';
import type { CreateSubTransactionInput } from '@/types/sub-transactions';

interface SubTransactionEditorProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Submit handler */
  onSubmit: (items: CreateSubTransactionInput[]) => Promise<void>;
  /** Parent transaction amount */
  parentAmount: number | null;
  /** Parent transaction currency */
  currency?: string;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
}

interface EditableItem {
  id: string; // Local unique ID for React key
  amount: string;
  category: string;
  merchant_name: string;
  user_notes: string;
}

const createEmptyItem = (): EditableItem => ({
  id: crypto.randomUUID(),
  amount: '',
  category: '',
  merchant_name: '',
  user_notes: '',
});

export const SubTransactionEditor = memo(function SubTransactionEditor({
  isOpen,
  onClose,
  onSubmit,
  parentAmount,
  currency = '₹',
  loading = false,
  error = null,
}: SubTransactionEditorProps) {
  // Initialize with 2 empty items
  const [items, setItems] = useState<EditableItem[]>([
    createEmptyItem(),
    createEmptyItem(),
  ]);

  // Reset items when modal opens
  useEffect(() => {
    if (isOpen) {
      setItems([createEmptyItem(), createEmptyItem()]);
    }
  }, [isOpen]);

  // Calculate totals
  const total = items.reduce((sum, item) => {
    const amount = parseFloat(item.amount) || 0;
    return sum + amount;
  }, 0);

  const difference = parentAmount !== null ? parentAmount - total : 0;
  const isBalanced = parentAmount !== null && Math.abs(difference) < SUB_TRANSACTION_LIMITS.TOLERANCE;
  const isExceeding = parentAmount !== null && total > parentAmount;

  // Handlers
  const handleAddItem = useCallback(() => {
    if (items.length >= SUB_TRANSACTION_LIMITS.MAX_COUNT) return;
    setItems((prev) => [...prev, createEmptyItem()]);
  }, [items.length]);

  const handleRemoveItem = useCallback((id: string) => {
    if (items.length <= SUB_TRANSACTION_LIMITS.MIN_COUNT) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, [items.length]);

  const handleItemChange = useCallback(
    (id: string, field: keyof EditableItem, value: string) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        )
      );
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    // Validate all items have amount
    const validItems = items.filter((item) => {
      const amount = parseFloat(item.amount);
      return !isNaN(amount) && amount > 0;
    });

    if (validItems.length < SUB_TRANSACTION_LIMITS.MIN_COUNT) {
      return; // Error will be shown in UI
    }

    const submitItems: CreateSubTransactionInput[] = validItems.map((item) => ({
      amount: parseFloat(item.amount),
      category: item.category.trim() || null,
      merchant_name: item.merchant_name.trim() || null,
      user_notes: item.user_notes.trim() || null,
    }));

    await onSubmit(submitItems);
  }, [items, onSubmit]);

  const validItemCount = items.filter((item) => {
    const amount = parseFloat(item.amount);
    return !isNaN(amount) && amount > 0;
  }).length;

  const canSubmit =
    !loading &&
    validItemCount >= SUB_TRANSACTION_LIMITS.MIN_COUNT &&
    !isExceeding;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="flex flex-col bg-card border-border overflow-hidden sm:max-w-lg sm:max-h-[90vh]"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Header */}
        <DialogHeader className="shrink-0 pt-4 pb-3 px-6 border-b border-border">
          <DialogTitle className="text-lg font-semibold text-foreground">
            Split Transaction
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 max-h-[calc(90vh-180px)]">
          {/* Parent amount info */}
          {parentAmount !== null && (
            <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Parent Amount
                </span>
                <span className="text-lg font-mono font-semibold text-foreground">
                  {currency}
                  {parentAmount.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="p-4 rounded-lg bg-muted/20 border border-border/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Item {index + 1}
                  </span>
                  {items.length > SUB_TRANSACTION_LIMITS.MIN_COUNT && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Amount - Required */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Amount *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {currency}
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={item.amount}
                        onChange={(e) =>
                          handleItemChange(item.id, 'amount', e.target.value)
                        }
                        placeholder="0.00"
                        className="pl-7 font-mono"
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Category
                    </label>
                    <Input
                      value={item.category}
                      onChange={(e) =>
                        handleItemChange(item.id, 'category', e.target.value)
                      }
                      placeholder="e.g., Groceries"
                    />
                  </div>

                  {/* Merchant Name */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Merchant
                    </label>
                    <Input
                      value={item.merchant_name}
                      onChange={(e) =>
                        handleItemChange(item.id, 'merchant_name', e.target.value)
                      }
                      placeholder="e.g., Store name"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Notes
                    </label>
                    <Input
                      value={item.user_notes}
                      onChange={(e) =>
                        handleItemChange(item.id, 'user_notes', e.target.value)
                      }
                      placeholder="Optional note"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add item button */}
          {items.length < SUB_TRANSACTION_LIMITS.MAX_COUNT && (
            <button
              type="button"
              onClick={handleAddItem}
              className="w-full mt-3 py-2 rounded-lg border border-dashed border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Add Item</span>
            </button>
          )}

          {/* Summary */}
          <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total</span>
              <span
                className={`text-lg font-mono font-semibold ${
                  isExceeding ? 'text-red-400' : 'text-foreground'
                }`}
              >
                {currency}
                {total.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            {parentAmount !== null && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {isBalanced
                    ? 'Status'
                    : difference > 0
                    ? 'Remaining'
                    : 'Exceeds by'}
                </span>
                <div className="flex items-center gap-2">
                  {isBalanced ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-green-400">Balanced</span>
                    </>
                  ) : isExceeding ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <span className="text-sm font-mono text-red-400">
                        {currency}
                        {Math.abs(difference).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                      <span className="text-sm font-mono text-amber-400">
                        {currency}
                        {difference.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Validation messages */}
          {validItemCount < SUB_TRANSACTION_LIMITS.MIN_COUNT && (
            <p className="mt-2 text-xs text-amber-400">
              At least {SUB_TRANSACTION_LIMITS.MIN_COUNT} items with valid amounts
              are required
            </p>
          )}
          {isExceeding && (
            <p className="mt-2 text-xs text-red-400">
              Total cannot exceed parent amount
            </p>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="shrink-0 px-6 py-4 border-t border-border bg-muted/20 sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
            {loading ? 'Saving...' : 'Save Split'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default SubTransactionEditor;
