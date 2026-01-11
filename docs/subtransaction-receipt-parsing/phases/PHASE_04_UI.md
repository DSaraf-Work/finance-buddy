# Phase 4: Sub-Transaction UI

## Objective
Create UI components for sub-transaction management within TransactionModal.

---

## New Components

```
src/components/transactions/
├── SubTransactionList.tsx      # Display existing sub-transactions
├── SubTransactionEditor.tsx    # Create/edit sub-transactions
├── SubTransactionItem.tsx      # Single sub-transaction row
└── SubTransactionBadge.tsx     # Badge for TxnCard
```

---

## Component Implementations

### `src/components/transactions/SubTransactionBadge.tsx`

```tsx
/**
 * Badge showing sub-transaction count on TxnCard
 */
import { memo } from 'react';
import { Layers } from 'lucide-react';

interface SubTransactionBadgeProps {
  count: number;
}

export const SubTransactionBadge = memo(function SubTransactionBadge({
  count,
}: SubTransactionBadgeProps) {
  if (count === 0) return null;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        background: 'rgba(99, 102, 241, 0.12)',
        color: 'rgb(129, 140, 248)',
      }}
    >
      <Layers className="h-3 w-3" />
      {count} items
    </span>
  );
});
```

---

### `src/components/transactions/SubTransactionItem.tsx`

```tsx
/**
 * Single sub-transaction row in list
 */
import { memo, useState } from 'react';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SubTransaction } from '@/types/sub-transactions';

interface SubTransactionItemProps {
  item: SubTransaction;
  currency: string;
  onUpdate: (id: string, updates: Partial<SubTransaction>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  canDelete: boolean;
}

export const SubTransactionItem = memo(function SubTransactionItem({
  item,
  currency,
  onUpdate,
  onDelete,
  canDelete,
}: SubTransactionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState(item.amount.toString());
  const [editCategory, setEditCategory] = useState(item.category || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(item.id, {
        amount: parseFloat(editAmount),
        category: editCategory || undefined,
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditAmount(item.amount.toString());
    setEditCategory(item.category || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
        <Input
          type="number"
          value={editAmount}
          onChange={(e) => setEditAmount(e.target.value)}
          className="w-24 font-mono"
          step="0.01"
        />
        <Input
          value={editCategory}
          onChange={(e) => setEditCategory(e.target.value)}
          placeholder="Category"
          className="flex-1"
        />
        <Button size="sm" variant="ghost" onClick={handleSave} disabled={saving}>
          <Check className="h-4 w-4 text-green-400" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving}>
          <X className="h-4 w-4 text-red-400" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground text-sm w-6">
          #{item.sub_transaction_order}
        </span>
        <div>
          <span className="font-mono text-foreground">
            {currency} {item.amount.toLocaleString('en-IN')}
          </span>
          {item.category && (
            <span className="ml-2 text-sm text-muted-foreground">
              {item.category}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
          <Edit2 className="h-4 w-4 text-muted-foreground" />
        </Button>
        {canDelete && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-4 w-4 text-red-400" />
          </Button>
        )}
      </div>
    </div>
  );
});
```

---

### `src/components/transactions/SubTransactionList.tsx`

```tsx
/**
 * List of existing sub-transactions
 */
import { memo } from 'react';
import { Layers, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SubTransactionItem } from './SubTransactionItem';
import type { SubTransaction, SubTransactionSummary } from '@/types/sub-transactions';

interface SubTransactionListProps {
  items: SubTransaction[];
  summary: SubTransactionSummary;
  currency: string;
  onUpdate: (id: string, updates: Partial<SubTransaction>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDeleteAll: () => Promise<void>;
}

export const SubTransactionList = memo(function SubTransactionList({
  items,
  summary,
  currency,
  onUpdate,
  onDelete,
  onDeleteAll,
}: SubTransactionListProps) {
  const canDeleteIndividual = items.length > 2;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">
            {summary.count} Sub-transactions
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-red-400 hover:text-red-300"
          onClick={onDeleteAll}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Remove All
        </Button>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <SubTransactionItem
            key={item.id}
            item={item}
            currency={currency}
            onUpdate={onUpdate}
            onDelete={onDelete}
            canDelete={canDeleteIndividual}
          />
        ))}
      </div>

      {/* Summary */}
      <div className="flex justify-between pt-2 border-t border-border/50">
        <span className="text-muted-foreground">Total</span>
        <span className="font-mono font-medium text-foreground">
          {currency} {summary.totalAmount.toLocaleString('en-IN')}
        </span>
      </div>
      {summary.remainingAmount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-amber-400">Unallocated</span>
          <span className="font-mono text-amber-400">
            {currency} {summary.remainingAmount.toLocaleString('en-IN')}
          </span>
        </div>
      )}
    </div>
  );
});
```

