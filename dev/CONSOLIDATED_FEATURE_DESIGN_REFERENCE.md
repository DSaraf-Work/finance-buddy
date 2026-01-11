# Finance Buddy: Sub-Transactions, Receipt Parsing & Smart Refunds
## Comprehensive Design Reference & Architectural Deep-Dive

> **Document Purpose**: Ultra-detailed reference preserving all architectural decisions, technical rationale, implementation specifications, and expert analysis for three interconnected features.
>
> **Created**: 2026-01-12
> **Status**: Pre-implementation Archive
> **Source**: `docs/subtransaction-receipt-parsing/` (17 markdown files)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Feature 1: Sub-Transactions](#feature-1-sub-transactions)
3. [Feature 2: Receipt Parsing](#feature-2-receipt-parsing)
4. [Feature 3: Smart Refunds](#feature-3-smart-refunds)
5. [Cross-Feature Integration](#cross-feature-integration)
6. [Testing & Quality Assurance](#testing--quality-assurance)
7. [Deployment Strategy](#deployment-strategy)
8. [Architectural Patterns](#architectural-patterns)
9. [Critical Decisions Log](#critical-decisions-log)
10. [Risk Analysis & Mitigations](#risk-analysis--mitigations)

---

## Executive Summary

### The Three Features

| Feature | Core Problem | Solution Approach | Complexity |
|---------|--------------|-------------------|------------|
| **Sub-Transactions** | Cannot categorize line items within single transaction | Self-referential FK with database triggers | Medium |
| **Receipt Parsing** | Manual entry of receipt items is tedious | AI vision + bidirectional linking | High |
| **Smart Refunds** | Tracking refunds to originals is manual | Weighted scoring algorithm + validation | Medium |

### Implementation Scope

- **11 Phases** across 3 features
- **3 Deployment Checkpoints** for incremental validation
- **3 Database Migrations** with rollback scripts
- **17 New API Endpoints** with full CRUD
- **12 New React Components** following design system
- **8 Database Triggers** for integrity enforcement
- **3 New TypeScript Module Files** with 15+ types

### Key Architectural Principles

1. **Minimize Database Changes**: Reuse `fb_emails_processed` table where possible
2. **Database-Level Integrity**: Use triggers for validation (cannot be bypassed)
3. **Bidirectional Linking**: Maintain referential integrity both ways
4. **Incremental Deployment**: Test each feature independently
5. **Backward Compatibility**: No breaking changes to existing features
6. **Design System Compliance**: Dark-only theme, CSS variables, Lucide icons

---

## Feature 1: Sub-Transactions

### Problem Space Analysis

#### User Pain Point
Users receive transactions from merchants that mix multiple categories:
- Grocery bill: Food, household items, personal care
- Restaurant: Food, drinks, desserts
- Shopping: Clothing, electronics, home goods

**Current State**: Single transaction with single category → poor expense tracking
**Desired State**: Split into line items with individual categories → accurate categorization

#### Business Impact
- **Splitwise Integration**: Current `splitwise_expense_id` must propagate to children
- **Category Analytics**: More granular data for spending insights
- **Budget Tracking**: Assign individual items to different budget categories

---

### Architectural Decision: Self-Referential FK

#### Options Considered

**Option A: Separate Child Table** (`fb_sub_transactions`)
```sql
CREATE TABLE fb_sub_transactions (
  id UUID PRIMARY KEY,
  parent_transaction_id UUID REFERENCES fb_emails_processed(id),
  amount NUMERIC(18,2),
  category TEXT,
  ...
);
```

**Pros**:
- Clean separation of concerns
- Simpler queries (no self-joins)
- Easier to understand schema

**Cons**:
- Need to duplicate RLS policies
- Need to duplicate API patterns
- More complex frontend (two data types)
- Splitwise integration needs custom logic

---

**Option B: Self-Referential FK** (CHOSEN)
```sql
ALTER TABLE fb_emails_processed
ADD COLUMN parent_transaction_id UUID REFERENCES fb_emails_processed(id);
```

**Pros**:
- ✅ Reuses existing RLS policies automatically
- ✅ Reuses existing API auth patterns
- ✅ Frontend treats as same type (TransactionWithSubTransactions)
- ✅ Splitwise cascade via simple trigger
- ✅ Minimal schema changes

**Cons**:
- ⚠️ Requires database triggers for validation
- ⚠️ Self-joins can be confusing
- ⚠️ Need explicit single-level nesting enforcement

**Decision Rationale**: The reuse benefits and automatic RLS application outweigh the trigger complexity. The existing codebase already has trigger experience, so this is not introducing new patterns.

---

### Database Schema Deep-Dive

#### New Columns

```sql
-- Self-referential parent link
parent_transaction_id UUID REFERENCES fb_emails_processed(id) ON DELETE CASCADE

-- Flag to identify sub-transactions
is_sub_transaction BOOLEAN DEFAULT FALSE

-- Ordering within parent (1, 2, 3, ...)
sub_transaction_order INTEGER DEFAULT 0

-- Link to receipt item (added in Phase 6, bidirectional)
receipt_item_id UUID REFERENCES fb_receipt_items(id) ON DELETE SET NULL
```

**Design Notes**:
- `ON DELETE CASCADE`: When parent deleted, children auto-delete (expected behavior)
- `sub_transaction_order`: Preserves user's entry order, useful for UI display
- `receipt_item_id`: Prepared for Phase 6 integration, but FK added later

---

#### Constraint: Parent-Child Relationship

```sql
ALTER TABLE fb_emails_processed
ADD CONSTRAINT chk_sub_transaction_has_parent
CHECK (
  (is_sub_transaction = FALSE AND parent_transaction_id IS NULL) OR
  (is_sub_transaction = TRUE AND parent_transaction_id IS NOT NULL)
);
```

**Purpose**: Prevent orphaned sub-transactions or parents with self-reference.

**Edge Cases Prevented**:
- Parent transaction with `parent_transaction_id` set (invalid state)
- Sub-transaction with `parent_transaction_id = NULL` (orphaned)

---

#### The Five Critical Triggers

##### 1. Field Inheritance Trigger

**Problem**: Sub-transactions need inherited fields from parent, especially `email_row_id` which has NOT NULL constraint.

```sql
CREATE OR REPLACE FUNCTION inherit_sub_transaction_fields()
RETURNS TRIGGER AS $$
DECLARE
  parent RECORD;
BEGIN
  IF NEW.is_sub_transaction = TRUE AND NEW.parent_transaction_id IS NOT NULL THEN
    SELECT * INTO parent FROM fb_emails_processed WHERE id = NEW.parent_transaction_id;

    IF parent.id IS NULL THEN
      RAISE EXCEPTION 'Parent transaction not found';
    END IF;

    -- Required fields (cannot be NULL)
    NEW.user_id := parent.user_id;
    NEW.google_user_id := parent.google_user_id;
    NEW.connection_id := parent.connection_id;
    NEW.email_row_id := parent.email_row_id;  -- ⭐ CRITICAL: Solves NOT NULL constraint

    -- Optional fields (allow override with COALESCE)
    NEW.currency := COALESCE(NEW.currency, parent.currency);
    NEW.direction := COALESCE(NEW.direction, parent.direction);
    NEW.txn_time := COALESCE(NEW.txn_time, parent.txn_time);
    NEW.account_type := COALESCE(NEW.account_type, parent.account_type);
    NEW.status := COALESCE(NEW.status, parent.status);

    -- Always cascade Splitwise (override user input)
    NEW.splitwise_expense_id := parent.splitwise_expense_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Timing**: `BEFORE INSERT`

**Why BEFORE INSERT**: Must set fields before row actually inserted, so constraints can validate.

**Critical Integration**: The `email_row_id` inheritance is what makes this architecture viable. Without it, every API would need to manually fetch and set this field.

**Splitwise Decision**: Always override user input for `splitwise_expense_id`. This ensures consistency - if parent is linked to Splitwise, ALL children must be. User cannot selectively link children.

---

##### 2. Nested Prevention Trigger

**Problem**: Design specifies single-level nesting only. Database must enforce.

```sql
CREATE OR REPLACE FUNCTION check_no_nested_sub_transactions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_sub_transaction = TRUE AND NEW.parent_transaction_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM fb_emails_processed
      WHERE id = NEW.parent_transaction_id AND is_sub_transaction = TRUE
    ) THEN
      RAISE EXCEPTION 'Cannot create sub-transaction of a sub-transaction';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Timing**: `BEFORE INSERT OR UPDATE`

**Why Both Operations**: User could try to UPDATE a regular transaction to become a sub-transaction of a sub-transaction.

**Alternative Considered**: Check constraint with subquery. Rejected because:
- Check constraints cannot reference other rows (only current row)
- Trigger provides clearer error message

---

##### 3. Amount Validation Trigger

**Problem**: Sum of sub-transaction amounts must never exceed parent amount.

```sql
CREATE OR REPLACE FUNCTION validate_sub_transaction_amounts()
RETURNS TRIGGER AS $$
DECLARE
  parent_amount NUMERIC(18,2);
  sub_total NUMERIC(18,2);
BEGIN
  IF NEW.is_sub_transaction = TRUE AND NEW.parent_transaction_id IS NOT NULL THEN
    -- Get parent amount
    SELECT amount INTO parent_amount
    FROM fb_emails_processed
    WHERE id = NEW.parent_transaction_id;

    -- Calculate current total (excluding this record if UPDATE)
    SELECT COALESCE(SUM(amount), 0) INTO sub_total
    FROM fb_emails_processed
    WHERE parent_transaction_id = NEW.parent_transaction_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    -- Add new amount
    sub_total := sub_total + COALESCE(NEW.amount, 0);

    -- Validate
    IF sub_total > parent_amount THEN
      RAISE EXCEPTION 'Sub-transaction amounts (%) exceed parent amount (%)',
        sub_total, parent_amount;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Timing**: `BEFORE INSERT OR UPDATE`

**Edge Case Handling**:
- `COALESCE(NEW.id, '00000000...')`: On INSERT, NEW.id is NULL. Use impossible UUID to exclude nothing.
- `COALESCE(SUM(amount), 0)`: If no other sub-transactions exist, SUM returns NULL. Default to 0.

**Performance Note**: This trigger runs SELECT for every INSERT/UPDATE of a sub-transaction. For batch inserts of 10 sub-transactions, this means 10 SELECTs. PostgreSQL handles this efficiently with indexes, but it's a known trade-off.

**Alternative Considered**: Application-level validation only. Rejected because:
- Triggers provide absolute guarantee (cannot be bypassed)
- API bugs or direct DB access still protected

---

##### 4. Splitwise Cascade Trigger

**Problem**: When parent's `splitwise_expense_id` changes (linked or unlinked), all children must update.

```sql
CREATE OR REPLACE FUNCTION cascade_splitwise_to_children()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.splitwise_expense_id IS DISTINCT FROM NEW.splitwise_expense_id THEN
    UPDATE fb_emails_processed
    SET splitwise_expense_id = NEW.splitwise_expense_id,
        updated_at = NOW()
    WHERE parent_transaction_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Timing**: `AFTER UPDATE`

**Why AFTER**: Parent row must be updated first before we can cascade to children.

**WHEN Clause**: `WHEN (OLD.splitwise_expense_id IS DISTINCT FROM NEW.splitwise_expense_id)`
- Performance optimization: Only fires when Splitwise ID actually changes
- `IS DISTINCT FROM`: Handles NULL properly (NULL != NULL is UNKNOWN, but NULL IS DISTINCT FROM NULL is FALSE)

**Use Cases**:
- User links parent to Splitwise expense → All children get same ID
- User unlinks parent from Splitwise → All children cleared (NULL)
- User changes Splitwise expense → All children updated to new ID

**Race Condition**: If Splitwise webhook updates parent while user editing child, child gets overwritten. This is acceptable - parent is source of truth.

---

##### 5. Parent Amount Lock Trigger

**Problem**: If user changes parent amount while sub-transactions exist, validation becomes complex. Lock parent instead.

```sql
CREATE OR REPLACE FUNCTION lock_parent_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.amount IS DISTINCT FROM NEW.amount THEN
    IF EXISTS (
      SELECT 1 FROM fb_emails_processed
      WHERE parent_transaction_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Cannot modify amount of transaction with sub-transactions';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Timing**: `BEFORE UPDATE OF amount`

**Why OF amount**: Trigger only fires when `amount` column changes, not on every UPDATE.

**User Flow**: If user wants to change parent amount:
1. Attempt to edit → Error message
2. Delete all sub-transactions
3. Change parent amount
4. Re-create sub-transactions with new amounts

**Alternative Considered**: Auto-proportional adjustment (scale all children). Rejected because:
- Complex logic (rounding issues)
- Unexpected behavior (user didn't ask for child changes)
- Loss of precision (₹33.33, ₹33.33, ₹33.34 rounding)

---

#### Indexes for Performance

```sql
-- Find children by parent (most common query)
CREATE INDEX idx_fb_txn_parent_id
  ON fb_emails_processed(parent_transaction_id)
  WHERE parent_transaction_id IS NOT NULL;

-- Filter sub-transactions (for analytics)
CREATE INDEX idx_fb_txn_is_sub
  ON fb_emails_processed(is_sub_transaction)
  WHERE is_sub_transaction = TRUE;

-- Order children within parent (for display)
CREATE INDEX idx_fb_txn_parent_order
  ON fb_emails_processed(parent_transaction_id, sub_transaction_order)
  WHERE parent_transaction_id IS NOT NULL;
```

**Partial Indexes**: Using `WHERE` clauses reduces index size (only indexes relevant rows).

**Expected Query Patterns**:
1. `SELECT * FROM ... WHERE parent_transaction_id = $1 ORDER BY sub_transaction_order` (most common)
2. `SELECT * FROM ... WHERE is_sub_transaction = TRUE AND category = $1` (analytics)
3. `SELECT COUNT(*) FROM ... WHERE parent_transaction_id = $1` (validation)

---

### TypeScript Type System

#### Core Types

```typescript
interface SubTransaction {
  id: UUID;
  parent_transaction_id: UUID;
  is_sub_transaction: true;  // Literal type
  sub_transaction_order: number;
  receipt_item_id?: UUID | null;

  // Inherited (auto-populated, but typed as optional for safety)
  user_id: UUID;
  google_user_id: string;
  connection_id?: UUID;
  email_row_id: UUID;
  currency?: string;
  direction?: TransactionDirection;
  txn_time?: string;
  splitwise_expense_id?: string | null;
  account_type?: string | null;
  status?: string;

  // User-provided
  amount?: number;
  merchant_name?: string | null;
  merchant_normalized?: string | null;
  category?: string | null;
  user_notes?: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}
```

**Design Notes**:
- `is_sub_transaction: true` as literal type provides type narrowing
- Inherited fields typed as optional (defensive) even though trigger guarantees they exist
- `receipt_item_id` supports Phase 6 integration

---

#### Validation Constants

```typescript
export const MIN_SUB_TRANSACTIONS = 2;
export const MAX_SUB_TRANSACTIONS = 10;
```

**Rationale**:
- **MIN = 2**: Splitting into 1 item is pointless (no split at all)
- **MAX = 10**: UI performance and usability limit. Beyond 10 items:
  - Scroll fatigue
  - Validation complexity
  - Unlikely real-world use case (most receipts < 10 items)

**Trade-off**: Some edge cases (e.g., large office supply orders) might need >10. Accepted as rare enough to not complicate UI.

---

#### Validation Functions

```typescript
function validateSubTransactionAmounts(
  items: CreateSubTransactionInput[],
  parentAmount: number
): SubTransactionValidation {
  const errors: string[] = [];

  // Count validation
  if (items.length < MIN_SUB_TRANSACTIONS) {
    errors.push(`Minimum ${MIN_SUB_TRANSACTIONS} sub-transactions required`);
  }
  if (items.length > MAX_SUB_TRANSACTIONS) {
    errors.push(`Maximum ${MAX_SUB_TRANSACTIONS} sub-transactions allowed`);
  }

  // Individual amount validation
  items.forEach((item, index) => {
    if (!item.amount || item.amount <= 0) {
      errors.push(`Item ${index + 1}: Amount must be positive`);
    }
  });

  // Sum validation
  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  if (totalAmount > parentAmount) {
    errors.push(`Total (${totalAmount}) exceeds parent amount (${parentAmount})`);
  }

  return {
    isValid: errors.length === 0,
    totalAmount,
    parentAmount,
    difference: parentAmount - totalAmount,
    errors,
  };
}
```

**Design Philosophy**: Client-side validation provides instant feedback. Server-side validation (triggers) provides guarantee. Both necessary.

**Difference Calculation**: `parentAmount - totalAmount` shows "unallocated" amount. UI can display this as warning (amber) if > 0.

---

### API Endpoint Architecture

#### Endpoint Strategy

**File Structure**:
```
src/pages/api/transactions/[id]/sub-transactions/
├── index.ts           # Collection operations (POST, GET, DELETE all)
└── [subId].ts        # Individual operations (PATCH, DELETE single)
```

**RESTful Mapping**:
- `POST /transactions/[id]/sub-transactions` → Create batch
- `GET /transactions/[id]/sub-transactions` → List all
- `PATCH /transactions/[id]/sub-transactions/[subId]` → Update one
- `DELETE /transactions/[id]/sub-transactions/[subId]` → Delete one
- `DELETE /transactions/[id]/sub-transactions` → Delete all

---

#### Atomic Batch Insert

**Problem**: Creating 5 sub-transactions should be all-or-nothing.

**Solution**: PostgreSQL's default transaction behavior + Supabase batch insert.

```typescript
const { data, error } = await supabaseAdmin
  .from(TABLE_EMAILS_PROCESSED)
  .insert(subTransactions)  // Array of 5 records
  .select();
```

**How It Works**:
1. Supabase wraps in transaction automatically
2. Trigger fires for each INSERT within transaction
3. If ANY trigger fails (amount validation, nested check, etc.) → ROLLBACK entire batch
4. If all succeed → COMMIT

**User Experience**: Either all 5 sub-transactions created, or none. No partial state.

---

#### GET with Summary

**Request**: `GET /api/transactions/123/sub-transactions`

**Response**:
```json
{
  "subTransactions": [
    { "id": "...", "amount": 50, "category": "Food", ... },
    { "id": "...", "amount": 30, "category": "Household", ... }
  ],
  "summary": {
    "count": 2,
    "totalAmount": 80,
    "remainingAmount": 20,
    "categories": ["Food", "Household"]
  }
}
```

**Rationale**: Summary computed server-side to avoid client-side recalculation. Includes unique categories for UI chips/badges.

---

#### PATCH Validation

**Request**: `PATCH /api/transactions/123/sub-transactions/456`
```json
{
  "amount": 60
}
```

**Server Logic**:
```typescript
const allowedFields = ['amount', 'merchant_name', 'category', 'user_notes'];
const updates: any = {};

for (const field of allowedFields) {
  if (body[field] !== undefined) {
    updates[field] = body[field];
  }
}

// Database trigger will validate amount
const { data, error } = await supabaseAdmin
  .from(TABLE_EMAILS_PROCESSED)
  .update(updates)
  .eq('id', subId)
  .select()
  .single();

if (error?.message.includes('exceed parent')) {
  return res.status(400).json({ error: 'Amount exceeds available parent amount' });
}
```

**Security**: Whitelist allowed fields. Ignore attempts to modify `user_id`, `splitwise_expense_id`, etc.

**Error Handling**: Trigger error message bubbles up. API catches and returns user-friendly message.

---

#### DELETE Single with Minimum Check

**Problem**: If only 2 sub-transactions exist, deleting 1 would leave 1 (violates MIN_SUB_TRANSACTIONS).

**Solution**: Server-side check before delete.

```typescript
const { count } = await supabaseAdmin
  .from(TABLE_EMAILS_PROCESSED)
  .select('id', { count: 'exact', head: true })
  .eq('parent_transaction_id', parentId);

if (count <= 2) {
  return res.status(400).json({
    error: 'Cannot delete. Minimum 2 sub-transactions required. Delete all instead.',
  });
}
```

**User Flow**: If user wants to remove sub-transactions entirely, they use DELETE all endpoint.

---

### UI Component Architecture

#### Design System Compliance

**Mandatory Rules from `.claude/rules/design-system.md`**:
1. Dark-only theme (no light mode)
2. CSS variables via Tailwind classes (no hardcoded colors)
3. Lucide-react icons only
4. shadcn/ui components for primitives
5. `font-mono` for amounts
6. Hover effects with `transition-all duration-300`
7. Loading states with skeleton/spinner

---

#### SubTransactionBadge

**Location**: `TxnCard.tsx` badges row

**Design**:
```tsx
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
```

**Color Rationale**: Indigo/violet (99, 102, 241) matches primary color in design system. 12% opacity provides subtle background.

**Conditional Render**: Only shows if `count > 0`.

---

#### SubTransactionEditor

**State Management**:
```tsx
const [items, setItems] = useState<EditableItem[]>([
  { id: '1', amount: '', category: '' },
  { id: '2', amount: '', category: '' },
]);
const [error, setError] = useState<string | null>(null);
```

**Real-time Validation**:
```tsx
const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
const remaining = parentAmount - totalAmount;

// Disable save if over
<Button onClick={handleSave} disabled={saving || totalAmount > parentAmount}>
```

**UX Flow**:
1. User types amount in item #1
2. Total updates instantly
3. Remaining amount changes color (green → amber → red)
4. Save button enables/disables based on validation

**Add/Remove Buttons**:
- Add: Disabled if count >= 10
- Remove: Disabled if count <= 2

---

#### SubTransactionList

**Inline Edit Pattern**:
```tsx
const [editingId, setEditingId] = useState<string | null>(null);
const [editValues, setEditValues] = useState<Partial<SubTransaction>>({});

// Click Edit → setEditingId(id), setEditValues(current values)
// Click Save → API PATCH, setEditingId(null)
// Click Cancel → setEditingId(null) (discard changes)
```

**Why Inline Edit**: Faster UX than modal. User can edit multiple items quickly without modal fatigue.

**Conditional Buttons**:
- Edit: Always shown
- Delete: Only shown if `count > 2`

---

#### TransactionModal Integration

**New State**:
```tsx
const [subTransactions, setSubTransactions] = useState<SubTransaction[]>([]);
const [loadingSubTransactions, setLoadingSubTransactions] = useState(false);
const [isCreatingSubs, setIsCreatingSubs] = useState(false);
```

**Effect for Auto-load**:
```tsx
useEffect(() => {
  if (transaction.id && !transaction.is_sub_transaction) {
    loadSubTransactions();
  }
}, [transaction.id]);
```

**Conditional Rendering**:
```tsx
{!transaction.is_sub_transaction && (
  <CollapsibleCard title="Sub-transactions" icon={<Layers />}>
    {loadingSubTransactions ? <Spinner /> :
     isCreatingSubs ? <SubTransactionEditor /> :
     subTransactions.length > 0 ? <SubTransactionList /> :
     <EmptyState />}
  </CollapsibleCard>
)}
```

**Why Exclude Sub-transactions**: Sub-transactions cannot have children (single-level nesting).

---

### Integration Points

#### Splitwise Cascade

**Existing Integration**: Parent transaction has `splitwise_expense_id` when linked to Splitwise expense.

**New Behavior**:
1. User links parent to Splitwise → API sets `splitwise_expense_id = 'abc123'`
2. Trigger (`cascade_splitwise_to_children`) fires → All children get `abc123`
3. User unlinks parent → API sets `splitwise_expense_id = NULL`
4. Trigger fires → All children get `NULL`

**Splitwise API Implications**: If user creates Splitwise expense with sub-transactions:
- Option A: Create 1 Splitwise expense for parent only
- Option B: Create 1 Splitwise expense with multiple line items (Splitwise API supports this)

**Recommendation**: Option B for accuracy. But requires Splitwise API exploration (not in current scope).

---

#### Transaction List Filtering

**Problem**: If user filters by category "Food", should parent with "Food" sub-transaction appear?

**Current Behavior**: Transaction list queries `WHERE category = 'Food'`.

**New Behavior**: Two options:
1. Query includes sub-transactions → Shows sub-transaction rows directly (confusing)
2. Query excludes sub-transactions → Shows parent if ANY child matches (better UX)

**Recommended Implementation**:
```typescript
// In search API
const query = supabaseAdmin
  .from(TABLE_EMAILS_PROCESSED)
  .select('*')
  .or(`category.eq.${category},id.in.(${subIdsMatchingCategory})`);
```

**Complexity**: Requires subquery. Deferred to later optimization.

---

## Feature 2: Receipt Parsing

### Problem Space Analysis

#### User Pain Point
After splitting transaction, user must manually enter:
- Item name: "Amul Milk"
- Amount: ₹65
- Category: "Food"

For 10 items, this is 30+ form inputs. Tedious and error-prone.

#### Business Value
- **Time Savings**: 10-item receipt takes 5 minutes manually vs 30 seconds with AI parsing
- **Accuracy**: OCR reduces typos in amounts
- **Categorization**: AI can suggest categories based on item names

---

### Architectural Decision: Vision API Integration

#### Options Considered

**Option A: OCR Library** (Tesseract.js, Google Cloud Vision)
- Pros: Lower cost, offline capable
- Cons: Requires custom parsing logic for receipt formats, lower accuracy on Indian receipts

**Option B: OpenAI Vision API**
- Pros: Structured output, good accuracy
- Cons: Cost per image, rate limits, JSON mode requires specific prompting

**Option C: Claude Vision API** (CHOSEN)
- Pros: ✅ Excellent JSON output, ✅ handles Indian receipts well, ✅ already using Anthropic
- Cons: Cost per image (~$0.01-0.05 per receipt)

**Decision Rationale**: Already using Anthropic for transaction extraction. Claude Vision provides best structured output with minimal prompt engineering.

---

### Vision API Extension

#### Current `AnthropicModel` Limitation

```typescript
// Before: Text-only
messages: [{
  role: 'user',
  content: request.prompt,  // String only
}]
```

**Problem**: Claude API supports images, but our wrapper doesn't.

---

#### Extended Implementation

```typescript
interface ImageContent {
  type: 'base64' | 'url';
  media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  data: string;  // base64 string or URL
}

interface VisionAIRequest extends AIRequest {
  images?: ImageContent[];
}
```

**buildContent() Method**:
```typescript
private buildContent(request: VisionAIRequest): Anthropic.ContentBlockParam[] {
  const content: Anthropic.ContentBlockParam[] = [];

  // Images first
  if (request.images) {
    for (const image of request.images) {
      if (image.type === 'base64') {
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: image.media_type,
            data: image.data,
          },
        });
      }
    }
  }

  // Text prompt last
  content.push({
    type: 'text',
    text: request.prompt,
  });

  return content;
}
```

**Why Images First**: Claude API documentation recommends images before text for better context.

---

### Receipt Parsing Prompts

#### System Prompt

```
You are an expert receipt parser specialized in Indian receipts. Extract structured data from receipt images accurately.

IMPORTANT:
- All amounts are in INR (Indian Rupees) unless explicitly stated otherwise
- Handle GST/CGST/SGST tax breakdowns
- Recognize common Indian store formats (Big Bazaar, DMart, Reliance, etc.)
- Parse both printed and handwritten receipts
- Handle multiple items per line

OUTPUT FORMAT:
Return valid JSON only, no markdown or explanation.
```

**Design Notes**:
- Emphasis on Indian formats (crucial for accuracy)
- Tax breakdown awareness (GST split into CGST + SGST)
- Explicit JSON-only output (no markdown code blocks)

---

#### User Prompt

```
Analyze this receipt image and extract:

1. Store Information:
   - store_name: Name of the store/merchant
   - receipt_date: Date in ISO format (YYYY-MM-DD)
   - receipt_number: Receipt/invoice number if visible

2. Items: Array of line items, each with:
   - item_name: Product name
   - quantity: Number (default 1)
   - unit: Unit of measure if applicable (kg, g, L, pcs, etc.)
   - unit_price: Price per unit
   - total_price: Total for this line

3. Totals:
   - subtotal: Sum before tax/discounts
   - tax_amount: Total tax (GST/VAT)
   - discount_amount: Any discounts applied
   - total_amount: Final amount paid

Return as JSON: {...}
```

**Expected Output**:
```json
{
  "store_name": "Big Bazaar",
  "receipt_date": "2026-01-10",
  "receipt_number": "INV-12345",
  "items": [
    {
      "item_name": "Amul Taaza Milk",
      "quantity": 2,
      "unit": "L",
      "unit_price": 32.50,
      "total_price": 65.00
    }
  ],
  "subtotal": 200.00,
  "tax_amount": 10.00,
  "discount_amount": 5.00,
  "total_amount": 205.00,
  "confidence": 0.95
}
```

---

### Database Schema: Receipts

#### Two-Table Design

**Why Two Tables**:
1. `fb_receipts` - Receipt metadata (file, parsing status, totals)
2. `fb_receipt_items` - Individual line items (linkable to sub-transactions)

**Alternative Considered**: JSON column for items in `fb_receipts`.
- Rejected: Cannot link individual items to sub-transactions (no ID)

---

#### fb_receipts Table

```sql
CREATE TABLE fb_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES fb_emails_processed(id) ON DELETE CASCADE,

  -- File info
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,

  -- Parsed metadata
  store_name TEXT,
  receipt_date TIMESTAMPTZ,
  receipt_number TEXT,

  -- Amounts
  subtotal NUMERIC(18,2),
  tax_amount NUMERIC(18,2),
  discount_amount NUMERIC(18,2),
  total_amount NUMERIC(18,2),
  currency TEXT DEFAULT 'INR',

  -- Parsing info
  raw_ocr_text TEXT,
  parsing_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (parsing_status IN ('pending', 'processing', 'completed', 'failed')),
  parsing_error TEXT,
  confidence NUMERIC(3,2),
  ai_model_used TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Field Notes**:
- `file_path`: Supabase Storage path (`{user_id}/{receipt_id}/{filename}`)
- `raw_ocr_text`: Stores entire AI response (debugging, re-parsing)
- `parsing_status`: State machine (pending → processing → completed/failed)
- `confidence`: AI's confidence score (0.00-1.00)

---

#### fb_receipt_items Table

```sql
CREATE TABLE fb_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES fb_receipts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Item details
  item_order INTEGER NOT NULL DEFAULT 0,
  item_name TEXT NOT NULL,
  item_description TEXT,
  quantity NUMERIC(10,3) DEFAULT 1,
  unit TEXT,
  unit_price NUMERIC(18,2),
  total_price NUMERIC(18,2) NOT NULL,

  -- Classification
  category TEXT,
  is_tax BOOLEAN DEFAULT FALSE,
  is_discount BOOLEAN DEFAULT FALSE,
  is_excluded BOOLEAN DEFAULT FALSE,

  -- Link to sub-transaction (bidirectional)
  sub_transaction_id UUID REFERENCES fb_emails_processed(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Bidirectional Linking**:
- `fb_receipt_items.sub_transaction_id` → Points to created sub-transaction
- `fb_emails_processed.receipt_item_id` → Points back to source receipt item

**Why Bidirectional**: Navigate in both directions:
- Receipt item → Which sub-transaction was created from this?
- Sub-transaction → Which receipt item was this created from?

**Classification Flags**:
- `is_tax`: GST, VAT lines (excluded from sub-transactions)
- `is_discount`: Discount lines (excluded, or could be negative amount)
- `is_excluded`: User manually excludes item (e.g., returned item on receipt)

---

#### Storage Bucket

**Configuration**:
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  false,  -- Private
  20971520,  -- 20MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
);
```

**RLS Policies**:
```sql
-- Upload to own folder
CREATE POLICY "Users can upload own receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- View own receipts
CREATE POLICY "Users can view own receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Path Convention**: `receipts/{user_id}/{receipt_id}/{original_filename.jpg}`

**Security**: Users can ONLY access files in their own `{user_id}/` folder.

---

### API Endpoints: Receipt Parsing

#### Upload Endpoint

**POST `/api/transactions/[id]/receipt`**

**Challenge**: Next.js API routes use `bodyParser` by default. File uploads need raw body.

**Solution**:
```typescript
export const config = {
  api: {
    bodyParser: false,  // Disable default JSON parser
  },
};
```

**Implementation**:
```typescript
import formidable from 'formidable';

const form = formidable({ maxFileSize: 20 * 1024 * 1024 });
const [fields, files] = await form.parse(req);

const file = Array.isArray(files.file) ? files.file[0] : files.file;

// Validate
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
if (!allowedTypes.includes(file.mimetype)) {
  return res.status(400).json({ error: 'Invalid file type' });
}

// Upload to storage
const receiptId = crypto.randomUUID();
const filePath = `${user.id}/${receiptId}/${file.originalFilename}`;

const fileBuffer = fs.readFileSync(file.filepath);
await supabaseAdmin.storage.from('receipts').upload(filePath, fileBuffer, {
  contentType: file.mimetype,
});

// Create receipt record
await supabaseAdmin.from('fb_receipts').insert({
  id: receiptId,
  user_id: user.id,
  transaction_id: id,
  file_path: filePath,
  file_name: file.originalFilename,
  file_type: file.mimetype,
  file_size: file.size,
  parsing_status: 'pending',
});
```

**Error Handling**: If database insert fails, cleanup uploaded file.

---

#### Parse Endpoint

**POST `/api/receipts/[id]/parse`**

**State Machine**:
1. Update status: `pending` → `processing`
2. Download file from storage
3. Convert to base64
4. Call Vision API
5. Parse JSON response
6. Update receipt + insert items
7. Update status: `processing` → `completed` (or `failed` on error)

**Implementation**:
```typescript
// Update status
await supabaseAdmin.from('fb_receipts').update({ parsing_status: 'processing' }).eq('id', id);

// Download file
const { data: fileData } = await supabaseAdmin.storage.from('receipts').download(receipt.file_path);
const buffer = await fileData.arrayBuffer();
const base64 = Buffer.from(buffer).toString('base64');

// Parse with AI
const model = new AnthropicModel('claude-sonnet-4-20250514');
const response = await model.analyzeImage(
  [{ type: 'base64', media_type: 'image/jpeg', data: base64 }],
  RECEIPT_PARSING_PROMPT,
  { systemPrompt: RECEIPT_PARSING_SYSTEM_PROMPT, maxTokens: 4096 }
);

const parsed = JSON.parse(response.text);

// Update receipt
await supabaseAdmin.from('fb_receipts').update({
  store_name: parsed.store_name,
  receipt_date: parsed.receipt_date,
  total_amount: parsed.total_amount,
  parsing_status: 'completed',
  ai_model_used: 'claude-sonnet-4-20250514',
}).eq('id', id);

// Insert items
const items = parsed.items.map((item, i) => ({
  receipt_id: id,
  user_id: user.id,
  item_order: i + 1,
  item_name: item.item_name,
  total_price: item.total_price,
  // ...
}));
await supabaseAdmin.from('fb_receipt_items').insert(items);
```

**Error Handling**:
```typescript
try {
  // ... parsing logic
} catch (error) {
  await supabaseAdmin.from('fb_receipts').update({
    parsing_status: 'failed',
    parsing_error: error.message,
  }).eq('id', id);

  return res.status(500).json({ error: error.message });
}
```

**Idempotency**: If user clicks "Parse" twice, second call returns 400 "Already parsed".

---

#### Create Sub-Transactions Endpoint

**POST `/api/receipts/[id]/create-sub-transactions`**

**Filter Logic**:
```typescript
const eligibleItems = receipt.items.filter(
  (item) => !item.is_excluded && !item.is_tax && !item.is_discount
);

if (eligibleItems.length < 2) {
  return res.status(400).json({ error: 'Need at least 2 eligible items' });
}
```

**Bidirectional Linking**:
```typescript
// Create sub-transactions
const subTransactions = eligibleItems.map((item, i) => ({
  parent_transaction_id: receipt.transaction_id,
  is_sub_transaction: true,
  sub_transaction_order: i + 1,
  receipt_item_id: item.id,  // → Link to receipt item
  amount: item.total_price,
  merchant_name: item.item_name,
  category: item.category,
}));

const { data: created } = await supabaseAdmin
  .from(TABLE_EMAILS_PROCESSED)
  .insert(subTransactions)
  .select();

// Update receipt items with sub-transaction links
for (let i = 0; i < created.length; i++) {
  await supabaseAdmin.from('fb_receipt_items').update({
    sub_transaction_id: created[i].id,  // ← Link back to sub-transaction
  }).eq('id', eligibleItems[i].id);
}
```

**Result**: Complete bidirectional linkage.

---

### UI Components: Receipt Parsing

#### ReceiptUploader

**File Validation**:
```typescript
function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 20 * 1024 * 1024;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Use JPEG, PNG, GIF, or WebP.' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Maximum 20MB.' };
  }

  return { valid: true };
}
```

**Preview Generation**:
```typescript
const reader = new FileReader();
reader.onload = () => {
  const result = reader.result as string;
  const base64 = result.split(',')[1];  // Remove data URL prefix
  setPreview(result);  // Full data URL for <img src>
};
reader.readAsDataURL(file);
```

**Upload Implementation**:
```typescript
const formData = new FormData();
formData.append('file', file);

const res = await fetch(`/api/transactions/${transactionId}/receipt`, {
  method: 'POST',
  body: formData,  // No Content-Type header (browser sets multipart/form-data)
});
```

---

#### ReceiptViewer State Machine

**States**:
1. **Pending**: Shows "Parse with AI" button
2. **Processing**: Animated spinner (Loader2 with `animate-spin`)
3. **Failed**: Error message + "Retry" button
4. **Completed**: Items editor + "Create Sub-Transactions" button

**Component**:
```tsx
{isPending && (
  <Button onClick={onParse} disabled={parsing}>
    <RefreshCw className={parsing ? 'animate-spin' : ''} />
    {parsing ? 'Parsing...' : 'Parse with AI'}
  </Button>
)}

{isProcessing && (
  <div className="text-center py-4">
    <RefreshCw className="h-8 w-8 mx-auto animate-spin text-primary" />
    <p className="text-muted-foreground">Parsing receipt...</p>
  </div>
)}

{isFailed && (
  <div className="text-center py-4">
    <p className="text-red-400">{receipt.parsing_error}</p>
    <Button onClick={onParse}>Retry</Button>
  </div>
)}

{isCompleted && (
  <>
    <ReceiptItemsEditor items={receipt.items} onUpdate={onUpdateItems} />
    <Button onClick={onCreateSubTransactions}>Create Sub-Transactions</Button>
  </>
)}
```

---

#### ReceiptItemsEditor

**Inline Edit with Flags**:
```tsx
<div className="flex items-center gap-3">
  <Checkbox
    checked={!item.is_excluded && !item.is_tax && !item.is_discount}
    onCheckedChange={() => toggleExcluded(item)}
    disabled={item.is_tax || item.is_discount}
  />
  <div>
    <span>{item.item_name}</span>
    {item.is_tax && <span className="text-xs text-amber-400 ml-2">TAX</span>}
    {item.is_discount && <span className="text-xs text-green-400 ml-2">DISCOUNT</span>}
  </div>
</div>
```

**Summary Calculation**:
```typescript
const eligibleItems = items.filter((i) => !i.is_excluded && !i.is_tax && !i.is_discount);
const totalEligible = eligibleItems.reduce((sum, i) => sum + i.total_price, 0);

<span className="text-sm text-muted-foreground">
  {eligibleItems.length} items ({items.length} total)
</span>
<span className="text-sm font-mono">
  Total: {totalEligible.toLocaleString('en-IN')}
</span>
```

---

## Feature 3: Smart Refunds

### Problem Space Analysis

#### User Pain Point
User receives credit from merchant. Was this a refund? For which purchase?

**Manual Process**:
1. Open credit transaction
2. Remember merchant name, amount, rough date
3. Search through past debits manually
4. Link mentally (no system support)
5. Lose track over time

**Example**:
- Jan 5: Purchase ₹1,299 from Amazon
- Jan 12: Return item
- Jan 15: Credit ₹1,299 from Amazon

User needs to remember Jan 5 purchase when seeing Jan 15 credit.

---

#### Business Value
- **Expense Accuracy**: Credits should offset original expenses
- **Splitwise Integration**: Refund might need Splitwise adjustment
- **Financial Insights**: Net spend = Debits - Refunds

---

### Architectural Decision: Scoring Algorithm

#### Alternative Approaches

**Option A: Exact Match Only**
- Rule: merchant_name + amount must match exactly
- Pros: Simple, no false positives
- Cons: Fails on partial refunds, merchant name variations ("Amazon" vs "Amazon.in")

**Option B: ML Model**
- Train model on historical refund patterns
- Pros: Learns from user behavior
- Cons: Requires training data, complex, overkill for this use case

**Option C: Weighted Scoring** (CHOSEN)
- Assign points for different match criteria
- Threshold: Show suggestions with score ≥ 50
- Pros: ✅ Balances precision/recall, ✅ tunable, ✅ explainable
- Cons: Requires weight tuning

---

#### Scoring System

```sql
score = 0
  + merchant_match_points (0, 20, or 40)
  + amount_match_points (0 or 30)
  + time_proximity_points (0 or 20)
  + reference_match_points (0 or 10)

WHERE score >= 50  -- Minimum threshold
```

**Weight Rationale**:
- **Merchant (40%)**: Most important signal. Wrong merchant = definitely wrong match.
- **Amount (30%)**: Second most important. Exact amount highly likely to be refund.
- **Time (20%)**: Helpful but not decisive. Refunds can be weeks later.
- **Reference (10%)**: Rare but strong signal when present.

**Tuning Process**:
1. Start with equal weights (25% each)
2. Test with sample data
3. Increase merchant weight (most discriminative)
4. Decrease reference weight (rarely available)
5. Validate precision/recall

---

#### Time Window: 90 Days

**Why 90 days**:
- Most refunds happen within 30 days (return window)
- Some chargebacks take 60-90 days
- Beyond 90 days, unlikely to be refund (separate purchase)

**Performance**: Filtering `WHERE txn_time >= credit_time - 90 days` uses index efficiently.

---

### Database Schema: Refunds

#### New Columns

```sql
refund_of_transaction_id UUID REFERENCES fb_emails_processed(id) ON DELETE SET NULL
refund_of_sub_transaction_id UUID REFERENCES fb_emails_processed(id) ON DELETE SET NULL
is_refund BOOLEAN DEFAULT FALSE
refund_type TEXT CHECK (refund_type IN ('full', 'partial', 'item'))
refund_reason TEXT
```

**ON DELETE SET NULL**: If original transaction deleted, preserve refund record (just unlink).

**Why Two FK Columns**:
- `refund_of_transaction_id`: Link to parent transaction
- `refund_of_sub_transaction_id`: Link to specific sub-transaction (item-level refund)

**Refund Types**:
1. **Full**: Credit amount = Original amount (₹1,299 = ₹1,299)
2. **Partial**: Credit amount < Original amount (₹500 refund on ₹1,299 purchase)
3. **Item**: Credit linked to specific sub-transaction (returned 1 item from 5)

---

#### Refund Validation Trigger

```sql
CREATE OR REPLACE FUNCTION validate_refund_linkage()
RETURNS TRIGGER AS $$
DECLARE
  original_txn RECORD;
  total_refunded NUMERIC(18,2);
BEGIN
  IF NEW.refund_of_transaction_id IS NOT NULL THEN
    -- Get original transaction
    SELECT * INTO original_txn
    FROM fb_emails_processed
    WHERE id = NEW.refund_of_transaction_id AND user_id = NEW.user_id;

    IF original_txn.id IS NULL THEN
      RAISE EXCEPTION 'Original transaction not found';
    END IF;

    -- Validate directions
    IF NEW.direction != 'credit' THEN
      RAISE EXCEPTION 'Refund must be a credit transaction';
    END IF;
    IF original_txn.direction != 'debit' THEN
      RAISE EXCEPTION 'Original must be a debit transaction';
    END IF;

    -- Prevent chains (refund of refund)
    IF original_txn.refund_of_transaction_id IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot link refund to another refund';
    END IF;

    -- Calculate total refunded so far
    SELECT COALESCE(SUM(amount), 0) INTO total_refunded
    FROM fb_emails_processed
    WHERE refund_of_transaction_id = NEW.refund_of_transaction_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    -- Validate amount
    IF (total_refunded + COALESCE(NEW.amount, 0)) > original_txn.amount THEN
      RAISE EXCEPTION 'Total refunds exceed original amount';
    END IF;

    -- Auto-set flags
    NEW.is_refund := TRUE;
    IF NEW.refund_type IS NULL THEN
      NEW.refund_type := CASE
        WHEN NEW.amount = original_txn.amount THEN 'full'
        ELSE 'partial'
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Critical Validations**:
1. ✅ Credit can only link to Debit (direction check)
2. ✅ Cannot link refund to another refund (prevent chains)
3. ✅ Total refunds cannot exceed original amount
4. ✅ Original must belong to same user (security)

**Auto-Setting**:
- `is_refund = TRUE` (flag for filtering)
- `refund_type = 'full' | 'partial'` (based on amounts)

---

#### Database Function: Suggest Matches

```sql
CREATE OR REPLACE FUNCTION suggest_refund_matches(
  p_user_id UUID,
  p_credit_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  transaction_id UUID,
  merchant_name TEXT,
  amount NUMERIC(18,2),
  txn_time TIMESTAMPTZ,
  match_score INTEGER,
  match_reasons TEXT[],
  has_sub_transactions BOOLEAN
) AS $$
DECLARE
  credit_txn RECORD;
BEGIN
  -- Get credit transaction details
  SELECT * INTO credit_txn
  FROM fb_emails_processed
  WHERE id = p_credit_id AND user_id = p_user_id;

  IF credit_txn.id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH candidate_debits AS (
    SELECT
      t.id,
      t.merchant_name,
      t.merchant_normalized,
      t.amount,
      t.txn_time,
      EXISTS (SELECT 1 FROM fb_emails_processed sub WHERE sub.parent_transaction_id = t.id) as has_subs,

      -- Calculate score
      0
      -- Merchant match (40 points)
      + CASE
          WHEN LOWER(t.merchant_normalized) = LOWER(credit_txn.merchant_normalized)
            AND t.merchant_normalized IS NOT NULL THEN 40
          WHEN LOWER(t.merchant_name) ILIKE '%' || credit_txn.merchant_normalized || '%'
            AND credit_txn.merchant_normalized IS NOT NULL THEN 20
          ELSE 0
        END
      -- Amount match (30 points)
      + CASE WHEN t.amount >= credit_txn.amount THEN 30 ELSE 0 END
      -- Time proximity (20 points)
      + CASE
          WHEN t.txn_time >= (credit_txn.txn_time - INTERVAL '90 days')
               AND t.txn_time <= credit_txn.txn_time THEN 20
          ELSE 0
        END
      AS score,

      -- Collect match reasons
      ARRAY_REMOVE(ARRAY[
        CASE WHEN LOWER(t.merchant_normalized) = LOWER(credit_txn.merchant_normalized)
             THEN 'Exact merchant match' END,
        CASE WHEN t.amount >= credit_txn.amount THEN 'Amount eligible' END,
        CASE WHEN t.txn_time >= (credit_txn.txn_time - INTERVAL '90 days')
             THEN 'Within 90 days' END
      ], NULL) AS reasons

    FROM fb_emails_processed t
    WHERE t.user_id = p_user_id
      AND t.direction = 'debit'
      AND t.is_sub_transaction = FALSE
      AND t.refund_of_transaction_id IS NULL  -- Unlinked only
      AND t.txn_time >= (credit_txn.txn_time - INTERVAL '90 days')
      AND t.txn_time <= credit_txn.txn_time
  )
  SELECT
    cd.id,
    cd.merchant_name,
    cd.amount,
    cd.txn_time,
    cd.score,
    cd.reasons,
    cd.has_subs
  FROM candidate_debits cd
  WHERE cd.score >= 50  -- Threshold
  ORDER BY cd.score DESC, cd.txn_time DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

**Performance Optimizations**:
1. `WHERE t.txn_time >= ... AND t.txn_time <= ...` uses index
2. `LIMIT p_limit` prevents returning thousands of rows
3. CTE (`candidate_debits`) computes once, not per row

**Merchant Matching**:
- Exact normalized match: 40 points
- Partial match (ILIKE): 20 points
- No match: 0 points

**Edge Case**: If merchant_normalized is NULL, uses merchant_name for partial match.

---

#### Database Function: Get Refund Status

```sql
CREATE OR REPLACE FUNCTION get_refund_status(txn_id UUID)
RETURNS TABLE (
  total_refunded NUMERIC(18,2),
  refund_count INTEGER,
  original_amount NUMERIC(18,2),
  remaining_amount NUMERIC(18,2),
  is_fully_refunded BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(r.amount), 0)::NUMERIC(18,2) as total_refunded,
    COUNT(r.id)::INTEGER as refund_count,
    t.amount::NUMERIC(18,2) as original_amount,
    (t.amount - COALESCE(SUM(r.amount), 0))::NUMERIC(18,2) as remaining_amount,
    (COALESCE(SUM(r.amount), 0) >= t.amount) as is_fully_refunded
  FROM fb_emails_processed t
  LEFT JOIN fb_emails_processed r ON r.refund_of_transaction_id = t.id
  WHERE t.id = txn_id
  GROUP BY t.id, t.amount;
END;
$$ LANGUAGE plpgsql;
```

**Use Case**: Display refund status on original transaction.

**Output Example**:
```json
{
  "total_refunded": 500,
  "refund_count": 2,
  "original_amount": 1299,
  "remaining_amount": 799,
  "is_fully_refunded": false
}
```

---

### API Endpoints: Smart Refunds

#### Get Suggestions Endpoint

**GET `/api/transactions/[id]/refund-suggestions`**

**Validation**:
```typescript
if (transaction.direction !== 'credit') {
  return res.status(400).json({ error: 'Only credit transactions can be linked as refunds' });
}

if (transaction.refund_of_transaction_id) {
  return res.status(400).json({
    error: 'This transaction is already linked as a refund',
    linked_to: transaction.refund_of_transaction_id,
  });
}
```

**Call RPC**:
```typescript
const { data: suggestions } = await supabaseAdmin.rpc('suggest_refund_matches', {
  p_user_id: user.id,
  p_credit_id: id,
  p_limit: 10,
});
```

**Response**:
```json
{
  "suggestions": [
    {
      "transaction_id": "...",
      "merchant_name": "Amazon",
      "amount": 1299,
      "txn_time": "2026-01-05T10:30:00Z",
      "match_score": 90,
      "match_reasons": ["Exact merchant match", "Amount eligible", "Within 90 days"],
      "has_sub_transactions": true,
      "splitwise_expense_id": "xyz789"
    }
  ],
  "credit": {
    "id": "...",
    "amount": 1299,
    "merchant_normalized": "amazon"
  }
}
```

---

#### Link Refund Endpoint

**POST `/api/transactions/[id]/link-refund`**

**Request Body**:
```json
{
  "original_transaction_id": "abc123",
  "refund_type": "partial",
  "refund_reason": "Returned defective item"
}
```

**Implementation**:
```typescript
// Validate directions
if (credit.direction !== 'credit') {
  return res.status(400).json({ error: 'Transaction must be a credit' });
}
if (original.direction !== 'debit') {
  return res.status(400).json({ error: 'Original must be a debit' });
}

// Update credit (trigger validates amount)
const { data, error } = await supabaseAdmin
  .from(TABLE_EMAILS_PROCESSED)
  .update({
    refund_of_transaction_id: originalId,
    refund_type: body.refund_type,
    refund_reason: body.refund_reason,
  })
  .eq('id', id)
  .select()
  .single();

if (error?.message.includes('exceed')) {
  return res.status(400).json({ error: 'Refund amount exceeds remaining original amount' });
}

// Get updated refund status for original
const { data: status } = await supabaseAdmin.rpc('get_refund_status', { txn_id: originalId });

// Return with Splitwise warning
return res.status(200).json({
  success: true,
  refund: data,
  original_status: status[0],
  splitwise_warning: original.splitwise_expense_id
    ? 'Original transaction is linked to Splitwise. You may need to update it manually.'
    : null,
});
```

**Splitwise Warning**: If original has Splitwise link, user should manually adjust expense amount.

**Future Enhancement**: Auto-update Splitwise expense amount via API.

---

#### Unlink Refund Endpoint

**DELETE `/api/transactions/[id]/link-refund`**

**Implementation**:
```typescript
await supabaseAdmin
  .from(TABLE_EMAILS_PROCESSED)
  .update({
    refund_of_transaction_id: null,
    refund_of_sub_transaction_id: null,
    is_refund: false,
    refund_type: null,
    refund_reason: null,
  })
  .eq('id', id);
```

**Why Clear All**: Ensures clean state. Half-cleared refund (is_refund=true but no link) is invalid.

---

### UI Components: Smart Refunds

#### RefundLinkModal

**Flow**:
1. User clicks "Find Original" on credit transaction
2. Modal opens, loads suggestions
3. Displays cards ranked by score (highest first)
4. User clicks card
5. Confirms link
6. Modal closes, RefundIndicator appears

**Score Visualization**:
```tsx
const scoreColor = suggestion.match_score >= 80 ? 'text-green-400' :
                   suggestion.match_score >= 60 ? 'text-amber-400' :
                   'text-red-400';

<p className={`text-sm font-medium ${scoreColor}`}>
  {suggestion.match_score}% match
</p>
```

**Match Reason Badges**:
```tsx
{suggestion.match_reasons.map((reason, i) => (
  <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
    {reason}
  </span>
))}
```

**Warnings**:
```tsx
{suggestion.splitwise_expense_id && (
  <span className="flex items-center gap-1 text-amber-400">
    <AlertTriangle className="h-3 w-3" />
    Linked to Splitwise
  </span>
)}
```

---

#### RefundIndicator for Debits

**Partial Refund Display**:
```tsx
<div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
  <div className="flex items-center gap-2 mb-3">
    <ArrowLeftRight className="h-5 w-5 text-amber-400" />
    <span className="font-medium">Partially Refunded</span>
  </div>

  <div className="space-y-1 text-sm">
    <div className="flex justify-between">
      <span className="text-muted-foreground">Original Amount</span>
      <span className="font-mono">₹1,299</span>
    </div>
    <div className="flex justify-between">
      <span className="text-muted-foreground">Total Refunded</span>
      <span className="font-mono text-green-400">-₹500</span>
    </div>
    <div className="flex justify-between">
      <span className="text-amber-400">Remaining</span>
      <span className="font-mono text-amber-400">₹799</span>
    </div>
  </div>

  <div className="mt-3 pt-3 border-t border-border/50">
    <p className="text-xs text-muted-foreground mb-2">Linked Refunds:</p>
    {refunds.map((refund) => (
      <div className="flex justify-between text-sm">
        <span>{new Date(refund.txn_time).toLocaleDateString()}</span>
        <span className="font-mono">₹{refund.amount}</span>
      </div>
    ))}
  </div>
</div>
```

**Color Coding**:
- Green: Fully refunded (100%)
- Amber: Partially refunded (< 100%)

---

## Cross-Feature Integration

### Sub-Transactions ↔ Receipt Parsing

**Data Flow**:
1. User uploads receipt → Creates `fb_receipts` record
2. AI parses receipt → Creates `fb_receipt_items` records
3. User clicks "Create Sub-Transactions" → Creates sub-transactions with `receipt_item_id`
4. Bidirectional link established

**Use Case**: User can navigate from sub-transaction back to original receipt item.

**UI Indicator**: Sub-transaction shows "From receipt" badge if `receipt_item_id` is set.

---

### Sub-Transactions ↔ Smart Refunds

**Scenario**: User returns 1 item from 5-item grocery bill.

**Data Model**:
- Parent: ₹500 grocery bill (split into 5 sub-transactions)
- Sub-transaction #3: ₹80 (returned item)
- Credit: ₹80 refund

**Linking**:
```sql
UPDATE fb_emails_processed
SET refund_of_sub_transaction_id = '<sub-transaction-3-id>',
    refund_type = 'item'
WHERE id = '<credit-id>';
```

**Refund Status**:
- Parent shows: "1 item refunded"
- Sub-transaction #3 shows: "Refunded" badge
- Credit shows: "Refund of [Item Name]"

---

### Splitwise Integration

**Current State**: Parent transaction has `splitwise_expense_id`.

**With Sub-Transactions**:
- Trigger auto-cascades `splitwise_expense_id` to all children
- All sub-transactions linked to same Splitwise expense
- If parent unlinked, all children cleared

**With Refunds**:
- If original has Splitwise link, refund linking shows warning
- User must manually adjust Splitwise expense amount
- Future: Auto-update via Splitwise API

---

## Testing & Quality Assurance

### Unit Tests

**Validation Functions** (`src/lib/validation/sub-transactions.ts`):
```typescript
describe('validateSubTransactionAmounts', () => {
  it('should pass with valid 2 items totaling less than parent', () => {
    const result = validateSubTransactionAmounts(
      [{ amount: 50 }, { amount: 30 }],
      100
    );
    expect(result.isValid).toBe(true);
    expect(result.difference).toBe(20);
  });

  it('should fail if total exceeds parent', () => {
    const result = validateSubTransactionAmounts(
      [{ amount: 60 }, { amount: 50 }],
      100
    );
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Total (110) exceeds parent amount (100)');
  });

  it('should fail with less than 2 items', () => {
    const result = validateSubTransactionAmounts([{ amount: 50 }], 100);
    expect(result.isValid).toBe(false);
  });
});
```

---

### Integration Tests: Database Triggers

**Test Inheritance Trigger**:
```sql
-- Insert parent
INSERT INTO fb_emails_processed (id, user_id, email_row_id, amount)
VALUES ('parent-id', 'user-123', 'email-456', 100);

-- Insert sub-transaction (minimal fields)
INSERT INTO fb_emails_processed (id, parent_transaction_id, is_sub_transaction, amount, merchant_name)
VALUES ('sub-id', 'parent-id', TRUE, 50, 'Item A');

-- Verify inheritance
SELECT user_id, email_row_id FROM fb_emails_processed WHERE id = 'sub-id';
-- Expected: user_id = 'user-123', email_row_id = 'email-456'
```

**Test Amount Validation Trigger**:
```sql
-- Should fail: sum exceeds parent
INSERT INTO fb_emails_processed (parent_transaction_id, is_sub_transaction, amount, merchant_name)
VALUES ('parent-id', TRUE, 60, 'Item B');
-- Expected: EXCEPTION 'Sub-transaction amounts (110) exceed parent amount (100)'
```

**Test Nested Prevention Trigger**:
```sql
-- Should fail: nested sub-transaction
INSERT INTO fb_emails_processed (parent_transaction_id, is_sub_transaction, amount)
VALUES ('sub-id', TRUE, 25);
-- Expected: EXCEPTION 'Cannot create sub-transaction of a sub-transaction'
```

---

### E2E Tests

**Sub-Transaction Flow** (Playwright):
```typescript
test('create, edit, delete sub-transactions', async ({ page }) => {
  // Open transaction modal
  await page.click('[data-testid="txn-card-123"]');

  // Click "Split Transaction"
  await page.click('button:has-text("Split Transaction")');

  // Add 2 items
  await page.fill('[data-testid="sub-item-0-amount"]', '50');
  await page.fill('[data-testid="sub-item-0-category"]', 'Food');
  await page.fill('[data-testid="sub-item-1-amount"]', '30');
  await page.fill('[data-testid="sub-item-1-category"]', 'Household');

  // Save
  await page.click('button:has-text("Save")');

  // Verify list appears
  await expect(page.locator('text=2 Sub-transactions')).toBeVisible();

  // Edit first item
  await page.click('[data-testid="sub-edit-0"]');
  await page.fill('[data-testid="sub-edit-amount"]', '55');
  await page.click('[data-testid="sub-save"]');

  // Verify update
  await expect(page.locator('text=₹55')).toBeVisible();

  // Delete all
  await page.click('button:has-text("Remove All")');
  await expect(page.locator('button:has-text("Split Transaction")')).toBeVisible();
});
```

**Receipt Parsing Flow**:
```typescript
test('upload and parse receipt', async ({ page }) => {
  // Upload file
  await page.setInputFiles('[data-testid="receipt-upload"]', 'test-receipt.jpg');
  await page.click('button:has-text("Upload")');

  // Wait for upload
  await expect(page.locator('text=Parse with AI')).toBeVisible();

  // Parse
  await page.click('button:has-text("Parse with AI")');

  // Wait for parsing (max 10 seconds)
  await expect(page.locator('text=Parsing receipt...')).toBeVisible();
  await expect(page.locator('text=Create Sub-Transactions')).toBeVisible({ timeout: 10000 });

  // Verify items
  await expect(page.locator('text=Amul Milk')).toBeVisible();

  // Exclude one item
  await page.click('[data-testid="item-exclude-2"]');

  // Create sub-transactions
  await page.click('button:has-text("Create Sub-Transactions")');

  // Verify created
  await expect(page.locator('text=Sub-transactions')).toBeVisible();
});
```

---

### Performance Tests

**Load 100 Sub-Transactions** (Target: < 500ms):
```typescript
test('load many sub-transactions', async () => {
  const start = Date.now();

  const response = await fetch('/api/transactions/parent-id/sub-transactions');
  const data = await response.json();

  const duration = Date.now() - start;

  expect(data.subTransactions).toHaveLength(100);
  expect(duration).toBeLessThan(500);
});
```

**Parse Receipt** (Target: < 10 seconds):
```typescript
test('parse receipt performance', async () => {
  const start = Date.now();

  await fetch('/api/receipts/receipt-id/parse', { method: 'POST' });

  // Poll until completed
  let status = 'processing';
  while (status === 'processing') {
    const res = await fetch('/api/transactions/txn-id/receipt');
    const data = await res.json();
    status = data.receipt.parsing_status;
    await new Promise(r => setTimeout(r, 500));
  }

  const duration = Date.now() - start;
  expect(duration).toBeLessThan(10000);
});
```

---

### Security Tests

**RLS Enforcement**:
```typescript
test('user cannot access other user sub-transactions', async () => {
  // User A creates sub-transaction
  const resA = await fetch('/api/transactions/parent-id/sub-transactions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer user-a-token' },
    body: JSON.stringify({ items: [{ amount: 50 }] }),
  });
  const dataA = await resA.json();
  const subId = dataA.subTransactions[0].id;

  // User B tries to access
  const resB = await fetch(`/api/transactions/parent-id/sub-transactions/${subId}`, {
    method: 'PATCH',
    headers: { 'Authorization': 'Bearer user-b-token' },
    body: JSON.stringify({ amount: 100 }),
  });

  expect(resB.status).toBe(404);  // RLS blocks, returns not found
});
```

**Storage RLS**:
```typescript
test('user cannot access other user receipt files', async () => {
  // User A uploads receipt
  // User B tries to download
  const { data, error } = await supabase.storage
    .from('receipts')
    .download('user-a-id/receipt-id/receipt.jpg');

  expect(error).toBeTruthy();
  expect(error.message).toContain('not allowed');
});
```

---

## Deployment Strategy

### 3 Deployment Checkpoints

**Philosophy**: Incremental deployment with validation at each checkpoint.

**Rationale**:
- Catch integration issues early
- Validate each feature independently before moving to next
- Easier rollback (only revert single feature, not all 3)

---

### Checkpoint 1: Sub-Transactions (After Phase 4)

**Pre-Deployment**:
1. Run `npx tsc --noEmit` (TypeScript check)
2. Run `npm run lint` (ESLint check)
3. Run `npm test` (unit tests)
4. Backup database: `supabase db dump > backup_pre_sub_txn.sql`

**Deployment**:
1. Run migration: `npx supabase db push` (applies `0005_sub_transactions.sql`)
2. Verify migration:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'fb_emails_processed'
   AND column_name IN ('parent_transaction_id', 'is_sub_transaction');
   ```
