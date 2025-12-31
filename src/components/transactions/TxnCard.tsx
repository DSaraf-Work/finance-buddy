import { memo } from 'react';
import { Transaction } from '@/pages/transactions';
import {
  getCategoryEmoji,
  getPaymentMethodColor,
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
 * - Font: Outfit for text, JetBrains Mono for amounts
 * - Animation: slideIn 0.35s ease-out
 */
const TxnCard = memo(function TxnCard({ transaction, onClick, isLast }: TxnCardProps) {
  const isExpense = transaction.direction === 'debit';
  const emoji = getCategoryEmoji(transaction.category, transaction.merchant_name);
  const paymentMethodColor = getPaymentMethodColor(transaction.account_type);

  return (
    <>
      {/* transactionItem - exact match to /txn design */}
      <div
        className="transaction-item"
        onClick={onClick}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 8px',
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        {/* transactionLeft - gap 14px */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* transactionIcon - 48x48, borderRadius 14px */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isExpense ? 'rgba(255,255,255,0.04)' : 'rgba(34, 197, 94, 0.12)'
            }}
          >
            <span style={{ fontSize: '18px' }}>{emoji}</span>
          </div>

          {/* transactionInfo - gap 4px */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* transactionTitle - 15px, 500 */}
            <span style={{ fontSize: '15px', fontWeight: '500' }}>
              {transaction.merchant_name || 'Unknown'}
            </span>
            {/* transactionCategory - 12px, rgba(255,255,255,0.35) */}
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
              {transaction.category || 'Uncategorized'}
            </span>
          </div>
        </div>

        {/* transactionRight - gap 2px for tighter spacing */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
          {/* transactionAmount - 15px, 600, JetBrains Mono */}
          <span
            style={{
              fontSize: '15px',
              fontWeight: '600',
              fontFamily: '"JetBrains Mono", monospace',
              color: isExpense ? '#F87171' : '#22C55E'
            }}
          >
            {isExpense ? '-' : '+'}₹{formatIndianAmount(transaction.amount)}
          </span>

          {/* Payment method - 10px, 500, uppercase, colored */}
          {transaction.account_type && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                color: paymentMethodColor
              }}
            >
              {displayAccountType(transaction.account_type)}
            </span>
          )}

          {/* transactionDate - 10px, rgba(255,255,255,0.3), 500 */}
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '500' }}>
            {formatShortDate(transaction.txn_time)}
          </span>
        </div>
      </div>

      {/* separatorWrapper + separator - 80%, 1px, rgba(255,255,255,0.06) */}
      {!isLast && (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div style={{ width: '80%', height: '1px', background: 'rgba(255,255,255,0.06)' }} />
        </div>
      )}
    </>
  );
});

export default TxnCard;
