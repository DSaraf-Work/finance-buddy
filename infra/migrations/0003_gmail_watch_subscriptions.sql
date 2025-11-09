-- Migration: Add Gmail Watch Subscriptions Support
-- Created: 2025-11-08
-- Description: Adds tables and columns for Gmail push notification support

-- ============================================================================
-- 1. Create fb_gmail_watch_subscriptions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS fb_gmail_watch_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES fb_gmail_connections(id) ON DELETE CASCADE,
  
  -- Gmail watch details
  history_id TEXT NOT NULL,
  expiration TIMESTAMPTZ NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'expired', 'failed', 'renewing')),
  last_renewed_at TIMESTAMPTZ,
  renewal_attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(connection_id)
);

-- ============================================================================
-- 2. Create indexes for fb_gmail_watch_subscriptions
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_watch_subscriptions_user 
  ON fb_gmail_watch_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_watch_subscriptions_status 
  ON fb_gmail_watch_subscriptions(status, expiration);

CREATE INDEX IF NOT EXISTS idx_watch_subscriptions_expiring 
  ON fb_gmail_watch_subscriptions(expiration) 
  WHERE status = 'active';

-- ============================================================================
-- 3. Update fb_gmail_connections table
-- ============================================================================

ALTER TABLE fb_gmail_connections
  ADD COLUMN IF NOT EXISTS last_history_id TEXT,
  ADD COLUMN IF NOT EXISTS watch_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS watch_setup_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_watch_error TEXT;

-- Create index for watch-enabled connections
CREATE INDEX IF NOT EXISTS idx_gmail_connections_watch_enabled 
  ON fb_gmail_connections(watch_enabled) 
  WHERE watch_enabled = true;

-- ============================================================================
-- 4. Create fb_webhook_logs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS fb_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_address TEXT NOT NULL,
  history_id TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,
  success BOOLEAN NOT NULL,
  new_messages INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for fb_webhook_logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_received 
  ON fb_webhook_logs(received_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_email 
  ON fb_webhook_logs(email_address, received_at DESC);

-- ============================================================================
-- 5. Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE fb_gmail_watch_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_webhook_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. Create RLS Policies for fb_gmail_watch_subscriptions
-- ============================================================================

CREATE POLICY "Users can view their own watch subscriptions"
  ON fb_gmail_watch_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own watch subscriptions"
  ON fb_gmail_watch_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all watch subscriptions"
  ON fb_gmail_watch_subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 7. Create RLS Policies for fb_webhook_logs
-- ============================================================================

CREATE POLICY "Users can view their own webhook logs"
  ON fb_webhook_logs FOR SELECT
  USING (
    email_address IN (
      SELECT email_address 
      FROM fb_gmail_connections 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all webhook logs"
  ON fb_webhook_logs FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 8. Add comments for documentation
-- ============================================================================

COMMENT ON TABLE fb_gmail_watch_subscriptions IS 
  'Tracks Gmail push notification watch subscriptions';

COMMENT ON COLUMN fb_gmail_watch_subscriptions.history_id IS 
  'Gmail history ID from watch response - used for incremental sync';

COMMENT ON COLUMN fb_gmail_watch_subscriptions.expiration IS 
  'Watch expiration time (Gmail watches expire after 7 days)';

COMMENT ON COLUMN fb_gmail_watch_subscriptions.status IS 
  'Watch status: active, expired, failed, renewing';

COMMENT ON COLUMN fb_gmail_connections.last_history_id IS 
  'Last processed history ID for incremental sync';

COMMENT ON COLUMN fb_gmail_connections.watch_enabled IS 
  'Whether Gmail push notifications are enabled for this connection';

COMMENT ON TABLE fb_webhook_logs IS 
  'Logs all incoming Gmail push notifications from Pub/Sub';

-- ============================================================================
-- Migration Complete
-- ============================================================================

