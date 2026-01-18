/**
 * Sub-Transactions Types
 *
 * Type definitions for the sub-transactions feature (Phase 1).
 * Sub-transactions allow splitting a parent transaction into 2-20 categorized line items.
 *
 * @see infra/migrations/0006_sub_transactions.sql
 */

import type { UUID, TransactionDirection, ExtractedTransactionPublic } from './dto';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Business rule limits for sub-transactions
 */
export const SUB_TRANSACTION_LIMITS = {
  /** Minimum number of sub-transactions when splitting */
  MIN_COUNT: 2,
  /** Maximum number of sub-transactions per parent (enforced at DB level) */
  MAX_COUNT: 20,
  /** Tolerance for amount validation (±₹0.01) */
  TOLERANCE: 0.01,
} as const;

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * A sub-transaction (line item) of a parent transaction.
 *
 * Key relationships:
 * - parent_transaction_id → fb_emails_processed.id (the parent being split)
 * - user_id, email_row_id, currency, direction → inherited from parent (enforced by trigger)
 * - splitwise_expense_id → auto-inherited on INSERT, cascaded on parent UPDATE
 */
export interface SubTransaction {
  /** Unique identifier */
  id: UUID;
  /** FK to parent transaction (fb_emails_processed) - immutable after creation */
  parent_transaction_id: UUID;
  /** FK to auth.users - must match parent */
  user_id: UUID;
  /** FK to fb_emails_fetched - must match parent */
  email_row_id: UUID;
  /** Currency code - must match parent */
  currency: string;
  /** Transaction direction - must match parent */
  direction: TransactionDirection;
  /** Transaction timestamp - inherited from parent if not set */
  txn_time: string | null;
  /** Amount for this sub-transaction (always positive, > 0) */
  amount: number;
  /** Category for this line item */
  category: string | null;
  /** Merchant name for this line item */
  merchant_name: string | null;
  /** User-provided notes */
  user_notes: string | null;
  /** Ordering within parent (0-indexed) */
  sub_transaction_order: number;
  /** Splitwise expense ID - auto-inherited from parent */
  splitwise_expense_id: string | null;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
}

/**
 * Public-facing sub-transaction (excludes user_id for API responses)
 */
export interface SubTransactionPublic {
  id: UUID;
  parent_transaction_id: UUID;
  email_row_id: UUID;
  currency: string;
  direction: TransactionDirection;
  txn_time: string | null;
  amount: number;
  category: string | null;
  merchant_name: string | null;
  user_notes: string | null;
  sub_transaction_order: number;
  splitwise_expense_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Parent transaction with nested sub-transactions.
 * Extends the public transaction type with computed/loaded fields.
 */
export interface TransactionWithSubs extends ExtractedTransactionPublic {
  /** Loaded sub-transactions (populated by query) */
  sub_transactions?: SubTransactionPublic[];
  /** Count of sub-transactions (can be computed without loading all) */
  sub_transaction_count?: number;
  /** Sum of sub-transaction amounts (for validation display) */
  sub_transaction_total?: number;
}

// ============================================================================
// API REQUEST TYPES
// ============================================================================

/**
 * Input for creating a single sub-transaction
 */
export interface CreateSubTransactionInput {
  /** Amount for this line item (required, > 0) */
  amount: number;
  /** Optional category */
  category?: string | null;
  /** Optional merchant name */
  merchant_name?: string | null;
  /** Optional user notes */
  user_notes?: string | null;
}

/**
 * Request body for bulk creating sub-transactions
 * POST /api/transactions/[id]/sub-transactions
 */
export interface CreateSubTransactionsRequest {
  /** Array of sub-transaction items (2-20 items required) */
  items: CreateSubTransactionInput[];
}

/**
 * Input for updating a sub-transaction
 * PATCH /api/transactions/[id]/sub-transactions/[subId]
 */
export interface UpdateSubTransactionInput {
  /** Updated amount (optional, > 0 if provided) */
  amount?: number;
  /** Updated category */
  category?: string | null;
  /** Updated merchant name */
  merchant_name?: string | null;
  /** Updated user notes */
  user_notes?: string | null;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Response for sub-transaction validation
 * GET /api/transactions/[id]/sub-transactions/validate
 */
export interface SubTransactionValidation {
  /** Whether sum equals parent amount (within tolerance) */
  is_valid: boolean;
  /** Parent transaction amount */
  parent_amount: number | null;
  /** Sum of all sub-transaction amounts */
  sub_total: number;
  /** Difference: parent_amount - sub_total */
  difference: number;
  /** Number of sub-transactions */
  sub_count: number;
  /** Human-readable message */
  message: string;
}

/**
 * Response for listing sub-transactions
 * GET /api/transactions/[id]/sub-transactions
 */
export interface SubTransactionListResponse {
  /** Array of sub-transactions ordered by sub_transaction_order */
  items: SubTransactionPublic[];
  /** Total count */
  count: number;
  /** Validation summary */
  validation: SubTransactionValidation;
}

/**
 * Response for creating sub-transactions
 * POST /api/transactions/[id]/sub-transactions
 */
export interface CreateSubTransactionsResponse {
  /** Created sub-transactions */
  items: SubTransactionPublic[];
  /** Count of created items */
  count: number;
  /** Validation after creation */
  validation: SubTransactionValidation;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Result from the validate_sub_transaction_sum database function
 */
export interface DBValidationResult {
  is_valid: boolean;
  parent_amount: number | null;
  sub_total: number;
  difference: number;
  sub_count: number;
}

/**
 * Input for the create_sub_transactions database function
 */
export interface DBCreateSubTransactionItem {
  amount: number;
  category?: string | null;
  merchant_name?: string | null;
  user_notes?: string | null;
}

// ============================================================================
// SUB-TRANSACTION INDEPENDENCE TYPES (Phase 2)
// Added in migration 0007_sub_transaction_status.sql
// ============================================================================

/**
 * Sibling sub-transaction info for cascade delete modal
 */
export interface SiblingSubTransaction {
  id: UUID;
  parent_id: UUID;
  amount: number;
  merchant_name: string | null;
  category: string | null;
}

/**
 * Response when deleting a sub-transaction
 * Includes sibling info for the frontend confirmation modal
 *
 * DELETE /api/transactions/[id]/sub-transactions/[subId]
 */
export interface SubTransactionDeleteResponse {
  /** Whether the deletion was successful */
  deleted: boolean;
  /** Number of remaining sibling sub-transactions */
  sibling_count: number;
  /** Details of remaining siblings (for modal display) */
  siblings: SiblingSubTransaction[];
  /** Parent transaction ID */
  parent_id: UUID;
  /** True if this was the last sibling and parent will be restored */
  will_restore_parent: boolean;
  /** Status the parent will be restored to (if will_restore_parent is true) */
  restored_status?: string;
}

/**
 * Response for unsplitting a transaction (delete all sub-transactions)
 *
 * POST /api/transactions/[id]/unsplit
 */
export interface UnsplitResponse {
  /** Whether the unsplit was successful */
  success: boolean;
  /** Parent transaction ID that was restored */
  parent_id: UUID;
  /** Number of sub-transactions deleted */
  deleted_count: number;
  /** Whether the parent was restored (always true on success) */
  parent_restored: boolean;
  /** Status the parent was restored to */
  restored_status: string;
}
