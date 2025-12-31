/**
 * Transaction formatting utilities
 * Matches /txn design specifications
 */

// Category emoji/icon mapping (matching /txn)
export const getCategoryEmoji = (category?: string | null, merchantName?: string | null): string => {
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
export const getPaymentMethodColor = (accountType?: string | null): string => {
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
export const formatShortDate = (dateStr: string | null): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

// Format amount with Indian number formatting
export const formatIndianAmount = (amount?: string | null): string => {
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

// Display account type in shortened uppercase format
export const displayAccountType = (type?: string | null): string => {
  if (!type) return '';

  // Shorten common patterns
  let display = type.replace(/_/g, ' ');
  if (display.length > 10) {
    display = display.substring(0, 10);
  }
  return display.toUpperCase();
};
