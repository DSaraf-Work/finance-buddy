/**
 * RefundSuggestionsModal
 *
 * Modal for viewing AI-suggested refund matches and linking them.
 * Shows the refund transaction details and candidate originals.
 */

import { memo, useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  Search,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RefundSuggestionCard } from './RefundSuggestionCard';
import type {
  RefundSuggestion,
  GetRefundSuggestionsResponse,
} from '@/types/refunds';

interface RefundSuggestionsModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Transaction ID (the refund) */
  transactionId: string;
  /** Transaction amount */
  transactionAmount: number;
  /** Transaction merchant */
  transactionMerchant?: string;
  /** Currency symbol */
  currency?: string;
  /** Called when a suggestion is linked */
  onLink?: (
    originalId: string,
    isSubTransaction: boolean,
    allocatedAmount: number,
    confidenceScore: number,
    matchReasons: string[]
  ) => Promise<void>;
  /** Called when view original is requested */
  onViewOriginal?: (originalId: string, isSubTransaction: boolean) => void;
  /** Already linked original IDs */
  linkedOriginalIds?: Set<string>;
}

export const RefundSuggestionsModal = memo(function RefundSuggestionsModal({
  isOpen,
  onClose,
  transactionId,
  transactionAmount,
  transactionMerchant,
  currency = '₹',
  onLink,
  onViewOriginal,
  linkedOriginalIds = new Set(),
}: RefundSuggestionsModalProps) {
  const [suggestions, setSuggestions] = useState<RefundSuggestion[]>([]);
  const [transactionDetails, setTransactionDetails] = useState<
    Record<string, { merchant_name?: string; amount?: number; txn_time?: string }>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [minConfidence, setMinConfidence] = useState(30);

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Fetch suggestions
  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        min_confidence: minConfidence.toString(),
        limit: '10',
      });

      const response = await fetch(
        `/api/transactions/${transactionId}/refunds/suggestions?${params}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch suggestions');
      }

      const data = await response.json();
      const result = data.data as GetRefundSuggestionsResponse;

      setSuggestions(result.suggestions);

      // TODO: Fetch transaction details for each suggestion
      // For now, use placeholder
      const details: Record<string, any> = {};
      result.suggestions.forEach((s) => {
        details[s.candidate_transaction_id] = {
          merchant_name: 'Loading...',
          amount: 0,
          txn_time: new Date().toISOString(),
        };
      });
      setTransactionDetails(details);
    } catch (err: any) {
      setError(err.message || 'Failed to load suggestions');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [transactionId, minConfidence]);

  // Load suggestions when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSuggestions();
    }
  }, [isOpen, fetchSuggestions]);

  // Handle linking
  const handleLink = useCallback(
    async (
      candidateId: string,
      isSubTransaction: boolean,
      confidenceScore: number
    ) => {
      if (!onLink) return;

      setLinkingId(candidateId);

      try {
        // Find the suggestion for match reasons
        const suggestion = suggestions.find(
          (s) => s.candidate_transaction_id === candidateId
        );
        const matchReasons = suggestion?.match_reasons.map((r) => r.description) || [];

        // For now, allocate full remaining amount
        await onLink(
          candidateId,
          isSubTransaction,
          transactionAmount,
          confidenceScore,
          matchReasons
        );

        // Update local state to show as linked
        // The parent should refresh the data
      } catch (err: any) {
        setError(err.message || 'Failed to link');
      } finally {
        setLinkingId(null);
      }
    },
    [onLink, suggestions, transactionAmount]
  );

  // Filter suggestions
  const filteredSuggestions = suggestions.filter(
    (s) => s.confidence_score >= minConfidence
  );

  // Group suggestions by confidence level
  const highConfidence = filteredSuggestions.filter(
    (s) => s.confidence_score >= 80
  );
  const mediumConfidence = filteredSuggestions.filter(
    (s) => s.confidence_score >= 50 && s.confidence_score < 80
  );
  const lowConfidence = filteredSuggestions.filter(
    (s) => s.confidence_score < 50
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Find Original Transaction
          </DialogTitle>
        </DialogHeader>

        {/* Refund transaction info */}
        <div className="p-4 rounded-lg bg-muted/20 border border-border/30 mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Refund Transaction
          </p>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              {transactionMerchant || 'Unknown Merchant'}
            </p>
            <p className="text-lg font-bold font-mono text-green-400">
              +{currency}
              {formatAmount(transactionAmount)}
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Min confidence:
            </span>
            <select
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="bg-muted/30 border border-border/50 rounded px-2 py-1 text-sm text-foreground"
            >
              <option value="0">All</option>
              <option value="30">30%+</option>
              <option value="50">50%+</option>
              <option value="80">80%+</option>
            </select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchSuggestions}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">
                Finding matching transactions...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-8 w-8 text-red-400 mb-3" />
              <p className="text-sm text-red-400 mb-3">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchSuggestions}>
                Try Again
              </Button>
            </div>
          ) : filteredSuggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Search className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-1">
                No matching transactions found
              </p>
              <p className="text-xs text-muted-foreground/70">
                Try lowering the confidence threshold or expanding the time
                window
              </p>
            </div>
          ) : (
            <>
              {/* High confidence */}
              {highConfidence.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-green-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    High Confidence ({highConfidence.length})
                  </p>
                  {highConfidence.map((suggestion) => (
                    <RefundSuggestionCard
                      key={suggestion.candidate_transaction_id}
                      suggestion={suggestion}
                      transactionDetails={
                        transactionDetails[suggestion.candidate_transaction_id]
                      }
                      currency={currency}
                      onLink={handleLink}
                      onView={onViewOriginal}
                      loading={linkingId === suggestion.candidate_transaction_id}
                      isLinked={linkedOriginalIds.has(
                        suggestion.candidate_transaction_id
                      )}
                    />
                  ))}
                </div>
              )}

              {/* Medium confidence */}
              {mediumConfidence.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Medium Confidence ({mediumConfidence.length})
                  </p>
                  {mediumConfidence.map((suggestion) => (
                    <RefundSuggestionCard
                      key={suggestion.candidate_transaction_id}
                      suggestion={suggestion}
                      transactionDetails={
                        transactionDetails[suggestion.candidate_transaction_id]
                      }
                      currency={currency}
                      onLink={handleLink}
                      onView={onViewOriginal}
                      loading={linkingId === suggestion.candidate_transaction_id}
                      isLinked={linkedOriginalIds.has(
                        suggestion.candidate_transaction_id
                      )}
                    />
                  ))}
                </div>
              )}

              {/* Low confidence */}
              {lowConfidence.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-red-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    Low Confidence ({lowConfidence.length})
                  </p>
                  {lowConfidence.map((suggestion) => (
                    <RefundSuggestionCard
                      key={suggestion.candidate_transaction_id}
                      suggestion={suggestion}
                      transactionDetails={
                        transactionDetails[suggestion.candidate_transaction_id]
                      }
                      currency={currency}
                      onLink={handleLink}
                      onView={onViewOriginal}
                      loading={linkingId === suggestion.candidate_transaction_id}
                      isLinked={linkedOriginalIds.has(
                        suggestion.candidate_transaction_id
                      )}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-border/30">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default RefundSuggestionsModal;
