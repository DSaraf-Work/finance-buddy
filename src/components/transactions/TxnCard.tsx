import { memo } from 'react';
import { Transaction } from '@/pages/transactions';
import {
  getCategoryEmoji,
  getPaymentMethodColor,
  formatShortDate,
  formatIndianAmount,
  displayAccountType,
} from '@/lib/utils/transaction-formatters';
import {
  isReceiptParsingEnabled,
  isSmartRefundsEnabled,
} from '@/lib/features/flags';
import { ReceiptBadge } from '@/components/receipts';
import { RefundBadge, RefundIndicator } from '@/components/refunds';
import { Users } from 'lucide-react';
import type { ReceiptParsingStatus } from '@/types/receipts';

interface TxnCardProps {
  transaction: Transaction;
  onClick: () => void;
  isLast?: boolean;
  /** Optional: Receipt parsing status (Phase 2) */
  receiptStatus?: ReceiptParsingStatus;
  /** Optional: Number of parsed receipt items (Phase 2) */
  receiptItemCount?: number;
  /** Optional: Total amount refunded (Phase 3 - for debits) */
  refundTotal?: number;
  /** Optional: Number of refund links (Phase 3 - for debits) */
  refundCount?: number;
  /** Optional: Number of original transactions linked (Phase 3 - for credits) */
  refundLinkCount?: number;
}

/**
 * Transaction Card Component - Matte Dark Design System
 *
 * Design Specifications:
 * - Icon: 48x48px, borderRadius 14px
 * - Gap between icon and text: 14px (gap-3.5)
 * - Gap within info column: 4px (gap-1)
 * - Gap in amount column: 2px (gap-0.5)
 * - Font: Outfit for text, font-mono for amounts
 * - Animation: transition-all duration-200 with micro-interactions
 */
const TxnCard = memo(function TxnCard({
  transaction,
  onClick,
  isLast,
  receiptStatus,
  receiptItemCount,
  refundTotal,
  refundCount,
  refundLinkCount,
}: TxnCardProps) {
  const isExpense = transaction.direction === 'debit';
  const isCredit = transaction.direction === 'credit';
  const emoji = getCategoryEmoji(transaction.category, transaction.merchant_name);
  const paymentMethodColor = getPaymentMethodColor(transaction.account_type);

  // Feature flag checks
  const showReceiptBadge = isReceiptParsingEnabled() && receiptStatus;
  const showRefundBadge = isSmartRefundsEnabled() && isExpense && refundTotal && refundTotal > 0;
  const showRefundIndicator = isSmartRefundsEnabled() && isCredit && refundLinkCount && refundLinkCount > 0;

  return (
    <>
      {/* Transaction Item */}
      <div
        onClick={onClick}
        className="
          group flex justify-between items-center
          px-2 py-4 rounded-xl cursor-pointer
          transition-all duration-200 ease-out
          hover:bg-muted/30 hover:shadow-sm
          active:scale-[0.98] active:bg-muted/40
        "
      >
        {/* Left Section - Icon + Info */}
        <div className="flex items-center gap-3.5">
          {/* Category Icon - with hover animation */}
          <div
            className={`
              w-12 h-12 rounded-[14px] flex items-center justify-center
              transition-all duration-200 ease-out
              group-hover:scale-105
              ${isExpense ? 'bg-foreground/[0.04] group-hover:bg-foreground/[0.08]' : 'bg-success/[0.12] group-hover:bg-success/[0.18]'}
            `}
          >
            <span className="text-lg transition-transform duration-200 group-hover:scale-110">{emoji}</span>
          </div>

          {/* Transaction Info */}
          <div className="flex flex-col gap-1">
            {/* Merchant Name */}
            <span className="text-[15px] font-medium text-foreground">
              {transaction.merchant_name || 'Unknown'}
            </span>

            {/* Category + Badges Row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground/50">
                {transaction.category || 'Uncategorized'}
              </span>

              {/* Receipt badge (Phase 2) */}
              {showReceiptBadge && (
                <ReceiptBadge
                  status={receiptStatus!}
                  itemCount={receiptItemCount}
                  size="sm"
                />
              )}

              {/* Refund badge for debits (Phase 3) */}
              {showRefundBadge && (
                <RefundBadge
                  totalRefunded={refundTotal!}
                  originalAmount={parseFloat(transaction.amount)}
                  refundCount={refundCount}
                  size="sm"
                />
              )}

              {/* Refund indicator for credits (Phase 3) */}
              {showRefundIndicator && (
                <RefundIndicator
                  linkCount={refundLinkCount!}
                  size="sm"
                />
              )}

              {/* Splitwise indicator */}
              {transaction.splitwise_expense_id && (
                <span title="Split on Splitwise" className="flex items-center">
                  <Users className="w-3 h-3 text-success" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - Amount + Details */}
        <div className="flex flex-col items-end gap-0.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5">
          {/* Amount */}
          <span
            className={`
              text-[15px] font-semibold font-mono transition-colors duration-200
              ${isExpense ? 'text-destructive group-hover:text-destructive/90' : 'text-success group-hover:text-success/90'}
            `}
          >
            {isExpense ? '-' : '+'}₹{formatIndianAmount(transaction.amount)}
          </span>

          {/* Payment Method */}
          {transaction.account_type && (
            <span
              className="text-[10px] font-medium uppercase tracking-wide transition-opacity duration-200 group-hover:opacity-80"
              style={{ color: paymentMethodColor }}
            >
              {displayAccountType(transaction.account_type)}
            </span>
          )}

          {/* Date */}
          <span className="text-[10px] font-medium text-muted-foreground/40 transition-opacity duration-200 group-hover:text-muted-foreground/60">
            {formatShortDate(transaction.txn_time)}
          </span>
        </div>
      </div>

      {/* Separator - subtle animated line */}
      {!isLast && (
        <div className="flex justify-center w-full overflow-hidden">
          <div className="w-4/5 h-px bg-foreground/[0.06] transition-all duration-300" />
        </div>
      )}
    </>
  );
});

export default TxnCard;
