create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  account_id uuid,
  farm_id uuid,
  user_id uuid references auth.users,
  table_name text not null,
  record_id uuid,
  action text not null check (action in ('insert','update','delete')),
  old_data jsonb,
  new_data jsonb,
  at timestamptz not null default now()
);
