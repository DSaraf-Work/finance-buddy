import { memo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Transaction } from '@/pages/transactions';
import TxnCard from './TxnCard';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export interface GroupedTransactions {
  date: string; // YYYY-MM-DD for sorting
  header: string; // Formatted display date
  transactions: Transaction[];
  total: number;
}

interface TxnListProps {
  transactions?: Transaction[];
  groupedTransactions?: GroupedTransactions[];
  onTransactionClick: (transaction: Transaction) => void;
}

/**
 * Get color classes based on amount for Day Total
 * Uses design system semantic colors
 * Green: credit (positive) or small debit up to 100
 * Yellow: debit 100-500
 * Orange: debit 500-1000
 * Red: debit 1000-5000
 * Dark Red: debit above 5000
 */
function getDayTotalClasses(total: number): { textClass: string; bgClass: string } {
  if (total > 0) {
    // Credit - Green (success)
    return { textClass: 'text-success', bgClass: 'bg-success/10' };
  }

  const absTotal = Math.abs(total);

  if (absTotal <= 100) {
    // Small debit - Green (minor expense)
    return { textClass: 'text-success', bgClass: 'bg-success/10' };
  } else if (absTotal <= 500) {
    // Medium debit - Yellow/Amber
    return { textClass: 'text-amber-400', bgClass: 'bg-amber-400/10' };
  } else if (absTotal <= 1000) {
    // Larger debit - Orange
    return { textClass: 'text-orange-400', bgClass: 'bg-orange-400/10' };
  } else if (absTotal <= 5000) {
    // High debit - Red (destructive)
    return { textClass: 'text-destructive', bgClass: 'bg-destructive/10' };
  } else {
    // Very high debit - Dark Crimson
    return { textClass: 'text-red-700', bgClass: 'bg-red-700/10' };
  }
}

/**
 * Collapsible Date Section Component
 * Uses Tailwind classes for design system compliance
 */
function DateSection({
  group,
  groupIndex,
  totalGroups,
  onTransactionClick,
}: {
  group: GroupedTransactions;
  groupIndex: number;
  totalGroups: number;
  onTransactionClick: (transaction: Transaction) => void;
}) {
  // First 2 dates expanded by default, rest collapsed
  const [isOpen, setIsOpen] = useState(groupIndex < 2);
  const { textClass, bgClass } = getDayTotalClasses(group.total);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {/* Date header - date on left, total on right */}
      <CollapsibleTrigger asChild>
        <div
          className={`
            flex items-center justify-between cursor-pointer px-1 mb-3
            hover:opacity-80 transition-all duration-200
            ${groupIndex === 0 ? '' : 'mt-5'}
          `}
        >
          {/* Left side: chevron + date + count */}
          <div className="flex items-center gap-2">
            <ChevronDown
              className={`
                h-4 w-4 text-muted-foreground transition-transform duration-200
                ${isOpen ? 'rotate-0' : '-rotate-90'}
              `}
            />
            <span className="text-[13px] font-medium text-muted-foreground/50 whitespace-nowrap">
              {group.header}
            </span>
            {/* Show count when collapsed */}
            {!isOpen && (
              <span className="text-xs text-muted-foreground animate-in fade-in duration-200">
                ({group.transactions.length})
              </span>
            )}
          </div>

          {/* Right side: day total (always visible) */}
          {group.total !== 0 && (
            <span
              className={`
                text-xs font-medium px-2 py-0.5 rounded
                transition-all duration-200 hover:scale-105
                ${textClass} ${bgClass}
              `}
            >
              {group.total > 0 ? '+' : ''}₹{Math.abs(group.total).toFixed(0)}
            </span>
          )}
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="animate-in slide-in-from-top-2 duration-200">
        {/* Transactions for this date */}
        {group.transactions.map((txn, index) => (
          <TxnCard
            key={txn.id}
            transaction={txn}
            isLast={
              groupIndex === totalGroups - 1 &&
              index === group.transactions.length - 1
            }
            onClick={() => onTransactionClick(txn)}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Transaction List Component
 * Renders a list of transaction cards with optional date grouping
 * Features: Collapsible date sections, staggered animations, design system compliance
 */
const TxnList = memo(function TxnList({
  transactions,
  groupedTransactions,
  onTransactionClick,
}: TxnListProps) {
  // If grouped transactions are provided, render with collapsible date sections
  if (groupedTransactions && groupedTransactions.length > 0) {
    return (
      <div className="flex flex-col">
        {groupedTransactions.map((group, groupIndex) => (
          <DateSection
            key={group.date}
            group={group}
            groupIndex={groupIndex}
            totalGroups={groupedTransactions.length}
            onTransactionClick={onTransactionClick}
          />
        ))}
      </div>
    );
  }

  // Fallback to flat list (backward compatibility)
  if (transactions) {
    return (
      <div className="flex flex-col">
        {transactions.map((txn, index) => (
          <TxnCard
            key={txn.id}
            transaction={txn}
            isLast={index === transactions.length - 1}
            onClick={() => onTransactionClick(txn)}
          />
        ))}
      </div>
    );
  }

  return null;
});

export default TxnList;
