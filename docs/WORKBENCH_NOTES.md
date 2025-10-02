# DB Workbenches (Owner-only)

/db/fb_emails
- Columns: internal_date, from_address, subject, status, email_address
- Filters: date range, account, sender, status, q
- Actions: Re-Extract (stub), Mark Invalid, Set Fetched, Redact body
- Default sort: internal_date asc

/db/fb_extracted_transactions
- Columns: txn_time, amount, currency, merchant, category, status
- Filters: date range, account, merchant, category, amount range, status
- Actions: Re-Extract (stub), Re-Categorize (stub)
- Default sort: txn_time asc
