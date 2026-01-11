# Phase 11: Refund UI

## Objective
Create UI components for refund linking and status display.

---

## New Components

```
src/components/transactions/
├── RefundStatusBadge.tsx    # Badge for TxnCard
├── RefundIndicator.tsx      # Status in TransactionModal
├── RefundLinkModal.tsx      # Modal to select original transaction
└── RefundSuggestionCard.tsx # Individual suggestion card
```

---

## Component Implementations

### `src/components/transactions/RefundStatusBadge.tsx`

```tsx
/**
 * Badge showing refund status on TxnCard
 */
import { memo } from 'react';
import { ArrowLeftRight, CheckCircle } from 'lucide-react';

interface RefundStatusBadgeProps {
  isRefund?: boolean;
  refundType?: 'full' | 'partial' | 'item';
  isFullyRefunded?: boolean;
  refundCount?: number;
}

export const RefundStatusBadge = memo(function RefundStatusBadge({
  isRefund,
  refundType,
  isFullyRefunded,
  refundCount,
}: RefundStatusBadgeProps) {
  // Credit linked as refund
  if (isRefund) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
        style={{
          background: 'rgba(74, 222, 128, 0.12)',
          color: 'rgb(74, 222, 128)',
        }}
      >
        <ArrowLeftRight className="h-3 w-3" />
        {refundType === 'full' ? 'Full Refund' : refundType === 'partial' ? 'Partial Refund' : 'Item Refund'}
      </span>
    );
  }

  // Debit with refunds
  if (refundCount && refundCount > 0) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
        style={{
          background: isFullyRefunded ? 'rgba(74, 222, 128, 0.12)' : 'rgba(251, 191, 36, 0.12)',
          color: isFullyRefunded ? 'rgb(74, 222, 128)' : 'rgb(251, 191, 36)',
        }}
      >
        {isFullyRefunded ? <CheckCircle className="h-3 w-3" /> : <ArrowLeftRight className="h-3 w-3" />}
        {isFullyRefunded ? 'Refunded' : `${refundCount} refund${refundCount > 1 ? 's' : ''}`}
      </span>
    );
  }

  return null;
});
```

---

### `src/components/transactions/RefundIndicator.tsx`

