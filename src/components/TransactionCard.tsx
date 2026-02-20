import { memo } from 'react';
import { Transaction, TransactionStatus } from '@/pages/transactions';
import {
  getCategoryEmoji,
  getPaymentMethodColorClass,
  formatShortDate,
  formatIndianAmount,
  displayAccountType,
} from '@/lib/utils/transaction-formatters';

interface TransactionCardProps {
  transaction: Transaction;
  onQuickEdit: () => void;
  onStatusUpdate: (status: TransactionStatus) => void;
  isLast?: boolean;
}

// Transaction Card Component (matches /txn design exactly)
const TransactionCard = memo(function TransactionCard({ transaction, onQuickEdit, onStatusUpdate, isLast }: TransactionCardProps) {
  const isExpense = transaction.direction === 'debit';
  const emoji = getCategoryEmoji(transaction.category, transaction.merchant_name);
  const paymentMethodColorClass = getPaymentMethodColorClass(transaction.account_type);

  return (
    <>
      {/* Transaction item */}
      <div
        className="flex justify-between items-center px-2 py-4 rounded-xl cursor-pointer transition-all duration-200 hover:bg-muted/10"
        onClick={onQuickEdit}
      >
        {/* Left side */}
        <div className="flex items-center gap-3.5">
          {/* Icon container */}
          <div
            className={`w-12 h-12 rounded-[14px] flex items-center justify-center ${
              isExpense ? 'bg-foreground/[0.04]' : 'bg-green-500/10'
            }`}
          >
            <span className="text-lg">{emoji}</span>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-1">
            <span className="text-[15px] font-medium text-foreground">
              {transaction.merchant_name || 'Unknown'}
            </span>
            <span className="text-xs text-foreground/35">
              {transaction.category || 'Uncategorized'}
            </span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-col items-end gap-0.5">
          <span
            className={`text-[15px] font-semibold font-mono ${
              isExpense ? 'text-red-400' : 'text-green-400'
            }`}
          >
            {isExpense ? '-' : '+'}₹{formatIndianAmount(transaction.amount)}
          </span>
          {transaction.account_type && (
            <span className={`text-[10px] font-medium uppercase tracking-[0.3px] ${paymentMethodColorClass}`}>
              {displayAccountType(transaction.account_type)}
            </span>
          )}
          <span className="text-[10px] text-foreground/30 font-medium">
            {formatShortDate(transaction.txn_time)}
          </span>
        </div>
      </div>

      {/* Separator */}
      {!isLast && (
        <div className="flex justify-center w-full">
          <div className="w-4/5 h-px bg-foreground/[0.06]" />
        </div>
      )}
    </>
  );
});

export default TransactionCard;
