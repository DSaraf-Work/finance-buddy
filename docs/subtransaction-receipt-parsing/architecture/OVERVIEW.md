# System Architecture Overview

## Current System Architecture

### Database Layer
- **Supabase PostgreSQL** with Row-Level Security (RLS)
- Main transaction table: `fb_emails_processed`
- Email source: `fb_emails_fetched`
- Connections: `fb_gmail_connections`

### API Layer
- **Next.js API Routes** at `/api/`
- Authentication via `withAuth` wrapper
- Supabase Admin client for database operations

### Frontend Layer
- **React** with useState/useMemo hooks
- **shadcn/ui** components
- Manual fetch() for data fetching (no React Query)
- Design system: dark-only, Tailwind CSS variables

### AI Layer
- Multi-model support: Anthropic, OpenAI, Google, Perplexity
- Model fallback and rate limiting
- Current: Text-only (Vision API to be added)

---

## New Feature Architecture

### Sub-Transactions

```
┌─────────────────────────────────────────────────────────┐
│                   fb_emails_processed                    │
├─────────────────────────────────────────────────────────┤
│ id (PK)                                                 │
│ parent_transaction_id (FK, self-ref) ────┐              │
│ is_sub_transaction                       │              │
│ sub_transaction_order                    │              │
│ splitwise_expense_id (cascaded)          │              │
│ ...other fields...                       │              │
├─────────────────────────────────────────────────────────┤
│                      ↓                                  │
│         Sub-transactions (same table)                   │
│         parent_transaction_id = parent.id               │
└─────────────────────────────────────────────────────────┘
```

**Key Design Decision**: Self-referential FK instead of separate table
- Pros: Simpler queries, reuses existing RLS
- Cons: Need triggers for validation

### Receipt Parsing

```
┌─────────────────┐     ┌─────────────────┐
│   fb_receipts   │────►│ fb_receipt_items │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │
│ transaction_id  │     │ receipt_id (FK) │
│ file_path       │     │ item_name       │
│ parsing_status  │     │ total_price     │
│ total_amount    │     │ category        │
│ ...             │     │ sub_txn_id (FK) │
└─────────────────┘     └─────────────────┘
         │                      │
         │                      ▼
         │              ┌─────────────────┐
         │              │ fb_emails_      │
         │              │ processed       │
         └─────────────►│ (sub-txn)       │
                        │ receipt_item_id │
                        └─────────────────┘
```

**Bidirectional Link**: Receipt items link to sub-transactions AND sub-transactions link back to receipt items.

### Smart Refunds

```
┌─────────────────────────────────────────┐
│         fb_emails_processed              │
│         (Debit Transaction)              │
├─────────────────────────────────────────┤
│ id: "txn-123"                           │
│ amount: 1000                            │
│ direction: "debit"                      │
│ merchant_name: "Amazon"                 │
└─────────────────────────────────────────┘
              │
              │ refund_of_transaction_id
              ▼
┌─────────────────────────────────────────┐
│         fb_emails_processed              │
│         (Credit/Refund)                  │
├─────────────────────────────────────────┤
│ id: "txn-456"                           │
│ amount: 500                             │
│ direction: "credit"                     │
│ is_refund: TRUE                         │
│ refund_type: "partial"                  │
│ refund_of_transaction_id: "txn-123"     │
└─────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Sub-Transaction Creation Flow

```
User clicks "Split Transaction"
         │
         ▼
┌─────────────────────┐
│ SubTransactionEditor│
│ - Add 2-10 items    │
│ - Validate amounts  │
└─────────────────────┘
         │
         ▼
POST /api/transactions/{id}/sub-transactions
         │
         ▼
┌─────────────────────┐
│ Database Triggers   │
│ - Inherit fields    │
│ - Validate amounts  │
│ - Copy Splitwise ID │
└─────────────────────┘
         │
         ▼
Batch INSERT into fb_emails_processed
         │
         ▼
Return sub-transactions to UI
```

### Receipt Parsing Flow

```
User uploads receipt image
         │
         ▼
