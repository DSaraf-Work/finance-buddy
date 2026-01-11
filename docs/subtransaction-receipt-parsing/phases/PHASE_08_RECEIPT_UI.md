# Phase 8: Receipt UI

## Objective
Create UI components for receipt upload, viewing, editing, and conversion.

---

## New Components

```
src/components/transactions/
├── ReceiptUploader.tsx      # Upload interface
├── ReceiptViewer.tsx        # Display parsed receipt
├── ReceiptItemsEditor.tsx   # Edit items before conversion
└── ReceiptBadge.tsx         # Badge for TxnCard
```

---

## Component Implementations

### `src/components/transactions/ReceiptBadge.tsx`

```tsx
/**
 * Badge showing receipt status on TxnCard
 */
import { memo } from 'react';
import { Receipt, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface ReceiptBadgeProps {
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export const ReceiptBadge = memo(function ReceiptBadge({ status }: ReceiptBadgeProps) {
  const config = {
    pending: { icon: Receipt, color: 'rgb(251, 191, 36)', bg: 'rgba(251, 191, 36, 0.12)' },
    processing: { icon: Loader2, color: 'rgb(96, 165, 250)', bg: 'rgba(96, 165, 250, 0.12)' },
    completed: { icon: CheckCircle, color: 'rgb(74, 222, 128)', bg: 'rgba(74, 222, 128, 0.12)' },
    failed: { icon: AlertCircle, color: 'rgb(248, 113, 113)', bg: 'rgba(248, 113, 113, 0.12)' },
  }[status];

  const Icon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: config.bg, color: config.color }}
    >
      <Icon className={`h-3 w-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
      Receipt
    </span>
  );
});
```

---

### `src/components/transactions/ReceiptUploader.tsx`

```tsx
/**
 * Upload interface for receipts
 */
