/**
 * RefundLinkSection
 *
 * Shows which original transactions a refund (credit) is linked to.
 * Used in TransactionModal for credit transactions.
 * Includes button to find matching original transactions.
 */

import { memo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Link2,
  ExternalLink,
  Trash2,
  Search,
  Plus,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { RefundLinkPublic } from '@/types/refunds';

interface RefundLinkSectionProps {
  /** Transaction ID (the refund/credit) */
  transactionId: string;
  /** Transaction amount */
  transactionAmount: number;
  /** Existing refund links */
  links: RefundLinkPublic[];
  /** Currency symbol */
  currency?: string;
  /** Called when viewing an original transaction */
  onViewOriginal?: (originalId: string, isSubTransaction: boolean) => void;
  /** Called when unlinking */
  onUnlink?: (linkId: string) => void;
  /** Called when find matches is clicked */
  onFindMatches?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Initially collapsed */
  defaultCollapsed?: boolean;
}

export const RefundLinkSection = memo(function RefundLinkSection({
  transactionId,
  transactionAmount,
  links,
  currency = '₹',
  onViewOriginal,
  onUnlink,
  onFindMatches,
  loading = false,
  defaultCollapsed = true,
}: RefundLinkSectionProps) {
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

  // Calculate totals
  const totalAllocated = links.reduce(
    (sum, link) => sum + link.allocated_amount,
    0
  );
  const remainingAmount = transactionAmount - totalAllocated;
  const allocationPercentage = transactionAmount > 0
    ? Math.min(100, (totalAllocated / transactionAmount) * 100)
    : 0;
  const isFullyAllocated = remainingAmount <= 0;

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
          <Link2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Refund Links
          </span>

          {/* Link count badge */}
          {links.length > 0 && (
            <span
              className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
                ${isFullyAllocated ? 'bg-green-500/15 text-green-400' : 'bg-blue-500/15 text-blue-400'}
              `}
            >
              {links.length} linked
            </span>
          )}
        </div>

        {/* Amount summary */}
        {links.length > 0 && (
          <div className="text-right">
            <span className="text-sm font-mono font-semibold text-foreground">
              {currency}
              {formatAmount(totalAllocated)}
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              / {currency}
              {formatAmount(transactionAmount)}
            </span>
          </div>
        )}
      </button>

      {/* Expanded content */}
      {!isCollapsed && (
        <div className="border-t border-border/30 p-4 space-y-4">
          {/* Progress bar (if has links) */}
          {links.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Allocation Progress</span>
                <span
                  className={
                    isFullyAllocated ? 'text-green-400' : 'text-blue-400'
                  }
                >
                  {Math.round(allocationPercentage)}%
                </span>
              </div>
              <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isFullyAllocated ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${allocationPercentage}%` }}
                />
              </div>
              {!isFullyAllocated && (
                <p className="text-xs text-muted-foreground">
                  {currency}
                  {formatAmount(remainingAmount)} remaining unallocated
                </p>
              )}
            </div>
          )}

          {/* Linked originals list */}
          {links.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Linked Original Transactions
              </p>
              <div className="space-y-2">
                {links.map((link) => {
                  const isSubTxn = link.original_sub_transaction_id !== null;
                  const originalId = isSubTxn
                    ? link.original_sub_transaction_id!
                    : link.original_transaction_id!;

                  return (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/10 border border-border/30 group"
                    >
                      <div className="flex items-center gap-3">
                        {/* Type indicators */}
                        <div className="flex items-center gap-1.5">
                          {isSubTxn && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium uppercase bg-purple-500/15 text-purple-400">
                              Sub
                            </span>
                          )}
                          <span
                            className={`
                              px-1.5 py-0.5 rounded text-[9px] font-medium uppercase
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
                          </span>
                        </div>

                        <div>
                          <p className="text-sm font-mono font-semibold text-foreground">
                            {currency}
                            {formatAmount(link.allocated_amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Linked {formatDate(link.created_at)}
                            {link.match_method === 'ai_suggestion' && (
                              <span className="ml-2 text-muted-foreground/60">
                                • AI suggested ({link.match_confidence_score}%)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onViewOriginal && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewOriginal(originalId, isSubTxn);
                            }}
                            className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                            title="View original transaction"
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
                            title="Unlink"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="text-center py-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                This refund is not linked to any original transactions
              </p>
              <p className="text-xs text-muted-foreground/70">
                Link this refund to the original purchase(s) it applies to
              </p>
            </div>
          )}

          {/* Find matches button */}
          {onFindMatches && !isFullyAllocated && (
            <Button
              variant="outline"
              size="sm"
              onClick={onFindMatches}
              className="w-full"
            >
              <Search className="h-4 w-4 mr-2" />
              Find Matching Transactions
            </Button>
          )}

          {/* Note about combined refunds */}
          {links.length > 1 && (
            <p className="text-xs text-muted-foreground text-center">
              This is a combined refund covering {links.length} original transactions
            </p>
          )}
        </div>
      )}
    </Card>
  );
});

export default RefundLinkSection;
