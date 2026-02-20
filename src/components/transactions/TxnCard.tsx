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

interface TxnCardProps {
  transaction: Transaction;
  onClick: () => void;
  isLast?: boolean;
}

/**
 * Transaction Card Component - Matches /txn design exactly
 *
 * Design Specifications:
 * - Icon: 48x48px, borderRadius 14px
 * - Gap between icon and text: 14px
 * - Gap within info column: 4px
 * - Gap in amount column: 2px
 * - Font: Outfit for text, font-mono for amounts
 * - Animation: slideIn 0.35s ease-out
 */
const TxnCard = memo(function TxnCard({ transaction, onClick, isLast }: TxnCardProps) {
  const isExpense = transaction.direction === 'debit';
  const emoji = getCategoryEmoji(transaction.category, transaction.merchant_name);
  const paymentMethodColorClass = getPaymentMethodColorClass(transaction.account_type);

  return (
    <>
      {/* Transaction item */}
      <div
        className="transaction-item flex justify-between items-center px-2 py-4 rounded-xl cursor-pointer transition-all duration-200 hover:bg-muted/10"
        onClick={onClick}
      >
        {/* Left side */}
        <div className="flex items-center gap-3.5">
          {/* Icon: 48x48, borderRadius 14px */}
          <div
            className={`w-12 h-12 rounded-[14px] flex items-center justify-center ${
              isExpense ? 'bg-foreground/[0.04]' : 'bg-green-500/10'
            }`}
          >
            <span className="text-lg">{emoji}</span>
          </div>

          {/* Info column */}
          <div className="flex flex-col gap-1">
            <span className="text-[15px] font-medium text-foreground">
              {transaction.merchant_name || 'Unknown'}
            </span>
            {/* Category + Splitwise indicator */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-foreground/35">
                {transaction.category || 'Uncategorized'}
              </span>
              {transaction.splitwise_expense_id && (
                <span title="Split on Splitwise" className="flex items-center">
                  <Users className="w-3 h-3 text-emerald-400" />
                </span>
              )}
            </div>
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
            <span
              className={`text-[10px] font-medium uppercase tracking-[0.3px] ${paymentMethodColorClass}`}
            >
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

export default TxnCard;
