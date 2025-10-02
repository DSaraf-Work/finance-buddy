# Manual Sync — Pseudocode (L1)

Input: connection_id, date_from, date_to, senders?, page, pageSize (default 50), sort=asc

1) Gmail `messages.list` (Google default newest-first) with date range + from filter (if provided).
2) Reverse list to oldest-first; slice for page.
3) Probe DB:
   SELECT message_id
   FROM fb_emails
   WHERE user_id=$uid
     AND google_user_id=$gid
     AND message_id = ANY($ids);
4) Fetch missing via `messages.get` only for IDs not present.
5) Upsert into `fb_emails` with unique (user_id, google_user_id, message_id).
   - `internal_date` = Gmail `internalDate` (ms) converted to UTC timestamptz.
   - `status` default 'Fetched'.
6) Return items (asc), nextPageToken (if more), stats {probed, fetched, upserts}.
