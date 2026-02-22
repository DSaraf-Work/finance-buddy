-- Finance Buddy - Initial Schema
-- Migration: 0001_init.sql
-- Note: Original table names fb_emails, fb_extracted_transactions, fb_jobs were renamed/dropped
--       during early development. This file reflects the current (renamed) table names.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- Gmail Connections
-- ============================================================================

CREATE TABLE IF NOT EXISTS fb_gmail_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  google_user_id TEXT NOT NULL,
  granted_scopes TEXT[] NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  token_type TEXT,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, email_address)
);

-- ============================================================================
-- Emails (fetched from Gmail)
-- Originally named fb_emails; renamed to fb_emails_fetched.
-- ============================================================================

CREATE TABLE IF NOT EXISTS fb_emails_fetched (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_user_id TEXT NOT NULL,
  connection_id UUID REFERENCES fb_gmail_connections(id) ON DELETE SET NULL,
  email_address TEXT NOT NULL,
  message_id TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  from_address TEXT,
  to_addresses TEXT[],
  subject TEXT,
  snippet TEXT,
  internal_date TIMESTAMPTZ,
  plain_body TEXT,
  error_reason TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, google_user_id, message_id)
);

CREATE INDEX IF NOT EXISTS fb_emails_fetched_user_date_idx ON fb_emails_fetched(user_id, internal_date DESC);
CREATE INDEX IF NOT EXISTS fb_emails_fetched_user_google_date_idx ON fb_emails_fetched(user_id, google_user_id, internal_date DESC);

-- ============================================================================
-- Processed Transactions (extracted from emails)
-- Originally named fb_extracted_transactions; renamed to fb_emails_processed.
-- ============================================================================

CREATE TABLE IF NOT EXISTS fb_emails_processed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_user_id TEXT NOT NULL,
  connection_id UUID REFERENCES fb_gmail_connections(id) ON DELETE SET NULL,
  email_row_id UUID REFERENCES fb_emails_fetched(id) ON DELETE CASCADE,
  txn_time TIMESTAMPTZ,
  amount NUMERIC(18,2),
  currency TEXT,
  direction TEXT CHECK (direction IN ('debit', 'credit')),
  merchant_name TEXT,
  merchant_normalized TEXT,
  category TEXT,
  account_hint TEXT,
  reference_id TEXT,
  location TEXT,
  confidence NUMERIC(3,2),
  extraction_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fb_txn_user_time_idx ON fb_emails_processed(user_id, txn_time DESC);
CREATE INDEX IF NOT EXISTS fb_txn_user_google_time_idx ON fb_emails_processed(user_id, google_user_id, txn_time DESC);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE fb_gmail_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_emails_fetched ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_emails_processed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own connections" ON fb_gmail_connections FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own emails"      ON fb_emails_fetched   FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own txns"        ON fb_emails_processed FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