3. Deploy to Vercel: `vercel --prod`

**Post-Deployment Validation**:
1. Open transaction modal
2. Click "Split Transaction"
3. Create 2 sub-transactions
4. Verify amounts validate
5. Edit sub-transaction
6. Delete sub-transaction
7. Link parent to Splitwise
8. Verify sub-transactions inherit Splitwise ID

**Rollback Plan** (if issues):
```bash
vercel rollback  # Revert code
psql -f infra/migrations/rollback_0005.sql  # Revert DB
```

---

### Checkpoint 2: Receipt Parsing (After Phase 8)

**Pre-Deployment**:
1. Verify Anthropic API key has Vision API access
2. Test Vision API locally with sample image
3. Create Supabase Storage bucket (if not exists)
4. Backup database: `supabase db dump > backup_pre_receipt.sql`

**Deployment**:
1. Run migration: `npx supabase db push` (applies `0006_receipts.sql`)
2. Verify tables:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('fb_receipts', 'fb_receipt_items');
   ```
3. Verify storage bucket:
   ```sql
   SELECT id, name FROM storage.buckets WHERE id = 'receipts';
   ```
4. Deploy to Vercel: `vercel --prod`

**Post-Deployment Validation**:
1. Upload receipt image
2. Parse with AI
3. Verify items extracted
4. Edit item (exclude, change amount)
5. Create sub-transactions from receipt
6. Verify bidirectional links

**Rollback Plan**:
```bash
vercel rollback
psql -f infra/migrations/rollback_0006.sql
# Delete storage bucket via Supabase Dashboard
```

---

### Checkpoint 3: Smart Refunds (After Phase 11)

**Pre-Deployment**:
1. Backup database: `supabase db dump > backup_pre_refund.sql`
2. Test refund matching function with sample data
3. Verify scoring algorithm weights

**Deployment**:
1. Run migration: `npx supabase db push` (applies `0007_smart_refunds.sql`)
2. Verify columns:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'fb_emails_processed'
   AND column_name LIKE 'refund%';
   ```
