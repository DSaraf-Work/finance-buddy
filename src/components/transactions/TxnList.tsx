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

// Get color based on amount for Day Total
// Green: credit (positive) or small debit up to 100
// Yellow: debit 100-500
// Orange: debit 500-1000
// Red: debit 1000-5000
// Purple/Indigo: debit above 5000
function getDayTotalColor(total: number): { text: string; bg: string } {
  if (total > 0) {
    // Credit - Green
    return { text: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
  }

  const absTotal = Math.abs(total);

  if (absTotal <= 100) {
    // Small debit - Green (minor expense)
    return { text: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
  } else if (absTotal <= 500) {
    // Medium debit - Yellow
    return { text: '#EAB308', bg: 'rgba(234, 179, 8, 0.1)' };
  } else if (absTotal <= 1000) {
    // Larger debit - Orange
    return { text: '#F97316', bg: 'rgba(249, 115, 22, 0.1)' };
  } else if (absTotal <= 5000) {
    // High debit - Red
    return { text: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' };
  } else {
    // Very high debit - Dark Crimson (darker red = more severe)
    return { text: '#B91C1C', bg: 'rgba(185, 28, 28, 0.1)' };
  }
}

/**
 * Collapsible Date Section Component
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
  const colors = getDayTotalColor(group.total);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {/* Date header - date on left, total on right */}
      <CollapsibleTrigger asChild>
        <div
          className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
          style={{
            marginTop: groupIndex === 0 ? '0' : '20px',
            marginBottom: '12px',
            padding: '0 4px',
          }}
        >
          {/* Left side: chevron + date + count */}
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-[#71717A]" />
            ) : (
              <ChevronRight className="h-4 w-4 text-[#71717A]" />
            )}
            <span
              style={{
                fontSize: '13px',
                fontWeight: '500',
                color: 'rgba(255,255,255,0.5)',
                whiteSpace: 'nowrap',
              }}
            >
              {group.header}
            </span>
            {/* Show count when collapsed */}
            {!isOpen && (
              <span
                style={{
                  fontSize: '12px',
                  color: '#71717A',
                }}
              >
                ({group.transactions.length})
              </span>
            )}
          </div>

          {/* Right side: day total (always visible) */}
          {group.total !== 0 && (
            <span
              style={{
                fontSize: '12px',
                fontWeight: '500',
                color: colors.text,
                padding: '2px 8px',
                background: colors.bg,
                borderRadius: '4px',
              }}
            >
              {group.total > 0 ? '+' : ''}₹{Math.abs(group.total).toFixed(0)}
            </span>
          )}
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
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
 */
const TxnList = memo(function TxnList({
  transactions,
  groupedTransactions,
  onTransactionClick,
}: TxnListProps) {
  // If grouped transactions are provided, render with collapsible date sections
  if (groupedTransactions && groupedTransactions.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
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
      <div style={{ display: 'flex', flexDirection: 'column' }}>
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
