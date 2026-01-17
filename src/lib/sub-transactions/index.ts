/**
 * Sub-Transactions Module
 *
 * Complete module for sub-transaction management.
 * Provides validation and mapping utilities.
 *
 * @module sub-transactions
 *
 * @example
 * ```typescript
 * import {
 *   validateBulkCreateRequest,
 *   mapSubTransactionToPublic,
 *   buildValidationResult,
 * } from '@/lib/sub-transactions';
 * ```
 */

// Validation
export {
  SubTransactionValidationError,
  validateSubTransactionInput,
  validateUpdateInput,
  validateBulkCreateRequest,
  isAmountValid,
  buildValidationResult,
  calculateSubTotal,
  wouldExceedMaxCount,
} from './validation';

// Mappers
export {
  mapSubTransactionToPublic,
  mapSubTransactionsToPublic,
} from './mappers';
