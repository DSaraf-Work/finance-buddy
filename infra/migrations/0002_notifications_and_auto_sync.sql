-- Finance Buddy - Auto-Sync with Notifications Migration
-- Migration: 0002_notifications_and_auto_sync.sql
-- Note: fb_sync_filters was originally created here but dropped — it is NOT in the DB.
--       fb_notifications schema here reflects the actual DB state (not the original draft).

-- ============================================================================
-- Auto-Sync Configuration (add to fb_gmail_connections)
-- ============================================================================

ALTER TABLE fb_gmail_connections
  ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_sync_interval_minutes INTEGER DEFAULT 15 CHECK (auto_sync_interval_minutes >= 5),
  ADD COLUMN IF NOT EXISTS last_auto_sync_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_gmail_connections_auto_sync
  ON fb_gmail_connections(auto_sync_enabled, last_auto_sync_at)
  WHERE auto_sync_enabled = true;

-- ============================================================================
-- Additional columns on fb_emails_processed (formerly fb_extracted_transactions)
-- ============================================================================

ALTER TABLE fb_emails_processed
  ADD COLUMN IF NOT EXISTS account_type TEXT,
  ADD COLUMN IF NOT EXISTS transaction_type TEXT,
  ADD COLUMN IF NOT EXISTS ai_notes TEXT,
  ADD COLUMN IF NOT EXISTS user_notes TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'REVIEW',
  ADD COLUMN IF NOT EXISTS splitwise_expense_id TEXT;

CREATE INDEX IF NOT EXISTS idx_emails_processed_status
  ON fb_emails_processed(user_id, status, created_at DESC);

-- ============================================================================
-- In-App Notifications
-- Note: This schema reflects the actual DB state. The original draft had different
--       columns (message, transaction_id, action_url, action_label) which were
--       replaced by (body, url, metadata) to support typed notification configs.
-- ============================================================================

CREATE TABLE IF NOT EXISTS fb_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Notification content
  title TEXT NOT NULL,
  subtitle TEXT,
  body TEXT,
  url TEXT,

  -- Classification
  type TEXT NOT NULL DEFAULT 'transaction_created',

  -- State
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Typed metadata (stores entity IDs like transaction_id per notification type)
  metadata JSONB DEFAULT '{}',

  -- Push delivery tracking
  push_sent BOOLEAN DEFAULT false,
  push_sent_at TIMESTAMPTZ,
  push_success_count INTEGER DEFAULT 0,
  push_failure_count INTEGER DEFAULT 0,
  push_error TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON fb_notifications(user_id, read, created_at DESC)
  WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_user_all
  ON fb_notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_metadata_txn
  ON fb_notifications USING GIN (metadata);

-- RLS
ALTER TABLE fb_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON fb_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON fb_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON fb_notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE fb_notifications IS 'In-app notification records. Push delivery tracked via push_sent_* columns.';
COMMENT ON COLUMN fb_notifications.type IS 'Notification type enum (e.g. transaction_created, sync_error, system_alert)';
COMMENT ON COLUMN fb_notifications.metadata IS 'Type-specific payload e.g. {"transaction_id": "uuid"}';
COMMENT ON COLUMN fb_gmail_connections.auto_sync_enabled IS 'Whether auto-sync is enabled for this connection';
COMMENT ON COLUMN fb_gmail_connections.auto_sync_interval_minutes IS 'Auto-sync polling interval in minutes (minimum 5)';
COMMENT ON COLUMN fb_gmail_connections.last_auto_sync_at IS 'Timestamp of last auto-sync execution';
COMMENT ON COLUMN fb_gmail_connections.status IS 'Connection health: active | expired | error';
