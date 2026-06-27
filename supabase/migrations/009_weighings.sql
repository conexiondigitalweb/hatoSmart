create table if not exists weighings (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts,
  farm_id uuid not null references farms,
  animal_id uuid not null references animals,
  date date not null,
  weight_kg numeric(7,2) not null,
  body_condition numeric(3,1),
  notes text,
  recorded_by uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