```tsx
/**
 * Refund status section in TransactionModal
 */
import { memo } from 'react';
import { ArrowLeftRight, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RefundStatus } from '@/types/refunds';

interface RefundIndicatorProps {
  // For credits
  isRefund?: boolean;
  refundType?: 'full' | 'partial' | 'item';
  originalTransaction?: {
    id: string;
    merchant_name: string;
    amount: number;
  };
  onUnlink?: () => Promise<void>;

  // For debits
  refundStatus?: RefundStatus;
  refunds?: Array<{
    id: string;
    amount: number;
    txn_time: string;
    refund_type: string;
  }>;

  currency?: string;
}

export const RefundIndicator = memo(function RefundIndicator({
  isRefund,
  refundType,
  originalTransaction,
  onUnlink,
  refundStatus,
  refunds,
  currency = 'INR',
}: RefundIndicatorProps) {
  // Credit linked as refund
  if (isRefund && originalTransaction) {
    return (
      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-green-400" />
            <div>
              <p className="font-medium text-foreground">
                {refundType === 'full' ? 'Full' : refundType === 'partial' ? 'Partial' : 'Item'} Refund
              </p>
              <p className="text-sm text-muted-foreground">
                of {originalTransaction.merchant_name} ({currency} {originalTransaction.amount.toLocaleString('en-IN')})
              </p>
            </div>
          </div>
          {onUnlink && (
            <Button size="sm" variant="ghost" onClick={onUnlink}>
              Unlink
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Debit with refund status
  if (refundStatus && refundStatus.refund_count > 0) {
    return (
      <div className={`p-4 rounded-lg border ${
        refundStatus.is_fully_refunded
          ? 'bg-green-500/10 border-green-500/20'
          : 'bg-amber-500/10 border-amber-500/20'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className={`h-5 w-5 ${
              refundStatus.is_fully_refunded ? 'text-green-400' : 'text-amber-400'
            }`} />
            <span className="font-medium text-foreground">
              {refundStatus.is_fully_refunded ? 'Fully Refunded' : 'Partially Refunded'}
            </span>
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Original Amount</span>
            <span className="font-mono">{currency} {refundStatus.original_amount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Refunded</span>
            <span className="font-mono text-green-400">
              -{currency} {refundStatus.total_refunded.toLocaleString('en-IN')}
            </span>
          </div>
          {!refundStatus.is_fully_refunded && (
            <div className="flex justify-between">
              <span className="text-amber-400">Remaining</span>
              <span className="font-mono text-amber-400">
                {currency} {refundStatus.remaining_amount.toLocaleString('en-IN')}
              </span>
            </div>
          )}
        </div>

        {refunds && refunds.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2">Linked Refunds:</p>
            {refunds.map((refund) => (
              <div key={refund.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {new Date(refund.txn_time).toLocaleDateString()}
                </span>
                <span className="font-mono">{currency} {refund.amount.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
});
```

---

### `src/components/transactions/RefundSuggestionCard.tsx`

```tsx
/**
 * Card for a single refund suggestion
 */
import { memo } from 'react';
import { Check, AlertTriangle, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RefundSuggestion } from '@/types/refunds';

interface RefundSuggestionCardProps {
  suggestion: RefundSuggestion;
  currency: string;
  onSelect: (id: string) => void;
}

export const RefundSuggestionCard = memo(function RefundSuggestionCard({
  suggestion,
  currency,
  onSelect,
}: RefundSuggestionCardProps) {
  const scoreColor = suggestion.match_score >= 80 ? 'text-green-400' :
                     suggestion.match_score >= 60 ? 'text-amber-400' :
                     'text-red-400';

  return (
    <div
      className="p-4 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
      onClick={() => onSelect(suggestion.transaction_id)}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium text-foreground">{suggestion.merchant_name}</p>
          <p className="text-sm text-muted-foreground">
            {new Date(suggestion.txn_time).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono font-medium text-foreground">
            {currency} {suggestion.amount.toLocaleString('en-IN')}
          </p>
          <p className={`text-sm font-medium ${scoreColor}`}>
            {suggestion.match_score}% match
          </p>
        </div>
      </div>

      {/* Match reasons */}
      <div className="flex flex-wrap gap-1 mb-2">
        {suggestion.match_reasons.map((reason, i) => (
          <span
            key={i}
            className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary"
          >
            {reason}
          </span>
        ))}
      </div>

      {/* Warnings */}
      <div className="flex items-center gap-2 text-xs">
        {suggestion.splitwise_expense_id && (
          <span className="flex items-center gap-1 text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            Linked to Splitwise
          </span>
        )}
        {suggestion.has_sub_transactions && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Layers className="h-3 w-3" />
            Has sub-transactions
          </span>
        )}
      </div>
    </div>
  );
});
```

---

### `src/components/transactions/RefundLinkModal.tsx`

```tsx
/**
 * Modal to select original transaction for refund linking
 */
import { memo, useState, useEffect } from 'react';
import { X, Search, ArrowLeftRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RefundSuggestionCard } from './RefundSuggestionCard';
import type { RefundSuggestion } from '@/types/refunds';

interface RefundLinkModalProps {
  creditTransaction: {
    id: string;
    amount: number;
    merchant_normalized: string;
    currency: string;
  };
  onLink: (originalId: string) => Promise<void>;
  onClose: () => void;
}

export const RefundLinkModal = memo(function RefundLinkModal({
  creditTransaction,
  onLink,
  onClose,
}: RefundLinkModalProps) {
  const [suggestions, setSuggestions] = useState<RefundSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSuggestions();
  }, [creditTransaction.id]);

  const loadSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/transactions/${creditTransaction.id}/refund-suggestions`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuggestions(data.suggestions || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (originalId: string) => {
    setLinking(true);
    setError(null);
    try {
      await onLink(originalId);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[80vh] overflow-hidden rounded-lg bg-card border border-border shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            <span className="font-medium text-foreground">Link as Refund</span>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Credit info */}
        <div className="p-4 bg-muted/50 border-b border-border">
          <p className="text-sm text-muted-foreground">Linking refund of:</p>
          <p className="font-mono font-medium text-foreground">
            {creditTransaction.currency} {creditTransaction.amount.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-2">{error}</p>
              <Button variant="outline" onClick={loadSuggestions}>
                Retry
              </Button>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No matching transactions found</p>
              <p className="text-sm">Try adjusting the date range or merchant</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-2">
                {suggestions.length} potential matches:
              </p>
              {suggestions.map((suggestion) => (
                <RefundSuggestionCard
                  key={suggestion.transaction_id}
                  suggestion={suggestion}
                  currency={creditTransaction.currency}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="w-full" disabled={linking}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
});
```

---

## TransactionModal Integration

Add to `src/components/transactions/TransactionModal.tsx`:

```tsx
// Add imports
import { RefundIndicator } from './RefundIndicator';
import { RefundLinkModal } from './RefundLinkModal';
import { ArrowLeftRight } from 'lucide-react';

// Add state
const [refundStatus, setRefundStatus] = useState<RefundStatus | null>(null);
const [linkedRefunds, setLinkedRefunds] = useState<any[]>([]);
const [showRefundLinkModal, setShowRefundLinkModal] = useState(false);

// Add load effect for debits
useEffect(() => {
  if (transaction.id && transaction.direction === 'debit') {
    loadRefundStatus();
  }
}, [transaction.id]);

const loadRefundStatus = async () => {
  const res = await fetch(`/api/transactions/${transaction.id}/refund-status`);
  const data = await res.json();
  setRefundStatus(data.status);
  setLinkedRefunds(data.refunds || []);
};

// Add handlers
const handleLinkRefund = async (originalId: string) => {
  const res = await fetch(`/api/transactions/${transaction.id}/link-refund`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ original_transaction_id: originalId }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  // Refresh transaction data
  window.location.reload();  // Or use callback to refresh
};

const handleUnlinkRefund = async () => {
  await fetch(`/api/transactions/${transaction.id}/link-refund`, {
    method: 'DELETE',
  });
  window.location.reload();
};

// Add section for credits (after Receipt section)
{transaction.direction === 'credit' && !transaction.is_sub_transaction && (
  <CollapsibleCard
    title="Refund Link"
    icon={<ArrowLeftRight className="h-4 w-4" />}
    defaultOpen={!!transaction.refund_of_transaction_id}
  >
    {transaction.refund_of_transaction_id ? (
      <RefundIndicator
        isRefund={true}
        refundType={transaction.refund_type}
        originalTransaction={/* fetch original */}
        onUnlink={handleUnlinkRefund}
        currency={transaction.currency}
      />
    ) : (
      <div className="text-center py-4">
        <p className="text-muted-foreground mb-3">
          Link this credit to an original purchase
        </p>
        <Button onClick={() => setShowRefundLinkModal(true)}>
          <ArrowLeftRight className="h-4 w-4 mr-2" />
          Find Original
        </Button>
      </div>
    )}
  </CollapsibleCard>
)}

{/* Add section for debits */}
{transaction.direction === 'debit' && refundStatus && refundStatus.refund_count > 0 && (
  <CollapsibleCard
    title="Refund Status"
    icon={<ArrowLeftRight className="h-4 w-4" />}
    defaultOpen={true}
  >
    <RefundIndicator
      refundStatus={refundStatus}
      refunds={linkedRefunds}
      currency={transaction.currency}
    />
  </CollapsibleCard>
)}

{/* Modal */}
{showRefundLinkModal && (
  <RefundLinkModal
    creditTransaction={{
      id: transaction.id,
      amount: transaction.amount,
      merchant_normalized: transaction.merchant_normalized,
      currency: transaction.currency || 'INR',
    }}
    onLink={handleLinkRefund}
    onClose={() => setShowRefundLinkModal(false)}
  />
)}
```

---

## TxnCard Integration

Add to `src/components/transactions/TxnCard.tsx`:

```tsx
// Add import
import { RefundStatusBadge } from './RefundStatusBadge';

// In badges row:
<RefundStatusBadge
  isRefund={transaction.is_refund}
  refundType={transaction.refund_type}
  isFullyRefunded={/* from status */}
  refundCount={/* from status */}
/>
```

---

## Final Deployment

After completing Phase 11:

1. **Run all tests**
   ```bash
   npm test
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Full E2E testing**
   - Sub-transaction CRUD
   - Receipt upload/parse/convert
   - Refund link/unlink
   - Splitwise interactions

---

## Success Criteria

- [ ] Badge shows on credits linked as refunds
- [ ] Badge shows on debits with refunds
- [ ] Modal shows ranked suggestions
- [ ] Link creates proper association
- [ ] Unlink clears association
- [ ] Status shows accurate totals
- [ ] Splitwise warning displays
- [ ] All three features work together
- [ ] No regressions in existing functionality
