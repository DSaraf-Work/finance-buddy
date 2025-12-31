import React, { memo, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  TxnList,
  TxnLoadingSkeleton,
  TxnEmptyState,
  TxnStyles
} from '@/components/transactions';

interface RecentTransactionsProps {
  limit?: number;
}

export const RecentTransactions = memo(function RecentTransactions({
  limit = 5
}: RecentTransactionsProps) {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentTransactions();
  }, []);

  const fetchRecentTransactions = async () => {
    try {
      const response = await fetch('/api/transactions/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: 1,
          pageSize: limit,
          sortBy: 'transaction_date',
          sortOrder: 'desc',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch recent transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionClick = (transaction: any) => {
    router.push(`/transactions?id=${transaction.id}`);
  };

  const handleViewAll = () => {
    router.push('/transactions');
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '14px',
      padding: '24px',
    }}>
      <TxnStyles />

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            fontSize: '15px',
            fontWeight: '600',
            color: '#FAFAFA',
            fontFamily: 'Outfit, sans-serif',
          }}>
            Recent Transactions
          </div>
          {!loading && transactions.length > 0 && (
            <div style={{
              padding: '4px 10px',
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.35)',
              fontFamily: 'Outfit, sans-serif',
            }}>
              {transactions.length}
            </div>
          )}
        </div>

        {!loading && transactions.length > 0 && (
          <button
            onClick={handleViewAll}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
              transition: 'all 0.2s ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#6366F1';
              e.currentTarget.style.color = '#6366F1';
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            View All
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <TxnLoadingSkeleton count={limit} />
      ) : transactions.length === 0 ? (
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>💸</div>
          <div style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.5)',
            fontFamily: 'Outfit, sans-serif',
          }}>
            No recent transactions
          </div>
        </div>
      ) : (
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '16px' }}>
          <TxnList
            transactions={transactions}
            onTransactionClick={handleTransactionClick}
          />
        </div>
      )}
    </div>
  );
});