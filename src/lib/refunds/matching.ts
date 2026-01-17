/**
 * Refund Matching Algorithm
 *
 * Finds potential original transactions for a refund based on:
 * - Merchant name similarity (40% weight)
 * - Amount matching (30% weight)
 * - Time window (20% weight)
 * - Reference/ID matching (10% weight)
 *
 * @module lib/refunds/matching
 */

import { supabaseAdmin } from '@/lib/supabase';
import { TABLE_EMAILS_PROCESSED, TABLE_SUB_TRANSACTIONS } from '@/lib/constants/database';
import type {
  RefundSuggestion,
  RefundMatchScores,
  MatchReason,
  MatchReasonType,
} from '@/types/refunds';
import {
  REFUND_MATCHING_CONFIG,
  calculateMatchScore,
} from '@/types/refunds';

// ============================================================================
// TYPES
// ============================================================================

interface CandidateTransaction {
  id: string;
  amount: number | null;
  merchant_name: string | null;
  merchant_normalized: string | null;
  txn_time: string | null;
  reference_id: string | null;
  category: string | null;
  is_sub_transaction: boolean;
}

interface RefundTransaction {
  id: string;
  amount: number;
  merchant_name: string | null;
  merchant_normalized: string | null;
  txn_time: string | null;
  reference_id: string | null;
}

// ============================================================================
// MAIN MATCHING FUNCTION
// ============================================================================

/**
 * Find potential original transactions for a refund
 *
 * @param userId - User ID for scoping
 * @param refundTxnId - The refund (credit) transaction ID
 * @param options - Matching options
 * @returns Sorted list of suggestions with confidence scores
 */
export async function findRefundMatches(
  userId: string,
  refundTxnId: string,
  options: {
    limit?: number;
    minConfidence?: number;
    timeWindowDays?: number;
    includeSubTransactions?: boolean;
  } = {}
): Promise<RefundSuggestion[]> {
  const {
    limit = REFUND_MATCHING_CONFIG.MAX_SUGGESTIONS,
    minConfidence = REFUND_MATCHING_CONFIG.MIN_SUGGESTION_CONFIDENCE,
    timeWindowDays = REFUND_MATCHING_CONFIG.DEFAULT_TIME_WINDOW_DAYS,
    includeSubTransactions = true,
  } = options;

  // Get the refund transaction
  const { data: refundTxn, error: refundError } = await supabaseAdmin
    .from(TABLE_EMAILS_PROCESSED)
    .select('id, amount, merchant_name, merchant_normalized, txn_time, reference_id')
    .eq('id', refundTxnId)
    .eq('user_id', userId)
    .single();

  if (refundError || !refundTxn) {
    throw new Error('Refund transaction not found');
  }

  // Validate it's a credit (refund)
  const refundAmount = Math.abs(Number(refundTxn.amount) || 0);
  if (refundAmount <= 0) {
    throw new Error('Invalid refund amount');
  }

  const refund: RefundTransaction = {
    id: refundTxn.id,
    amount: refundAmount,
    merchant_name: refundTxn.merchant_name,
    merchant_normalized: refundTxn.merchant_normalized,
    txn_time: refundTxn.txn_time,
    reference_id: refundTxn.reference_id,
  };

  // Calculate time window
  const refundDate = refundTxn.txn_time ? new Date(refundTxn.txn_time) : new Date();
  const windowStart = new Date(refundDate);
  windowStart.setDate(windowStart.getDate() - timeWindowDays);

  // Find candidate debit transactions
  const candidates: CandidateTransaction[] = [];

  // Get parent transactions (debits only)
  const { data: parentTxns } = await supabaseAdmin
    .from(TABLE_EMAILS_PROCESSED)
    .select('id, amount, merchant_name, merchant_normalized, txn_time, reference_id, category')
    .eq('user_id', userId)
    .eq('direction', 'debit')
    .gte('txn_time', windowStart.toISOString())
    .lte('txn_time', refundDate.toISOString())
    .not('id', 'eq', refundTxnId);

  if (parentTxns) {
    for (const txn of parentTxns) {
      candidates.push({
        ...txn,
        is_sub_transaction: false,
      });
    }
  }

  // Get sub-transactions if enabled
  if (includeSubTransactions) {
    const { data: subTxns } = await supabaseAdmin
      .from(TABLE_SUB_TRANSACTIONS)
      .select('id, amount, merchant_name, txn_time, category')
      .eq('user_id', userId)
      .eq('direction', 'debit')
      .gte('txn_time', windowStart.toISOString())
      .lte('txn_time', refundDate.toISOString());

    if (subTxns) {
      for (const sub of subTxns) {
        candidates.push({
          id: sub.id,
          amount: sub.amount,
          merchant_name: sub.merchant_name,
          merchant_normalized: null, // Sub-transactions don't have normalized
          txn_time: sub.txn_time,
          reference_id: null, // Sub-transactions don't have reference_id
          category: sub.category,
          is_sub_transaction: true,
        });
      }
    }
  }

  // Score each candidate
  const suggestions: RefundSuggestion[] = [];

  for (const candidate of candidates) {
    const { scores, reasons } = scoreCandidate(refund, candidate);
    const confidenceScore = calculateMatchScore(scores);

    if (confidenceScore >= minConfidence) {
      suggestions.push({
        candidate_transaction_id: candidate.id,
        is_sub_transaction: candidate.is_sub_transaction,
        confidence_score: confidenceScore,
        match_reasons: reasons,
        scores,
      });
    }
  }

  // Sort by confidence descending
  suggestions.sort((a, b) => b.confidence_score - a.confidence_score);

  // Return top N
  return suggestions.slice(0, limit);
}

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Score a candidate transaction against the refund
 */