---

### `src/components/transactions/SubTransactionEditor.tsx`

```tsx
/**
 * Editor for creating new sub-transactions
 */
import { memo, useState } from 'react';
import { Plus, Minus, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { validateSubTransactionAmounts, MIN_SUB_TRANSACTIONS, MAX_SUB_TRANSACTIONS } from '@/lib/validation/sub-transactions';
import type { CreateSubTransactionInput } from '@/types/sub-transactions';

interface SubTransactionEditorProps {
  parentAmount: number;
  currency: string;
  onSave: (items: CreateSubTransactionInput[]) => Promise<void>;
  onCancel: () => void;
}

interface EditableItem {
  id: string;
  amount: string;
  category: string;
}

export const SubTransactionEditor = memo(function SubTransactionEditor({
  parentAmount,
  currency,
  onSave,
  onCancel,
}: SubTransactionEditorProps) {
  const [items, setItems] = useState<EditableItem[]>([
    { id: '1', amount: '', category: '' },
    { id: '2', amount: '', category: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = () => {
    if (items.length >= MAX_SUB_TRANSACTIONS) return;
    setItems([...items, { id: Date.now().toString(), amount: '', category: '' }]);
  };

  const removeItem = (id: string) => {
    if (items.length <= MIN_SUB_TRANSACTIONS) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof EditableItem, value: string) => {
    setItems(items.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    ));
    setError(null);
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0
  );
  const remaining = parentAmount - totalAmount;

  const handleSave = async () => {
    const parsed: CreateSubTransactionInput[] = items.map((item) => ({
      amount: parseFloat(item.amount) || 0,
      category: item.category || undefined,
    }));

    const validation = validateSubTransactionAmounts(parsed, parentAmount);
    if (!validation.isValid) {
      setError(validation.errors.join('. '));
      return;
    }

    setSaving(true);
    try {
      await onSave(parsed);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-medium text-foreground">Split Transaction</span>
        <span className="text-sm text-muted-foreground">
          Parent: {currency} {parentAmount.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm w-6">
              #{index + 1}
            </span>
            <Input
              type="number"
              placeholder="Amount"
              value={item.amount}
              onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
              className="w-28 font-mono"
              step="0.01"
            />
            <Input
              placeholder="Category"
              value={item.category}
              onChange={(e) => updateItem(item.id, 'category', e.target.value)}
              className="flex-1"
            />
            {items.length > MIN_SUB_TRANSACTIONS && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeItem(item.id)}
              >
                <Minus className="h-4 w-4 text-red-400" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add button */}
      {items.length < MAX_SUB_TRANSACTIONS && (
        <Button
          size="sm"
          variant="outline"
          onClick={addItem}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </Button>
      )}

      {/* Summary */}
      <div className="flex justify-between pt-2 border-t border-border/50">
        <span className="text-muted-foreground">Total</span>
        <span className={`font-mono font-medium ${totalAmount > parentAmount ? 'text-red-400' : 'text-foreground'}`}>
          {currency} {totalAmount.toLocaleString('en-IN')}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className={remaining < 0 ? 'text-red-400' : 'text-muted-foreground'}>
          {remaining < 0 ? 'Over by' : 'Remaining'}
        </span>
        <span className={`font-mono ${remaining < 0 ? 'text-red-400' : 'text-amber-400'}`}>
          {currency} {Math.abs(remaining).toLocaleString('en-IN')}
        </span>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || totalAmount > parentAmount}
        >
          <Save className="h-4 w-4 mr-1" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
});
```

---

## Modify TransactionModal

### Add to `src/components/transactions/TransactionModal.tsx`

