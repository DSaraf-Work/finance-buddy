import { memo } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
      <p className="mb-4 text-sm text-red-400">
        {error}
      </p>
      <Button
        onClick={onRetry}
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        Retry
      </Button>
    </div>
  );
});

export default TxnErrorState;