function scoreCandidate(
  refund: RefundTransaction,
  candidate: CandidateTransaction
): { scores: RefundMatchScores; reasons: MatchReason[] } {
  const reasons: MatchReason[] = [];

  // Merchant score
  const merchantScore = scoreMerchant(refund, candidate, reasons);

  // Amount score
  const amountScore = scoreAmount(refund.amount, candidate.amount, reasons);

  // Time score
  const timeScore = scoreTimeWindow(refund.txn_time, candidate.txn_time, reasons);

  // Reference score
  const referenceScore = scoreReference(refund.reference_id, candidate.reference_id, reasons);

  return {
    scores: {
      merchant_score: merchantScore,
      amount_score: amountScore,
      time_score: timeScore,
      reference_score: referenceScore,
    },
    reasons,
  };
}

/**
 * Score merchant name similarity
 */
function scoreMerchant(
  refund: RefundTransaction,
  candidate: CandidateTransaction,
  reasons: MatchReason[]
): number {
  // Check normalized names first
  if (refund.merchant_normalized && candidate.merchant_normalized) {
    if (refund.merchant_normalized.toLowerCase() === candidate.merchant_normalized.toLowerCase()) {
      reasons.push({
        type: 'merchant_match',
        description: `Merchant match: ${refund.merchant_normalized}`,
        score: 100,
      });
      return 100;
    }
  }

  // Check raw merchant names
  const refundMerchant = (refund.merchant_name || '').toLowerCase().trim();
  const candidateMerchant = (candidate.merchant_name || '').toLowerCase().trim();

  if (!refundMerchant || !candidateMerchant) {
    return 0;
  }

  // Exact match
  if (refundMerchant === candidateMerchant) {
    reasons.push({
      type: 'merchant_match',
      description: `Exact merchant match: ${candidate.merchant_name}`,
      score: 100,
    });
    return 100;
  }

  // Fuzzy match using simple containment
  if (refundMerchant.includes(candidateMerchant) || candidateMerchant.includes(refundMerchant)) {
    reasons.push({
      type: 'merchant_similar',
      description: `Similar merchant: ${candidate.merchant_name}`,
      score: 80,
    });
    return 80;
  }

  // Check first significant words match
  const refundWords = refundMerchant.split(/\s+/).filter((w) => w.length > 2);
  const candidateWords = candidateMerchant.split(/\s+/).filter((w) => w.length > 2);

  const matchingWords = refundWords.filter((w) => candidateWords.includes(w));
  if (matchingWords.length > 0) {
    const score = Math.min(70, matchingWords.length * 25);
    reasons.push({
      type: 'merchant_similar',
      description: `Merchant words match: ${matchingWords.join(', ')}`,
      score,
    });
    return score;
  }

  return 0;
}

