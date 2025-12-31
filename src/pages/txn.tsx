import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Head from 'next/head';
import TransactionModal from '@/components/TransactionModal';

export type TransactionStatus = 'REVIEW' | 'APPROVED' | 'INVALID' | 'REJECTED';

export interface Transaction {
  id: string;
  user_id: string;
  google_user_id: string;
  connection_id: string;
  email_row_id: string;
  txn_time: string | null;
  amount: string;
  currency: string | null;
  direction: 'debit' | 'credit' | 'transfer' | null;
  merchant_name: string | null;
  merchant_normalized: string | null;
  category: string | null;
  account_hint: string | null;
  reference_id: string | null;
  location: string | null;
  account_type: string | null;
  transaction_type: 'Dr' | 'Cr' | null;
  ai_notes: string | null;
  user_notes: string | null;
  confidence: string;
  extraction_version: string;
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
}

// Category emoji/icon mapping
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

// Category background color mapping
const getCategoryBgColor = (category?: string | null, direction?: string | null): string => {
  const cat = category?.toLowerCase() || '';

  if (direction === 'credit') return 'bg-emerald-500/20';

  switch (cat) {
    case 'food': case 'food & dining': case 'dining': return 'bg-orange-500/20';
    case 'groceries': case 'grocery': return 'bg-violet-500/20';
    case 'income': case 'salary': return 'bg-emerald-500/20';
    case 'subscription': case 'entertainment': return 'bg-slate-600/40';
    case 'transport': case 'transportation': case 'travel': return 'bg-orange-400/20';
    case 'utilities': case 'bills': return 'bg-yellow-500/20';
    case 'investment': case 'savings': return 'bg-emerald-400/20';
    case 'shopping': return 'bg-pink-500/20';
    default: return 'bg-slate-500/20';
  }
};

// Payment method color mapping (from design spec)
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

// Format date to "28 Dec" style
const formatShortDate = (dateStr: string | null): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

// Transaction Card Component (matches design/transactions-final.jsx)
const TxnCard = ({
  transaction,
  onClick,
  isLast
}: {
  transaction: Transaction;
  onClick: () => void;
  isLast?: boolean;
}) => {
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
      {/* transactionItem - exact match to design */}
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
            {/* transactionMeta - gap 6px */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* transactionCategory - 12px, rgba(255,255,255,0.35) */}
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                {transaction.category || 'Uncategorized'}
              </span>
              {transaction.account_type && (
                <>
                  {/* metaDot - 8px, rgba(255,255,255,0.2) */}
                  <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)' }}>•</span>
                  {/* transactionMethod - 11px, 600, uppercase, letterSpacing 0.3px */}
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      color: paymentMethodColor
                    }}
                  >
                    {displayAccountType(transaction.account_type)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* transactionRight - gap 4px */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
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
          {/* transactionDate - 11px, rgba(255,255,255,0.3), 500 */}
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '500' }}>
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
};

