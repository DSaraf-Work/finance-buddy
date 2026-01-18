/**
 * RefundSuggestionCard
 *
 * Displays an AI-suggested refund match with confidence score,
 * match reasons, and action to link.
 */

import { memo } from 'react';
import {
  Store,
  DollarSign,
  Calendar,
  Hash,
  Tag,
  Check,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RefundSuggestion, MatchReasonType } from '@/types/refunds';

interface RefundSuggestionCardProps {
  /** Suggestion data */
  suggestion: RefundSuggestion;
  /** Transaction details for display */
  transactionDetails?: {
    merchant_name?: string;
    amount?: number;
    txn_time?: string;
    category?: string;
  };
  /** Currency symbol */
  currency?: string;
  /** Called when link is clicked */
  onLink?: (
    candidateId: string,
    isSubTransaction: boolean,
    confidenceScore: number
  ) => void;
  /** Called when view is clicked */
  onView?: (candidateId: string, isSubTransaction: boolean) => void;
  /** Loading state */
  loading?: boolean;
  /** Whether already linked */
  isLinked?: boolean;
}

// Icon mapping for match reason types
const reasonIcons: Record<MatchReasonType, typeof Store> = {
  merchant_match: Store,
  merchant_similar: Store,
  exact_amount: DollarSign,
  close_amount: DollarSign,
  time_window: Calendar,
  reference_match: Hash,
  category_match: Tag,
};

// Color mapping for match reason types
const reasonColors: Record<MatchReasonType, { text: string; bg: string }> = {
  merchant_match: { text: 'text-green-400', bg: 'bg-green-500/15' },
  merchant_similar: { text: 'text-green-400', bg: 'bg-green-500/15' },
  exact_amount: { text: 'text-blue-400', bg: 'bg-blue-500/15' },
  close_amount: { text: 'text-blue-400', bg: 'bg-blue-500/15' },
  time_window: { text: 'text-amber-400', bg: 'bg-amber-500/15' },
  reference_match: { text: 'text-purple-400', bg: 'bg-purple-500/15' },
  category_match: { text: 'text-cyan-400', bg: 'bg-cyan-500/15' },
};

export const RefundSuggestionCard = memo(function RefundSuggestionCard({
  suggestion,
  transactionDetails,
  currency = '₹',
  onLink,
  onView,
  loading = false,
  isLinked = false,
}: RefundSuggestionCardProps) {
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

  // Get confidence level styling
  const getConfidenceStyle = (score: number) => {
    if (score >= 80) {
      return {
        color: 'text-green-400',
        bg: 'bg-green-500/15',
        border: 'border-green-500/30',
        label: 'High',
      };
    }
    if (score >= 50) {
      return {
        color: 'text-amber-400',
        bg: 'bg-amber-500/15',
        border: 'border-amber-500/30',
        label: 'Medium',
      };
    }
    return {
      color: 'text-red-400',
      bg: 'bg-red-500/15',
      border: 'border-red-500/30',
      label: 'Low',
    };
  };

  const confidenceStyle = getConfidenceStyle(suggestion.confidence_score);

  return (
    <div
      className={`
        p-4 rounded-lg border transition-all duration-200
        ${isLinked ? 'bg-green-500/5 border-green-500/30' : 'bg-card/50 border-border/50 hover:border-primary/30'}
      `}
    >
      {/* Header: Merchant/Transaction info + Confidence */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Sub-transaction indicator */}
          {suggestion.is_sub_transaction && (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(147, 51, 234, 0.15)' }}
            >
              <Layers className="h-4 w-4 text-purple-400" />
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-foreground">
              {transactionDetails?.merchant_name || 'Unknown Merchant'}
              {suggestion.is_sub_transaction && (
                <span className="ml-2 text-xs text-purple-400">(sub-txn)</span>
              )}
            </p>
            {transactionDetails?.txn_time && (
              <p className="text-xs text-muted-foreground">
                {formatDate(transactionDetails.txn_time)}
              </p>
            )}
          </div>
        </div>

        {/* Confidence badge */}
        <div
          className={`
            px-2 py-1 rounded-lg text-center
            ${confidenceStyle.bg} ${confidenceStyle.color}
          `}
        >
          <p className="text-lg font-bold font-mono">
            {suggestion.confidence_score}%
          </p>
          <p className="text-[9px] uppercase tracking-wider opacity-80">
            {confidenceStyle.label}
          </p>
        </div>
      </div>

      {/* Amount */}
      {transactionDetails?.amount !== undefined && (
        <div className="mb-3">
          <p className="text-2xl font-bold font-mono text-foreground">
            {currency}
            {formatAmount(transactionDetails.amount)}
          </p>
        </div>
      )}

      {/* Match reasons */}
      <div className="space-y-2 mb-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Match Reasons
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestion.match_reasons.map((reason, index) => {
            const Icon = reasonIcons[reason.type] || Tag;
            const colors = reasonColors[reason.type] || {
              text: 'text-muted-foreground',
              bg: 'bg-muted/30',
            };

            return (
              <div
                key={index}
                className={`
                  inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs
                  ${colors.bg} ${colors.text}
                `}
                title={reason.description}
              >
                <Icon className="h-3 w-3" />
                <span>{reason.description}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Score breakdown */}
      <div className="grid grid-cols-4 gap-2 mb-4 p-2 rounded-lg bg-muted/20">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground mb-0.5">Merchant</p>
          <p className="text-xs font-mono font-semibold text-foreground">
            {suggestion.scores.merchant_score}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground mb-0.5">Amount</p>
          <p className="text-xs font-mono font-semibold text-foreground">
            {suggestion.scores.amount_score}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground mb-0.5">Time</p>
          <p className="text-xs font-mono font-semibold text-foreground">
            {suggestion.scores.time_score}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground mb-0.5">Reference</p>
          <p className="text-xs font-mono font-semibold text-foreground">
            {suggestion.scores.reference_score}%
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {isLinked ? (
          <div className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-green-500/10 text-green-400">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Linked</span>
          </div>
        ) : (
          <>
            {onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onView(
                    suggestion.candidate_transaction_id,
                    suggestion.is_sub_transaction
                  )
                }
                className="flex-1"
              >
                View
              </Button>
            )}
            {onLink && (
              <Button
                size="sm"
                onClick={() =>
                  onLink(
                    suggestion.candidate_transaction_id,
                    suggestion.is_sub_transaction,
                    suggestion.confidence_score
                  )
                }
                disabled={loading}
                className="flex-1"
              >
                Link
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
});

export default RefundSuggestionCard;