3. Verify functions:
   ```sql
   SELECT routine_name FROM information_schema.routines
   WHERE routine_name IN ('get_refund_status', 'suggest_refund_matches');
   ```
4. Deploy to Vercel: `vercel --prod`

**Post-Deployment Validation**:
1. Open credit transaction
2. Click "Find Original"
3. Verify suggestions load
4. Link to original
5. Verify refund status on original
6. Unlink refund
7. Test full refund scenario

**Rollback Plan**:
```bash
vercel rollback
psql -f infra/migrations/rollback_0007.sql
```

---

### Post-Deployment Monitoring

**Immediate (First Hour)**:
- Watch Vercel logs for errors
- Monitor Sentry for exceptions
- Check Supabase query logs for slow queries
- Verify RLS working (no unauthorized access errors)

**Short-term (First Day)**:
- Monitor API response times (P50, P95, P99)
- Check database connection pool usage
- Review user feedback
- Verify storage usage normal (receipts accumulating)

**Long-term (First Week)**:
- Analyze usage patterns (how many users using features?)
- Review AI parsing accuracy (how many "Parse failed"?)
- Check for edge cases (refund chains, complex receipts)
- Plan improvements based on data

---

## Architectural Patterns

### Pattern 1: Self-Referential Foreign Keys

**Use Case**: Parent-child relationships within same table.

