/**
 * RefundStatusSection
 *
 * Shows refund status for an original (debit) transaction.
 * Displays total refunded, refund links, and progress bar.
 * Used in TransactionModal for debit transactions.
 */

import { memo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Undo2,
  ExternalLink,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { RefundStatus, RefundLinkPublic } from '@/types/refunds';

interface RefundStatusSectionProps {
  /** Refund status data */
  status: RefundStatus;
  /** Currency symbol */
  currency?: string;
  /** Called when viewing a refund transaction */
  onViewRefund?: (refundTransactionId: string) => void;
  /** Called when unlinking a refund */
  onUnlink?: (linkId: string) => void;
  /** Loading state */
  loading?: boolean;
  /** Initially collapsed */
  defaultCollapsed?: boolean;
}

export const RefundStatusSection = memo(function RefundStatusSection({
  status,
  currency = '₹',
  onViewRefund,
  onUnlink,
  loading = false,
  defaultCollapsed = true,
}: RefundStatusSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const refundPercentage = status.original_amount > 0
    ? Math.min(100, (status.total_refunded / status.original_amount) * 100)
    : 0;

  const hasLinks = status.refund_links && status.refund_links.length > 0;

  // Get status indicator
  const getStatusConfig = () => {
    if (status.is_fully_refunded) {
      return {
        icon: CheckCircle2,
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        label: 'Fully Refunded',
        progressColor: 'bg-green-500',
      };
    }
    if (status.total_refunded > 0) {
      return {
        icon: AlertCircle,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        label: 'Partially Refunded',
        progressColor: 'bg-amber-500',
      };
    }
    return {
      icon: Undo2,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/30',
      label: 'No Refunds',
      progressColor: 'bg-muted',
    };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  // Don't show section if no refunds and collapsed by default
  if (status.refund_count === 0 && defaultCollapsed) {
    return null;
  }

  return (
    <Card className="bg-card/50 border-border/50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
          <Undo2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Refunds</span>

          {/* Status badge */}
          {status.refund_count > 0 && (
            <span
              className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
                ${statusConfig.bgColor} ${statusConfig.color}
              `}
            >
              <StatusIcon className="h-3 w-3" />
              {statusConfig.label}
            </span>
          )}
        </div>

        {/* Amount summary */}
        <div className="text-right">
          <span className="text-sm font-mono font-semibold text-foreground">
            {currency}
            {formatAmount(status.total_refunded)}
          </span>
          <span className="text-xs text-muted-foreground ml-1">
            / {currency}
            {formatAmount(status.original_amount)}
          </span>
        </div>
      </button>

      {/* Expanded content */}
      {!isCollapsed && (
        <div className="border-t border-border/30 p-4 space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Refund Progress</span>
              <span className={statusConfig.color}>
                {Math.round(refundPercentage)}%
              </span>
            </div>
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
              <div
                className={`h-full ${statusConfig.progressColor} transition-all duration-300`}
                style={{ width: `${refundPercentage}%` }}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/20">
              <p className="text-xs text-muted-foreground mb-1">Refunded</p>
              <p className="text-sm font-mono font-semibold text-green-400">
                {currency}
                {formatAmount(status.total_refunded)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20">
              <p className="text-xs text-muted-foreground mb-1">Remaining</p>
              <p className="text-sm font-mono font-semibold text-foreground">
                {currency}
                {formatAmount(status.remaining_amount)}
              </p>
            </div>
          </div>

          {/* Linked refunds list */}
          {hasLinks && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Linked Refunds ({status.refund_count})
              </p>
              <div className="space-y-2">
                {status.refund_links!.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/10 border border-border/30 group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Type indicator */}
                      <div
                        className={`
                          px-2 py-0.5 rounded text-[10px] font-medium uppercase
                          ${
                            link.refund_type === 'full'
                              ? 'bg-green-500/15 text-green-400'
                              : link.refund_type === 'partial'
                                ? 'bg-amber-500/15 text-amber-400'
                                : 'bg-blue-500/15 text-blue-400'
                          }
                        `}
                      >
                        {link.refund_type}
                      </div>

                      <div>
                        <p className="text-sm font-mono font-semibold text-foreground">
                          {currency}
                          {formatAmount(link.allocated_amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(link.created_at)}
                          {link.match_method !== 'manual' && (
                            <span className="ml-2 text-muted-foreground/60">
                              • {link.match_confidence_score}% match
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onViewRefund && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewRefund(link.refund_transaction_id);
                          }}
                          className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                          title="View refund transaction"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {onUnlink && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnlink(link.id);
                          }}
                          className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                          title="Unlink refund"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!hasLinks && status.refund_count === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                No refunds linked to this transaction
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
});

export default RefundStatusSection;
