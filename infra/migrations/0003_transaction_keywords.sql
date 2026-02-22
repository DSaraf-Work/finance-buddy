-- Transaction Keywords Management System
-- This migration adds support for dynamic keyword management

-- Create transaction keywords table
create table if not exists fb_transaction_keywords (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword text not null,
  is_active boolean not null default true,
  auto_generated boolean not null default false,
  usage_count integer not null default 0,
  category text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, keyword)
);

-- Create indexes for performance
create index if not exists fb_keywords_user_active_idx on fb_transaction_keywords(user_id, is_active);
create index if not exists fb_keywords_user_usage_idx on fb_transaction_keywords(user_id, usage_count desc);
create index if not exists fb_keywords_auto_generated_idx on fb_transaction_keywords(user_id, auto_generated);

-- Enable RLS
alter table fb_transaction_keywords enable row level security;

-- Create RLS policy
create policy "own keywords" on fb_transaction_keywords for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Create function to initialize default keywords for new users
create or replace function initialize_default_keywords(target_user_id uuid)
returns void as $$
begin
  insert into fb_transaction_keywords (user_id, keyword, is_active, auto_generated)
  values 
    (target_user_id, 'Food', true, false),
    (target_user_id, 'Fitness', true, false),
    (target_user_id, 'Shopping', true, false),
    (target_user_id, 'Chill', true, false),
    (target_user_id, 'Groceries', true, false),
    (target_user_id, 'Gift', true, false),
    (target_user_id, 'Split', true, false)
  on conflict (user_id, keyword) do nothing;
end;
$$ language plpgsql security definer;

-- Create function to auto-add keywords when AI generates new ones
create or replace function add_auto_generated_keyword(target_user_id uuid, new_keyword text)
returns uuid as $$
declare
  keyword_id uuid;
begin
  -- Normalize keyword (trim and capitalize first letter)
  new_keyword := initcap(trim(new_keyword));
  
  -- Insert or update keyword
  insert into fb_transaction_keywords (user_id, keyword, is_active, auto_generated, usage_count)
  values (target_user_id, new_keyword, true, true, 1)
  on conflict (user_id, keyword) 
  do update set 
    usage_count = fb_transaction_keywords.usage_count + 1,
    updated_at = now()
  returning id into keyword_id;
  
  return keyword_id;
end;
$$ language plpgsql security definer;

-- Create function to increment keyword usage
create or replace function increment_keyword_usage(target_user_id uuid, keyword_text text)
returns void as $$
begin
  update fb_transaction_keywords 
  set 
    usage_count = usage_count + 1,
    updated_at = now()
  where user_id = target_user_id and keyword = initcap(trim(keyword_text));
end;
$$ language plpgsql security definer;

-- Create view for active keywords with usage stats
create or replace view fb_user_active_keywords as
select 
  k.id,
  k.user_id,
  k.keyword,
  k.is_active,
  k.auto_generated,
  k.usage_count,
  k.created_at,
  k.updated_at,
  case 
    when k.usage_count > 10 then 'frequent'
    when k.usage_count > 3 then 'common'
    else 'rare'
  end as usage_category
from fb_transaction_keywords k
where k.is_active = true
order by k.usage_count desc, k.keyword asc;

-- Grant permissions on the view
grant select on fb_user_active_keywords to authenticated;

-- Create trigger to update updated_at timestamp
create or replace function update_keywords_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_fb_transaction_keywords_updated_at
  before update on fb_transaction_keywords
  for each row execute function update_keywords_updated_at();
