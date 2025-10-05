-- ============================================================================
-- Finance Buddy - Auto-Sync with Notifications Migration
-- Migration: 0002_notifications_and_auto_sync.sql
-- ============================================================================

-- ============================================================================
-- Auto-Sync Configuration
-- ============================================================================

-- Add auto-sync columns to fb_gmail_connections
ALTER TABLE fb_gmail_connections
ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_sync_interval_minutes INTEGER DEFAULT 15 CHECK (auto_sync_interval_minutes >= 5),
ADD COLUMN IF NOT EXISTS last_auto_sync_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_gmail_connections_auto_sync 
ON fb_gmail_connections(auto_sync_enabled, last_auto_sync_at) 
WHERE auto_sync_enabled = true;

-- ============================================================================
-- Sync Filters Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS fb_sync_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES fb_gmail_connections(id) ON DELETE CASCADE,
  
  -- Filter configuration
  filter_name TEXT NOT NULL,
  filter_type TEXT NOT NULL CHECK (filter_type IN ('sender', 'subject', 'label', 'query')),
  filter_value TEXT NOT NULL,
  gmail_query TEXT NOT NULL,
  
  -- Status
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  sync_count INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(connection_id, filter_name)
);

CREATE INDEX IF NOT EXISTS idx_sync_filters_connection 
ON fb_sync_filters(connection_id) WHERE enabled = true;

CREATE INDEX IF NOT EXISTS idx_sync_filters_user 
ON fb_sync_filters(user_id);

-- RLS policies for sync filters
ALTER TABLE fb_sync_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sync filters"
ON fb_sync_filters FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sync filters"
ON fb_sync_filters FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync filters"
ON fb_sync_filters FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync filters"
ON fb_sync_filters FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- Notifications Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS fb_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification content
  type TEXT NOT NULL CHECK (type IN ('transaction_processed', 'sync_error', 'system_alert')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entities
  transaction_id UUID REFERENCES fb_extracted_transactions(id) ON DELETE CASCADE,
  email_id UUID REFERENCES fb_emails(id) ON DELETE CASCADE,
  
  -- Action link
  action_url TEXT,
  action_label TEXT,
  
  -- Status
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON fb_notifications(user_id, read, created_at DESC) 
WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_user_all 
ON fb_notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_transaction 
ON fb_notifications(transaction_id) 
WHERE transaction_id IS NOT NULL;

-- RLS policies for notifications
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
-- Add missing columns to fb_extracted_transactions (if not exists)
-- ============================================================================

ALTER TABLE fb_extracted_transactions
ADD COLUMN IF NOT EXISTS account_type TEXT,
ADD COLUMN IF NOT EXISTS transaction_type TEXT CHECK (transaction_type IN ('Dr', 'Cr')),
ADD COLUMN IF NOT EXISTS ai_notes TEXT,
ADD COLUMN IF NOT EXISTS user_notes TEXT,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_extracted_transactions_status 
ON fb_extracted_transactions(user_id, status, created_at DESC);

-- ============================================================================
-- Function to auto-delete old notifications (optional)
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM fb_notifications
  WHERE read = true 
  AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE fb_sync_filters IS 'Email filter configurations for auto-sync';
COMMENT ON TABLE fb_notifications IS 'Web notifications for user alerts';
COMMENT ON COLUMN fb_notifications.type IS 'Notification type: transaction_processed, sync_error, system_alert';
COMMENT ON COLUMN fb_notifications.read IS 'Whether the notification has been read by the user';
COMMENT ON COLUMN fb_gmail_connections.auto_sync_enabled IS 'Whether auto-sync is enabled for this connection';
COMMENT ON COLUMN fb_gmail_connections.auto_sync_interval_minutes IS 'Auto-sync polling interval in minutes (minimum 5)';
COMMENT ON COLUMN fb_gmail_connections.last_auto_sync_at IS 'Timestamp of last auto-sync execution';

