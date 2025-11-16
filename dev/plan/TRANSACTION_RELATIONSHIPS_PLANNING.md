# Transaction Relationships Feature - Complete Planning Document

**Version:** 1.0
**Date:** 2025-11-16
**Status:** Planning
**Feature:** Link related transactions (refunds, transfers, reimbursements, chargebacks)

---

## Table of Contents
1. [Overview](#1-overview)
2. [Use Cases](#2-use-cases)
3. [Data Model](#3-data-model)
4. [API Design](#4-api-design)
5. [UI/UX Workflows](#5-uiux-workflows)
6. [Business Logic](#6-business-logic)
7. [Implementation Plan](#7-implementation-plan)
8. [Edge Cases](#8-edge-cases)
9. [Testing Strategy](#9-testing-strategy)
10. [Migration Strategy](#10-migration-strategy)

---

## 1. Overview

### 1.1 Purpose
Allow users to create relationships between two existing transactions to track business logic connections like refunds, transfers, reimbursements, and chargebacks.

### 1.2 Key Characteristics
- Both transactions exist independently
- Relationship is metadata/annotation (doesn't affect amounts)
- Transactions maintain their own amounts, dates, merchants
- Relationship types are flexible and extensible
- Can be one-to-one or one-to-many (e.g., one purchase → multiple partial refunds)
- Bidirectional relationships supported

### 1.3 Examples
```
Purchase: -$100 (Amazon) → Refund: +$100 (Amazon)
Debit: -$500 (Bank A) → Credit: +$500 (Bank B)
Expense: -$200 (Restaurant) → Reimbursement: +$200 (Employer)
Charge: -$50 (Merchant) → Chargeback: +$50 (Bank)
```

### 1.4 Goals
- ✅ Improve transaction tracking and organization
- ✅ Reduce confusion about refunds and transfers
- ✅ Enable better financial reporting (exclude refunded items, transfers)
- ✅ Provide audit trail for reimbursements and chargebacks
- ✅ Support AI-powered relationship detection

### 1.5 Non-Goals
- ❌ Transaction splitting (decomposing one transaction into multiple)
- ❌ Modifying transaction amounts based on relationships
- ❌ Automatic reconciliation or settlement
- ❌ Multi-currency relationship handling (future enhancement)

---

## 2. Use Cases

### 2.1 Use Case: Refund Tracking
**Scenario:** User purchases item for $100, later receives full refund of $100.

**User Story:**
> As a user, I want to link my refund transaction to the original purchase so I can see they are related and understand my net spending.

**Workflow:**
1. User views purchase transaction (-$100 Amazon)
2. Clicks "Link Transaction" button
3. Searches for refund transaction (+$100 Amazon)
4. Selects "Refund" relationship type
5. System creates bidirectional link
6. Both transactions show relationship indicator

**Expected Outcome:**
- Purchase shows "Refunded" badge with link to refund
- Refund shows "Refund for" link to original purchase
- Net spending calculation can optionally exclude refunded purchases
- Reports can filter "Show only non-refunded transactions"

**Acceptance Criteria:**
- ✅ User can link two transactions
- ✅ Relationship type is "Refund"
- ✅ Both transactions show visual indicator
- ✅ User can navigate between linked transactions
- ✅ User can add optional notes to relationship
- ✅ User can delete relationship

### 2.2 Use Case: Account Transfer
**Scenario:** User transfers $500 from checking to savings.

**User Story:**
> As a user, I want to link my debit and credit transactions for the same transfer so they don't appear as separate income/expense.

**Workflow:**
1. User views debit transaction (-$500 Checking)
2. Clicks "Link Transaction"
3. Finds credit transaction (+$500 Savings)
4. Selects "Transfer" relationship type
5. System creates link

**Expected Outcome:**
- Both transactions marked as "Transfer"
- Reports can filter out transfers to show true income/expense
- Transfer pairs are visually grouped in transaction list
- Net effect on total balance is zero

**Acceptance Criteria:**
- ✅ Transfer relationships exclude from income/expense calculations
- ✅ Visual grouping in transaction list
- ✅ Filter option: "Hide transfers"
- ✅ Both transactions show transfer badge

### 2.3 Use Case: Reimbursement
**Scenario:** User pays $200 for business dinner, later reimbursed by employer.

**User Story:**
> As a user, I want to link my expense to the reimbursement so I know which expenses have been reimbursed.

**Workflow:**
1. User views expense (-$200 Restaurant)
2. Clicks "Link Transaction"
3. Finds reimbursement (+$200 Employer)
4. Selects "Reimbursement" relationship type
5. Adds note: "Q4 business dinner"

**Expected Outcome:**
- Expense shows "Reimbursed" status
- Reimbursement links back to original expense
- Can filter for "unreimbursed expenses"
- Notes provide context for reimbursement

**Acceptance Criteria:**
- ✅ Reimbursement status visible on expense
- ✅ Filter: "Show unreimbursed expenses only"
- ✅ Notes field supports rich text
- ✅ Can track partial reimbursements (multiple links)

### 2.4 Use Case: Chargeback
**Scenario:** User disputes fraudulent charge, receives chargeback.

**User Story:**
> As a user, I want to link disputed charges to their chargebacks for tracking.

**Workflow:**
1. User views fraudulent charge (-$50)
2. Clicks "Link Transaction"
3. Finds chargeback (+$50)
4. Selects "Chargeback" relationship type


### 3.1 Database Schema

```sql
-- New table for transaction relationships
CREATE TABLE fb_transaction_relationships (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User ownership (for RLS)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Relationship participants
  transaction_a_id UUID NOT NULL REFERENCES fb_emails_processed(id) ON DELETE CASCADE,
  transaction_b_id UUID NOT NULL REFERENCES fb_emails_processed(id) ON DELETE CASCADE,

  -- Relationship metadata
  relationship_type VARCHAR(50) NOT NULL,
    -- Values: 'refund', 'transfer', 'reimbursement', 'chargeback', 'custom'
  direction VARCHAR(20) DEFAULT 'bidirectional',
    -- Values: 'bidirectional', 'a_to_b', 'b_to_a'

  -- Optional metadata
  notes TEXT,
  confidence DECIMAL(3,2), -- AI confidence if auto-detected (0.00 to 1.00)

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(50) DEFAULT 'user', -- 'user', 'ai', 'system'

  -- Constraints
  CONSTRAINT different_transactions CHECK (transaction_a_id != transaction_b_id),
  CONSTRAINT unique_relationship UNIQUE (transaction_a_id, transaction_b_id, relationship_type),
  CONSTRAINT valid_direction CHECK (direction IN ('bidirectional', 'a_to_b', 'b_to_a')),
  CONSTRAINT valid_type CHECK (relationship_type IN ('refund', 'transfer', 'reimbursement', 'chargeback', 'custom')),
  CONSTRAINT valid_confidence CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

-- Indexes for performance
CREATE INDEX idx_relationships_transaction_a ON fb_transaction_relationships(transaction_a_id);
CREATE INDEX idx_relationships_transaction_b ON fb_transaction_relationships(transaction_b_id);
CREATE INDEX idx_relationships_user ON fb_transaction_relationships(user_id);
CREATE INDEX idx_relationships_type ON fb_transaction_relationships(relationship_type);
CREATE INDEX idx_relationships_created_at ON fb_transaction_relationships(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_relationships_user_type ON fb_transaction_relationships(user_id, relationship_type);
CREATE INDEX idx_relationships_user_created ON fb_transaction_relationships(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE fb_transaction_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own relationships"
  ON fb_transaction_relationships FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own relationships"
  ON fb_transaction_relationships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own relationships"
  ON fb_transaction_relationships FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own relationships"
  ON fb_transaction_relationships FOR DELETE
  USING (auth.uid() = user_id);
```

### 3.2 TypeScript Types

```typescript
// src/types/relationships.ts

export type RelationshipType =
  | 'refund'
  | 'transfer'
  | 'reimbursement'
  | 'chargeback'
  | 'custom';

export type RelationshipDirection =
  | 'bidirectional'
  | 'a_to_b'
  | 'b_to_a';

export type RelationshipCreatedBy =
  | 'user'
  | 'ai'
  | 'system';

export interface TransactionRelationship {
  id: string;
  user_id: string;
  transaction_a_id: string;
  transaction_b_id: string;
  relationship_type: RelationshipType;
  direction: RelationshipDirection;
  notes?: string;
  confidence?: number;
  created_at: string;
  updated_at: string;
  created_by: RelationshipCreatedBy;
}

export interface RelatedTransaction {
  relationship_id: string;
  relationship_type: RelationshipType;
  direction: 'outgoing' | 'incoming';
  related_transaction: EmailProcessed;
  notes?: string;
  confidence?: number;
  created_at: string;
}

export interface TransactionWithRelationships extends EmailProcessed {
  outgoing_relationships?: RelatedTransaction[];
  incoming_relationships?: RelatedTransaction[];
  relationship_count?: number;
}

export interface CreateRelationshipRequest {
  transaction_a_id: string;
  transaction_b_id: string;
  relationship_type: RelationshipType;
  direction?: RelationshipDirection;
  notes?: string;
}

export interface UpdateRelationshipRequest {
  relationship_type?: RelationshipType;
  direction?: RelationshipDirection;
  notes?: string;
}

export interface SuggestedRelationship {
  transaction_id: string;
  transaction: EmailProcessed;
  relationship_type: RelationshipType;
  confidence: number;
  reason: string;
}
```

### 3.3 Database Queries

**Get transaction with all relationships:**
```sql
SELECT
  t.*,
  -- Outgoing relationships (this transaction → others)
  COALESCE(
    json_agg(DISTINCT jsonb_build_object(
      'relationship_id', r1.id,
      'relationship_type', r1.relationship_type,
      'direction', 'outgoing',
      'notes', r1.notes,
      'confidence', r1.confidence,
      'created_at', r1.created_at,
      'related_transaction', row_to_json(t2.*)
    )) FILTER (WHERE r1.id IS NOT NULL),
    '[]'
  ) as outgoing_relationships,

  -- Incoming relationships (others → this transaction)
  COALESCE(
    json_agg(DISTINCT jsonb_build_object(
      'relationship_id', r2.id,
      'relationship_type', r2.relationship_type,
      'direction', 'incoming',
      'notes', r2.notes,
      'confidence', r2.confidence,
      'created_at', r2.created_at,
      'related_transaction', row_to_json(t3.*)
    )) FILTER (WHERE r2.id IS NOT NULL),
    '[]'
  ) as incoming_relationships,

  -- Total relationship count
  (
    SELECT COUNT(*)
    FROM fb_transaction_relationships
    WHERE (transaction_a_id = t.id OR transaction_b_id = t.id)
      AND user_id = t.user_id
  ) as relationship_count

FROM fb_emails_processed t
LEFT JOIN fb_transaction_relationships r1
  ON t.id = r1.transaction_a_id AND t.user_id = r1.user_id
LEFT JOIN fb_emails_processed t2
  ON r1.transaction_b_id = t2.id
LEFT JOIN fb_transaction_relationships r2
  ON t.id = r2.transaction_b_id AND t.user_id = r2.user_id
LEFT JOIN fb_emails_processed t3
  ON r2.transaction_a_id = t3.id
WHERE t.id = $1 AND t.user_id = $2
GROUP BY t.id;
```

---

## 4. API Design

### 4.1 API Endpoints

```typescript
// Create a relationship between two transactions
POST /api/transactions/relationships
Body: CreateRelationshipRequest
Response: TransactionRelationship

// Get all relationships for a specific transaction
GET /api/transactions/:id/relationships
Response: RelatedTransaction[]

// Get a specific relationship by ID
GET /api/transactions/relationships/:id
Response: TransactionRelationship

// Update a relationship (notes, type, direction)
PUT /api/transactions/relationships/:id
Body: UpdateRelationshipRequest
Response: TransactionRelationship

// Delete a relationship
DELETE /api/transactions/relationships/:id
Response: { success: boolean }

// Get AI-suggested relationships for a transaction
GET /api/transactions/:id/suggested-relationships
Response: SuggestedRelationship[]

// Bulk create relationships
POST /api/transactions/relationships/bulk
Body: CreateRelationshipRequest[]
Response: TransactionRelationship[]
```

### 4.2 Request/Response Examples

**Create Relationship:**
```json
// POST /api/transactions/relationships
{
  "transaction_a_id": "123e4567-e89b-12d3-a456-426614174000",
  "transaction_b_id": "987fcdeb-51a2-43f7-9876-543210fedcba",
  "relationship_type": "refund",
  "direction": "bidirectional",
  "notes": "Full refund for defective product"
}

// Response 201
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user123",
  "transaction_a_id": "123e4567-e89b-12d3-a456-426614174000",
  "transaction_b_id": "987fcdeb-51a2-43f7-9876-543210fedcba",
  "relationship_type": "refund",
  "direction": "bidirectional",
  "notes": "Full refund for defective product",
  "confidence": null,
  "created_at": "2025-11-16T10:30:00Z",
  "updated_at": "2025-11-16T10:30:00Z",
  "created_by": "user"
}
```

**Get Transaction Relationships:**
```json
// GET /api/transactions/123e4567-e89b-12d3-a456-426614174000/relationships

// Response 200
[
  {
    "relationship_id": "550e8400-e29b-41d4-a716-446655440000",
    "relationship_type": "refund",
    "direction": "outgoing",
    "notes": "Full refund for defective product",
    "confidence": null,
    "created_at": "2025-11-16T10:30:00Z",
    "related_transaction": {
      "id": "987fcdeb-51a2-43f7-9876-543210fedcba",
      "amount": 100.00,
      "merchant_name": "Amazon",
      "txn_time": "2025-11-15T14:20:00Z",
      "category": "Shopping",
      "direction": "credit"
    }
  }
]
```

---

## 5. UI/UX Workflows

### 5.1 Link Transaction Workflow

**Entry Point 1: Transaction Detail Page**
```
┌─────────────────────────────────────────────────┐
│ Transaction Details                             │
│                                                 │
│ Amazon                          -$100.00        │
│ Nov 15, 2025 • Shopping • Account 7712         │
│                                                 │
│ [Edit] [Link Transaction] [Delete]             │
└─────────────────────────────────────────────────┘
```

**Step 1: Click "Link Transaction"**
```
┌─────────────────────────────────────────────────┐
│ Link Transaction                          [X]   │
├─────────────────────────────────────────────────┤
│                                                 │
│ Search for related transaction:                │
│ ┌─────────────────────────────────────┐ 🔍     │
│ │ Search by merchant, amount, date... │        │
│ └─────────────────────────────────────┘        │
│                                                 │
│ Recent Transactions:                            │
│ ┌─────────────────────────────────────────────┐│
│ │ ○ +$100.00 Amazon (Nov 20) - Refund       ││
│ │   Suggested: Refund 🤖 95% confidence      ││
│ ├─────────────────────────────────────────────┤│
│ │ ○ -$50.00 Walmart (Nov 14)                ││
│ ├─────────────────────────────────────────────┤│
│ │ ○ +$200.00 Employer (Nov 13)              ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ [Cancel] [Next]                                 │
└─────────────────────────────────────────────────┘
```

**Step 2: Select Relationship Type**
```
┌─────────────────────────────────────────────────┐
│ Link Transaction                          [X]   │
├─────────────────────────────────────────────────┤
│                                                 │
│ Selected: +$100.00 Amazon (Nov 20)             │
│                                                 │
│ What type of relationship?                      │
│                                                 │
│ ● Refund (recommended) 🤖                       │
│   This appears to be a refund                   │
│                                                 │
│ ○ Transfer                                      │
│   Money moved between accounts                  │
│                                                 │
│ ○ Reimbursement                                 │
│   Expense reimbursed by someone                 │
│                                                 │
│ ○ Chargeback                                    │
│   Disputed transaction reversed                 │
│                                                 │
│ ○ Custom                                        │
│   Other relationship type                       │
│                                                 │
│ Notes (optional):                               │
│ ┌─────────────────────────────────────────────┐│
│ │ Defective product returned                  ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ [Back] [Link Transactions]                      │
└─────────────────────────────────────────────────┘
```

**Step 3: Success Confirmation**
```
┌─────────────────────────────────────────────────┐
│ ✅ Transactions Linked!                         │
├─────────────────────────────────────────────────┤
│                                                 │
│ -$100.00 Amazon ↔️ +$100.00 Amazon             │
│ Relationship: Refund                            │
│ Note: Defective product returned                │
│                                                 │
│ [View Linked Transaction] [Done]                │
└─────────────────────────────────────────────────┘
```

### 5.2 Visual Indicators in Transaction List

```
┌─────────────────────────────────────────────────────────┐
│ Transactions                                            │
├─────────────────────────────────────────────────────────┤
│ Nov 20  Amazon          +$100  🔗 Refund               │
│         ↳ Refund for: -$100 Amazon (Nov 15)            │
├─────────────────────────────────────────────────────────┤
│ Nov 17  Swiggy          -$184  🔗 Refunded             │
│         ↳ Refund: +$184 Swiggy (Nov 18)                │
├─────────────────────────────────────────────────────────┤
│ Nov 16  Bank Transfer   -$500  🔗 Transfer             │
│         ↳ To: +$500 Savings Account                    │
├─────────────────────────────────────────────────────────┤
│ Nov 15  Restaurant      -$200  🔗 Reimbursed           │
│         ↳ Reimbursement: +$200 Employer (Nov 20)       │
└─────────────────────────────────────────────────────────┘
```

### 5.3 Transaction Detail Page with Relationships

```
┌─────────────────────────────────────────────────────────┐
│ Transaction Details                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Amazon                                    -$100.00      │
│ Nov 15, 2025 • Shopping • Account 7712                 │
│                                                         │
│ Status: Refunded 🔗                                     │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ Related Transactions (1)                            ││
│ ├─────────────────────────────────────────────────────┤│
│ │ 🔗 Refund                                           ││
│ │ +$100.00 Amazon (Nov 20, 2025)                      ││
│ │ Note: Defective product returned                    ││
│ │ [View Transaction] [Remove Link]                    ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ [Edit] [Link Another Transaction] [Delete]             │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Business Logic


### 6.1 Relationship Rules

**Amount Validation:**
- ✅ No strict amount constraints (relationships are annotations)
- ⚠️ Warning if refund amount > original purchase (but allow)
- ⚠️ Warning if transfer amounts don't match exactly (but allow)
- ℹ️ Show net amount when multiple refunds exist

**Relationship Integrity:**
- ✅ Allow multiple relationships per transaction
- ✅ Allow same relationship type multiple times (e.g., 3 partial refunds)
- ✅ Allow circular relationships (A→B, B→A with different types)
- ✅ Soft delete: Mark as deleted, preserve audit trail
- ✅ Cascade delete: When transaction deleted, delete all its relationships
- ❌ Cannot link transaction to itself

**Direction Rules:**
- `bidirectional`: Both transactions show the relationship equally
- `a_to_b`: Transaction A is the source, B is the target (e.g., purchase → refund)
- `b_to_a`: Transaction B is the source, A is the target

**Relationship Types:**
- `refund`: Original purchase linked to refund
- `transfer`: Money moved between accounts
- `reimbursement`: Expense linked to reimbursement payment
- `chargeback`: Disputed charge linked to chargeback
- `custom`: User-defined relationship type

### 6.2 Statistics Impact

**Default Behavior:**
- ✅ All transactions counted in totals (relationships don't affect amounts)
- ✅ Both linked transactions appear in transaction list
- ✅ Relationship is metadata only

**Optional Filters:**
- "Hide refunded transactions" - Exclude transactions with outgoing refund relationships
- "Hide transfers" - Exclude transactions with transfer relationships
- "Show unreimbursed expenses only" - Show expenses without reimbursement relationships
- "Show disputed transactions" - Show transactions with chargeback relationships

**Reports:**
- Can group related transactions together
- Can show net amounts (original - refunds)
- Can exclude transfers from income/expense calculations
- Can track reimbursement status

### 6.3 AI Suggestions

**Refund Detection:**
```typescript
// Suggest refund relationship if:
- Same merchant name (exact or fuzzy match)
- Opposite direction (debit → credit or credit → debit)
- Similar amount (within 5% tolerance)
- Within 90 days of each other
- Confidence: 0.85-0.95
```

**Transfer Detection:**
```typescript
// Suggest transfer relationship if:
- Same amount (exact match)
- Opposite direction
- Same date or within 1 day
- Different account numbers
- Confidence: 0.90-0.98
```

**Reimbursement Detection:**
```typescript
// Suggest reimbursement relationship if:
- Merchant contains "employer", "company", "reimbursement"
- Opposite direction
- Similar amount (within 10% tolerance)
- Within 60 days
- Confidence: 0.70-0.85
```

---

## 7. Implementation Plan

### 7.1 Phase 1: Foundation (Week 1-2)

**Database:**
- ✅ Create `fb_transaction_relationships` table
- ✅ Add indexes for performance
- ✅ Enable RLS policies
- ✅ Write migration script
- ✅ Test migration on staging

**API:**
- ✅ Create relationship CRUD endpoints
- ✅ Add validation logic
- ✅ Write unit tests for API
- ✅ Add error handling

**Types:**
- ✅ Define TypeScript types
- ✅ Update EmailProcessed type
- ✅ Create relationship DTOs

### 7.2 Phase 2: Core Features (Week 3-4)

**UI Components:**
- ✅ Link Transaction modal
- ✅ Relationship type selector
- ✅ Transaction search component
- ✅ Relationship badge component
- ✅ Related transactions list

**Workflows:**
- ✅ Link transaction from detail page
- ✅ View relationships on detail page
- ✅ Edit relationship notes
- ✅ Delete relationship
- ✅ Navigate between linked transactions

**Visual Indicators:**
- ✅ Relationship icons in transaction list
- ✅ Expandable related transactions
- ✅ Relationship badges (Refunded, Transfer, etc.)

### 7.3 Phase 3: AI & Suggestions (Week 5-6)

**AI Detection:**
- ✅ Refund detection algorithm
- ✅ Transfer detection algorithm
- ✅ Reimbursement detection algorithm
- ✅ Confidence scoring

**UI for Suggestions:**
- ✅ AI suggestion banner
- ✅ Quick accept/reject buttons
- ✅ Bulk accept suggestions
- ✅ Dismiss suggestions

### 7.4 Phase 4: Polish & Optimization (Week 7-8)

**Filters & Reports:**
- ✅ Add relationship filters to transaction list
- ✅ Update statistics to support filters
- ✅ Add relationship grouping in reports
- ✅ Net amount calculations

**Performance:**
- ✅ Optimize relationship queries
- ✅ Add caching for frequently accessed relationships
- ✅ Lazy load related transactions
- ✅ Pagination for large relationship lists

**Mobile:**
- ✅ Mobile-optimized link modal
- ✅ Touch-friendly relationship indicators
- ✅ Swipe actions for quick linking

---

## 8. Edge Cases

### 8.1 Circular Relationships
**Scenario:** A→B (refund), B→A (chargeback)

**Solution:**
- ✅ Allow circular relationships with different types
- ⚠️ Show warning in UI: "These transactions already have a relationship"
- ✅ Display both relationships clearly

### 8.2 Chain Relationships
**Scenario:** A→B→C→D (multiple refunds/transfers)

**Solution:**
- ✅ Allow chains up to depth 5
- ✅ Show full chain in UI
- ⚠️ Warning if chain exceeds 5 levels

### 8.3 Duplicate Relationships
**Scenario:** User tries to create same relationship twice

**Solution:**
- ❌ Block with error: "Relationship already exists"
- ✅ Unique constraint on (transaction_a_id, transaction_b_id, relationship_type)
- ℹ️ Suggest editing existing relationship instead

### 8.4 Delete Transaction with Relationships
**Scenario:** User deletes transaction that has relationships

**Solution:**
- ✅ CASCADE DELETE on foreign keys
- ⚠️ Show warning: "This transaction has 2 relationships. Deleting will remove all links."
- ✅ Confirm before deletion

### 8.5 Amount Mismatch
**Scenario:** Refund amount doesn't match original purchase

**Solution:**
- ⚠️ Show warning: "Refund amount ($80) is less than purchase ($100)"
- ✅ Allow creation (partial refund is valid)
- ℹ️ Suggest linking multiple refunds if needed

### 8.6 Concurrent Edits
**Scenario:** Two users edit same relationship simultaneously

**Solution:**
- ✅ Optimistic locking with `updated_at` field
- ❌ Block second edit with error: "Relationship was modified. Please refresh."
- ✅ Show current state and allow retry

### 8.7 AI Re-extraction on Linked Transaction
**Scenario:** User re-extracts transaction that has relationships

**Solution:**
- ✅ Preserve relationships (they're independent of transaction data)
- ℹ️ Show info: "This transaction has relationships that will be preserved"

---

## 9. Testing Strategy

### 9.1 Unit Tests

**Database Tests:**
```typescript
describe('fb_transaction_relationships', () => {
  test('should create relationship', async () => {
    const relationship = await createRelationship({
      transaction_a_id: txnA.id,
      transaction_b_id: txnB.id,
      relationship_type: 'refund',
    });
    expect(relationship.id).toBeDefined();
  });

  test('should prevent self-linking', async () => {
    await expect(
      createRelationship({
        transaction_a_id: txnA.id,
        transaction_b_id: txnA.id,
        relationship_type: 'refund',
      })
    ).rejects.toThrow('different_transactions');
  });

  test('should prevent duplicate relationships', async () => {
    await createRelationship({
      transaction_a_id: txnA.id,
      transaction_b_id: txnB.id,
      relationship_type: 'refund',
    });

    await expect(
      createRelationship({
        transaction_a_id: txnA.id,
        transaction_b_id: txnB.id,
        relationship_type: 'refund',
      })
    ).rejects.toThrow('unique_relationship');
  });

  test('should cascade delete relationships', async () => {
    const rel = await createRelationship({
      transaction_a_id: txnA.id,
      transaction_b_id: txnB.id,
      relationship_type: 'refund',
    });

    await deleteTransaction(txnA.id);

    const found = await getRelationship(rel.id);
    expect(found).toBeNull();
  });
});
```

**API Tests:**
```typescript
describe('POST /api/transactions/relationships', () => {
  test('should create relationship with valid data', async () => {
    const res = await request(app)
      .post('/api/transactions/relationships')
      .send({
        transaction_a_id: txnA.id,
        transaction_b_id: txnB.id,
        relationship_type: 'refund',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.relationship_type).toBe('refund');
  });

  test('should return 400 for missing fields', async () => {
    await request(app)
      .post('/api/transactions/relationships')
      .send({
        transaction_a_id: txnA.id,
      })
      .expect(400);
  });

  test('should return 404 for non-existent transaction', async () => {
    await request(app)
      .post('/api/transactions/relationships')
      .send({
        transaction_a_id: 'invalid-id',
        transaction_b_id: txnB.id,
        relationship_type: 'refund',
      })
      .expect(404);
  });
});
```

### 9.2 Integration Tests

**End-to-End Workflow:**
```typescript
describe('Link Transaction Workflow', () => {
  test('should link refund to purchase', async () => {
    // 1. Create purchase
    const purchase = await createTransaction({
      amount: -100,
      merchant_name: 'Amazon',
    });

    // 2. Create refund
    const refund = await createTransaction({
      amount: 100,
      merchant_name: 'Amazon',
    });

    // 3. Link them
    const relationship = await linkTransactions(
      purchase.id,
      refund.id,
      'refund'
    );

    // 4. Verify relationship exists
    const purchaseWithRels = await getTransactionWithRelationships(purchase.id);
    expect(purchaseWithRels.outgoing_relationships).toHaveLength(1);
    expect(purchaseWithRels.outgoing_relationships[0].relationship_type).toBe('refund');

    // 5. Verify bidirectional
    const refundWithRels = await getTransactionWithRelationships(refund.id);
    expect(refundWithRels.incoming_relationships).toHaveLength(1);
  });
});
```

### 9.3 UI Tests (Playwright)

```typescript
test('should link transactions via UI', async ({ page }) => {
  // Navigate to transaction detail
  await page.goto('/transactions/123');

  // Click "Link Transaction"
  await page.click('button:has-text("Link Transaction")');

  // Search for related transaction
  await page.fill('input[placeholder*="Search"]', 'Amazon');

  // Select transaction
  await page.click('text=+$100.00 Amazon');
  await page.click('button:has-text("Next")');

  // Select relationship type
  await page.click('text=Refund');

  // Add note
  await page.fill('textarea[placeholder*="Notes"]', 'Defective product');

  // Submit
  await page.click('button:has-text("Link Transactions")');

  // Verify success
  await expect(page.locator('text=Transactions Linked!')).toBeVisible();

  // Verify badge appears
  await expect(page.locator('text=Refunded')).toBeVisible();
});
```

---

## 10. Migration Strategy

### 10.1 Database Migration

```sql
-- Migration: Add transaction relationships support
-- Version: 20250116_transaction_relationships
-- Description: Create table and indexes for linking related transactions

BEGIN;

-- Step 1: Create relationships table
CREATE TABLE IF NOT EXISTS fb_transaction_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_a_id UUID NOT NULL REFERENCES fb_emails_processed(id) ON DELETE CASCADE,
  transaction_b_id UUID NOT NULL REFERENCES fb_emails_processed(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL,
  direction VARCHAR(20) DEFAULT 'bidirectional',
  notes TEXT,
  confidence DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(50) DEFAULT 'user',
  CONSTRAINT different_transactions CHECK (transaction_a_id != transaction_b_id),
  CONSTRAINT unique_relationship UNIQUE (transaction_a_id, transaction_b_id, relationship_type),
  CONSTRAINT valid_direction CHECK (direction IN ('bidirectional', 'a_to_b', 'b_to_a')),
  CONSTRAINT valid_type CHECK (relationship_type IN ('refund', 'transfer', 'reimbursement', 'chargeback', 'custom')),
  CONSTRAINT valid_confidence CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_relationships_transaction_a ON fb_transaction_relationships(transaction_a_id);
CREATE INDEX IF NOT EXISTS idx_relationships_transaction_b ON fb_transaction_relationships(transaction_b_id);
CREATE INDEX IF NOT EXISTS idx_relationships_user ON fb_transaction_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON fb_transaction_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_relationships_created_at ON fb_transaction_relationships(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_relationships_user_type ON fb_transaction_relationships(user_id, relationship_type);
CREATE INDEX IF NOT EXISTS idx_relationships_user_created ON fb_transaction_relationships(user_id, created_at DESC);

-- Step 3: Enable RLS
ALTER TABLE fb_transaction_relationships ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
CREATE POLICY "Users can view their own relationships"
  ON fb_transaction_relationships FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own relationships"
  ON fb_transaction_relationships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own relationships"
  ON fb_transaction_relationships FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own relationships"
  ON fb_transaction_relationships FOR DELETE
  USING (auth.uid() = user_id);

COMMIT;
```

### 10.2 Rollback Plan

```sql
-- Rollback migration if needed
BEGIN;

-- Drop policies
DROP POLICY IF EXISTS "Users can delete their own relationships" ON fb_transaction_relationships;
DROP POLICY IF EXISTS "Users can update their own relationships" ON fb_transaction_relationships;
DROP POLICY IF EXISTS "Users can create their own relationships" ON fb_transaction_relationships;
DROP POLICY IF EXISTS "Users can view their own relationships" ON fb_transaction_relationships;

-- Drop table (CASCADE will drop indexes)
DROP TABLE IF EXISTS fb_transaction_relationships CASCADE;

COMMIT;
```

### 10.3 Deployment Checklist

**Pre-Deployment:**
- [ ] Review migration script
- [ ] Test migration on local database
- [ ] Test migration on staging database
- [ ] Verify RLS policies work correctly
- [ ] Run performance tests on large datasets
- [ ] Backup production database

**Deployment:**
- [ ] Run migration on production
- [ ] Verify table created successfully
- [ ] Verify indexes created
- [ ] Verify RLS policies active
- [ ] Test API endpoints
- [ ] Monitor error logs

**Post-Deployment:**
- [ ] Verify no performance degradation
- [ ] Monitor query performance
- [ ] Check for any errors in logs
- [ ] Test UI workflows
- [ ] Gather user feedback

---

## 11. Summary

### Key Features
✅ Link related transactions (refunds, transfers, reimbursements, chargebacks)
✅ Bidirectional relationships with flexible types
✅ AI-powered relationship suggestions
✅ Visual indicators in transaction list
✅ Relationship management (create, edit, delete)
✅ Filters and reports integration
✅ Mobile-optimized UI

### Technical Highlights
✅ Single table design (`fb_transaction_relationships`)
✅ Row Level Security (RLS) for data protection
✅ Cascade delete for data integrity
✅ Optimized indexes for performance
✅ Comprehensive validation and error handling
✅ Full test coverage (unit, integration, E2E)

### Timeline
- **Phase 1 (Week 1-2):** Database + API foundation
- **Phase 2 (Week 3-4):** Core UI features
- **Phase 3 (Week 5-6):** AI suggestions
- **Phase 4 (Week 7-8):** Polish & optimization

**Total:** 8 weeks from start to production

---

**Document End**