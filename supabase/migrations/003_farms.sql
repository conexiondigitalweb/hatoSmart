create table if not exists farms (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts,
  name text not null,
  commercial_name text,
  logo_url text,
  orientation text not null default 'dairy'
    check (orientation in ('dairy','beef','dual','genetics','mixed')),
  country text not null default 'CO',
  region text,
  currency text not null default 'COP',
  units text not null default 'metric',
  locale text not null default 'es-CO',
  gestation_days integer not null default 283,
  dry_off_days_before_calving integer not null default 60,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
