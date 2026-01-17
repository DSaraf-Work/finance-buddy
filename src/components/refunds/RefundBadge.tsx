/**
 * RefundBadge
 *
 * A small badge that indicates refund status for a transaction.
 * Shows different states: fully refunded, partially refunded, no refunds.
 */

import { memo } from 'react';
import { Undo2, CheckCircle2, CircleDot } from 'lucide-react';

interface RefundBadgeProps {
  /** Total amount refunded */
  totalRefunded: number;
  /** Original transaction amount */
  originalAmount: number;
  /** Number of refund links */
  refundCount?: number;
  /** Optional click handler */
  onClick?: () => void;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Currency symbol */
  currency?: string;
}

export const RefundBadge = memo(function RefundBadge({
  totalRefunded,
  originalAmount,
  refundCount = 0,
  onClick,
  size = 'sm',
  currency = '₹',
}: RefundBadgeProps) {
  const isFullyRefunded = totalRefunded >= originalAmount;
  const hasPartialRefund = totalRefunded > 0 && totalRefunded < originalAmount;
  const refundPercentage = originalAmount > 0
    ? Math.min(100, Math.round((totalRefunded / originalAmount) * 100))
    : 0;

  // Don't show badge if no refunds
  if (totalRefunded === 0 || refundCount === 0) {
    return null;
  }

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const isSmall = size === 'sm';

  // Determine badge config based on status
  const config = isFullyRefunded
    ? {
        icon: CheckCircle2,
        color: 'text-green-400',
        bgColor: 'bg-green-500/15',
        label: 'Refunded',
      }
    : {
        icon: CircleDot,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/15',
        label: `${refundPercentage}%`,
      };

  const Icon = config.icon;

  return (
    <div
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      className={`
        inline-flex items-center gap-1 rounded-full
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
        ${isSmall ? 'px-2 py-0.5' : 'px-2.5 py-1'}
        ${config.bgColor} ${config.color}
      `}
      title={`${isFullyRefunded ? 'Fully' : 'Partially'} refunded: ${currency}${formatAmount(totalRefunded)} of ${currency}${formatAmount(originalAmount)}`}
    >
      <Icon
        className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'}
      />
      <span className={`font-medium ${isSmall ? 'text-[10px]' : 'text-[11px]'}`}>
        {isFullyRefunded
          ? config.label
          : hasPartialRefund
            ? `${refundPercentage}%`
            : config.label}
      </span>
    </div>
  );
});

/**
 * RefundIndicator
 *
 * A small indicator for refund transactions (credits) showing
 * they are linked to original transactions.
 */
export const RefundIndicator = memo(function RefundIndicator({
  linkCount,
  onClick,
  size = 'sm',
}: {
  linkCount: number;
  onClick?: () => void;
  size?: 'sm' | 'md';
}) {
  if (linkCount === 0) return null;

  const isSmall = size === 'sm';

  return (
    <div
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      className={`
        inline-flex items-center gap-1 rounded-full
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
        ${isSmall ? 'px-2 py-0.5' : 'px-2.5 py-1'}
        bg-blue-500/15 text-blue-400
      `}
      title={`Linked to ${linkCount} original transaction${linkCount > 1 ? 's' : ''}`}
    >
      <Undo2 className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      <span className={`font-medium ${isSmall ? 'text-[10px]' : 'text-[11px]'}`}>
        {linkCount} linked
      </span>
    </div>
  );
});

export default RefundBadge;