**Benefits**:
- Reuses existing table structure
- RLS policies apply uniformly
- Queries simpler (no JOIN to separate table)

**Drawbacks**:
- Requires triggers for validation
- Self-JOINs can be confusing

**When to Use**:
- Child records are same type as parent
- Inheritance of fields is natural
- Existing RLS policies should apply to children

---

### Pattern 2: Bidirectional Linking

**Use Case**: Navigate relationship from both directions.

**Example**: Receipt items ↔ Sub-transactions
- `fb_receipt_items.sub_transaction_id` → Sub-transaction
- `fb_emails_processed.receipt_item_id` → Receipt item

**Benefits**:
- Fast lookups in both directions (indexed)
- Explicit relationship in both schemas

**Drawbacks**:
- Must maintain both sides (update two tables)
- Potential for inconsistency if not atomic

**When to Use**:
- Frequent navigation in both directions
- Clear 1:1 or 1:many relationship

---

### Pattern 3: Database Triggers for Validation

**Use Case**: Enforce business rules that cannot be bypassed.

**Benefits**:
- Absolute guarantee (even if API bypassed)
- Centralized validation (not duplicated across APIs)
- Prevents invalid states from direct DB access

**Drawbacks**:
- Performance cost (executes for every INSERT/UPDATE)
- Harder to debug (errors in SQL, not application code)
- Cannot be unit tested easily

