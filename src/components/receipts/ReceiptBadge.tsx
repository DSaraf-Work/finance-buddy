/**
 * ReceiptBadge
 *
 * A small badge that indicates the receipt status for a transaction.
 * Displayed on transaction cards when a receipt exists.
 */

import { memo } from 'react';
import { Receipt, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import type { ReceiptParsingStatus } from '@/types/receipts';

interface ReceiptBadgeProps {
  /** Parsing status of the receipt */
  status: ReceiptParsingStatus;
  /** Number of parsed items (shown when completed) */
  itemCount?: number;
  /** Optional click handler */
  onClick?: () => void;
  /** Size variant */
  size?: 'sm' | 'md';
}

const statusConfig: Record<
  ReceiptParsingStatus,
  { icon: typeof Receipt; color: string; bgColor: string; label: string }
> = {
  pending: {
    icon: Receipt,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
    label: 'Pending',
  },
  processing: {
    icon: Loader2,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/15',
    label: 'Processing',
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-500/15',
    label: 'Parsed',
  },
  failed: {
    icon: AlertCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/15',
    label: 'Failed',
  },
  manual_review: {
    icon: AlertCircle,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/15',
    label: 'Review',
  },
};

export const ReceiptBadge = memo(function ReceiptBadge({
  status,
  itemCount,
  onClick,
  size = 'sm',
}: ReceiptBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isSmall = size === 'sm';
  const isProcessing = status === 'processing';

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
      title={`Receipt: ${config.label}${itemCount ? ` (${itemCount} items)` : ''}`}
    >
      <Icon
        className={`
          ${isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'}
          ${isProcessing ? 'animate-spin' : ''}
        `}
      />
      <span className={`font-medium ${isSmall ? 'text-[10px]' : 'text-[11px]'}`}>
        {status === 'completed' && itemCount !== undefined
          ? `${itemCount} items`
          : config.label}
      </span>
    </div>
  );
});

export default ReceiptBadge;
