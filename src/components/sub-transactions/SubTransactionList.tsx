/**
 * SubTransactionList
 *
 * Displays a list of sub-transactions for a parent transaction.
 * Supports expandable view, editing, and deletion.
 */

import { memo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
  SubTransactionPublic,
  SubTransactionValidation,
} from '@/types/sub-transactions';

interface SubTransactionListProps {
  /** Array of sub-transactions */
  items: SubTransactionPublic[];
  /** Validation result */
  validation?: SubTransactionValidation;
  /** Loading state */
  loading?: boolean;
  /** Called when edit is requested */
  onEdit?: (subId: string) => void;
  /** Called when delete is requested */
  onDelete?: (subId: string) => void;
  /** Called when "Add Split" is clicked */
  onAdd?: () => void;
  /** Initially expanded */
  defaultExpanded?: boolean;
  /** Currency symbol */
  currency?: string;
}

export const SubTransactionList = memo(function SubTransactionList({
  items,
  validation,
  loading = false,
  onEdit,
  onDelete,
  onAdd,
  defaultExpanded = false,
  currency = '₹',
}: SubTransactionListProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (items.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-lg border border-border/30">
        <span className="text-sm text-muted-foreground">
          No sub-transactions
        </span>
        {onAdd && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAdd}
            className="h-7 text-xs"
          >
            Split Transaction
          </Button>
        )}
      </div>
    );
  }

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden bg-card/30">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium text-foreground">
              {items.length} Sub-transactions
            </span>
          </div>

          {/* Validation indicator */}
          {validation && (
            <div className="flex items-center gap-1">
              {validation.is_valid ? (
                <CheckCircle className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
              )}
              <span
                className={`text-xs ${
                  validation.is_valid
                    ? 'text-green-400'
                    : 'text-amber-400'
                }`}
              >
                {validation.is_valid ? 'Balanced' : `Diff: ${currency}${formatAmount(Math.abs(validation.difference))}`}
              </span>
            </div>
          )}
        </div>

        {/* Total */}
        <span className="text-sm font-mono font-semibold text-foreground">
          {currency}
          {formatAmount(validation?.sub_total || items.reduce((sum, i) => sum + i.amount, 0))}
        </span>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border/30">
          {loading ? (
            <div className="px-4 py-6 text-center text-muted-foreground">
              Loading...
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/10 transition-colors group"
                >
                  {/* Left side - Order, Category, Merchant */}
                  <div className="flex items-center gap-3">
                    {/* Order number */}
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium"
                      style={{
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#818CF8',
                      }}
                    >
                      {index + 1}
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {item.merchant_name || item.category || 'Item'}
                      </span>
                      {item.merchant_name && item.category && (
                        <span className="text-xs text-muted-foreground">
                          {item.category}
                        </span>
                      )}
                      {item.user_notes && (
                        <span className="text-xs text-muted-foreground/60 italic">
                          {item.user_notes}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side - Amount and actions */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-semibold text-foreground">
                      {currency}
                      {formatAmount(item.amount)}
                    </span>

                    {/* Action buttons - show on hover */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(item.id);
                          }}
                          className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item.id);
                          }}
                          className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer with validation message */}
          {validation && !validation.is_valid && (
            <div className="px-4 py-2 bg-amber-500/5 border-t border-amber-500/20">
              <p className="text-xs text-amber-400">
                {validation.message}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default SubTransactionList;
