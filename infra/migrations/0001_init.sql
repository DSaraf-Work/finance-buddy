-- finance-buddy-schema.sql (L1 Approved)
create extension if not exists pgcrypto;
-- Connections
create table if not exists fb_gmail_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email_address text not null,
  google_user_id text not null,
  granted_scopes text[] not null,
  access_token text not null,
  refresh_token text not null,
  token_expiry timestamptz not null,
  token_type text,
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, email_address)
);

-- Emails
create table if not exists fb_emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  google_user_id text not null,
  connection_id uuid references fb_gmail_connections(id) on delete set null,
  email_address text not null,
  message_id text not null,
  thread_id text not null,
  from_address text,
  to_addresses text[],
  subject text,
  snippet text,
  internal_date timestamptz,
  plain_body text,
  status text not null default 'Fetched' check (status in ('Fetched','Processed','Failed','Invalid')),
  error_reason text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, google_user_id, message_id)
);
create index if not exists fb_emails_user_date_idx on fb_emails(user_id, internal_date desc);
create index if not exists fb_emails_user_google_date_idx on fb_emails(user_id, google_user_id, internal_date desc);

-- Extracted Transactions (placeholder for L2+)
create table if not exists fb_extracted_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  google_user_id text not null,
  connection_id uuid references fb_gmail_connections(id) on delete set null,
  email_row_id uuid not null references fb_emails(id) on delete cascade,
  txn_time timestamptz,
  amount numeric(18,2),
  currency text,
  direction text check (direction in ('debit','credit')),
  merchant_name text,
  merchant_normalized text,
  category text,
  account_hint text,
  reference_id text,
  location text,
  confidence numeric(3,2),
  extraction_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists fb_txn_user_time_idx on fb_extracted_transactions(user_id, txn_time desc);
create index if not exists fb_txn_user_google_time_idx on fb_extracted_transactions(user_id, google_user_id, txn_time desc);

-- Jobs (backfill)
create table if not exists fb_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, -- 'backfill'
  payload jsonb not null,
  status text not null default 'queued',
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table fb_gmail_connections enable row level security;
alter table fb_emails enable row level security;
alter table fb_extracted_transactions enable row level security;
alter table fb_jobs enable row level security;

create policy "own connections" on fb_gmail_connections for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own emails"       on fb_emails            for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own txns"         on fb_extracted_transactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own jobs"         on fb_jobs             for all using (user_id = auth.uid()) with check (user_id = auth.uid());
