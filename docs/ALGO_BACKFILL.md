# Backfill Orchestration — L1

- Split requested date range into chunks (e.g., per day/week).
- Insert `fb_jobs` row with payload {connection_id, ranges, cursor}.
- Iterate ranges:
  - call manual-sync for the chunk
  - update job cursor/progress
- Retries: increment attempts; retain last_error.
- Status: Pending -> Running -> Completed | Failed.
