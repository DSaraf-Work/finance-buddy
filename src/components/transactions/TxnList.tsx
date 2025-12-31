import { memo } from 'react';
import { Transaction } from '@/pages/transactions';
import TxnCard from './TxnCard';
import { Separator } from '@/components/ui/separator';

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
 * Transaction List Component
 * Renders a list of transaction cards with optional date grouping
 */
const TxnList = memo(function TxnList({
  transactions,
  groupedTransactions,
  onTransactionClick
}: TxnListProps) {
  // If grouped transactions are provided, render with date separators
  if (groupedTransactions && groupedTransactions.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {groupedTransactions.map((group, groupIndex) => (
          <div key={group.date}>
            {/* Date separator with formatted date */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: groupIndex === 0 ? '0' : '20px',
                marginBottom: '12px'
              }}
            >
              <Separator className="flex-1 bg-[#27272A]" />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: 'rgba(255,255,255,0.5)',
                  whiteSpace: 'nowrap'
                }}
              >
                {group.header}
              </span>
              <Separator className="flex-1 bg-[#27272A]" />
            </div>

            {/* Transactions for this date */}
            {group.transactions.map((txn, index) => (
              <TxnCard
                key={txn.id}
                transaction={txn}
                isLast={
                  groupIndex === groupedTransactions.length - 1 &&
                  index === group.transactions.length - 1
                }
                onClick={() => onTransactionClick(txn)}
              />
            ))}

            {/* Daily total (optional - can be commented out if not needed) */}
            {group.total !== 0 && (
              <div
                style={{
                  textAlign: 'right',
                  padding: '8px 16px',
                  fontSize: '12px',
                  color: group.total > 0 ? '#10B981' : '#EF4444',
                  fontWeight: '500',
                  marginTop: '4px',
                  marginBottom: '8px',
                  background: group.total > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '6px'
                }}
              >
                Day Total: {group.total > 0 ? '+' : ''}₹{Math.abs(group.total).toFixed(2)}
              </div>
            )}
          </div>
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
