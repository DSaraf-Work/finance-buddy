import { memo } from 'react';

/**
 * Transaction Empty State Component
 * Matches /txn design specifications
 */
const TxnEmptyState = memo(function TxnEmptyState() {
  return (
    <div className="text-center py-12">
      <span className="text-6xl mb-4 block">📭</span>
      <p className="text-foreground/35 text-sm">No transactions found</p>
    </div>
  );
});

export default TxnEmptyState;
