create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts,
  farm_id uuid not null references farms,
  animal_id uuid references animals,
  type text not null
    check (type in ('calving_due','pregnancy_check_due','dry_off_due','possible_heat','health_due','low_stock')),
  due_date date not null,
  status text not null default 'pending'
    check (status in ('pending','done','dismissed')),
  source_table text,
  source_id uuid,
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
