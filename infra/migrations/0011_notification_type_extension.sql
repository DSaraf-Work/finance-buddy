-- ============================================================================
-- Finance Buddy - Extend fb_notifications type constraint
-- Migration: 0011_notification_type_extension.sql
-- ============================================================================
-- Add 'transaction_created' to the allowed notification types.
-- This enables the in-app notification system for new transactions.
-- ============================================================================

ALTER TABLE fb_notifications
  DROP CONSTRAINT IF EXISTS fb_notifications_type_check;

ALTER TABLE fb_notifications
  ADD CONSTRAINT fb_notifications_type_check
  CHECK (type IN (
    'transaction_processed',
    'sync_error',
    'system_alert',
    'transaction_created'
  ));