┌─────────────────────┐
│ Store in Supabase   │
│ Storage (receipts/) │
└─────────────────────┘
         │
         ▼
Create fb_receipts record (status: 'processing')
         │
         ▼
┌─────────────────────┐
│ Claude Vision API   │
│ - Extract items     │
│ - Detect store      │
│ - Parse totals      │
└─────────────────────┘
         │
         ▼
Insert fb_receipt_items
         │
         ▼
Update fb_receipts (status: 'completed')
         │
         ▼
User reviews/edits items
         │
         ▼
POST /api/receipts/{id}/create-sub-transactions
         │
         ▼
Create sub-transactions linked to receipt items
```

### Refund Linking Flow

```
User views credit transaction
         │
         ▼
GET /api/transactions/{id}/refund-suggestions
         │
         ▼
┌─────────────────────┐
│ Matching Algorithm  │
│ - Merchant: 40 pts  │
│ - Amount: 30 pts    │
│ - Time: 20 pts      │
│ - Reference: 10 pts │
└─────────────────────┘
         │
         ▼
Display ranked suggestions
         │
         ▼
User selects original transaction
         │
         ▼
POST /api/transactions/{id}/link-refund
         │
         ▼
┌─────────────────────┐
│ Database Trigger    │
│ - Validate dirs     │
│ - Check amount cap  │
│ - Set refund_type   │
└─────────────────────┘
         │
         ▼
Update credit with refund linkage
```

---

## Component Hierarchy

### TransactionModal (Modified)

```
TransactionModal.tsx
├── [Header: Icon + Amount]
├── [Transaction Details Section]
├── [Merchant Information Section]
├── [Additional Details Section]
├── [Source Email Section] (collapsible)
├── [Notes & Comments Section] (collapsible)
├── [Sub-transactions Section] (NEW - collapsible)
│   ├── SubTransactionList (if has subs)
│   └── SubTransactionEditor (if creating)
├── [Receipt Section] (NEW - collapsible)
│   ├── ReceiptUploader (if no receipt)
│   └── ReceiptItemsEditor (if parsed)
├── [Refund Section] (NEW - for credits)
│   └── RefundLinkModal (on click)
└── [Footer: Actions]
    ├── SplitwiseDropdown
    └── Save/Cancel buttons
```

### TxnCard (Modified)

```
TxnCard.tsx
├── [Icon Container]
├── [Content]
│   ├── Merchant Name
│   ├── Category
│   └── [Badges Row]
│       ├── Splitwise Badge (existing)
│       ├── Sub-transactions Badge (NEW)
│       └── Refund Badge (NEW)
├── [Amount]
└── [Meta: Account Type, Date]
```

---

## State Management

### Page Level (transactions.tsx)
```typescript
// Existing
const [transactions, setTransactions] = useState<Transaction[]>([]);
const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
const [isModalOpen, setIsModalOpen] = useState(false);

// No changes needed - sub-transactions included in transaction response
```

### Modal Level (TransactionModal.tsx)
```typescript
// Existing (12 useState hooks)
const [formData, setFormData] = useState<Transaction>(transaction);
const [splitwiseStatus, setSplitwiseStatus] = useState<'checking'|'exists'|'none'>('checking');

// New
const [subTransactions, setSubTransactions] = useState<SubTransaction[]>([]);
const [loadingSubTransactions, setLoadingSubTransactions] = useState(false);
const [receipt, setReceipt] = useState<Receipt | null>(null);
const [loadingReceipt, setLoadingReceipt] = useState(false);
const [refundStatus, setRefundStatus] = useState<RefundStatus | null>(null);
```

---

## Security Model

### Row-Level Security (RLS)

All new tables follow existing pattern:
```sql
CREATE POLICY "own data" ON table_name
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### Storage Security

Receipt files protected by folder-based RLS:
```sql
-- Path: {user_id}/{receipt_id}/{filename}
CREATE POLICY "Users can manage own receipts"
ON storage.objects FOR ALL
USING (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### API Security

All endpoints use `withAuth` wrapper:
```typescript
export default withAuth(async (req, res, user) => {
  // user.id available for RLS
});
```
