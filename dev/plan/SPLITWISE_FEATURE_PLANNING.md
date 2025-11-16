# Splitwise Feature - Complete Planning Document

**Version:** 1.0
**Date:** 2025-11-16
**Status:** Planning
**Feature:** Split expenses among people with settlement tracking (Splitwise-style)

---

## Table of Contents
1. [Overview](#1-overview)
2. [Use Cases](#2-use-cases)
3. [Data Model](#3-data-model)
4. [API Design](#4-api-design)
5. [UI/UX Workflows](#5-uiux-workflows)
6. [Business Logic](#6-business-logic)
7. [Settlement System](#7-settlement-system)
8. [Implementation Plan](#8-implementation-plan)
9. [Edge Cases](#9-edge-cases)
10. [Testing Strategy](#10-testing-strategy)
11. [Integration Points](#11-integration-points)

---

## 1. Overview

### 1.1 Purpose
Enable users to split expenses among multiple people (friends, roommates, colleagues) and track who owes whom, similar to Splitwise. This is a **modular, abstracted component** that works independently from the core transaction system.

### 1.2 Key Characteristics
- **Modular Design:** Completely separate from transaction relationships feature
- **Person-Centric:** Track balances between people, not just transactions
- **Settlement Tracking:** Record payments to settle debts
- **Flexible Splitting:** Equal splits, unequal splits, percentage-based, custom amounts
- **Group Support:** Create groups for recurring shared expenses (roommates, trips)
- **Balance Calculation:** Automatic calculation of who owes whom
- **Settlement Optimization:** Suggest optimal payment plan to minimize transactions

### 1.3 Core Concepts

```
Transaction: -$150 Restaurant (User paid)
  ├─ User's share: $50
  ├─ Alice's share: $50
  └─ Bob's share: $50

Result:
  - Alice owes User: $50
  - Bob owes User: $50

After Settlement:
  - Alice pays User: $50 → Balance: $0
  - Bob pays User: $50 → Balance: $0
```

### 1.4 Goals
- ✅ Simplify expense splitting among friends/groups
- ✅ Track who owes whom with running balances
- ✅ Support multiple split methods (equal, unequal, percentage, shares)
- ✅ Enable settlement tracking and payment recording
- ✅ Provide clear balance summaries and history
- ✅ Support group-based expense management
- ✅ Minimize number of transactions needed to settle (optimization)

### 1.5 Non-Goals
- ❌ Multi-currency support (future enhancement)
- ❌ Recurring/subscription expense tracking (future enhancement)
- ❌ Integration with payment apps (Venmo, PayPal) - future enhancement
- ❌ Expense approval workflows (future enhancement)
- ❌ Receipt scanning and OCR (future enhancement)

---

## 2. Use Cases

### 2.1 Use Case: Roommate Rent Split
**Scenario:** User pays $1,500 rent, splits equally among 3 roommates.

**User Story:**
> As a user, I want to split my rent payment among my roommates so I can track who owes me their share.

**Workflow:**
1. User views rent transaction (-$1,500)
2. Clicks "Split Expense"
3. Selects "Roommates" group (or creates new)
4. Adds participants: User, Alice, Bob
5. Chooses "Split Equally"
6. System calculates: $500 each
7. Confirms split

**Expected Outcome:**
- User paid: $1,500
- User's share: $500
- Alice owes User: $500
- Bob owes User: $500
- Balance summary shows: "You are owed $1,000"

**Acceptance Criteria:**
- ✅ Can select existing group or create new
- ✅ Equal split calculates correctly
- ✅ Balances update automatically
- ✅ Can view who owes what
- ✅ Can record settlements

### 2.2 Use Case: Unequal Restaurant Bill
**Scenario:** User pays $150 restaurant bill, but people ordered different amounts.

**User Story:**
> As a user, I want to split a restaurant bill based on what each person ordered.

**Workflow:**
1. User views restaurant transaction (-$150)
2. Clicks "Split Expense"
3. Adds participants: User, Alice, Bob, Charlie
4. Chooses "Unequal Split"
5. Enters amounts:
   - User: $40 (paid $150)
   - Alice: $35
   - Bob: $45
   - Charlie: $30
6. System validates: $40 + $35 + $45 + $30 = $150 ✅
7. Confirms split

**Expected Outcome:**
- Alice owes User: $35
- Bob owes User: $45
- Charlie owes User: $30
- User's net: Paid $150, owed $110, share $40 → Owed $110

**Acceptance Criteria:**
- ✅ Can enter custom amounts per person
- ✅ Validation ensures amounts sum to total
- ✅ Shows real-time validation
- ✅ Calculates who owes whom correctly

### 2.3 Use Case: Trip Expenses
**Scenario:** Group trip with multiple expenses paid by different people.

**User Story:**
> As a user, I want to track all expenses during a trip and see final balances.

**Workflow:**
1. User creates "Bali Trip" group
2. Adds participants: User, Alice, Bob, Charlie
3. Over time, adds expenses:
   - Day 1: User pays $200 hotel (split equally)
   - Day 2: Alice pays $80 dinner (split equally)
   - Day 3: Bob pays $120 activities (split equally)
   - Day 4: User pays $60 breakfast (split equally)
4. Views group balance summary


### 3.1 Database Schema

```sql
-- Table 1: People (contacts for splitting)
CREATE TABLE fb_splitwise_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Person details
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  avatar_url TEXT,

  -- Metadata
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_person_per_user UNIQUE (user_id, email)
);

-- Table 2: Groups (for organizing shared expenses)
CREATE TABLE fb_splitwise_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Group details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  group_type VARCHAR(50) DEFAULT 'general', -- 'general', 'trip', 'home', 'couple', 'other'
  avatar_url TEXT,

  -- Settings
  default_split_method VARCHAR(50) DEFAULT 'equal', -- 'equal', 'unequal', 'percentage', 'shares'
  is_active BOOLEAN DEFAULT TRUE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: Group Members (many-to-many)
CREATE TABLE fb_splitwise_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES fb_splitwise_groups(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES fb_splitwise_people(id) ON DELETE CASCADE,

  -- Member role
  role VARCHAR(50) DEFAULT 'member', -- 'owner', 'admin', 'member'

  -- Audit
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_group_member UNIQUE (group_id, person_id)
);

-- Table 4: Split Expenses (the main split records)
CREATE TABLE fb_splitwise_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Link to original email (optional - for email-based expenses)
  email_row_id UUID REFERENCES fb_emails_fetched(id) ON DELETE SET NULL,

  -- Link to processed transaction (optional - for processed email transactions)
  transaction_id UUID REFERENCES fb_emails_processed(id) ON DELETE SET NULL,

  -- Expense details
  description VARCHAR(255) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  expense_date DATE NOT NULL,
  category VARCHAR(100),

  -- Who paid
  paid_by_person_id UUID NOT NULL REFERENCES fb_splitwise_people(id),

  -- Group (optional)
  group_id UUID REFERENCES fb_splitwise_groups(id) ON DELETE SET NULL,

  -- Split method
  split_method VARCHAR(50) NOT NULL, -- 'equal', 'unequal', 'percentage', 'shares'

  -- Metadata
  notes TEXT,
  receipt_url TEXT,

  -- Status
  is_settled BOOLEAN DEFAULT FALSE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT positive_amount CHECK (total_amount > 0),
  CONSTRAINT email_or_transaction_link CHECK (
    -- Can have email_row_id, transaction_id, both, or neither (manual entry)
    -- But if both exist, transaction must be from that email
    email_row_id IS NULL OR transaction_id IS NULL OR
    EXISTS (
      SELECT 1 FROM fb_emails_processed
      WHERE id = transaction_id AND email_row_id = fb_splitwise_expenses.email_row_id
    )
  )
);

-- Table 5: Expense Shares (who owes what)
CREATE TABLE fb_splitwise_expense_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES fb_splitwise_expenses(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES fb_splitwise_people(id) ON DELETE CASCADE,

  -- Share details
  share_amount DECIMAL(10,2) NOT NULL,
  share_percentage DECIMAL(5,2), -- Optional: for percentage splits
  share_count DECIMAL(10,2), -- Optional: for share-based splits (e.g., 1.5 shares)

  -- Status
  is_settled BOOLEAN DEFAULT FALSE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT positive_share CHECK (share_amount >= 0),
  CONSTRAINT unique_expense_person UNIQUE (expense_id, person_id)
);

-- Table 6: Settlements (payment records)
CREATE TABLE fb_splitwise_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Who paid whom
  payer_person_id UUID NOT NULL REFERENCES fb_splitwise_people(id),
  payee_person_id UUID NOT NULL REFERENCES fb_splitwise_people(id),

  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50), -- 'cash', 'venmo', 'bank_transfer', 'upi', 'other'

  -- Link to expense (optional - can be general settlement)
  expense_id UUID REFERENCES fb_splitwise_expenses(id) ON DELETE SET NULL,

  -- Metadata
  notes TEXT,
  receipt_url TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT positive_settlement CHECK (amount > 0),
  CONSTRAINT different_people CHECK (payer_person_id != payee_person_id)
);

-- Indexes
CREATE INDEX idx_splitwise_people_user ON fb_splitwise_people(user_id);
CREATE INDEX idx_splitwise_people_email ON fb_splitwise_people(email);
CREATE INDEX idx_splitwise_groups_user ON fb_splitwise_groups(user_id);
CREATE INDEX idx_splitwise_group_members_group ON fb_splitwise_group_members(group_id);
CREATE INDEX idx_splitwise_group_members_person ON fb_splitwise_group_members(person_id);
CREATE INDEX idx_splitwise_expenses_user ON fb_splitwise_expenses(user_id);
CREATE INDEX idx_splitwise_expenses_email ON fb_splitwise_expenses(email_row_id);
CREATE INDEX idx_splitwise_expenses_transaction ON fb_splitwise_expenses(transaction_id);
CREATE INDEX idx_splitwise_expenses_group ON fb_splitwise_expenses(group_id);
CREATE INDEX idx_splitwise_expenses_paid_by ON fb_splitwise_expenses(paid_by_person_id);
CREATE INDEX idx_splitwise_expenses_date ON fb_splitwise_expenses(expense_date DESC);
CREATE INDEX idx_splitwise_expense_shares_expense ON fb_splitwise_expense_shares(expense_id);
CREATE INDEX idx_splitwise_expense_shares_person ON fb_splitwise_expense_shares(person_id);
CREATE INDEX idx_splitwise_settlements_user ON fb_splitwise_settlements(user_id);
CREATE INDEX idx_splitwise_settlements_payer ON fb_splitwise_settlements(payer_person_id);
CREATE INDEX idx_splitwise_settlements_payee ON fb_splitwise_settlements(payee_person_id);
CREATE INDEX idx_splitwise_settlements_expense ON fb_splitwise_settlements(expense_id);
CREATE INDEX idx_splitwise_settlements_date ON fb_splitwise_settlements(payment_date DESC);

-- Enable RLS on all tables
ALTER TABLE fb_splitwise_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_splitwise_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_splitwise_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_splitwise_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_splitwise_expense_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_splitwise_settlements ENABLE ROW LEVEL SECURITY;

-- RLS Policies (example for fb_splitwise_people)
CREATE POLICY "Users can view their own people"
  ON fb_splitwise_people FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own people"
  ON fb_splitwise_people FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own people"
  ON fb_splitwise_people FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own people"
  ON fb_splitwise_people FOR DELETE
  USING (auth.uid() = user_id);

-- Similar policies for other tables...
```

### 3.2 Email Foreign Key Relationship

**Purpose:** Link splitwise expenses to original email source for traceability.

**Three Linking Scenarios:**

1. **Email-based Expense (email_row_id only):**
   - User splits an expense from a fetched email
   - Links to `fb_emails_fetched` via `email_row_id`
   - No processed transaction yet (email not processed)
   - Example: Split a restaurant receipt email before AI extraction

2. **Processed Transaction Expense (transaction_id only):**
   - User splits an expense from a processed transaction
   - Links to `fb_emails_processed` via `transaction_id`
   - The processed transaction already has `email_row_id` linking to source email
   - Example: Split a confirmed transaction from transaction list

3. **Both Links (email_row_id + transaction_id):**
   - Expense linked to both email and processed transaction
   - Constraint ensures transaction belongs to that email
   - Provides complete traceability: expense → transaction → email
   - Example: Split expense created from email, then transaction confirmed

4. **Manual Expense (neither):**
   - User manually creates expense (not from email/transaction)
   - Both `email_row_id` and `transaction_id` are NULL
   - Example: Cash expense, shared Uber ride, etc.

**Benefits:**
- ✅ Complete audit trail from expense back to original email
- ✅ Can find all splitwise expenses from a specific email
- ✅ Can show email context when viewing expense
- ✅ Supports both email-first and transaction-first workflows
- ✅ Allows manual expenses without email/transaction

**Database Constraint:**
```sql
CONSTRAINT email_or_transaction_link CHECK (
  -- Can have email_row_id, transaction_id, both, or neither
  -- But if both exist, transaction must be from that email
  email_row_id IS NULL OR transaction_id IS NULL OR
  EXISTS (
    SELECT 1 FROM fb_emails_processed
    WHERE id = transaction_id AND email_row_id = fb_splitwise_expenses.email_row_id
  )
)
```

**Note on fb_emails_processed:**
The `fb_emails_processed` table should also have a foreign key to `fb_emails_fetched`:
```sql
ALTER TABLE fb_emails_processed
  ADD COLUMN email_row_id UUID REFERENCES fb_emails_fetched(id) ON DELETE SET NULL;
```

This creates the chain: `fb_splitwise_expenses` → `fb_emails_processed` → `fb_emails_fetched`

### 3.3 TypeScript Types

```typescript
// src/types/splitwise.ts

export type SplitMethod = 'equal' | 'unequal' | 'percentage' | 'shares';
export type GroupType = 'general' | 'trip' | 'home' | 'couple' | 'other';
export type MemberRole = 'owner' | 'admin' | 'member';
export type PaymentMethod = 'cash' | 'venmo' | 'bank_transfer' | 'upi' | 'other';

export interface SplitwisePerson {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SplitwiseGroup {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  group_type: GroupType;
  avatar_url?: string;
  default_split_method: SplitMethod;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SplitwiseGroupMember {
  id: string;
  group_id: string;
  person_id: string;
  role: MemberRole;
  joined_at: string;
  person?: SplitwisePerson;
}

export interface SplitwiseExpense {
  id: string;
  user_id: string;
  email_row_id?: string;  // Link to original email (fb_emails_fetched)
  transaction_id?: string;  // Link to processed transaction (fb_emails_processed)
  description: string;
  total_amount: number;
  currency: string;
  expense_date: string;
  category?: string;
  paid_by_person_id: string;
  group_id?: string;
  split_method: SplitMethod;
  notes?: string;
  receipt_url?: string;
  is_settled: boolean;
  created_at: string;
  updated_at: string;

  // Populated fields
  paid_by_person?: SplitwisePerson;
  group?: SplitwiseGroup;
  shares?: SplitwiseExpenseShare[];
  email?: EmailFetched;  // Populated from email_row_id
  transaction?: EmailProcessed;  // Populated from transaction_id
}

export interface SplitwiseExpenseShare {
  id: string;
  expense_id: string;
  person_id: string;
  share_amount: number;
  share_percentage?: number;
  share_count?: number;
  is_settled: boolean;
  created_at: string;

  // Populated fields
  person?: SplitwisePerson;
}

export interface SplitwiseSettlement {
  id: string;
  user_id: string;
  payer_person_id: string;
  payee_person_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method?: PaymentMethod;
  expense_id?: string;
  notes?: string;
  receipt_url?: string;
  created_at: string;

  // Populated fields
  payer_person?: SplitwisePerson;
  payee_person?: SplitwisePerson;
  expense?: SplitwiseExpense;
}

export interface PersonBalance {
  person_id: string;
  person_name: string;
  total_paid: number;
  total_owed: number;
  balance: number; // positive = they owe you, negative = you owe them
}

export interface GroupBalance {
  group_id: string;
  group_name: string;
  total_expenses: number;
  member_balances: PersonBalance[];
  suggested_settlements: SuggestedSettlement[];
}

export interface SuggestedSettlement {
  from_person_id: string;
  from_person_name: string;
  to_person_id: string;
  to_person_name: string;
  amount: number;
}

export interface CreateExpenseRequest {
  description: string;
  total_amount: number;
  expense_date: string;
  paid_by_person_id: string;
  split_method: SplitMethod;
  group_id?: string;
  email_row_id?: string;  // Optional: link to source email
  transaction_id?: string;  // Optional: link to processed transaction
  category?: string;
  notes?: string;
  shares: {
    person_id: string;
    share_amount?: number;
    share_percentage?: number;
    share_count?: number;
  }[];
}

export interface CreateSettlementRequest {
  payer_person_id: string;
  payee_person_id: string;
  amount: number;
  payment_date: string;
  payment_method?: PaymentMethod;
  expense_id?: string;
  notes?: string;
}
```

---

## 4. API Design

### 4.1 API Endpoints

```typescript
// People Management
POST   /api/splitwise/people                    // Create person
GET    /api/splitwise/people                    // List all people
GET    /api/splitwise/people/:id                // Get person details
PUT    /api/splitwise/people/:id                // Update person
DELETE /api/splitwise/people/:id                // Delete person

// Groups Management
POST   /api/splitwise/groups                    // Create group
GET    /api/splitwise/groups                    // List all groups
GET    /api/splitwise/groups/:id                // Get group details
PUT    /api/splitwise/groups/:id                // Update group
DELETE /api/splitwise/groups/:id                // Delete group
POST   /api/splitwise/groups/:id/members        // Add member to group
DELETE /api/splitwise/groups/:id/members/:personId  // Remove member

// Expenses Management
POST   /api/splitwise/expenses                  // Create split expense
GET    /api/splitwise/expenses                  // List all expenses
GET    /api/splitwise/expenses/:id              // Get expense details
PUT    /api/splitwise/expenses/:id              // Update expense
DELETE /api/splitwise/expenses/:id              // Delete expense
GET    /api/splitwise/groups/:id/expenses       // Get group expenses

// Settlements Management
POST   /api/splitwise/settlements               // Record settlement
GET    /api/splitwise/settlements               // List all settlements
GET    /api/splitwise/settlements/:id           // Get settlement details
DELETE /api/splitwise/settlements/:id           // Delete settlement

// Balance Calculations
GET    /api/splitwise/balances                  // Get overall balances
GET    /api/splitwise/balances/person/:id       // Get balance with specific person
GET    /api/splitwise/groups/:id/balances       // Get group balances
GET    /api/splitwise/groups/:id/suggested-settlements  // Get settlement suggestions

// Transaction Integration
POST   /api/transactions/:id/split              // Split existing transaction
GET    /api/transactions/:id/split-info         // Get split info for transaction
```

### 4.2 Request/Response Examples

**Create Split Expense (Equal Split):**
```json
// POST /api/splitwise/expenses
{
  "description": "Dinner at Restaurant",
  "total_amount": 150.00,
  "expense_date": "2025-11-16",
  "paid_by_person_id": "user-person-id",
  "split_method": "equal",
  "group_id": "roommates-group-id",
  "shares": [
    { "person_id": "user-person-id" },
    { "person_id": "alice-person-id" },
    { "person_id": "bob-person-id" }
  ]
}

// Response 201
{
  "id": "expense-uuid",
  "description": "Dinner at Restaurant",
  "total_amount": 150.00,
  "split_method": "equal",
  "shares": [
    {
      "person_id": "user-person-id",
      "person_name": "You",
      "share_amount": 50.00,
      "is_settled": true  // Payer's share is auto-settled
    },
    {
      "person_id": "alice-person-id",
      "person_name": "Alice",
      "share_amount": 50.00,
      "is_settled": false
    },
    {
      "person_id": "bob-person-id",
      "person_name": "Bob",
      "share_amount": 50.00,
      "is_settled": false
    }
  ]
}
```

**Create Split Expense (Unequal Split):**
```json
// POST /api/splitwise/expenses
{
  "description": "Restaurant Bill",
  "total_amount": 150.00,
  "expense_date": "2025-11-16",
  "paid_by_person_id": "user-person-id",
  "split_method": "unequal",
  "shares": [
    { "person_id": "user-person-id", "share_amount": 40.00 },
    { "person_id": "alice-person-id", "share_amount": 35.00 },
    { "person_id": "bob-person-id", "share_amount": 45.00 },
    { "person_id": "charlie-person-id", "share_amount": 30.00 }
  ]
}
```

**Get Balances:**
```json
// GET /api/splitwise/balances

// Response 200
{
  "overall_balance": 250.00,  // Total you are owed
  "balances": [
    {
      "person_id": "alice-person-id",
      "person_name": "Alice",
      "total_paid": 80.00,
      "total_owed": 115.00,
      "balance": -35.00  // Alice owes you $35
    },
    {
      "person_id": "bob-person-id",
      "person_name": "Bob",
      "total_paid": 120.00,
      "total_owed": 115.00,
      "balance": 5.00  // You owe Bob $5
    },
    {
      "person_id": "charlie-person-id",
      "person_name": "Charlie",
      "total_paid": 0.00,
      "total_owed": 115.00,
      "balance": -115.00  // Charlie owes you $115
    }
  ]
}
```

**Record Settlement:**
```json
// POST /api/splitwise/settlements
{
  "payer_person_id": "alice-person-id",
  "payee_person_id": "user-person-id",
  "amount": 35.00,
  "payment_date": "2025-11-16",
  "payment_method": "upi",
  "notes": "Paid via Google Pay"
}

// Response 201
{
  "id": "settlement-uuid",
  "payer_person_id": "alice-person-id",
  "payee_person_id": "user-person-id",
  "amount": 35.00,
  "payment_date": "2025-11-16",
  "payment_method": "upi",
  "notes": "Paid via Google Pay",
  "created_at": "2025-11-16T10:30:00Z"
}
```

---

## 5. UI/UX Workflows


### 5.1 Split Expense Workflow (from Transaction)

```
Step 1: Transaction Detail Page
┌─────────────────────────────────────────────────┐
│ Transaction Details                             │
│                                                 │
│ Restaurant                          -$150.00    │
│ Nov 16, 2025 • Dining • Account 7712           │
│                                                 │
│ [Edit] [Split Expense] [Delete]                │
└─────────────────────────────────────────────────┘
         ↓ Click "Split Expense"

Step 2: Choose Split Method
┌─────────────────────────────────────────────────┐
│ Split Expense: $150.00                    [X]   │
├─────────────────────────────────────────────────┤
│                                                 │
│ How do you want to split this expense?         │
│                                                 │
│ ● Split Equally                                 │
│   Everyone pays the same amount                 │
│                                                 │
│ ○ Unequal Amounts                               │
│   Enter different amounts for each person       │
│                                                 │
│ ○ By Percentage                                 │
│   Split by percentage (e.g., 60/40)            │
│                                                 │
│ ○ By Shares                                     │
│   Split by shares (e.g., 2 shares vs 1 share)  │
│                                                 │
│ [Cancel] [Next]                                 │
└─────────────────────────────────────────────────┘
         ↓ Select "Split Equally"

Step 3: Add Participants
┌─────────────────────────────────────────────────┐
│ Split Expense: $150.00                    [X]   │
├─────────────────────────────────────────────────┤
│                                                 │
│ Who shared this expense?                        │
│                                                 │
│ Group (optional):                               │
│ [Select Group ▼] or [Create New Group]         │
│                                                 │
│ Participants:                                   │
│ ┌─────────────────────────────────────────────┐│
│ │ ✓ You (paid $150.00)                       ││
│ │   Share: $50.00                            ││
│ ├─────────────────────────────────────────────┤│
│ │ ☐ Alice                                    ││
│ │   Share: $50.00                            ││
│ ├─────────────────────────────────────────────┤│
│ │ ☐ Bob                                      ││
│ │   Share: $50.00                            ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ [+ Add Person]                                  │
│                                                 │
│ Total: $150.00 / $150.00 ✅                     │
│                                                 │
│ [Back] [Split Expense]                          │
└─────────────────────────────────────────────────┘
         ↓ Confirm

Step 4: Success
┌─────────────────────────────────────────────────┐
│ ✅ Expense Split!                               │
├─────────────────────────────────────────────────┤
│                                                 │
│ Restaurant - $150.00                            │
│                                                 │
│ You paid: $150.00                               │
│ Your share: $50.00                              │
│                                                 │
│ You are owed:                                   │
│ • Alice: $50.00                                 │
│ • Bob: $50.00                                   │
│                                                 │
│ Total owed to you: $100.00                      │
│                                                 │
│ [View Balances] [Done]                          │
└─────────────────────────────────────────────────┘
```

### 5.2 Balances Dashboard

```
┌─────────────────────────────────────────────────────────┐
│ Splitwise Balances                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Overall Balance: +$250.00                               │
│ You are owed $250.00                                    │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 👤 Alice                                            ││
│ │ Owes you: $50.00                                    ││
│ │ [Record Payment] [View History]                     ││
│ ├─────────────────────────────────────────────────────┤│
│ │ 👤 Bob                                              ││
│ │ You owe: $5.00                                      ││
│ │ [Settle Up] [View History]                          ││
│ ├─────────────────────────────────────────────────────┤│
│ │ 👤 Charlie                                          ││
│ │ Owes you: $115.00                                   ││
│ │ [Record Payment] [View History]                     ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ Groups:                                                 │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 🏠 Roommates                                        ││
│ │ Total expenses: $1,500.00                           ││
│ │ Your balance: +$500.00                              ││
│ │ [View Details]                                      ││
│ ├─────────────────────────────────────────────────────┤│
│ │ ✈️ Bali Trip                                        ││
│ │ Total expenses: $460.00                             ││
│ │ Your balance: +$145.00                              ││
│ │ [View Details]                                      ││
│ └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### 5.3 Group Balance Detail

```
┌─────────────────────────────────────────────────────────┐
│ ✈️ Bali Trip                                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Total Expenses: $460.00                                 │
│ Per Person: $115.00                                     │
│                                                         │
│ Member Balances:                                        │
│ ┌─────────────────────────────────────────────────────┐│
│ │ You                                                 ││
│ │ Paid: $260.00 | Share: $115.00 | Owed: +$145.00    ││
│ ├─────────────────────────────────────────────────────┤│
│ │ Alice                                               ││
│ │ Paid: $80.00 | Share: $115.00 | Owes: -$35.00      ││
│ ├─────────────────────────────────────────────────────┤│
│ │ Bob                                                 ││
│ │ Paid: $120.00 | Share: $115.00 | Owed: +$5.00      ││
│ ├─────────────────────────────────────────────────────┤│
│ │ Charlie                                             ││
│ │ Paid: $0.00 | Share: $115.00 | Owes: -$115.00      ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ Suggested Settlements (3 transactions):                │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 1. Alice pays You: $35.00                           ││
│ │ 2. Charlie pays You: $110.00                        ││
│ │ 3. Charlie pays Bob: $5.00                          ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ Recent Expenses:                                        │
│ ┌─────────────────────────────────────────────────────┐│
│ │ Nov 16  You paid $60 - Breakfast (split 4 ways)    ││
│ │ Nov 15  Bob paid $120 - Activities (split 4 ways)  ││
│ │ Nov 14  Alice paid $80 - Dinner (split 4 ways)     ││
│ │ Nov 13  You paid $200 - Hotel (split 4 ways)       ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ [Add Expense] [Settle Up] [View All]                    │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Business Logic

### 6.1 Split Calculation Rules

**Equal Split:**
```typescript
// Total: $150, Participants: 3
share_amount = total_amount / participant_count
// Each person: $50.00
```

**Unequal Split:**
```typescript
// Validation: Sum of shares must equal total
sum(shares) === total_amount
// Example: $40 + $35 + $45 + $30 = $150 ✅
```

**Percentage Split:**
```typescript
// Validation: Percentages must sum to 100%
sum(percentages) === 100
// Calculate amounts from percentages
share_amount = (percentage / 100) * total_amount
// Example: 40% of $200 = $80
```

**Shares Split:**
```typescript
// Example: User has 2 shares, Alice has 1 share
total_shares = 2 + 1 = 3
share_value = total_amount / total_shares
user_amount = 2 * share_value
alice_amount = 1 * share_value
// $150 / 3 = $50 per share
// User: 2 * $50 = $100
// Alice: 1 * $50 = $50
```

### 6.2 Balance Calculation

**Person Balance:**
```typescript
balance = total_paid - total_share
// Positive = they owe you
// Negative = you owe them
// Zero = settled

Example:
User paid: $260
User's share: $115
Balance: $260 - $115 = +$145 (owed to user)

Alice paid: $80
Alice's share: $115
Balance: $80 - $115 = -$35 (Alice owes)
```

**Settlement Impact:**
```typescript
// Before settlement
Alice balance: -$50 (owes you $50)

// After Alice pays $50
Alice balance: -$50 + $50 = $0 (settled)
```

### 6.3 Settlement Optimization

**Problem:** Minimize number of transactions to settle all debts.

**Algorithm:** Greedy approach
```typescript
function optimizeSettlements(balances: PersonBalance[]): SuggestedSettlement[] {
  const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
  const debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);

  const settlements: SuggestedSettlement[] = [];

  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const amount = Math.min(creditor.balance, Math.abs(debtor.balance));

    settlements.push({
      from_person_id: debtor.person_id,
      from_person_name: debtor.person_name,
      to_person_id: creditor.person_id,
      to_person_name: creditor.person_name,
      amount: amount
    });

    creditor.balance -= amount;
    debtor.balance += amount;

    if (creditor.balance === 0) i++;
    if (debtor.balance === 0) j++;
  }

  return settlements;
}
```

**Example:**
```
Before:
- User: +$145 (owed)
- Alice: -$35 (owes)
- Bob: +$5 (owed)
- Charlie: -$115 (owes)

Optimized Settlements (3 transactions):
1. Alice pays User: $35
2. Charlie pays User: $110
3. Charlie pays Bob: $5

Instead of 4 potential transactions:
1. Alice pays User: $35
2. Charlie pays User: $115
3. User pays Bob: $5
```

---

## 7. Settlement System

### 7.1 Recording Settlements

**Manual Settlement:**
- User records when someone pays them back
- Updates balances immediately
- Maintains payment history
- Supports partial payments

**Settlement Methods:**
- Cash
- UPI (Google Pay, PhonePe, Paytm)
- Bank Transfer
- Venmo/PayPal
- Other

### 7.2 Settlement Validation

```typescript
// Validate settlement amount
if (amount <= 0) {
  throw new Error('Settlement amount must be positive');
}

// Check if settlement exceeds debt
const currentDebt = calculateDebt(payer, payee);
if (amount > Math.abs(currentDebt)) {
  showWarning(`Amount exceeds debt of ${currentDebt}. Continue anyway?`);
}
```

### 7.3 Settlement History

Track all settlements with:
- Date and time
- Amount
- Payment method
- Notes
- Link to original expense (if applicable)
- Ability to undo/delete

---

## 8. Implementation Plan

### 8.1 Phase 1: Foundation (Week 1-2)

**Database:**
- ✅ Create 6 splitwise tables
- ✅ Add indexes
- ✅ Enable RLS policies
- ✅ Write migration script
- ✅ Test on staging

**API:**
- ✅ People CRUD endpoints
- ✅ Groups CRUD endpoints
- ✅ Expenses CRUD endpoints
- ✅ Settlements CRUD endpoints
- ✅ Balance calculation endpoints

**Types:**
- ✅ Define all TypeScript types
- ✅ Create DTOs for requests/responses

### 8.2 Phase 2: Core Features (Week 3-4)

**UI Components:**
- ✅ Split Expense modal
- ✅ Split method selector
- ✅ Participant selector
- ✅ Amount calculator
- ✅ Balance dashboard
- ✅ Person balance card
- ✅ Group balance view

**Workflows:**
- ✅ Split expense from transaction
- ✅ Create standalone expense
- ✅ View balances
- ✅ Record settlement
- ✅ View expense history

### 8.3 Phase 3: Groups & Optimization (Week 5-6)

**Group Features:**
- ✅ Create/edit groups
- ✅ Add/remove members
- ✅ Group expense tracking
- ✅ Group balance calculation
- ✅ Group settlement suggestions

**Optimization:**
- ✅ Settlement optimization algorithm
- ✅ Suggested settlements UI
- ✅ One-click settle up

### 8.4 Phase 4: Polish & Integration (Week 7-8)

**Integration:**
- ✅ Link to transactions
- ✅ Show split info on transaction detail
- ✅ Filter transactions by split status

**Polish:**
- ✅ Mobile optimization
- ✅ Notifications for settlements
- ✅ Export expense history
- ✅ Charts and visualizations

---

## 9. Edge Cases

### 9.1 Rounding Errors
**Scenario:** $100 split 3 ways = $33.33 + $33.33 + $33.34

**Solution:**
- Assign extra cent to payer
- Or distribute evenly with clear indication
- Validate total always matches

### 9.2 Delete Person with Balances
**Scenario:** User tries to delete person who owes money

**Solution:**
- ❌ Block deletion with error: "Cannot delete person with outstanding balance"
- ✅ Suggest settling balance first
- ✅ Or allow "archive" instead of delete

### 9.3 Delete Expense with Settlements
**Scenario:** User deletes expense that has been partially settled

**Solution:**
- ⚠️ Show warning: "This expense has settlements. Deleting will affect balances."
- ✅ Recalculate balances after deletion
- ✅ Keep settlement records (orphaned)

### 9.4 Overpayment
**Scenario:** Alice owes $50 but pays $60

**Solution:**
- ⚠️ Show warning: "Payment exceeds debt"
- ✅ Allow and reverse balance (now you owe Alice $10)
- ✅ Record full payment amount

### 9.5 Multiple Currencies
**Scenario:** Trip expenses in different currencies

**Solution:**
- ⚠️ Show warning: "Mixed currencies detected"
- ❌ Block for MVP (future enhancement)
- ℹ️ Suggest converting to single currency

---

## 10. Testing Strategy

### 10.1 Unit Tests

```typescript
describe('Split Calculations', () => {
  test('equal split calculates correctly', () => {
    const result = calculateEqualSplit(150, 3);
    expect(result).toEqual([50, 50, 50]);
  });

  test('unequal split validates sum', () => {
    expect(() => {
      validateUnequalSplit(150, [40, 35, 45, 20]);
    }).toThrow('Shares must sum to total');
  });

  test('percentage split calculates correctly', () => {
    const result = calculatePercentageSplit(200, [
      { person_id: '1', percentage: 60 },
      { person_id: '2', percentage: 40 }
    ]);
    expect(result[0].share_amount).toBe(120);
    expect(result[1].share_amount).toBe(80);
  });
});

describe('Balance Calculations', () => {
  test('calculates person balance correctly', () => {
    const balance = calculatePersonBalance({
      total_paid: 260,
      total_share: 115
    });
    expect(balance).toBe(145);
  });

  test('settlement updates balance', () => {
    let balance = -50; // Alice owes $50
    balance = applySettlement(balance, 50);
    expect(balance).toBe(0);
  });
});

describe('Settlement Optimization', () => {
  test('minimizes transactions', () => {
    const balances = [
      { person_id: '1', balance: 145 },
      { person_id: '2', balance: -35 },
      { person_id: '3', balance: 5 },
      { person_id: '4', balance: -115 }
    ];
    const settlements = optimizeSettlements(balances);
    expect(settlements.length).toBe(3);
  });
});
```

### 10.2 Integration Tests

```typescript
describe('Split Expense Workflow', () => {
  test('creates expense with equal split', async () => {
    const expense = await createExpense({
      description: 'Dinner',
      total_amount: 150,
      paid_by_person_id: user.id,
      split_method: 'equal',
      shares: [
        { person_id: user.id },
        { person_id: alice.id },
        { person_id: bob.id }
      ]
    });

    expect(expense.shares).toHaveLength(3);
    expect(expense.shares[0].share_amount).toBe(50);
  });

  test('records settlement and updates balance', async () => {
    const balanceBefore = await getPersonBalance(alice.id);
    expect(balanceBefore.balance).toBe(-50);

    await recordSettlement({
      payer_person_id: alice.id,
      payee_person_id: user.id,
      amount: 50
    });

    const balanceAfter = await getPersonBalance(alice.id);
    expect(balanceAfter.balance).toBe(0);
  });
});
```

---

## 11. Integration Points

### 11.1 Transaction Integration

**Link Expense to Transaction:**
```typescript
// When splitting a transaction
const expense = await createExpense({
  transaction_id: transaction.id,  // Link to original transaction
  description: transaction.merchant_name,
  total_amount: Math.abs(transaction.amount),
  expense_date: transaction.txn_time,
  // ... rest of split details
});
```

**Show Split Info on Transaction:**
```typescript
// On transaction detail page
if (transaction.splitwise_expense_id) {
  const expense = await getExpense(transaction.splitwise_expense_id);
  // Display split information
  // Show who owes what
  // Link to balances
}
```

### 11.2 Modular Architecture

**Separate Module Structure:**
```
src/
├── lib/
│   └── splitwise/
│       ├── calculations.ts      // Split & balance calculations
│       ├── optimization.ts      // Settlement optimization
│       ├── validation.ts        // Input validation
│       └── index.ts
├── pages/
│   └── api/
│       └── splitwise/
│           ├── people/
│           ├── groups/
│           ├── expenses/
│           ├── settlements/
│           └── balances/
├── components/
│   └── splitwise/
│       ├── SplitExpenseModal.tsx
│       ├── BalanceDashboard.tsx
│       ├── PersonBalanceCard.tsx
│       ├── GroupBalanceView.tsx
│       ├── SettlementForm.tsx
│       └── ExpenseHistory.tsx
└── types/
    └── splitwise.ts
```

**Independent Operation:**
- Splitwise module works standalone
- Optional integration with transactions
- Can be enabled/disabled via feature flag
- No dependencies on core transaction logic

---

## 12. Summary

### Key Features
✅ Split expenses among people (equal, unequal, percentage, shares)
✅ Track balances (who owes whom)
✅ Record settlements and payment history
✅ Group-based expense management
✅ Settlement optimization (minimize transactions)
✅ Integration with existing transactions
✅ Modular, abstracted architecture

### Technical Highlights
✅ 6-table design (people, groups, members, expenses, shares, settlements)
✅ Row Level Security (RLS) for data protection
✅ Balance calculation algorithms
✅ Settlement optimization algorithm
✅ Comprehensive validation
✅ Full test coverage
✅ Mobile-optimized UI

### Timeline
- **Phase 1 (Week 1-2):** Database + API foundation
- **Phase 2 (Week 3-4):** Core UI features
- **Phase 3 (Week 5-6):** Groups & optimization
- **Phase 4 (Week 7-8):** Polish & integration

**Total:** 8 weeks from start to production

---

**Document End**
- Alice: Paid $80, Share $115 → Owes $35
- Bob: Paid $120, Share $115 → Owed $5
- Charlie: Paid $0, Share $115 → Owes $115

Simplified Settlements:
- Alice pays User: $35
- Charlie pays User: $110
- Charlie pays Bob: $5
```

**Acceptance Criteria:**
- ✅ Can create groups for trips
- ✅ Multiple people can pay expenses
- ✅ Running balance calculated correctly
- ✅ Settlement optimization suggests minimal transactions
- ✅ Can view expense history per group

### 2.4 Use Case: Percentage-Based Split
**Scenario:** Business dinner where senior partner pays 60%, junior pays 40%.

**User Story:**
> As a user, I want to split an expense by percentage.

**Workflow:**
1. User views dinner transaction (-$200)
2. Clicks "Split Expense"
3. Adds participants: User, Partner
4. Chooses "Percentage Split"
5. Enters percentages:
   - User: 40% = $80
   - Partner: 60% = $120
6. System validates: 40% + 60% = 100% ✅
7. Confirms split

**Expected Outcome:**
- User paid: $200
- User's share: $80 (40%)
- Partner owes User: $120 (60%)

**Acceptance Criteria:**
- ✅ Can enter percentages
- ✅ Validation ensures percentages sum to 100%
- ✅ Amounts calculated from percentages
- ✅ Shows both percentage and amount

### 2.5 Use Case: Settlement Recording
**Scenario:** Alice pays back her share via cash/Venmo.

**User Story:**
> As a user, I want to record when someone pays me back so balances update.

**Workflow:**
1. User views balance: "Alice owes you $50"
2. Clicks "Record Payment"
3. Enters amount: $50
4. Selects method: "Cash" or "Venmo"
5. Adds note: "Paid via Venmo on Nov 16"
6. Confirms

**Expected Outcome:**
- Alice's balance: $50 → $0
- Payment recorded in history
- Notification: "Alice settled $50"

**Acceptance Criteria:**
- ✅ Can record partial or full payments
- ✅ Balance updates immediately
- ✅ Payment history maintained
- ✅ Can add payment method and notes
- ✅ Can undo payment if needed

---

## 3. Data Model

