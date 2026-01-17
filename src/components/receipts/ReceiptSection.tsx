/**
 * ReceiptSection
 *
 * Collapsible section for receipts in TransactionModal.
 * Shows receipt status, upload button, and parsed items.
 */

import { memo, useState, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Receipt,
  Loader2,
  Upload,
  RefreshCw,
  Eye,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ReceiptUpload } from './ReceiptUpload';
import { ReceiptItemList } from './ReceiptItemList';
import { ReceiptBadge } from './ReceiptBadge';
import type { ReceiptPublic, ReceiptItemPublic } from '@/types/receipts';

interface ReceiptSectionProps {
  /** Transaction ID */
  transactionId: string;
  /** Receipt data (if exists) */
  receipt?: ReceiptPublic | null;
  /** Receipt items (when loaded) */
  items?: ReceiptItemPublic[];
  /** Loading state */
  loading?: boolean;
  /** Currency symbol */
  currency?: string;
  /** Called when upload completes */
  onUploadComplete?: (receiptId: string) => void;
  /** Called when parse is requested */
  onParse?: (receiptId: string) => void;
  /** Called when delete is requested */
  onDelete?: (receiptId: string) => void;
  /** Called when view image is requested */
  onViewImage?: (receiptId: string) => void;
  /** Called when item exclusion is toggled */
  onToggleItemExclude?: (itemId: string) => void;
  /** Called when create sub-transactions is requested */
  onCreateSubTransactions?: (receiptId: string) => void;
  /** Initially collapsed */
  defaultCollapsed?: boolean;
}

export const ReceiptSection = memo(function ReceiptSection({
  transactionId,
  receipt,
  items = [],
  loading = false,
  currency = '₹',
  onUploadComplete,
  onParse,
  onDelete,
  onViewImage,
  onToggleItemExclude,
  onCreateSubTransactions,
  defaultCollapsed = true,
}: ReceiptSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUploadComplete = useCallback(
    (receiptId: string) => {
      setIsUploading(false);
      setUploadError(null);
      onUploadComplete?.(receiptId);
    },
    [onUploadComplete]
  );

  const handleUploadError = useCallback((error: string) => {
    setIsUploading(false);
    setUploadError(error);
  }, []);

  const isParsing = receipt?.parsing_status === 'processing';
  const hasParsedItems = items.length > 0;
  const canCreateSubTransactions =
    receipt?.parsing_status === 'completed' && hasParsedItems;

  return (
    <Card className="bg-card/50 border-border/50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
          <Receipt className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Receipt</span>

          {/* Status badge */}
          {receipt && (
            <ReceiptBadge
              status={receipt.parsing_status}
              itemCount={receipt.item_count}
              size="sm"
            />
          )}
        </div>

        {/* Right side indicator */}
        {!receipt && (
          <span className="text-xs text-muted-foreground">No receipt</span>
        )}
      </button>

      {/* Expanded content */}
      {!isCollapsed && (
        <div className="border-t border-border/30 p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          ) : !receipt ? (
            /* No receipt - show upload area */
            <div className="space-y-3">
              <ReceiptUpload
                transactionId={transactionId}
                onUploadComplete={handleUploadComplete}
                onError={handleUploadError}
                disabled={isUploading}
              />
              {uploadError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-400">{uploadError}</span>
                </div>
              )}
            </div>
          ) : (
            /* Has receipt - show status and items */
            <div className="space-y-4">
              {/* Receipt info */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {receipt.store_name || receipt.file_name}
                  </p>
                  {receipt.receipt_date && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(receipt.receipt_date).toLocaleDateString()}
                    </p>
                  )}
                  {receipt.receipt_number && (
                    <p className="text-xs text-muted-foreground">
                      Receipt #{receipt.receipt_number}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  {onViewImage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewImage(receipt.id);
                      }}
                      className="h-8 px-2"
                      title="View image"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {onParse &&
                    (receipt.parsing_status === 'pending' ||
                      receipt.parsing_status === 'failed') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onParse(receipt.id);
                        }}
                        disabled={isParsing}
                        className="h-8 px-2"
                        title={isParsing ? 'Parsing...' : 'Parse receipt'}
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${isParsing ? 'animate-spin' : ''}`}
                        />
                      </Button>
                    )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(receipt.id);
                      }}
                      className="h-8 px-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                      title="Delete receipt"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Parsing status messages */}
              {receipt.parsing_status === 'processing' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Loader2 className="h-4 w-4 text-blue-400 animate-spin flex-shrink-0" />
                  <span className="text-sm text-blue-400">
                    Parsing receipt with AI...
                  </span>
                </div>
              )}

              {receipt.parsing_status === 'failed' && receipt.parsing_error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm text-red-400 block">
                      Failed to parse receipt
                    </span>
                    <span className="text-xs text-red-400/70">
                      {receipt.parsing_error}
                    </span>
                  </div>
                </div>
              )}

              {receipt.parsing_status === 'manual_review' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  <span className="text-sm text-amber-400">
                    Low confidence - please review parsed items
                  </span>
                </div>
              )}

              {/* Parsed items */}
              {hasParsedItems && (
                <ReceiptItemList
                  items={items}
                  currency={currency}
                  onToggleExclude={onToggleItemExclude}
                  defaultExpanded
                  showLinkStatus
                />
              )}

              {/* Create sub-transactions button */}
              {canCreateSubTransactions && onCreateSubTransactions && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCreateSubTransactions(receipt.id)}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Create Sub-Transactions from Items
                </Button>
              )}

              {/* Confidence indicator */}
              {receipt.confidence !== null && receipt.confidence < 0.8 && (
                <p className="text-xs text-muted-foreground text-center">
                  Parsing confidence:{' '}
                  {Math.round((receipt.confidence || 0) * 100)}%
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
});

export default ReceiptSection;
