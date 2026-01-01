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
    // Very high debit - Purple/Indigo
    return { text: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' };
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
  const [isOpen, setIsOpen] = useState(true);
  const colors = getDayTotalColor(group.total);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {/* Date separator with formatted date - clickable to collapse */}
      <CollapsibleTrigger asChild>
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          style={{
            marginTop: groupIndex === 0 ? '0' : '20px',
            marginBottom: '12px',
          }}
        >
          <Separator className="flex-1 bg-[#27272A]" />
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
            {/* Show mini total when collapsed */}
            {!isOpen && group.total !== 0 && (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: colors.text,
                }}
              >
                {group.total > 0 ? '+' : ''}₹{Math.abs(group.total).toFixed(0)}
              </span>
            )}
          </div>
          <Separator className="flex-1 bg-[#27272A]" />
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

        {/* Daily total with color palette */}
        {group.total !== 0 && (
          <div
            style={{
              textAlign: 'right',
              padding: '8px 16px',
              fontSize: '12px',
              color: colors.text,
              fontWeight: '500',
              marginTop: '4px',
              marginBottom: '8px',
              background: colors.bg,
              borderRadius: '6px',
            }}
          >
            Day Total: {group.total > 0 ? '+' : ''}₹{Math.abs(group.total).toFixed(2)}
          </div>
        )}
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
