/**
 * ReceiptUploadModal
 *
 * Dialog for uploading a receipt image and previewing parsed line items
 * before sending them to SubTransactionEditor.
 *
 * Upload methods: file picker, camera capture, clipboard paste.
 * Parsing: POST /api/transactions/[id]/receipt (Sharp + OpenRouter Claude Haiku).
 */

import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, ScanLine, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ModalToast } from '@/components/ui/modal-toast';
import type { EditableItem } from '@/components/sub-transactions/SubTransactionEditor';
import type { ParsedReceipt, ParsedReceiptItem } from '@/lib/receipt/types';

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/heic,image/heif';

interface ReceiptUploadModalProps {
  transactionId: string;
  parentAmount: number | null;
  isOpen: boolean;
  onClose: () => void;
  /** Called when user confirms parsed items — transitions to SubTransactionEditor */
  onConfirm: (items: EditableItem[]) => void;
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

function mapToEditableItems(parsed: ParsedReceipt): EditableItem[] {
  return parsed.items
    .filter((item) => !item.is_tax_line && !item.is_discount_line)
    .map((item: ParsedReceiptItem) => ({
      id: crypto.randomUUID(),
      amount: item.total_price.toFixed(2),
      category: item.suggested_category || 'other',
      merchant_name: item.item_name,
      user_notes: item.unit
        ? `${item.quantity !== 1 ? `${item.quantity} ` : ''}${item.unit}`
        : '',
    }));
}

function formatAmount(amount: number): string {
  return `₹${Math.abs(amount).toFixed(2)}`;
}

export const ReceiptUploadModal = memo(function ReceiptUploadModal({
  transactionId,
  parentAmount,
  isOpen,
  onClose,
  onConfirm,
}: ReceiptUploadModalProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setUploadState('idle');
      setParsed(null);
      setErrorMsg(null);
    }
  }, [isOpen]);

  // Clipboard paste listener
  useEffect(() => {
    if (!isOpen || uploadState !== 'idle') return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            handleFile(file);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, uploadState]);

  const handleFile = useCallback(
    async (file: File) => {
      // Client-side size guard
      if (file.size > MAX_FILE_BYTES) {
        setErrorMsg('File exceeds the 20MB limit. Please use a smaller image.');
        setUploadState('error');
        return;
      }

      setUploadState('uploading');
      setErrorMsg(null);
      setParsed(null);

      try {
        const formData = new FormData();
        formData.append('file', file);
        if (parentAmount !== null) {
          formData.append('parentAmount', String(parentAmount));
        }

        const response = await fetch(`/api/transactions/${transactionId}/receipt`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to parse receipt');
        }

        setParsed(data.parsed as ParsedReceipt);
        setUploadState('done');
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        setUploadState('error');
      }
    },
    [transactionId, parentAmount]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [handleFile]
  );

  const handleConfirm = useCallback(() => {
    if (!parsed) return;
    const items = mapToEditableItems(parsed);
    onConfirm(items);
  }, [parsed, onConfirm]);

  const handleReset = useCallback(() => {
    setUploadState('idle');
    setParsed(null);
    setErrorMsg(null);
  }, []);

  const displayItems = parsed?.items.filter((i) => !i.is_tax_line && !i.is_discount_line) ?? [];
  const isOthersItem = (name: string) => name === 'Others';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="flex flex-col bg-card border-border overflow-hidden sm:max-w-md sm:max-h-[85vh]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <DialogHeader className="shrink-0 px-6 pt-5 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <ScanLine className="h-5 w-5 text-primary" />
            Scan Receipt
          </DialogTitle>
        </DialogHeader>

        {/* Mismatch warning — shown above the item list */}
        {uploadState === 'done' && parsed?.mismatch.has_mismatch && (
          <ModalToast
            type="warning"
            message={`₹${Math.abs(parsed.mismatch.difference).toFixed(2)} unaccounted — "Others" item added to balance`}
            className="border-b-0"
          />
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* IDLE — upload options */}
          {uploadState === 'idle' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Upload a receipt to automatically extract line items.
              </p>

              {/* Upload method buttons */}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Upload className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Choose file</p>
                    <p className="text-xs text-muted-foreground">JPEG, PNG, WebP or HEIC</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Camera className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Take photo</p>
                    <p className="text-xs text-muted-foreground">Use your camera</p>
                  </div>
                </button>
              </div>

              {/* Paste hint */}
              <p className="text-xs text-muted-foreground text-center">
                Or paste a screenshot with{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[11px] font-mono">
                  ⌘V
                </kbd>{' '}
                /{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[11px] font-mono">
                  Ctrl+V
                </kbd>
              </p>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                className="hidden"
                onChange={handleFileInputChange}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileInputChange}
              />
            </div>
          )}

          {/* UPLOADING — spinner */}
          {uploadState === 'uploading' && (
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ScanLine className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <p className="text-sm font-medium text-foreground">Parsing receipt…</p>
              <p className="text-xs text-muted-foreground">This usually takes 5–10 seconds</p>
            </div>
          )}

          {/* DONE — item preview */}
          {uploadState === 'done' && parsed && (
            <div className="flex flex-col gap-3">
              {/* Store + confidence */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {parsed.store_name ?? 'Receipt Items'}
                </p>
                <span className="text-xs text-muted-foreground">
                  {Math.round(parsed.confidence * 100)}% confidence
                </span>
              </div>

              {/* Item list */}
              <div className="flex flex-col gap-1.5">
                {displayItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-3 text-center">
                    No line items found
                  </p>
                ) : (
                  displayItems.map((item, idx) => {
                    const isOthers = isOthersItem(item.item_name);
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                          isOthers
                            ? 'bg-amber-500/10 border border-amber-500/20'
                            : 'bg-muted/40 border border-border/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isOthers && (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                isOthers ? 'text-amber-400' : 'text-foreground'
                              }`}
                            >
                              {item.item_name}
                            </p>
                            {item.unit && (
                              <p className="text-xs text-muted-foreground">
                                {item.quantity !== 1 ? `${item.quantity} ` : ''}
                                {item.unit}
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className={`text-sm font-mono font-medium ml-3 shrink-0 ${
                            isOthers ? 'text-amber-400' : 'text-foreground'
                          }`}
                        >
                          {formatAmount(item.total_price)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Total line */}
              {parsed.total_amount !== null && (
                <div className="flex items-center justify-between border-t border-border pt-2 mt-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Total</span>
                  <span className="text-sm font-mono font-semibold text-foreground">
                    {formatAmount(parsed.total_amount)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ERROR */}
          {uploadState === 'error' && errorMsg && (
            <div className="flex flex-col items-center gap-4 py-6">
              <ModalToast type="error" message={errorMsg} className="w-full border-b-0 rounded-lg" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="gap-2"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Try again
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="shrink-0 px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between sm:justify-between">
          <div className="flex gap-2">
            {uploadState === 'done' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="gap-1.5 text-muted-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Rescan
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {uploadState !== 'uploading' && (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            {uploadState === 'done' && displayItems.length > 0 && (
              <Button onClick={handleConfirm}>
                Confirm {displayItems.length} item{displayItems.length !== 1 ? 's' : ''}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default ReceiptUploadModal;
