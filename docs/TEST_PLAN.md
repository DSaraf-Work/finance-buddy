# Test Plan (L1)

## Contract Tests
- Validate all routes conform to OpenAPI (status codes, shapes).

## Behavior Tests
- OAuth connect/callback persists tokens, scopes, google_user_id, email_address.
- Idempotency: resync same message IDs -> no duplicates.
- internal_date fidelity: saved == Gmail internalDate (ms→UTC).
- Default ordering: asc for manual-sync output and searches.
- Disconnect: token revoked, connection deleted; emails/txns persist (FKs nullable).
- RLS: user can access only their rows across all fb_ tables.
