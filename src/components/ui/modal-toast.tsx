/**
 * ModalToast
 *
 * An inline notification banner for use within modals and dialogs.
 * Replaces the inline JSX notification patterns in TransactionModal and
 * similar components. Supports success, error, info, and warning states.
 *
 * Usage:
 *   <ModalToast type="success" message="Saved!" onDismiss={() => setMsg(null)} />
 */

import { memo } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ModalToastProps {
  /** The notification type */
  type: ToastType;
  /** Message to display */
  message: string;
  /** When provided, shows a dismiss button */
  onDismiss?: () => void;
  /** Whether to show a loading spinner instead of the type icon */
  loading?: boolean;
  /** Additional class names */
  className?: string;
}

const toastConfig: Record<
  ToastType,
  { bg: string; border: string; text: string; Icon: React.ElementType }
> = {
  success: {
    bg: 'bg-green-500/10',
    border: 'border-b border-green-500/20',
    text: 'text-green-400',
    Icon: CheckCircle,
  },
  error: {
    bg: 'bg-destructive/10',
    border: 'border-b border-destructive/20',
    text: 'text-destructive',
    Icon: AlertCircle,
  },
  info: {
    bg: 'bg-primary/10',
    border: 'border-b border-primary/20',
    text: 'text-primary',
    Icon: Info,
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-b border-amber-500/20',
    text: 'text-amber-400',
    Icon: AlertTriangle,
  },
};

export const ModalToast = memo(function ModalToast({
  type,
  message,
  onDismiss,
  loading = false,
  className = '',
}: ModalToastProps) {
  const { bg, border, text, Icon } = toastConfig[type];

  return (
    <div
      className={`px-4 py-3 flex items-center justify-between ${bg} ${border} ${className}`}
      role="alert"
    >
      <div className="flex items-center gap-2">
        {loading ? (
          <Loader2 className={`w-4 h-4 ${text} animate-spin shrink-0`} />
        ) : (
          <Icon className={`w-4 h-4 ${text} shrink-0`} />
        )}
        <span className={`text-sm ${text}`}>{message}</span>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className={`h-6 w-6 p-0 ml-2 ${text} hover:${text}/80 hover:bg-transparent`}
        >
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">Dismiss</span>
        </Button>
      )}
    </div>
  );
});

export default ModalToast;