/**
 * Score amount matching
 */
function scoreAmount(
  refundAmount: number,
  candidateAmount: number | null,
  reasons: MatchReason[]
): number {
  if (!candidateAmount || candidateAmount <= 0) {
    return 0;
  }

  const absCandidate = Math.abs(candidateAmount);
  const diff = Math.abs(refundAmount - absCandidate);
  const percentDiff = diff / absCandidate;

  // Exact match (within 1%)
  if (percentDiff <= REFUND_MATCHING_CONFIG.AMOUNT_EXACT_TOLERANCE) {
    reasons.push({
      type: 'exact_amount',
      description: `Exact amount match: ₹${absCandidate.toFixed(2)}`,
      score: 100,
    });
    return 100;
  }

  // Close match (within 10%)
  if (percentDiff <= REFUND_MATCHING_CONFIG.AMOUNT_CLOSE_TOLERANCE) {
    const score = Math.round(100 - percentDiff * 500); // 90-100 range
    reasons.push({
      type: 'close_amount',
      description: `Close amount: ₹${absCandidate.toFixed(2)} (diff: ${(percentDiff * 100).toFixed(1)}%)`,
      score,
    });
    return score;
  }

  // Partial refund possible (refund < original)
  if (refundAmount < absCandidate) {
    const ratio = refundAmount / absCandidate;
    if (ratio >= 0.1) {
      // At least 10% of original
      const score = Math.round(ratio * 60); // Up to 60 points
      reasons.push({
        type: 'close_amount',
        description: `Partial refund possible: ₹${refundAmount.toFixed(2)} of ₹${absCandidate.toFixed(2)}`,
        score,
      });
      return score;
    }
  }

  return 0;
}

/**
 * Score time window proximity
 */
function scoreTimeWindow(
  refundTime: string | null,
  candidateTime: string | null,
  reasons: MatchReason[]
): number {
  if (!refundTime || !candidateTime) {
    return 30; // Give some default score if times are unknown
  }

  const refundDate = new Date(refundTime);
  const candidateDate = new Date(candidateTime);

  // Refund must be after purchase
  if (candidateDate > refundDate) {
    return 0;
  }

  const daysDiff = Math.floor(
    (refundDate.getTime() - candidateDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Within 7 days - excellent
  if (daysDiff <= 7) {
    reasons.push({
      type: 'time_window',
      description: `Recent purchase: ${daysDiff} days ago`,
      score: 100,
    });
    return 100;
  }

  // Within 30 days - good
  if (daysDiff <= 30) {
    const score = Math.round(100 - (daysDiff - 7) * 2);
    reasons.push({
      type: 'time_window',
      description: `Within 30 days: ${daysDiff} days ago`,
      score,
    });
    return score;
  }

  // Within 90 days - moderate
  if (daysDiff <= 90) {
    const score = Math.round(50 - (daysDiff - 30) * 0.5);
    reasons.push({
      type: 'time_window',
      description: `Within 90 days: ${daysDiff} days ago`,
      score,
    });
    return Math.max(20, score);
  }

  // Older - low score
  reasons.push({
    type: 'time_window',
    description: `Older purchase: ${daysDiff} days ago`,
    score: 10,
  });
  return 10;
}

/**
 * Score reference/transaction ID matching
 */
function scoreReference(
  refundRef: string | null,
  candidateRef: string | null,
  reasons: MatchReason[]
): number {
  if (!refundRef || !candidateRef) {
    return 0;
  }

  const refundRefLower = refundRef.toLowerCase().trim();
  const candidateRefLower = candidateRef.toLowerCase().trim();

  // Exact match
  if (refundRefLower === candidateRefLower) {
    reasons.push({
      type: 'reference_match',
      description: `Reference match: ${candidateRef}`,
      score: 100,
    });
    return 100;
  }

  // Partial match (one contains the other)
  if (refundRefLower.includes(candidateRefLower) || candidateRefLower.includes(refundRefLower)) {
    reasons.push({
      type: 'reference_match',
      description: `Partial reference match`,
      score: 70,
    });
    return 70;
  }

  return 0;
}