// Main Page Component
export default function TxnPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
      return;
    }

    if (user) {
      fetchTransactions();
    }
  }, [user, authLoading, router]);

  const fetchTransactions = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/transactions/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          page,
          pageSize: pagination.pageSize,
          sort: 'desc',
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch transactions');

      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions || []);
        setPagination({
          page: data.page,
          pageSize: data.pageSize,
          total: data.total,
          totalPages: data.totalPages,
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionUpdate = async (updatedTransaction: Transaction) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: updatedTransaction.id,
          txn_time: updatedTransaction.txn_time,
          amount: updatedTransaction.amount,
          currency: updatedTransaction.currency,
          direction: updatedTransaction.direction,
          merchant_name: updatedTransaction.merchant_name,
          merchant_normalized: updatedTransaction.merchant_normalized,
          category: updatedTransaction.category,
          account_hint: updatedTransaction.account_hint,
          reference_id: updatedTransaction.reference_id,
          location: updatedTransaction.location,
          account_type: updatedTransaction.account_type,
          transaction_type: updatedTransaction.transaction_type,
          user_notes: updatedTransaction.user_notes,
          ai_notes: updatedTransaction.ai_notes,
        }),
      });

      if (!response.ok) throw new Error('Failed to update');

      const data = await response.json();
      if (data.success) {
        setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? { ...t, ...updatedTransaction } : t));
        setIsModalOpen(false);
        setSelectedTransaction(null);
      }
    } catch (err) {
      console.error('Failed to update transaction:', err);
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Transactions | FinBook</title>
        <meta name="description" content="Your financial transactions" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div
        className="min-h-screen bg-[#09090B] text-[#FAFAFA]"
        style={{
          fontFamily: '"Outfit", -apple-system, sans-serif',
          maxWidth: '430px',
          margin: '0 auto',
          position: 'relative'
        }}
      >
        {/* CSS from design spec */}
        <style>{`
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(-16px); }
            to { opacity: 1; transform: translateX(0); }
          }
          .transaction-item {
            animation: slideIn 0.35s ease-out backwards;
          }
          .transaction-item:hover {
            background: rgba(255,255,255,0.02) !important;
          }
          .menu-btn:hover {
            background: rgba(99, 102, 241, 0.15) !important;
          }
          .notif-btn:hover, .sync-btn:hover {
            background: rgba(255,255,255,0.08) !important;
          }
        `}</style>

        {/* Header - exact match to design */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            background: '#111113',
            borderBottom: '1px solid rgba(255,255,255,0.04)'
          }}
        >
          {/* headerLeft - gap 12px */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* logoIcon - 40x40, borderRadius 12px */}
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            >
              {/* rupeeSymbol - 20px, 700 */}
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#FAFAFA' }}>₹</span>
            </div>
            {/* appName - 18px, 700, letterSpacing -0.3px */}
            <span style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.3px' }}>FinBook</span>
          </div>

          {/* headerRight - gap 8px */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* iconBtn (notification) - 40x40, borderRadius 12px */}
            <button
              className="notif-btn"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                border: 'none',
                background: 'transparent',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* syncBtn - height 32px, px 12px, borderRadius 16px */}
            <button
              className="sync-btn"
              onClick={() => fetchTransactions(1)}
              style={{
                height: '32px',
                paddingLeft: '12px',
                paddingRight: '12px',
                borderRadius: '16px',
                border: 'none',
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#A5B4FC',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 01-9 9m0 0a9 9 0 01-9-9m9 9V3m0 0l3 3m-3-3l-3 3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* menuBtn - 44x44, borderRadius 14px, gap 4px, padding 12px */}
            <button
              className="menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'center',
                gap: '4px',
                padding: '12px'
              }}
            >
              {/* menuLine - 18px width, 2px height */}
              <span style={{ width: '18px', height: '2px', background: 'rgba(255,255,255,0.7)', borderRadius: '1px' }} />
              <span style={{ width: '18px', height: '2px', background: 'rgba(255,255,255,0.7)', borderRadius: '1px' }} />
              {/* Third line - 14px width */}
              <span style={{ width: '14px', height: '2px', background: 'rgba(255,255,255,0.7)', borderRadius: '1px' }} />
            </button>
          </div>
        </header>

        {/* Side Menu Overlay */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setMenuOpen(false)}>
            <div
              className="absolute right-0 top-0 h-full w-64 bg-[#1a1a1a] p-6 animate-slide-in-right"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <span className="text-lg font-semibold">Menu</span>
                <button onClick={() => setMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="space-y-4">
                <a href="/" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors">
                  <span>🏠</span> Dashboard
                </a>
                <a href="/transactions" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors">
                  <span>💰</span> Transactions (Old)
                </a>
                <a href="/settings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors">
                  <span>⚙️</span> Settings
                </a>
                <a href="/reports" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors">
                  <span>📊</span> Reports
                </a>
              </nav>
            </div>
          </div>
        )}

        {/* listContainer - padding 20px */}
        <main style={{ padding: '8px' }}>
          {/* listHeader - marginBottom 16px */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}
          >
            {/* listTitle - 15px, 600, rgba(255,255,255,0.9) */}
            <span style={{ fontSize: '15px', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>
              Transactions
            </span>
            {/* listCount - 12px, rgba(255,255,255,0.35), 600, bg 0.06, padding 4px 10px, radius 8px */}
            <span
              style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.35)',
                fontWeight: '600',
                background: 'rgba(255,255,255,0.06)',
                padding: '4px 10px',
                borderRadius: '8px'
              }}
            >
              {pagination.total}
            </span>
          </div>

          {/* Loading State - matches design spacing */}
          {loading && (
            <div>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center animate-pulse" style={{ padding: '16px 8px', gap: '14px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)' }} />
                  <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ height: '15px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', width: '70%' }} />
                    <div style={{ height: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', width: '45%' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <div style={{ height: '15px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', width: '72px' }} />
                    <div style={{ height: '11px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', width: '48px' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12">
              <p className="text-[var(--color-expense)] mb-4">{error}</p>
              <button
                onClick={() => fetchTransactions()}
                className="px-4 py-2 bg-[#5B8CFF] text-white rounded-xl font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && transactions.length === 0 && (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📭</span>
              <p className="text-[var(--color-text-muted)]">No transactions found</p>
            </div>
          )}

          {/* transactionsList - flex column */}
          {!loading && !error && transactions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {transactions.map((txn, index) => (
                <TxnCard
                  key={txn.id}
                  transaction={txn}
                  isLast={index === transactions.length - 1}
                  onClick={() => {
                    setSelectedTransaction(txn);
                    setIsModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}

          {/* Load More */}
          {!loading && pagination.page < pagination.totalPages && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => fetchTransactions(pagination.page + 1)}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
              >
                Load More
              </button>
            </div>
          )}
        </main>

        {/* Transaction Modal */}
        {selectedTransaction && (
          <TransactionModal
            transaction={selectedTransaction}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedTransaction(null);
            }}
            onSave={handleTransactionUpdate}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
