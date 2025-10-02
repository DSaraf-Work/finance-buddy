# Finance Buddy — DB UI Spec

## Routes
- /db/fb_emails — Email workbench
- /db/fb_extracted_transactions — Transaction review workbench

## Emails Workbench
- Grid columns: internal_date, from_address, subject, status, email_address
- Filters: date range, account, sender, status, q
- Actions: Re-Extract (stub), Mark Invalid, Set Fetched, Redact body
- Drawer: headers + body (read-only by default), error_reason, processed_at

## Transactions Workbench
- Grid columns: txn_time, amount, currency, direction, merchant, category, confidence, review_state
- Filters: date range, account, direction, category prefix, merchant q, min_confidence, review_state
- Actions: Approve, Reject, Set Category, Set Merchant, Re-extract (stub)
- Drawer: editable form + source email snapshot

## Validation
- Transactions: amount ≥ 0; currency ISO; direction in {debit, credit}; txn_time valid ISO.
- Emails: status transitions—Processed read-only (except via extractor); Invalid↔Fetched; Failed→Fetched.

## Implementation Brief
- Server paging; default sort **asc** by internal_date / txn_time.
- Optimistic UI optional via updated_at.
- Endpoints used: /api/emails/search, PATCH /api/emails/{id}, POST /api/emails/bulk; same pattern for transactions.