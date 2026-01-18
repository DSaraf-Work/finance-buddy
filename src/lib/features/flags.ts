/**
 * Feature Flags System
 *
 * Centralized feature flag management for independent feature deployment.
 * Each phase can be enabled/disabled independently via environment variables.
 *
 * Usage:
 * ```ts
 * import { isFeatureEnabled, getFeatureFlags } from '@/lib/features/flags';
 *
 * // Check single feature
 * if (isFeatureEnabled('RECEIPT_PARSING')) {
 *   // Show receipt upload button
 * }
 *
 * // Get all flags (useful for passing to client)
 * const flags = getFeatureFlags();
 * ```
 */

// ============================================================================
// FEATURE FLAG DEFINITIONS
// ============================================================================

/**
 * All available feature flags
 */
export type FeatureFlag =
  | 'SUB_TRANSACTIONS'
  | 'RECEIPT_PARSING'
  | 'SMART_REFUNDS';

/**
 * Default feature flag states
 * These are the base states before environment variable overrides
 */
const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
  /** Phase 1: Sub-transactions - always enabled after migration 0006 */
  SUB_TRANSACTIONS: true,
  /** Phase 2: Receipt parsing - disabled until migration 0007 and testing */
  RECEIPT_PARSING: false,
  /** Phase 3: Smart refunds - disabled until migration 0008 and testing */
  SMART_REFUNDS: false,
} as const;

// ============================================================================
// FEATURE FLAG FUNCTIONS
// ============================================================================

/**
 * Get all feature flags with environment variable overrides.
 *
 * Environment variables:
 * - NEXT_PUBLIC_ENABLE_SUB_TRANSACTIONS (default: true)
 * - NEXT_PUBLIC_ENABLE_RECEIPT_PARSING (default: false)
 * - NEXT_PUBLIC_ENABLE_SMART_REFUNDS (default: false)
 *
 * @returns Record of all feature flags and their enabled states
 */
export function getFeatureFlags(): Record<FeatureFlag, boolean> {
  return {
    SUB_TRANSACTIONS:
      process.env.NEXT_PUBLIC_ENABLE_SUB_TRANSACTIONS !== 'false',
    RECEIPT_PARSING:
      process.env.NEXT_PUBLIC_ENABLE_RECEIPT_PARSING === 'true',
    SMART_REFUNDS:
      process.env.NEXT_PUBLIC_ENABLE_SMART_REFUNDS === 'true',
  };
}

/**
 * Check if a specific feature is enabled.
 *
 * @param flag - The feature flag to check
 * @returns true if the feature is enabled
 *
 * @example
 * ```ts
 * if (isFeatureEnabled('RECEIPT_PARSING')) {
 *   // Show receipt upload UI
 * }
 * ```
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const flags = getFeatureFlags();
  return flags[flag] ?? DEFAULT_FLAGS[flag];
}

/**
 * Get feature flag for server-side rendering.
 * Use this when you need the flag value during SSR.
 *
 * @param flag - The feature flag to check
 * @returns true if the feature is enabled
 */
export function getServerFeatureFlag(flag: FeatureFlag): boolean {
  return isFeatureEnabled(flag);
}

// ============================================================================
// FEATURE-SPECIFIC HELPERS
// ============================================================================

/**
 * Check if sub-transactions feature is enabled.
 * Shorthand for isFeatureEnabled('SUB_TRANSACTIONS').
 */
export function isSubTransactionsEnabled(): boolean {
  return isFeatureEnabled('SUB_TRANSACTIONS');
}

/**
 * Check if receipt parsing feature is enabled.
 * Shorthand for isFeatureEnabled('RECEIPT_PARSING').
 */
export function isReceiptParsingEnabled(): boolean {
  return isFeatureEnabled('RECEIPT_PARSING');
}

/**
 * Check if smart refunds feature is enabled.
 * Shorthand for isFeatureEnabled('SMART_REFUNDS').
 */
export function isSmartRefundsEnabled(): boolean {
  return isFeatureEnabled('SMART_REFUNDS');
}

// ============================================================================
// REACT HOOK (for client-side usage)
// ============================================================================

/**
 * React hook for accessing feature flags in components.
 *
 * Note: This is a simple implementation. For more complex scenarios
 * (e.g., A/B testing, user-specific flags), consider using a dedicated
 * feature flag service like LaunchDarkly or Unleash.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { SUB_TRANSACTIONS, RECEIPT_PARSING } = useFeatureFlags();
 *
 *   return (
 *     <>
 *       {SUB_TRANSACTIONS && <SubTransactionEditor />}
 *       {RECEIPT_PARSING && <ReceiptUpload />}
 *     </>
 *   );
 * }
 * ```
 */
export function useFeatureFlags(): Record<FeatureFlag, boolean> {
  // In Next.js, NEXT_PUBLIC_ env vars are inlined at build time
  // so this is safe to call on both server and client
  return getFeatureFlags();
}

// Note: FeatureFlag type is exported above via 'export type FeatureFlag = ...'
