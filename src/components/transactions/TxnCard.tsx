import { memo } from 'react';
import { Transaction } from '@/pages/transactions';
import { Users } from 'lucide-react';
import {
  getCategoryEmoji,
  getPaymentMethodColorClass,
  formatShortDate,
  formatIndianAmount,
  displayAccountType,
} from '@/lib/utils/transaction-formatters';
import { SubTransactionBadge } from '@/components/sub-transactions';

interface TxnCardProps {
  transaction: Transaction;
  onClick: () => void;
  isLast?: boolean;
}

const TxnCard = memo(function TxnCard({ transaction, onClick }: TxnCardProps) {
  const isExpense = transaction.direction === 'debit';
  const emoji = getCategoryEmoji(transaction.category, transaction.merchant_name);
  const paymentMethodColorClass = getPaymentMethodColorClass(transaction.account_type);

  return (
    <div
      className="flex items-center gap-3 px-1 py-3.5 rounded-xl cursor-pointer transition-colors duration-150 hover:bg-muted/10 active:bg-muted/15"
      onClick={onClick}
    >
      {/* Emoji icon */}
      <div
        className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-lg ${
          isExpense ? 'bg-foreground/[0.05]' : 'bg-green-500/10'
        }`}
      >
        {emoji}
      </div>

      {/* Left: name + category */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <span className="text-[15px] font-semibold text-foreground leading-tight truncate">
          {transaction.merchant_name || 'Unknown'}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-foreground/35 capitalize leading-none">
            {transaction.category || 'uncategorized'}
          </span>
          {transaction.splitwise_expense_id && (
            <Users className="w-3 h-3 text-emerald-400 shrink-0" />
          )}
        </div>
      </div>

      {/* Right: amount + meta */}
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <span
          className={`text-[15px] font-bold font-mono leading-tight ${
            isExpense ? 'text-red-400' : 'text-green-400'
          }`}
        >
          {isExpense ? '−' : '+'}₹{formatIndianAmount(transaction.amount)}
        </span>

        {transaction.account_type && (
          <span className={`text-[10px] font-semibold uppercase tracking-[0.4px] ${paymentMethodColorClass}`}>
            {displayAccountType(transaction.account_type)}
          </span>
        )}

        {(transaction.sub_transaction_count ?? 0) > 0 && (
          <SubTransactionBadge count={transaction.sub_transaction_count!} />
        )}

        <span className="text-[10px] text-foreground/25 font-medium">
          {formatShortDate(transaction.txn_time)}
        </span>
      </div>
    </div>
  );
});

export default TxnCard;