```tsx
// Add imports
import { SubTransactionList } from './SubTransactionList';
import { SubTransactionEditor } from './SubTransactionEditor';
import { Layers } from 'lucide-react';

// Add state
const [subTransactions, setSubTransactions] = useState<SubTransaction[]>([]);
const [loadingSubTransactions, setLoadingSubTransactions] = useState(false);
const [isCreatingSubs, setIsCreatingSubs] = useState(false);

// Add effect to load sub-transactions
useEffect(() => {
  if (transaction.id && !transaction.is_sub_transaction) {
    loadSubTransactions();
  }
}, [transaction.id]);

const loadSubTransactions = async () => {
  setLoadingSubTransactions(true);
  try {
    const res = await fetch(`/api/transactions/${transaction.id}/sub-transactions`);
    const data = await res.json();
    setSubTransactions(data.subTransactions || []);
  } finally {
    setLoadingSubTransactions(false);
  }
};

// Add handlers
const handleCreateSubTransactions = async (items: CreateSubTransactionInput[]) => {
  const res = await fetch(`/api/transactions/${transaction.id}/sub-transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  await loadSubTransactions();
  setIsCreatingSubs(false);
};

const handleUpdateSubTransaction = async (id: string, updates: Partial<SubTransaction>) => {
  await fetch(`/api/transactions/${transaction.id}/sub-transactions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  await loadSubTransactions();
};

const handleDeleteSubTransaction = async (id: string) => {
  await fetch(`/api/transactions/${transaction.id}/sub-transactions/${id}`, {
    method: 'DELETE',
  });
  await loadSubTransactions();
};

const handleDeleteAllSubTransactions = async () => {
  await fetch(`/api/transactions/${transaction.id}/sub-transactions`, {
    method: 'DELETE',
  });
  setSubTransactions([]);
};

// Add section in render (after existing sections, before footer)
{!transaction.is_sub_transaction && (
  <CollapsibleCard
    title="Sub-transactions"
    icon={<Layers className="h-4 w-4" />}
    defaultOpen={subTransactions.length > 0}
    badge={subTransactions.length > 0 ? `${subTransactions.length} items` : undefined}
  >
    {loadingSubTransactions ? (
      <div className="text-center py-4 text-muted-foreground">Loading...</div>
    ) : isCreatingSubs ? (
      <SubTransactionEditor
        parentAmount={transaction.amount}
        currency={transaction.currency || 'INR'}
        onSave={handleCreateSubTransactions}
        onCancel={() => setIsCreatingSubs(false)}
      />
    ) : subTransactions.length > 0 ? (
      <SubTransactionList
        items={subTransactions}
        summary={{
          count: subTransactions.length,
          totalAmount: subTransactions.reduce((s, i) => s + i.amount, 0),
          remainingAmount: transaction.amount - subTransactions.reduce((s, i) => s + i.amount, 0),
          categories: [...new Set(subTransactions.map(s => s.category).filter(Boolean))],
        }}
        currency={transaction.currency || 'INR'}
        onUpdate={handleUpdateSubTransaction}
        onDelete={handleDeleteSubTransaction}
        onDeleteAll={handleDeleteAllSubTransactions}
      />
    ) : (
      <div className="text-center py-4">
        <p className="text-muted-foreground mb-3">
          Split this transaction into categorized items
        </p>
        <Button onClick={() => setIsCreatingSubs(true)}>
          <Layers className="h-4 w-4 mr-2" />
          Split Transaction
        </Button>
      </div>
    )}
  </CollapsibleCard>
)}
```

---

## Modify TxnCard

### Add to `src/components/transactions/TxnCard.tsx`

```tsx
// Add import
import { SubTransactionBadge } from './SubTransactionBadge';

// In badges row, add:
{transaction.hasSubTransactions && (
  <SubTransactionBadge count={transaction.subTransactions?.length || 0} />
)}
```

---

## Validation Steps

1. **Open transaction without sub-transactions**
   - Should show "Split Transaction" button

2. **Create sub-transactions**
   - Add 2-10 items
   - Validate amounts don't exceed parent
   - Save and verify list appears

3. **Edit sub-transaction**
   - Click edit, modify amount/category
   - Save and verify changes

4. **Delete sub-transaction**
   - Delete individual (if >2)
   - Delete all

5. **TxnCard badge**
   - Verify badge shows count

---

## Success Criteria

- [ ] SubTransactionBadge displays on TxnCard
- [ ] TransactionModal shows sub-transaction section
- [ ] Editor validates amounts in real-time
- [ ] List shows all sub-transactions
- [ ] Edit inline works correctly
- [ ] Delete respects minimum count
- [ ] Follows design system (dark theme, tokens)
- [ ] Accessible (keyboard navigation, focus states)
