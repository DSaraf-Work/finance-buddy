/**
 * Core Splitwise validation utilities
 * Shared logic for checking expense status across the application
 */

import { fetchSplitwiseExpense, SPLITWISE_API_KEY } from './client';

export interface SplitwiseExpenseCheckResult {
  exists: boolean;
  reason?: 'not_found' | 'deleted' | 'error';
  deletedAt?: string;
}

/**
 * Check if a Splitwise expense still exists
 * Returns false if expense was deleted or not found
 * Returns true on error (fail-safe: assumes link is valid)
 *
 * @param expenseId - The Splitwise expense ID to check
 * @returns Object indicating if the expense exists
 */
export async function checkSplitwiseExpenseExists(
  expenseId: string
): Promise<SplitwiseExpenseCheckResult> {
  if (!expenseId) {
    return { exists: false, reason: 'not_found' };
  }

  if (!SPLITWISE_API_KEY) {
    console.warn('Splitwise API key not configured, skipping validation');
    return { exists: true }; // Assume it exists if we can't check
  }

  const result = await fetchSplitwiseExpense(expenseId);

  if (result.error) {
    // On API error, assume expense exists to be safe
    if (result.statusCode === 404) {
      return { exists: false, reason: 'not_found' };
    }
    console.error(`Splitwise API error checking expense ${expenseId}:`, result.error);
    return { exists: true }; // Fail-safe
  }

  // Check if expense was deleted (soft delete in Splitwise)
  if (result.data?.deleted_at) {
    return { 
      exists: false, 
      reason: 'deleted', 
      deletedAt: result.data.deleted_at 
    };
  }

  // Expense exists and is not deleted
  return { exists: true };
}
