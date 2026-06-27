create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts,
  farm_id uuid not null references farms,
  user_id uuid not null references auth.users,
  role text not null default 'worker'
    check (role in ('owner','admin','worker')),
  permissions jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (farm_id, user_id)
);
