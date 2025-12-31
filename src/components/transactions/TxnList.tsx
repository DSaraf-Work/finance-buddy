import { memo } from 'react';
import { Transaction } from '@/pages/transactions';
import TxnCard from './TxnCard';

interface TxnListProps {
  transactions: Transaction[];
  onTransactionClick: (transaction: Transaction) => void;
}

/**
 * Transaction List Component
 * Renders a list of transaction cards with proper styling
 */
const TxnList = memo(function TxnList({ transactions, onTransactionClick }: TxnListProps) {
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
});

export default TxnList;
