import { memo } from 'react';
import { Transaction, TransactionStatus } from '@/pages/transactions';

interface TransactionCardProps {
  transaction: Transaction;
  onQuickEdit: () => void;
  onStatusUpdate: (status: TransactionStatus) => void;
  isLast?: boolean;
}

// Category emoji/icon mapping (matching /txn)
const getCategoryEmoji = (category?: string | null, merchantName?: string | null): string => {
  const cat = category?.toLowerCase() || '';
  const merchant = merchantName?.toLowerCase() || '';

  // Check merchant name first for specific matches
  if (merchant.includes('swiggy') || merchant.includes('zomato')) return '🍜';
  if (merchant.includes('bigbasket') || merchant.includes('zepto') || merchant.includes('blinkit')) return '🛒';
  if (merchant.includes('netflix') || merchant.includes('hotstar') || merchant.includes('prime')) return '▶️';
  if (merchant.includes('ola') || merchant.includes('uber') || merchant.includes('rapido')) return '🚗';
  if (merchant.includes('chai') || merchant.includes('coffee') || merchant.includes('starbucks')) return '☕';
  if (merchant.includes('mutual fund') || merchant.includes('investment')) return '📈';
  if (merchant.includes('electricity') || merchant.includes('bescom') || merchant.includes('power')) return '⚡';
  if (merchant.includes('salary') || merchant.includes('freelance') || merchant.includes('upwork')) return '✏️';

  // Fallback to category
  switch (cat) {
    case 'food': case 'food & dining': case 'dining': return '🍜';
    case 'groceries': case 'grocery': return '🛒';
    case 'income': case 'salary': return '✏️';
    case 'subscription': case 'entertainment': return '▶️';
    case 'transport': case 'transportation': case 'travel': return '🚗';
    case 'utilities': case 'bills': return '⚡';
    case 'investment': case 'savings': return '📈';
    case 'shopping': return '🛍️';
    case 'health': case 'medical': return '💊';
    case 'education': return '📚';
    default: return '💳';
  }
};

// Payment method color mapping (from /txn design spec)
const getPaymentMethodColor = (accountType?: string | null): string => {
  const type = accountType?.toUpperCase() || '';

  if (type.includes('UPI')) return '#6366F1';
  if (type.includes('GPAY') || type.includes('GOOGLE')) return '#4285F4';
  if (type.includes('PHONEPE')) return '#5F259F';
  if (type.includes('PAYTM')) return '#00BAF2';
  if (type.includes('NEFT') || type.includes('WIRE') || type.includes('IMPS')) return '#10B981';
  if (type.includes('CARD') || type.includes('CREDIT') || type.includes('DEBIT')) return '#F59E0B';
  if (type.includes('AUTO')) return '#EF4444';
  return '#6B7280';
};

// Format date to "28 Dec" style (matching /txn)
const formatShortDate = (dateStr: string | null): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

// Transaction Card Component (matches /txn design exactly)
const TransactionCard = memo(function TransactionCard({ transaction, onQuickEdit, onStatusUpdate, isLast }: TransactionCardProps) {
  const isExpense = transaction.direction === 'debit';
  const emoji = getCategoryEmoji(transaction.category, transaction.merchant_name);
  const paymentMethodColor = getPaymentMethodColor(transaction.account_type);

  const formatAmount = (amount?: string | null) => {
    if (!amount) return '0';
    const numAmount = Math.abs(parseFloat(amount));
    // Indian number formatting with commas
    if (numAmount >= 10000000) {
      return (numAmount / 10000000).toFixed(2) + ' Cr';
    } else if (numAmount >= 100000) {
      return (numAmount / 100000).toFixed(2) + ' L';
    }
    return numAmount.toLocaleString('en-IN');
  };

  const displayAccountType = (type?: string | null): string => {
    if (!type) return '';
    // Shorten common patterns
    let display = type.replace(/_/g, ' ');
    if (display.length > 10) {
      display = display.substring(0, 10);
    }
    return display.toUpperCase();
  };

  return (
    <>
      {/* transactionItem - exact match to /txn design */}
      <div
        className="transaction-item"
        onClick={onQuickEdit}
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
            {/* transactionCategory only - 12px, rgba(255,255,255,0.35) */}
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
            {isExpense ? '-' : '+'}₹{formatAmount(transaction.amount)}
          </span>
          {/* Payment method - smaller text below amount */}
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

export default TransactionCard;

