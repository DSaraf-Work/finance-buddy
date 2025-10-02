Approved Scope: through L1

# Finance Buddy — PRD + Tech Design

## TL;DR
Finance Buddy connects multiple Gmail accounts via OAuth, lets the user run **manual syncs** over date ranges (with optional sender filters and paging), stores emails with strict idempotency, and provides read/search APIs and DB workbenches. Connections are **hard-deleted** on revoke; data persists. RLS protects all user data.

## Problem & Goals
- Automate collecting financial emails.
- Keep setup simple and device-agnostic.
- Ensure no duplicates across disconnect → reconnect flows.

## Non-Goals (now)
- Gmail push watch/history/polling.
- Device binding, MFA.
- Writing any application code in this builder.

## Architecture Overview
- Frontend: Next.js 15, React 19, TS, Tailwind.
- Backend: Next.js API routes (Node/TS).
- Auth: Supabase Auth (email/password), cookies `Secure` + `HttpOnly`, 6‑month sliding refresh.
- DB: Postgres (Supabase) with RLS.
- Gmail: OAuth-only; `messages.list` + `messages.get`.

```mermaid
C4Context
title Finance Buddy (L0-L1)
Person(user, "User")
System_Boundary(app, "Finance Buddy") {
  System(web, "Next.js Web + API")
  SystemDb(db, "Postgres (Supabase, RLS)")
}
System_Ext(google, "Gmail (OAuth)")
Rel(user, web, "HTTPS + Cookies")
Rel(web, google, "OAuth + Gmail REST")
Rel(web, db, "RLS CRUD")
```

## Data Model (summary)
- `fb_gmail_connections`: tokens, scopes, `google_user_id`, `email_address`. **Hard-delete on disconnect**.
- `fb_emails`: unique per `(user_id, google_user_id, message_id)`. `internal_date` from Gmail `internalDate` (ms→UTC). `connection_id` nullable `ON DELETE SET NULL`.
- `fb_extracted_transactions`: structured rows per email (kept for future phases), includes `google_user_id`.

## Phase L0 (Approved)
- Auth & Sessions
- DB schema & RLS

## Phase L1 (Approved)
- L1.1 OAuth connect/callback & storage (PKCE; store tokens, scopes, `google_user_id`).
- L1.2 Manual Sync API (date range + senders + paging; default **oldest→newest**; DB probe → get missing → upsert).
- L1.3 Manual Backfill wrapper (orchestrates L1.2 in chunks; resumable).
- L1.4 Disconnect/Revoke (hard delete connection) & Health.
- L1.5 Read APIs (emails & transactions).

### Manual Sync Sequence
```mermaid
sequenceDiagram
  participant U as User
  participant API as /api/gmail/manual-sync
  participant G as Gmail
  participant DB as Postgres
  U->>API: connection_id, date_from/to, senders?, page/pageSize
  API->>G: messages.list (newest-first)
  G-->>API: message IDs
  API->>API: reverse to oldest-first, slice page
  API->>DB: probe ANY($ids) for existing (user_id, google_user_id, message_id)
  API->>G: messages.get for missing only
  API->>DB: upsert emails (idempotent), internal_date=Gmail
  API-->>U: items + nextPageToken + stats
```

## APIs (summary)
See `finance-buddy-openapi.yaml` for full shapes.

## Acceptance Criteria (L1)
- No duplicates across disconnect → reconnect.
- `internal_date` fidelity.
- Read APIs filter & paginate correctly; default asc order.

## Security & Performance
- RLS on all `fb_` tables.
- Single probe query per page using `ANY($ids)`.
- Indexes for `(user_id, google_user_id, message_id)` and time-based listing.

## Rollout Plan
1) Apply schema.
2) Enable OAuth credentials.
3) Test manual sync idempotency & ordering.
4) Ship `/db` workbenches for owner-only.
