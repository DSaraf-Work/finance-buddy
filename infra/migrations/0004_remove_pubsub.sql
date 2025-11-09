-- Migration: Remove Google Pub/Sub Support
-- Created: 2025-11-09
-- Description: Removes all Gmail push notification (Pub/Sub) related tables and columns

-- ============================================================================
-- 1. Drop RLS Policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own watch subscriptions" ON fb_gmail_watch_subscriptions;
DROP POLICY IF EXISTS "Users can update their own watch subscriptions" ON fb_gmail_watch_subscriptions;
DROP POLICY IF EXISTS "Service role can manage all watch subscriptions" ON fb_gmail_watch_subscriptions;

DROP POLICY IF EXISTS "Users can view their own webhook logs" ON fb_webhook_logs;
DROP POLICY IF EXISTS "Service role can manage all webhook logs" ON fb_webhook_logs;

-- ============================================================================
-- 2. Drop Indexes
-- ============================================================================

DROP INDEX IF EXISTS idx_watch_subscriptions_user;
DROP INDEX IF EXISTS idx_watch_subscriptions_status;
DROP INDEX IF EXISTS idx_watch_subscriptions_expiring;

DROP INDEX IF EXISTS idx_webhook_logs_received;
DROP INDEX IF EXISTS idx_webhook_logs_email;

DROP INDEX IF EXISTS idx_gmail_connections_watch_enabled;

-- ============================================================================
-- 3. Drop Tables
-- ============================================================================

DROP TABLE IF EXISTS fb_gmail_watch_subscriptions CASCADE;
DROP TABLE IF EXISTS fb_webhook_logs CASCADE;

-- ============================================================================
-- 4. Remove Columns from fb_gmail_connections
-- ============================================================================

ALTER TABLE fb_gmail_connections
  DROP COLUMN IF EXISTS last_history_id,
  DROP COLUMN IF EXISTS watch_enabled,
  DROP COLUMN IF EXISTS watch_setup_at,
  DROP COLUMN IF EXISTS last_watch_error;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Note: This migration removes all Google Pub/Sub push notification support.
-- The system now relies solely on polling-based auto-sync.

