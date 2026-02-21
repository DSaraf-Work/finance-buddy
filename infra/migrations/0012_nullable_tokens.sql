-- Migration 0012: Allow NULL on token columns in fb_gmail_connections
--
-- Why: When a Gmail connection is invalidated (invalid_grant / token revoked),
-- resetGmailConnection() needs to clear the token data for security.
-- The original NOT NULL constraints prevent this, causing the reset to
-- silently fail and leaving the connection stuck as 'active' with stale tokens.
--
-- Run manually in the Supabase SQL editor.

alter table fb_gmail_connections
  alter column access_token  drop not null,
  alter column refresh_token drop not null,
  alter column token_expiry  drop not null;
