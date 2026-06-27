create table if not exists repro_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts,
  farm_id uuid not null references farms,
  animal_id uuid not null references animals,
  type text not null
    check (type in ('heat','service','pregnancy_check','calving','abortion','dry_off')),
  date date not null,
  service_method text check (service_method in ('natural','ai')),
  sire_id uuid references animals,
  external_sire text,
  result text check (result in ('pregnant','open')),
  expected_calving_date date,
  calf_id uuid references animals,
  calf_sex text check (calf_sex in ('female','male')),
  calf_weight numeric(6,2),
  notes text,
  recorded_by uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
