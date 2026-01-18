/**
 * Refunds Module
 *
 * Smart refund linking system - exports all refund-related functionality.
 *
 * @module lib/refunds
 */

// Matching algorithm
export { findRefundMatches } from './matching';

// Mappers
export {
  mapRefundLinkToPublic,
  mapRefundLinksToPublic,
  buildRefundStatus,
  buildEmptyRefundStatus,
  createRefundAggregateMap,
  getAggregateFromMap,
} from './mappers';
