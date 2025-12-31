import { memo } from 'react';

interface TxnErrorStateProps {
  error: string;
  onRetry: () => void;
}

/**
 * Transaction Error State Component
 * Matches /txn design specifications
 */
const TxnErrorState = memo(function TxnErrorState({ error, onRetry }: TxnErrorStateProps) {
  return (
    <div className="text-center py-12">
      <p className="mb-4" style={{ color: '#F87171' }}>
        {error}
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-xl font-medium"
        style={{ background: '#6366F1', color: 'white' }}
      >
        Retry
      </button>
    </div>
  );
});

export default TxnErrorState;