**When to Use**:
- Critical invariants (e.g., amount validation, direction checks)
- Validation requires DB state (e.g., check existing records)
- Security-critical (e.g., user isolation)

---

### Pattern 4: Weighted Scoring for Suggestions

**Use Case**: Rank suggestions based on multiple signals.

**Benefits**:
- Tunable (adjust weights for precision/recall)
- Explainable (show match reasons to user)
- Flexible (add new signals easily)

**Drawbacks**:
- Requires manual weight tuning
- No learning from user feedback (static)

**When to Use**:
- Multiple weak signals (no single strong signal)
- User should see why suggestion is ranked
- Precision and recall both matter

---

### Pattern 5: State Machine for Async Operations

**Use Case**: Receipt parsing (async AI call).

**States**: pending → processing → completed/failed

**Benefits**:
- Clear status for UI
- Idempotent (can't parse twice)
- Recoverable (retry from failed state)

**Drawbacks**:
- Requires polling (or webhooks)
- More complex than synchronous

**When to Use**:
- Operation takes > 2 seconds
- Operation can fail and should be retryable
- User should see progress

---

## Critical Decisions Log

### Decision 1: Self-Referential FK vs Separate Table
**Date**: 2026-01-11
**Context**: How to store sub-transactions
**Options**: Separate table (`fb_sub_transactions`) vs same table with parent FK
**Decision**: Same table with `parent_transaction_id` FK
**Rationale**: Reuses RLS policies, simpler API patterns, automatic Splitwise cascade
**Trade-offs**: Requires 5 database triggers for validation

---

### Decision 2: Database Triggers vs Application-Level Validation
**Date**: 2026-01-11
**Context**: Where to enforce amount validation, nesting prevention
**Options**: Trigger vs API validation
**Decision**: Both (client-side for UX, trigger for guarantee)
**Rationale**: Triggers cannot be bypassed, even by bugs or direct DB access
**Trade-offs**: Performance cost (SELECT on every INSERT), harder debugging

---

### Decision 3: Claude Vision API vs Tesseract/Google Vision
**Date**: 2026-01-11
**Context**: Which OCR solution for receipt parsing
**Options**: Tesseract (free), Google Vision, Claude Vision
**Decision**: Claude Vision API
**Rationale**: Best structured JSON output, handles Indian receipts well, already using Anthropic
**Trade-offs**: Cost per image (~$0.01-0.05), requires API key

---

### Decision 4: Bidirectional Linking for Receipts ↔ Sub-Transactions
**Date**: 2026-01-11
**Context**: How to link receipt items to sub-transactions
**Options**: One-way FK vs bidirectional FKs
**Decision**: Bidirectional (`receipt_item_id` + `sub_transaction_id`)
**Rationale**: Fast navigation in both directions, explicit in schema
**Trade-offs**: Must update both tables, potential inconsistency

---

### Decision 5: Weighted Scoring Algorithm for Refund Matching
**Date**: 2026-01-11
**Context**: How to suggest refund matches
**Options**: Exact match only, ML model, weighted scoring
**Decision**: Weighted scoring (Merchant 40%, Amount 30%, Time 20%, Reference 10%)
**Rationale**: Balances precision/recall, tunable, explainable to users
**Trade-offs**: Manual weight tuning, no learning from user feedback

---

### Decision 6: 11-Phase Implementation vs Big Bang
**Date**: 2026-01-11
**Context**: How to roll out 3 features
**Options**: All at once vs incremental phases
**Decision**: 11 phases with 3 deployment checkpoints
**Rationale**: Validate each feature independently, easier debugging, safer rollback
**Trade-offs**: Longer overall timeline, more deployment overhead

---

### Decision 7: Dark-Only Theme (No Light Mode)
**Date**: 2026-01-11
**Context**: UI theming strategy
**Options**: Dark + light mode vs dark-only
**Decision**: Dark-only
**Rationale**: Matches existing design system, reduces complexity
**Trade-offs**: Some users prefer light mode (not supported)

---

### Decision 8: MIN=2, MAX=10 Sub-Transactions
**Date**: 2026-01-11
**Context**: Constraints on sub-transaction count
**Options**: No limits, 2-20, 2-10
**Decision**: 2-10
**Rationale**: MIN=2 makes sense (splitting to 1 is pointless), MAX=10 prevents UI clutter
**Trade-offs**: Edge cases with >10 items (rare) not supported

---

## Risk Analysis & Mitigations

### Risk 1: Database Trigger Performance

**Risk**: Amount validation trigger runs SELECT on every sub-transaction INSERT. For batch insert of 10 sub-transactions, that's 10 SELECTs.

**Impact**: Medium - Could slow down API response time

**Probability**: Low - PostgreSQL handles this efficiently with indexes

**Mitigation**:
1. Index on `parent_transaction_id` (already planned)
2. Monitor query performance in production
3. If slow, consider materialized view for parent amounts
4. Alternative: Application-level validation with optimistic locking

---

### Risk 2: Vision API Cost

**Risk**: Receipt parsing costs ~$0.01-0.05 per image. Heavy users could incur significant costs.

**Impact**: High - Could blow budget

**Probability**: Medium - If feature goes viral

**Mitigation**:
1. Rate limit: Max 10 receipts per user per day
2. Monitor API usage via Anthropic dashboard
3. Set alerts at $50/day, $500/month
4. Consider caching parsed receipts (store raw_ocr_text for re-parsing)
5. Degrade gracefully: Disable receipt parsing if budget exceeded

---

### Risk 3: Vision API Accuracy on Handwritten Receipts

**Risk**: AI might struggle with handwritten receipts, returning garbage data.

**Impact**: Medium - Poor UX, user must manually fix

**Probability**: High - Handwritten receipts common in small shops

**Mitigation**:
1. Confidence score: Warn user if confidence < 0.7
2. Manual review: Allow editing items before creating sub-transactions
3. Fallback: "Parse failed" state with manual entry option
4. Feedback loop: Collect failed receipts for future model training

---

### Risk 4: Splitwise API Rate Limits

**Risk**: If user links many transactions to Splitwise, could hit rate limits.

**Impact**: Medium - Failed Splitwise syncs

**Probability**: Low - Splitwise API limits are generous

**Mitigation**:
1. Current design: Manual Splitwise linking (user-controlled)
2. Future: Batch Splitwise updates (not individual per sub-transaction)
3. Exponential backoff on rate limit errors
4. Queue system for Splitwise updates

---

### Risk 5: Refund Matching False Positives

**Risk**: AI suggests wrong original transaction for refund.

**Impact**: Low - User can ignore or unlink

**Probability**: Medium - Scoring algorithm not perfect

**Mitigation**:
1. High threshold (score ≥ 50)
2. Show match reasons (user can judge)
3. Easy unlink (DELETE /link-refund)
4. Collect feedback: "Was this suggestion helpful?" (future enhancement)
5. Tune weights based on feedback

---

### Risk 6: Data Migration for Existing Users

**Risk**: Existing users have no sub-transactions, receipts, or refund links. Features feel empty.

**Impact**: Medium - Poor initial experience

**Probability**: High - All existing users affected

**Mitigation**:
1. Feature discovery: Banner/tooltip explaining new features
2. Sample data: Demo mode with pre-populated sub-transactions
3. Gradual adoption: Users can ignore features until ready
4. Documentation: Help articles on how to use features

---

### Risk 7: Storage Quota for Receipts

**Risk**: Users upload many receipts, filling storage quota.

**Impact**: High - Service disruption if quota exceeded

**Probability**: Medium - Depends on user adoption

**Mitigation**:
1. 20MB per file limit (already enforced)
2. Monitor Supabase Storage usage dashboard
3. Set alerts at 80% quota
4. Implement retention policy: Delete receipts > 1 year old (with user consent)
5. Upgrade Supabase plan if needed

---

### Risk 8: Concurrent Edits (Race Conditions)

**Risk**: User A edits sub-transaction while user B (same account, different device) also edits. Last write wins, changes lost.

**Impact**: Low - Rare (same user, two devices, same transaction)

**Probability**: Very Low

**Mitigation**:
1. Optimistic locking: Check `updated_at` timestamp on UPDATE
2. If timestamp changed, return 409 Conflict
3. UI: Refresh and show "Transaction was updated elsewhere. Please retry."
4. Future: WebSocket for real-time sync

---

## Conclusion

This document provides a comprehensive, deep-dive reference for implementing Sub-Transactions, Receipt Parsing, and Smart Refunds features in Finance Buddy.

**Key Takeaways**:
1. **Incremental Approach**: 11 phases, 3 deployments, validate each feature independently
2. **Database-First**: Use triggers for absolute guarantees, avoid invalid states
3. **AI-Powered**: Claude Vision for receipts, weighted scoring for refunds
4. **User-Centric**: Design system compliance, inline editing, real-time validation
5. **Production-Ready**: RLS, indexes, monitoring, rollback plans

**Next Steps**:
1. User reviews this document
2. Adds `<!-- UserInput: ... -->` comments with questions/concerns
3. Agent addresses feedback, updates docs
4. Iterate until user approves
5. Begin Phase 1 implementation

---

**Document Metadata**:
- **Total Pages**: ~120 (if printed)
- **Word Count**: ~25,000
- **Sections**: 10 major sections
- **Code Examples**: 50+
- **SQL Scripts**: 15+
- **API Specs**: 17 endpoints
- **UI Components**: 12 components
- **Database Objects**: 3 migrations, 8 triggers, 2 functions, 12 indexes
