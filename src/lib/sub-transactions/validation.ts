/**
 * Sub-Transaction Validation
 *
 * Client-side and server-side validation for sub-transactions.
 * Database-level triggers provide additional enforcement.
 *
 * @module sub-transactions/validation
 */

import {
  SUB_TRANSACTION_LIMITS,
  CreateSubTransactionInput,
  UpdateSubTransactionInput,
  SubTransactionValidation,
} from '@/types/sub-transactions';

// ============================================================================
// VALIDATION ERRORS
// ============================================================================

export class SubTransactionValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public field?: string
  ) {
    super(message);
    this.name = 'SubTransactionValidationError';
  }
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Validate a single sub-transaction input
 *
 * @throws SubTransactionValidationError if validation fails
 */
export function validateSubTransactionInput(
  input: CreateSubTransactionInput,
  index?: number
): void {
  const prefix = index !== undefined ? `Item ${index + 1}: ` : '';

  // Amount is required and must be positive
  if (input.amount === undefined || input.amount === null) {
    throw new SubTransactionValidationError(
      `${prefix}Amount is required`,
      'AMOUNT_REQUIRED',
      'amount'
    );
  }

  if (typeof input.amount !== 'number' || isNaN(input.amount)) {
    throw new SubTransactionValidationError(
      `${prefix}Amount must be a number`,
      'AMOUNT_INVALID',
      'amount'
    );
  }

  if (input.amount <= 0) {
    throw new SubTransactionValidationError(
      `${prefix}Amount must be greater than 0`,
      'AMOUNT_POSITIVE',
      'amount'
    );
  }

  // Category is optional but if provided must be non-empty string
  if (input.category !== undefined && input.category !== null) {
    if (typeof input.category !== 'string') {
      throw new SubTransactionValidationError(
        `${prefix}Category must be a string`,
        'CATEGORY_INVALID',
        'category'
      );
    }
  }

  // Merchant name is optional but if provided must be non-empty string
  if (input.merchant_name !== undefined && input.merchant_name !== null) {
    if (typeof input.merchant_name !== 'string') {
      throw new SubTransactionValidationError(
        `${prefix}Merchant name must be a string`,
        'MERCHANT_INVALID',
        'merchant_name'
      );
    }
  }

  // User notes is optional
  if (input.user_notes !== undefined && input.user_notes !== null) {
    if (typeof input.user_notes !== 'string') {
      throw new SubTransactionValidationError(
        `${prefix}User notes must be a string`,
        'NOTES_INVALID',
        'user_notes'
      );
    }
  }
}

/**
 * Validate update input for a sub-transaction
 *
 * @throws SubTransactionValidationError if validation fails
 */
export function validateUpdateInput(input: UpdateSubTransactionInput): void {
  // At least one field must be provided
  const hasField =
    input.amount !== undefined ||
    input.category !== undefined ||
    input.merchant_name !== undefined ||
    input.user_notes !== undefined;

  if (!hasField) {
    throw new SubTransactionValidationError(
      'At least one field must be provided for update',
      'UPDATE_EMPTY'
    );
  }

  // Validate amount if provided
  if (input.amount !== undefined && input.amount !== null) {
    if (typeof input.amount !== 'number' || isNaN(input.amount)) {
      throw new SubTransactionValidationError(
        'Amount must be a number',
        'AMOUNT_INVALID',
        'amount'
      );
    }

    if (input.amount <= 0) {
      throw new SubTransactionValidationError(
        'Amount must be greater than 0',
        'AMOUNT_POSITIVE',
        'amount'
      );
    }
  }
}

/**
 * Validate bulk create request
 *
 * @throws SubTransactionValidationError if validation fails
 */
export function validateBulkCreateRequest(
  items: CreateSubTransactionInput[]
): void {
  // Must be an array
  if (!Array.isArray(items)) {
    throw new SubTransactionValidationError(
      'Items must be an array',
      'ITEMS_NOT_ARRAY',
      'items'
    );
  }

  // Check count limits
  if (items.length < SUB_TRANSACTION_LIMITS.MIN_COUNT) {
    throw new SubTransactionValidationError(
      `At least ${SUB_TRANSACTION_LIMITS.MIN_COUNT} sub-transactions are required`,
      'ITEMS_TOO_FEW',
      'items'
    );
  }

  if (items.length > SUB_TRANSACTION_LIMITS.MAX_COUNT) {
    throw new SubTransactionValidationError(
      `Maximum ${SUB_TRANSACTION_LIMITS.MAX_COUNT} sub-transactions allowed`,
      'ITEMS_TOO_MANY',
      'items'
    );
  }

  // Validate each item
  items.forEach((item, index) => {
    validateSubTransactionInput(item, index);
  });
}

// ============================================================================
// AMOUNT VALIDATION
// ============================================================================

/**
 * Check if sub-transaction amounts match parent (within tolerance)
 */
export function isAmountValid(
  parentAmount: number | null,
  subTotal: number
): boolean {
  if (parentAmount === null) {
    // If parent has no amount, any split is valid
    return true;
  }
  return Math.abs(parentAmount - subTotal) <= SUB_TRANSACTION_LIMITS.TOLERANCE;
}

/**
 * Build validation result with human-readable message
 */
export function buildValidationResult(
  parentAmount: number | null,
  subTotal: number,
  subCount: number
): SubTransactionValidation {
  const difference =
    parentAmount !== null ? parentAmount - subTotal : 0;
  const isValid = isAmountValid(parentAmount, subTotal);

  let message: string;
  if (subCount === 0) {
    message = 'No sub-transactions exist';
  } else if (isValid) {
    message = 'Sub-transaction amounts match parent';
  } else if (parentAmount === null) {
    message = 'Parent transaction has no amount set';
  } else if (difference > 0) {
    message = `Sub-transactions are under by ${formatCurrency(Math.abs(difference))}`;
  } else {
    message = `Sub-transactions exceed parent by ${formatCurrency(Math.abs(difference))}`;
  }

  return {
    is_valid: isValid,
    parent_amount: parentAmount,
    sub_total: subTotal,
    difference,
    sub_count: subCount,
    message,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format currency for display (simple INR formatting)
 */
function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Calculate total from sub-transaction items
 */
export function calculateSubTotal(
  items: Array<{ amount: number }>
): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

/**
 * Check if adding new items would exceed max count
 */
export function wouldExceedMaxCount(
  existingCount: number,
  newCount: number
): boolean {
  return existingCount + newCount > SUB_TRANSACTION_LIMITS.MAX_COUNT;
}
