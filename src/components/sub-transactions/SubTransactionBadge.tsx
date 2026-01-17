/**
 * SubTransactionBadge
 *
 * A small badge that indicates a transaction has been split into sub-transactions.
 * Displayed on transaction cards/rows when sub-transactions exist.
 */

import { memo } from 'react';
import { Layers } from 'lucide-react';

interface SubTransactionBadgeProps {
  /** Number of sub-transactions */
  count: number;
  /** Whether the total matches the parent amount */
  isValid?: boolean;
  /** Optional click handler */
  onClick?: () => void;
  /** Size variant */
  size?: 'sm' | 'md';
}

export const SubTransactionBadge = memo(function SubTransactionBadge({
  count,
  isValid = true,
  onClick,
  size = 'sm',
}: SubTransactionBadgeProps) {
  if (count === 0) return null;

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
        ${isValid
          ? 'bg-primary/15 text-primary'
          : 'bg-amber-500/15 text-amber-400'}
      `}
      title={
        isValid
          ? `${count} sub-transactions`
          : `${count} sub-transactions (amounts don't match)`
      }
    >
      <Layers className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      <span
        className={`font-medium ${isSmall ? 'text-[10px]' : 'text-[11px]'}`}
      >
        {count}
      </span>
    </div>
  );
});

export default SubTransactionBadge;
