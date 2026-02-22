-- Finance Buddy - Core Infrastructure Tables
-- Migration: 0005_core_infrastructure.sql
-- Covers tables that were created directly in Supabase without a corresponding
-- local migration file: profiles, fb_config, fb_push_subscriptions, fb_rejected_emails.
-- Also adds columns to fb_emails_fetched that were added after initial creation.

-- ============================================================================
-- Profiles (synced from auth.users via Supabase trigger)
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- App Configuration (key-value store, optionally scoped to a user)
-- ============================================================================

CREATE TABLE IF NOT EXISTS fb_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Global config rows have user_id = NULL; unique key per user (or globally)
CREATE UNIQUE INDEX IF NOT EXISTS fb_config_key_user_idx
  ON fb_config(config_key, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::UUID));

ALTER TABLE fb_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own or global config"
  ON fb_config FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own config"
  ON fb_config FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Web Push Subscriptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS fb_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  expiration_time BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, endpoint)
);

ALTER TABLE fb_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push subscriptions"
  ON fb_push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Rejected Emails (emails that failed extraction / were not financial)
-- ============================================================================

CREATE TABLE IF NOT EXISTS fb_rejected_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_user_id TEXT NOT NULL,
  connection_id UUID NOT NULL REFERENCES fb_gmail_connections(id) ON DELETE CASCADE,
  email_row_id UUID NOT NULL REFERENCES fb_emails_fetched(id) ON DELETE CASCADE,
  rejection_reason TEXT NOT NULL,
  rejection_type TEXT NOT NULL,
  error_details JSONB,
  status TEXT DEFAULT 'REVIEW',
  rejected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (email_row_id)
);

CREATE INDEX IF NOT EXISTS idx_rejected_emails_user ON fb_rejected_emails(user_id, rejected_at DESC);

ALTER TABLE fb_rejected_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rejected emails"
  ON fb_rejected_emails FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- Link columns on fb_emails_fetched (added after initial creation)
-- processed_id → fb_emails_processed
-- rejected_id  → fb_rejected_emails
-- remarks      → free-text notes on fetched email
-- ============================================================================

ALTER TABLE fb_emails_fetched
  ADD COLUMN IF NOT EXISTS remarks TEXT,
  ADD COLUMN IF NOT EXISTS processed_id UUID REFERENCES fb_emails_processed(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejected_id UUID REFERENCES fb_rejected_emails(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_emails_fetched_processed ON fb_emails_fetched(processed_id) WHERE processed_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emails_fetched_rejected  ON fb_emails_fetched(rejected_id)  WHERE rejected_id  IS NOT NULL;