import { memo, useState, useRef } from 'react';
import { Upload, Image, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReceiptUploaderProps {
  transactionId: string;
  onUploadComplete: (receipt: any) => void;
  onCancel: () => void;
}

export const ReceiptUploader = memo(function ReceiptUploader({
  transactionId,
  onUploadComplete,
  onCancel,
}: ReceiptUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Use JPEG, PNG, GIF, WebP, or PDF.');
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('File too large. Maximum 20MB.');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Generate preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/transactions/${transactionId}/receipt`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await res.json();
      onUploadComplete(data.receipt);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${file ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/30'}`}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {preview ? (
          <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
        ) : file ? (
          <div className="flex items-center justify-center gap-2 text-foreground">
            <FileText className="h-8 w-8" />
            <span>{file.name}</span>
          </div>
        ) : (
          <div className="text-muted-foreground">
            <Upload className="h-10 w-10 mx-auto mb-2" />
            <p>Click or drag to upload receipt</p>
            <p className="text-sm mt-1">JPEG, PNG, GIF, WebP, or PDF (max 20MB)</p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={uploading}>
          Cancel
        </Button>
        <Button onClick={handleUpload} disabled={!file || uploading}>
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>
    </div>
  );
});
```

---

### `src/components/transactions/ReceiptViewer.tsx`

```tsx
/**
 * Display parsed receipt with items
 */
import { memo, useState } from 'react';
import { Receipt, Trash2, RefreshCw, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReceiptItemsEditor } from './ReceiptItemsEditor';

interface ReceiptViewerProps {
  receipt: any;
  onParse: () => Promise<void>;
  onDelete: () => Promise<void>;
  onCreateSubTransactions: () => Promise<void>;
  onUpdateItems: (items: any[]) => Promise<void>;
}

export const ReceiptViewer = memo(function ReceiptViewer({
  receipt,
  onParse,
  onDelete,
  onCreateSubTransactions,
  onUpdateItems,
}: ReceiptViewerProps) {
  const [parsing, setParsing] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleParse = async () => {
    setParsing(true);
    try {
      await onParse();
    } finally {
      setParsing(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      await onCreateSubTransactions();
    } finally {
      setCreating(false);
    }
  };

  const isPending = receipt.parsing_status === 'pending';
  const isProcessing = receipt.parsing_status === 'processing';
  const isCompleted = receipt.parsing_status === 'completed';
  const isFailed = receipt.parsing_status === 'failed';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">{receipt.file_name}</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-red-400 hover:text-red-300"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Status-based content */}
      {isPending && (
        <div className="text-center py-4">
          <p className="text-muted-foreground mb-3">Receipt uploaded. Ready to parse.</p>
          <Button onClick={handleParse} disabled={parsing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${parsing ? 'animate-spin' : ''}`} />
            {parsing ? 'Parsing...' : 'Parse with AI'}
          </Button>
        </div>
      )}

      {isProcessing && (
        <div className="text-center py-4">
          <RefreshCw className="h-8 w-8 mx-auto animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">Parsing receipt...</p>
        </div>
      )}

      {isFailed && (
        <div className="text-center py-4">
          <p className="text-red-400 mb-2">Parsing failed</p>
          <p className="text-sm text-muted-foreground mb-3">{receipt.parsing_error}</p>
          <Button onClick={handleParse} disabled={parsing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${parsing ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </div>
      )}

      {isCompleted && (
        <>
          {/* Store info */}
          {receipt.store_name && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="font-medium text-foreground">{receipt.store_name}</p>
              {receipt.receipt_date && (
                <p className="text-sm text-muted-foreground">
                  {new Date(receipt.receipt_date).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Items editor */}
          <ReceiptItemsEditor
            items={receipt.items || []}
            onUpdate={onUpdateItems}
          />

          {/* Totals */}
          <div className="space-y-1 pt-2 border-t border-border/50">
            {receipt.subtotal && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">{receipt.currency} {receipt.subtotal}</span>
              </div>
            )}
            {receipt.tax_amount && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-mono">{receipt.currency} {receipt.tax_amount}</span>
              </div>
            )}
            {receipt.discount_amount && (
              <div className="flex justify-between text-sm">
                <span className="text-green-400">Discount</span>
                <span className="font-mono text-green-400">-{receipt.currency} {receipt.discount_amount}</span>
              </div>
            )}
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span className="font-mono">{receipt.currency} {receipt.total_amount}</span>
            </div>
          </div>

          {/* Convert button */}
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="w-full"
          >
            <Layers className="h-4 w-4 mr-2" />
            {creating ? 'Creating...' : 'Create Sub-Transactions'}
          </Button>
        </>
      )}
    </div>
  );
});
```

---

### `src/components/transactions/ReceiptItemsEditor.tsx`

```tsx
/**
 * Edit receipt items before conversion
 */
import { memo, useState } from 'react';
import { Check, X, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface ReceiptItem {
  id: string;
  item_name: string;
  quantity: number;
  total_price: number;
  category?: string;
  is_excluded?: boolean;
  is_tax?: boolean;
  is_discount?: boolean;
}

interface ReceiptItemsEditorProps {
  items: ReceiptItem[];
  onUpdate: (items: ReceiptItem[]) => Promise<void>;
}

export const ReceiptItemsEditor = memo(function ReceiptItemsEditor({
  items,
  onUpdate,
}: ReceiptItemsEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<ReceiptItem>>({});
  const [saving, setSaving] = useState(false);

  const startEdit = (item: ReceiptItem) => {
    setEditingId(item.id);
    setEditValues({
      item_name: item.item_name,
      total_price: item.total_price,
      category: item.category || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = async () => {
    if (!editingId) return;

    setSaving(true);
    try {
      const updatedItems = items.map((item) =>
        item.id === editingId ? { ...item, ...editValues } : item
      );
      await onUpdate(updatedItems);
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const toggleExcluded = async (item: ReceiptItem) => {
    const updatedItems = items.map((i) =>
      i.id === item.id ? { ...i, is_excluded: !i.is_excluded } : i
    );
    await onUpdate(updatedItems);
  };

  const eligibleItems = items.filter((i) => !i.is_excluded && !i.is_tax && !i.is_discount);
  const totalEligible = eligibleItems.reduce((sum, i) => sum + i.total_price, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">
          {eligibleItems.length} items ({items.length} total)
        </span>
        <span className="text-sm font-mono">
          Total: {totalEligible.toLocaleString('en-IN')}
        </span>
      </div>

      {items.map((item) => (
        <div
          key={item.id}
          className={`p-3 rounded-lg border transition-colors ${
            item.is_excluded || item.is_tax || item.is_discount
              ? 'bg-muted/30 border-border/30 opacity-60'
              : 'bg-card border-border/50 hover:border-primary/30'
          }`}
        >
          {editingId === item.id ? (
            <div className="space-y-2">
              <Input
                value={editValues.item_name || ''}
                onChange={(e) => setEditValues({ ...editValues, item_name: e.target.value })}
                placeholder="Item name"
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={editValues.total_price || 0}
                  onChange={(e) => setEditValues({ ...editValues, total_price: parseFloat(e.target.value) })}
                  className="w-28 font-mono"
                />
                <Input
                  value={editValues.category || ''}
                  onChange={(e) => setEditValues({ ...editValues, category: e.target.value })}
                  placeholder="Category"
                />
                <Button size="sm" variant="ghost" onClick={saveEdit} disabled={saving}>
                  <Check className="h-4 w-4 text-green-400" />
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={saving}>
                  <X className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={!item.is_excluded && !item.is_tax && !item.is_discount}
                  onCheckedChange={() => toggleExcluded(item)}
                  disabled={item.is_tax || item.is_discount}
                />
                <div>
                  <span className="text-foreground">{item.item_name}</span>
                  {item.quantity > 1 && (
                    <span className="text-muted-foreground text-sm ml-1">x{item.quantity}</span>
                  )}
                  {item.is_tax && <span className="text-xs text-amber-400 ml-2">TAX</span>}
                  {item.is_discount && <span className="text-xs text-green-400 ml-2">DISCOUNT</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-foreground">{item.total_price.toLocaleString('en-IN')}</span>
                <Button size="sm" variant="ghost" onClick={() => startEdit(item)}>
                  <Edit2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
});
```

---

## TransactionModal Integration

Add to `src/components/transactions/TransactionModal.tsx`:

```tsx
// Add imports
import { ReceiptUploader } from './ReceiptUploader';
import { ReceiptViewer } from './ReceiptViewer';
import { Receipt } from 'lucide-react';

// Add state
const [receipt, setReceipt] = useState<any>(null);
const [loadingReceipt, setLoadingReceipt] = useState(false);
const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

// Add load effect
useEffect(() => {
  if (transaction.id) {
    loadReceipt();
  }
}, [transaction.id]);

const loadReceipt = async () => {
  setLoadingReceipt(true);
  try {
    const res = await fetch(`/api/transactions/${transaction.id}/receipt`);
    const data = await res.json();
    setReceipt(data.receipt);
  } finally {
    setLoadingReceipt(false);
  }
};

// Add handlers
const handleParseReceipt = async () => {
  const res = await fetch(`/api/receipts/${receipt.id}/parse`, { method: 'POST' });
  if (!res.ok) throw new Error((await res.json()).error);
  await loadReceipt();
};

const handleDeleteReceipt = async () => {
  await fetch(`/api/receipts/${receipt.id}`, { method: 'DELETE' });
  setReceipt(null);
};

const handleCreateFromReceipt = async () => {
  const res = await fetch(`/api/receipts/${receipt.id}/create-sub-transactions`, { method: 'POST' });
  if (!res.ok) throw new Error((await res.json()).error);
  await loadSubTransactions();
  await loadReceipt();
};

const handleUpdateReceiptItems = async (items: any[]) => {
  await fetch(`/api/receipts/${receipt.id}/items`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  await loadReceipt();
};

// Add section (after sub-transactions section)
{!transaction.is_sub_transaction && (
  <CollapsibleCard
    title="Receipt"
    icon={<Receipt className="h-4 w-4" />}
    defaultOpen={!!receipt}
    badge={receipt?.parsing_status}
  >
    {loadingReceipt ? (
      <div className="text-center py-4 text-muted-foreground">Loading...</div>
    ) : isUploadingReceipt ? (
      <ReceiptUploader
        transactionId={transaction.id}
        onUploadComplete={(r) => { setReceipt(r); setIsUploadingReceipt(false); }}
        onCancel={() => setIsUploadingReceipt(false)}
      />
    ) : receipt ? (
      <ReceiptViewer
        receipt={receipt}
        onParse={handleParseReceipt}
        onDelete={handleDeleteReceipt}
        onCreateSubTransactions={handleCreateFromReceipt}
        onUpdateItems={handleUpdateReceiptItems}
      />
    ) : (
      <div className="text-center py-4">
        <p className="text-muted-foreground mb-3">
          Upload a receipt to auto-split this transaction
        </p>
        <Button onClick={() => setIsUploadingReceipt(true)}>
          <Receipt className="h-4 w-4 mr-2" />
          Upload Receipt
        </Button>
      </div>
    )}
  </CollapsibleCard>
)}
```

---

## Deploy Checkpoint

After completing Phase 8:

1. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

2. **Test full receipt flow**
   - Upload receipt image
   - Parse with AI
   - Review/edit items
   - Create sub-transactions
   - Verify amounts

---

## Success Criteria

- [ ] Upload component accepts valid files
- [ ] Preview shows for images
- [ ] Parse triggers AI analysis
- [ ] Items displayed correctly
- [ ] Items editable inline
- [ ] Exclusion toggles work
- [ ] Create button generates sub-transactions
- [ ] Badge shows on TxnCard
- [ ] Follows design system
