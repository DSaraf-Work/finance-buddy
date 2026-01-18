/**
 * Refund Types
 *
 * Type definitions for the smart refunds feature (Phase 3).
 * Supports M:N relationships between refund credits and original debits.
 *
 * @module types/refunds
 */

import type { UUID } from './dto';

// ============================================================================
// REFUND LINK TYPES
// ============================================================================

/**
 * Refund type classification
 */
export type RefundType = 'full' | 'partial' | 'combined';

/**
 * How the refund link was created
 */
export type RefundMatchMethod = 'manual' | 'ai_suggestion' | 'auto_detected';

/**
 * Refund link database row
 */
export interface RefundLink {
  id: UUID;
  user_id: UUID;
  refund_transaction_id: UUID;
  original_transaction_id: UUID | null;
  original_sub_transaction_id: UUID | null;
  allocated_amount: number;
  refund_type: RefundType;
  match_confidence_score: number | null;
  match_method: RefundMatchMethod;
  match_reasons: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Refund link for public API responses
 */
export interface RefundLinkPublic {
  id: UUID;
  refund_transaction_id: UUID;
  original_transaction_id: UUID | null;
  original_sub_transaction_id: UUID | null;
  allocated_amount: number;
  refund_type: RefundType;
  match_confidence_score: number | null;
  match_method: RefundMatchMethod;
  match_reasons: string[];
  created_at: string;
}

// ============================================================================
// REFUND STATUS TYPES
// ============================================================================

/**
 * Aggregated refund status for a transaction/sub-transaction
 */
export interface RefundStatus {
  /** Total amount refunded across all linked refunds */
  total_refunded: number;
  /** Number of refund links */
  refund_count: number;
  /** Original amount of the transaction */
  original_amount: number;
  /** Remaining amount that can still be refunded */
  remaining_amount: number;
  /** Whether fully refunded */
  is_fully_refunded: boolean;
  /** List of refund links (optional, loaded separately) */
  refund_links?: RefundLinkPublic[];
}

/**
 * Refund aggregate view row
 */
export interface RefundLinkAggregate {
  original_id: string;
  original_transaction_id: UUID | null;
  original_sub_transaction_id: UUID | null;
  user_id: UUID;
  total_refunded: number;
  refund_count: number;
  refund_transaction_ids: UUID[];
  last_refund_at: string;
}

// ============================================================================
// REFUND SUGGESTION TYPES
// ============================================================================

/**
 * AI-suggested refund match
 */
export interface RefundSuggestion {
  /** Candidate original transaction ID */
  candidate_transaction_id: UUID;
  /** Whether this is a sub-transaction */
  is_sub_transaction: boolean;
  /** Confidence score (0-100) */
  confidence_score: number;
  /** Reasons why this match was suggested */
  match_reasons: MatchReason[];
  /** Individual match scores */
  scores: RefundMatchScores;
}

/**
 * Individual match scores for suggestion
 */
export interface RefundMatchScores {
  /** Merchant name similarity (0-100) */
  merchant_score: number;
  /** Amount match score (0-100) */
  amount_score: number;
  /** Time window score (0-100) */
  time_score: number;
  /** Reference/transaction ID match (0-100) */
  reference_score: number;
}

/**
 * Match reason categories
 */
export type MatchReasonType =
  | 'merchant_match'
  | 'merchant_similar'
  | 'exact_amount'
  | 'close_amount'
  | 'time_window'
  | 'reference_match'
  | 'category_match';

/**
 * Individual match reason
 */
export interface MatchReason {
  type: MatchReasonType;
  description: string;
  score: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Create refund link request
 */
export interface CreateRefundLinkRequest {
  /** The refund (credit) transaction ID */
  refund_transaction_id: UUID;
  /** Amount to allocate from this refund */
  allocated_amount: number;
  /** Refund type classification */
  refund_type?: RefundType;
  /** Match method (defaults to 'manual') */
  match_method?: RefundMatchMethod;
  /** Confidence score (for AI suggestions) */
  match_confidence_score?: number;
  /** Reasons for the match */
  match_reasons?: string[];
}

/**
 * Create refund link response
 */
export interface CreateRefundLinkResponse {
  link: RefundLinkPublic;
  original_status: RefundStatus;
}

/**
 * List refund links response
 */
export interface ListRefundLinksResponse {
  links: RefundLinkPublic[];
  count: number;
  status: RefundStatus;
}

/**
 * Get refund suggestions request
 */
export interface GetRefundSuggestionsRequest {
  /** Maximum number of suggestions to return */
  limit?: number;
  /** Minimum confidence score to include */
  min_confidence?: number;
  /** Time window in days to search */
  time_window_days?: number;
}

/**
 * Get refund suggestions response
 */
export interface GetRefundSuggestionsResponse {
  suggestions: RefundSuggestion[];
  refund_transaction: {
    id: UUID;
    amount: number;
    merchant_name: string | null;
    txn_time: string | null;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Refund matching configuration
 */
export const REFUND_MATCHING_CONFIG = {
  /** Weight for merchant name matching (0-1) */
  MERCHANT_WEIGHT: 0.40,
  /** Weight for amount matching (0-1) */
  AMOUNT_WEIGHT: 0.30,
  /** Weight for time window matching (0-1) */
  TIME_WEIGHT: 0.20,
  /** Weight for reference matching (0-1) */
  REFERENCE_WEIGHT: 0.10,

  /** Default time window in days to search for matches */
  DEFAULT_TIME_WINDOW_DAYS: 90,
  /** Maximum time window in days */
  MAX_TIME_WINDOW_DAYS: 365,

  /** Amount tolerance percentage for "exact" match */
  AMOUNT_EXACT_TOLERANCE: 0.01, // 1%
  /** Amount tolerance percentage for "close" match */
  AMOUNT_CLOSE_TOLERANCE: 0.10, // 10%

  /** Minimum confidence score for auto-detection */
  AUTO_DETECT_THRESHOLD: 90,
  /** Minimum confidence score to show in suggestions */
  MIN_SUGGESTION_CONFIDENCE: 30,

  /** Maximum suggestions to return */
  MAX_SUGGESTIONS: 10,
} as const;

/**
 * Calculate overall match score from individual scores
 */
export function calculateMatchScore(scores: RefundMatchScores): number {
  const { MERCHANT_WEIGHT, AMOUNT_WEIGHT, TIME_WEIGHT, REFERENCE_WEIGHT } =
    REFUND_MATCHING_CONFIG;

  return Math.round(
    scores.merchant_score * MERCHANT_WEIGHT +
      scores.amount_score * AMOUNT_WEIGHT +
      scores.time_score * TIME_WEIGHT +
      scores.reference_score * REFERENCE_WEIGHT
  );
}
