create table if not exists milk_individual (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts,
  farm_id uuid not null references farms,
  animal_id uuid not null references animals,
  date date not null,
  session text not null default 'total'
    check (session in ('am','pm','total')),
  liters numeric(6,2) not null,
  recorded_by uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
