import { memo } from 'react';

/**
 * Transaction Empty State Component
 * Matches /txn design specifications
 */
const TxnEmptyState = memo(function TxnEmptyState() {
  return (
    <div className="text-center py-12">
      <span className="text-6xl mb-4 block">📭</span>
      <p style={{ color: 'rgba(255,255,255,0.35)' }}>No transactions found</p>
    </div>
  );
});

export default TxnEmptyState;
