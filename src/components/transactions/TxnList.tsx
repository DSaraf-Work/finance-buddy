import { memo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Transaction } from '@/pages/transactions';
import TxnCard from './TxnCard';
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

// Dynamic colors for day total — cannot use static Tailwind for computed values
function getDayTotalColor(total: number): { text: string; bg: string } {
  if (total > 0) return { text: '#10B981', bg: 'rgba(16,185,129,0.1)' };
  const abs = Math.abs(total);
  if (abs <= 100)  return { text: '#10B981', bg: 'rgba(16,185,129,0.1)' };
  if (abs <= 500)  return { text: '#EAB308', bg: 'rgba(234,179,8,0.1)' };
  if (abs <= 1000) return { text: '#F97316', bg: 'rgba(249,115,22,0.1)' };
  if (abs <= 5000) return { text: '#EF4444', bg: 'rgba(239,68,68,0.1)' };
  return { text: '#B91C1C', bg: 'rgba(185,28,28,0.1)' };
}

function DateSection({
  group,
  groupIndex,
  onTransactionClick,
}: {
  group: GroupedTransactions;
  groupIndex: number;
  totalGroups: number;
  onTransactionClick: (transaction: Transaction) => void;
}) {
  const [isOpen, setIsOpen] = useState(groupIndex < 2);
  const colors = getDayTotalColor(group.total);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {/* Date header row */}
      <CollapsibleTrigger asChild>
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          style={{ marginTop: groupIndex === 0 ? '4px' : '20px', marginBottom: '4px' }}
        >
          {/* Rotating chevron */}
          <ChevronRight
            className="h-3.5 w-3.5 shrink-0 text-foreground/30 transition-transform duration-200"
            style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
          />

          {/* Date label */}
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/40 shrink-0 whitespace-nowrap">
            {group.header}
            {!isOpen && (
              <span className="ml-1.5 text-foreground/20 font-normal normal-case tracking-normal">
                · {group.transactions.length}
              </span>
            )}
          </span>

          {/* Thin rule */}
          <div className="flex-1 h-px bg-foreground/[0.06]" />

          {/* Day total pill */}
          {group.total !== 0 && (
            <span
              className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-full shrink-0"
              style={{ color: colors.text, background: colors.bg }}
            >
              {group.total > 0 ? '+' : ''}₹{Math.abs(group.total).toFixed(0)}
            </span>
          )}
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        {group.transactions.map((txn) => (
          <TxnCard
            key={txn.id}
            transaction={txn}
            onClick={() => onTransactionClick(txn)}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

const TxnList = memo(function TxnList({
  transactions,
  groupedTransactions,
  onTransactionClick,
}: TxnListProps) {
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

  if (transactions) {
    return (
      <div className="flex flex-col">
        {transactions.map((txn) => (
          <TxnCard
            key={txn.id}
            transaction={txn}
            onClick={() => onTransactionClick(txn)}
          />
        ))}
      </div>
    );
  }

  return null;
});

export default TxnList;
