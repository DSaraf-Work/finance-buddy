# Finance Buddy — ADRs

## ADR-01: Supabase Auth with secure cookies
Accepted. Dual-cookie with 6‑month sliding refresh.

## ADR-02: Gmail OAuth-only
Accepted. Store tokens + granted scopes; PKCE; HTTPS only.

## ADR-03: Manual Sync Only
Accepted. No watch/history/polling. Use messages.list + messages.get.

## ADR-04: Idempotency Key
Accepted. UNIQUE (user_id, google_user_id, message_id) on fb_emails.

## ADR-05: internal_date Fidelity
Accepted. internal_date = Gmail internalDate (ms→UTC).

## ADR-06: Hard Delete Connections
Accepted. On disconnect: revoke token then DELETE connection; emails/txns persist, FKs set NULL.

## ADR-07: RLS
Accepted. All fb_ tables enforce user_id = auth.uid().
