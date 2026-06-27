create table if not exists milk_records (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts,
  farm_id uuid not null references farms,
  date date not null,
  session text not null default 'total'
    check (session in ('am','pm','total')),
  cows_milked integer,
  liters_produced numeric(8,2),
  liters_sold numeric(8,2),
  liters_internal numeric(8,2),
  price_per_liter numeric(8,2),
  notes text,
  recorded_by uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (farm_id, date, session)
);
