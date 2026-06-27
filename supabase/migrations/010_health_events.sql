create table if not exists health_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts,
  farm_id uuid not null references farms,
  animal_id uuid references animals,
  group_label text,
  type text not null
    check (type in ('vaccine','deworming','treatment','illness','other')),
  product text,
  dose text,
  date date not null,
  next_due_date date,
  diagnosis text,
  responsible text,
  notes text,
  recorded_by uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
