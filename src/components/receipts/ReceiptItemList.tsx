/**
 * ReceiptItemList
 *
 * Displays parsed receipt items in a collapsible list.
 * Supports item exclusion, editing, and links to sub-transactions.
 */

import { memo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Tag,
  Percent,
  DollarSign,
  Hand,
  Check,
  X,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReceiptItemPublic } from '@/types/receipts';

interface ReceiptItemListProps {
  /** Array of receipt items */
  items: ReceiptItemPublic[];
  /** Currency symbol */
  currency?: string;
  /** Loading state */
  loading?: boolean;
  /** Called when item exclusion is toggled */
  onToggleExclude?: (itemId: string) => void;
  /** Called when item is clicked for editing */
  onEditItem?: (itemId: string) => void;
  /** Initially expanded */
  defaultExpanded?: boolean;
  /** Whether to show linked status */
  showLinkStatus?: boolean;
}

export const ReceiptItemList = memo(function ReceiptItemList({
  items,
  currency = '₹',
  loading = false,
  onToggleExclude,
  onEditItem,
  defaultExpanded = false,
  showLinkStatus = false,
}: ReceiptItemListProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Calculate totals
  const activeItems = items.filter((item) => !item.is_excluded);
  const excludedCount = items.length - activeItems.length;
  const subtotal = activeItems
    .filter((item) => !item.is_tax && !item.is_discount)
    .reduce((sum, item) => sum + item.total_price, 0);
  const taxTotal = activeItems
    .filter((item) => item.is_tax)
    .reduce((sum, item) => sum + item.total_price, 0);
  const discountTotal = activeItems
    .filter((item) => item.is_discount)
    .reduce((sum, item) => sum + Math.abs(item.total_price), 0);
  const grandTotal = subtotal + taxTotal - discountTotal;

  // Get icon and color for item type
  const getItemTypeIndicator = (item: ReceiptItemPublic) => {
    if (item.is_tax) {
      return {
        icon: DollarSign,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/15',
        label: 'Tax',
      };
    }
    if (item.is_discount) {
      return {
        icon: Percent,
        color: 'text-green-400',
        bgColor: 'bg-green-500/15',
        label: 'Discount',
      };
    }
    if (item.is_tip) {
      return {
        icon: Hand,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/15',
        label: 'Tip',
      };
    }
    if (item.is_service_charge) {
      return {
        icon: Tag,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/15',
        label: 'Service',
      };
    }
    return null;
  };

  if (items.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-center py-4 px-4 bg-muted/30 rounded-lg border border-border/30">
        <span className="text-sm text-muted-foreground">
          No items parsed from receipt
        </span>
      </div>
    );
  }

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
              {activeItems.length} Items
              {excludedCount > 0 && (
                <span className="text-muted-foreground ml-1">
                  ({excludedCount} excluded)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Total */}
        <span className="text-sm font-mono font-semibold text-foreground">
          {currency}
          {formatAmount(grandTotal)}
        </span>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border/30">
          {loading ? (
            <div className="px-4 py-6 text-center text-muted-foreground">
              Loading items...
            </div>
          ) : (
            <>
              <div className="divide-y divide-border/20">
                {items.map((item) => {
                  const typeIndicator = getItemTypeIndicator(item);
                  const TypeIcon = typeIndicator?.icon;

                  return (
                    <div
                      key={item.id}
                      onClick={() => onEditItem?.(item.id)}
                      className={`
                        flex items-center justify-between px-4 py-3
                        hover:bg-muted/10 transition-colors group
                        ${onEditItem ? 'cursor-pointer' : ''}
                        ${item.is_excluded ? 'opacity-50' : ''}
                      `}
                    >
                      {/* Left side - Item details */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Line number */}
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0"
                          style={{
                            background: item.is_excluded
                              ? 'rgba(100, 100, 100, 0.15)'
                              : 'rgba(99, 102, 241, 0.15)',
                            color: item.is_excluded ? '#666' : '#818CF8',
                          }}
                        >
                          {item.line_number}
                        </div>

                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium truncate ${
                                item.is_excluded
                                  ? 'text-muted-foreground line-through'
                                  : 'text-foreground'
                              }`}
                            >
                              {item.item_name}
                            </span>

                            {/* Type badge */}
                            {typeIndicator && TypeIcon && (
                              <span
                                className={`
                                  inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium
                                  ${typeIndicator.bgColor} ${typeIndicator.color}
                                `}
                              >
                                <TypeIcon className="h-2.5 w-2.5" />
                                {typeIndicator.label}
                              </span>
                            )}

                            {/* Linked indicator */}
                            {showLinkStatus &&
                              item.linked_sub_transaction_id && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/15 text-green-400">
                                  <Link2 className="h-2.5 w-2.5" />
                                  Linked
                                </span>
                              )}
                          </div>

                          {/* Quantity and unit price */}
                          {item.quantity > 1 || item.unit_price !== null ? (
                            <span className="text-xs text-muted-foreground">
                              {item.quantity > 1
                                ? `${item.quantity}x`
                                : ''}{' '}
                              {item.unit_price !== null &&
                                `@ ${currency}${formatAmount(item.unit_price)}`}
                            </span>
                          ) : null}

                          {item.item_description && (
                            <span className="text-xs text-muted-foreground/60 italic truncate">
                              {item.item_description}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right side - Amount and actions */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span
                          className={`
                            text-sm font-mono font-semibold
                            ${item.is_excluded ? 'text-muted-foreground line-through' : ''}
                            ${item.is_discount ? 'text-green-400' : 'text-foreground'}
                          `}
                        >
                          {item.is_discount ? '-' : ''}
                          {currency}
                          {formatAmount(Math.abs(item.total_price))}
                        </span>

                        {/* Exclude toggle - show on hover */}
                        {onToggleExclude && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleExclude(item.id);
                            }}
                            className={`
                              p-1.5 rounded transition-all
                              opacity-0 group-hover:opacity-100
                              ${
                                item.is_excluded
                                  ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                  : 'bg-muted/50 text-muted-foreground hover:bg-red-500/10 hover:text-red-400'
                              }
                            `}
                            title={item.is_excluded ? 'Include' : 'Exclude'}
                          >
                            {item.is_excluded ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <X className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary footer */}
              <div className="px-4 py-3 bg-muted/20 border-t border-border/30">
                <div className="space-y-1">
                  {taxTotal > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="font-mono text-amber-400">
                        +{currency}
                        {formatAmount(taxTotal)}
                      </span>
                    </div>
                  )}
                  {discountTotal > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Discounts</span>
                      <span className="font-mono text-green-400">
                        -{currency}
                        {formatAmount(discountTotal)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-medium pt-1 border-t border-border/20">
                    <span className="text-foreground">Total</span>
                    <span className="font-mono text-foreground">
                      {currency}
                      {formatAmount(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
});

export default ReceiptItemList;
