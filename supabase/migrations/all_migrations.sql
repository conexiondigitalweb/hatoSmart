create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'free',
  country text not null default 'CO',
  default_locale text not null default 'es-CO',
  owner_user_id uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  locale text not null default 'es-CO',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
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
create table if not exists animals (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts,
  farm_id uuid not null references farms,
  internal_code text,
  tag_number text,
  name text,
  breed text,
  sex text not null check (sex in ('female','male')),
  birth_date date,
  category text check (category in ('calf','heifer','cow','young_bull','bull','steer')),
  status text not null default 'active'
    check (status in ('active','sold','dead','culled','transferred','quarantine')),
  status_date date,
  status_notes text,
  origin text not null default 'born'
    check (origin in ('born','purchased','transferred')),
  mother_id uuid references animals,
  father_id uuid references animals,
  external_father text,
  lot text,
  photo_url text,
  registry_number text,
  registry_association text,
  breeder_origin text,
  notes text,
  repro_status text check (repro_status in ('open','served','pregnant','dry','fresh')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
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
create table if not exists health_event_animals (
  health_event_id uuid not null references health_events,
  animal_id uuid not null references animals,
  primary key (health_event_id, animal_id)
);
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
-- Enable RLS on all tables
alter table accounts enable row level security;
alter table profiles enable row level security;
alter table farms enable row level security;
alter table memberships enable row level security;
alter table animals enable row level security;
alter table repro_events enable row level security;
alter table milk_records enable row level security;
alter table milk_individual enable row level security;
alter table weighings enable row level security;
alter table health_events enable row level security;
alter table health_event_animals enable row level security;
alter table alerts enable row level security;
alter table audit_log enable row level security;

-- accounts: owner can read and update their own account
create policy "accounts_select" on accounts
  for select using (owner_user_id = auth.uid());

create policy "accounts_update" on accounts
  for update using (owner_user_id = auth.uid());

-- profiles: each user manages their own profile
create policy "profiles_select" on profiles
  for select using (id = auth.uid());

create policy "profiles_insert" on profiles
  for insert with check (id = auth.uid());

create policy "profiles_update" on profiles
  for update using (id = auth.uid());

-- Helper: check if current user has a membership for a given farm
create or replace function has_farm_access(p_farm_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from memberships
    where farm_id = p_farm_id
      and user_id = auth.uid()
  );
$$;

-- farms
create policy "farms_select" on farms
  for select using (has_farm_access(id));

create policy "farms_insert" on farms
  for insert with check (
    exists (select 1 from accounts where id = account_id and owner_user_id = auth.uid())
  );

create policy "farms_update" on farms
  for update using (has_farm_access(id));

-- memberships: user sees their own memberships
create policy "memberships_select" on memberships
  for select using (user_id = auth.uid());

create policy "memberships_insert" on memberships
  for insert with check (
    exists (
      select 1 from farms f
      join accounts a on a.id = f.account_id
      where f.id = farm_id and a.owner_user_id = auth.uid()
    )
  );

-- animals
create policy "animals_select" on animals
  for select using (has_farm_access(farm_id));

create policy "animals_insert" on animals
  for insert with check (has_farm_access(farm_id));

create policy "animals_update" on animals
  for update using (has_farm_access(farm_id));

-- repro_events
create policy "repro_events_select" on repro_events
  for select using (has_farm_access(farm_id));

create policy "repro_events_insert" on repro_events
  for insert with check (has_farm_access(farm_id));

create policy "repro_events_update" on repro_events
  for update using (has_farm_access(farm_id));

-- milk_records
create policy "milk_records_select" on milk_records
  for select using (has_farm_access(farm_id));

create policy "milk_records_insert" on milk_records
  for insert with check (has_farm_access(farm_id));

create policy "milk_records_update" on milk_records
  for update using (has_farm_access(farm_id));

-- milk_individual
create policy "milk_individual_select" on milk_individual
  for select using (has_farm_access(farm_id));

create policy "milk_individual_insert" on milk_individual
  for insert with check (has_farm_access(farm_id));

create policy "milk_individual_update" on milk_individual
  for update using (has_farm_access(farm_id));

-- weighings
create policy "weighings_select" on weighings
  for select using (has_farm_access(farm_id));

create policy "weighings_insert" on weighings
  for insert with check (has_farm_access(farm_id));

create policy "weighings_update" on weighings
  for update using (has_farm_access(farm_id));

-- health_events
create policy "health_events_select" on health_events
  for select using (has_farm_access(farm_id));

create policy "health_events_insert" on health_events
  for insert with check (has_farm_access(farm_id));

create policy "health_events_update" on health_events
  for update using (has_farm_access(farm_id));

-- health_event_animals (acceso via health_event farm)
create policy "health_event_animals_select" on health_event_animals
  for select using (
    exists (
      select 1 from health_events he
      where he.id = health_event_id and has_farm_access(he.farm_id)
    )
  );

create policy "health_event_animals_insert" on health_event_animals
  for insert with check (
    exists (
      select 1 from health_events he
      where he.id = health_event_id and has_farm_access(he.farm_id)
    )
  );

-- alerts
create policy "alerts_select" on alerts
  for select using (has_farm_access(farm_id));

create policy "alerts_insert" on alerts
  for insert with check (has_farm_access(farm_id));

create policy "alerts_update" on alerts
  for update using (has_farm_access(farm_id));

-- audit_log: each user sees their own entries
create policy "audit_log_select" on audit_log
  for select using (user_id = auth.uid());

create policy "audit_log_insert" on audit_log
  for insert with check (user_id = auth.uid());
-- Generic updated_at trigger function
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at trigger to all relevant tables
do $$
declare
  t text;
begin
  foreach t in array array[
    'accounts','profiles','farms','memberships','animals',
    'repro_events','milk_records','milk_individual','weighings',
    'health_events','alerts'
  ] loop
    execute format(
      'create or replace trigger trg_%s_updated_at
       before update on %I
       for each row execute function update_updated_at_column()',
      t, t
    );
  end loop;
end;
$$;

-- Auto-create profile when a new user registers
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger trg_auth_users_new_profile
  after insert on auth.users
  for each row execute function handle_new_user();
-- Performance indexes

-- milk_records
create index if not exists idx_milk_records_farm_date on milk_records (farm_id, date);

-- milk_individual
create index if not exists idx_milk_individual_farm_date on milk_individual (farm_id, date);

-- weighings
create index if not exists idx_weighings_farm_date on weighings (farm_id, date);

-- repro_events
create index if not exists idx_repro_events_farm_date on repro_events (farm_id, date);

-- health_events
create index if not exists idx_health_events_farm_date on health_events (farm_id, date);

-- animals
create index if not exists idx_animals_farm_status on animals (farm_id, status);

-- alerts
create index if not exists idx_alerts_farm_status_due on alerts (farm_id, status, due_date);

-- account-level
create index if not exists idx_farms_account on farms (account_id);
create index if not exists idx_memberships_account on memberships (account_id);
create index if not exists idx_memberships_user on memberships (user_id);
create or replace function create_demo_farm(p_user_id uuid)
returns void language plpgsql security definer as $$
declare
  v_account_id uuid := gen_random_uuid();
  v_farm_id    uuid := gen_random_uuid();

  -- Cows in production (8)
  v_cow1 uuid := gen_random_uuid();
  v_cow2 uuid := gen_random_uuid();
  v_cow3 uuid := gen_random_uuid();
  v_cow4 uuid := gen_random_uuid();
  v_cow5 uuid := gen_random_uuid();
  v_cow6 uuid := gen_random_uuid();
  v_cow7 uuid := gen_random_uuid();
  v_cow8 uuid := gen_random_uuid();

  -- Pregnant cows (3)
  v_preg1 uuid := gen_random_uuid();
  v_preg2 uuid := gen_random_uuid();
  v_preg3 uuid := gen_random_uuid();

  -- Heifers (2)
  v_heif1 uuid := gen_random_uuid();
  v_heif2 uuid := gen_random_uuid();

  -- Male calves (2)
  v_calf_m1 uuid := gen_random_uuid();
  v_calf_m2 uuid := gen_random_uuid();

  -- Female calves (2)
  v_calf_f1 uuid := gen_random_uuid();
  v_calf_f2 uuid := gen_random_uuid();

  -- Bull (1)
  v_bull uuid := gen_random_uuid();

  -- Registered genetics (2)
  v_reg1 uuid := gen_random_uuid();
  v_reg2 uuid := gen_random_uuid();

  -- Health events for alerts
  v_health1 uuid := gen_random_uuid();
  v_health2 uuid := gen_random_uuid();

  v_today date := current_date;
begin
  -- Account
  insert into accounts (id, name, plan, country, default_locale, owner_user_id)
  values (v_account_id, 'Cuenta Demo HatoSmart', 'free', 'CO', 'es-CO', p_user_id);

  -- Farm
  insert into farms (id, account_id, name, commercial_name, orientation, country, region,
                     currency, units, locale, gestation_days, dry_off_days_before_calving, settings)
  values (v_farm_id, v_account_id, 'Finca El Progreso', 'El Progreso', 'dual',
          'CO', 'Antioquia', 'COP', 'metric', 'es-CO', 283, 60, '{}');

  -- Membership
  insert into memberships (account_id, farm_id, user_id, role)
  values (v_account_id, v_farm_id, p_user_id, 'owner');

  -- 8 Cows in production
  insert into animals (id, account_id, farm_id, tag_number, name, breed, sex, birth_date, category, status, repro_status)
  values
    (v_cow1, v_account_id, v_farm_id, 'V-001', 'Margarita', 'Holstein', 'female', v_today - 1460, 'cow', 'active', 'open'),
    (v_cow2, v_account_id, v_farm_id, 'V-002', 'Paloma',    'Holstein', 'female', v_today - 1825, 'cow', 'active', 'open'),
    (v_cow3, v_account_id, v_farm_id, 'V-003', 'Rosita',    'Gyr',      'female', v_today - 2190, 'cow', 'active', 'open'),
    (v_cow4, v_account_id, v_farm_id, 'V-004', 'Blanquita', 'Girolando','female', v_today - 1642, 'cow', 'active', 'open'),
    (v_cow5, v_account_id, v_farm_id, 'V-005', 'Linda',     'Holstein', 'female', v_today - 1900, 'cow', 'active', 'fresh'),
    (v_cow6, v_account_id, v_farm_id, 'V-006', 'Canela',    'Girolando','female', v_today - 2555, 'cow', 'active', 'open'),
    (v_cow7, v_account_id, v_farm_id, 'V-007', 'Estrella',  'Gyr',      'female', v_today - 1280, 'cow', 'active', 'open'),
    (v_cow8, v_account_id, v_farm_id, 'V-008', 'Lulú',      'Holstein', 'female', v_today - 2000, 'cow', 'active', 'open');

  -- 3 Pregnant cows
  insert into animals (id, account_id, farm_id, tag_number, name, breed, sex, birth_date, category, status, repro_status)
  values
    (v_preg1, v_account_id, v_farm_id, 'V-009', 'Esperanza', 'Holstein',  'female', v_today - 1825, 'cow', 'active', 'pregnant'),
    (v_preg2, v_account_id, v_farm_id, 'V-010', 'Dulce',     'Girolando', 'female', v_today - 2100, 'cow', 'active', 'pregnant'),
    (v_preg3, v_account_id, v_farm_id, 'V-011', 'Fortuna',   'Gyr',       'female', v_today - 1500, 'cow', 'active', 'pregnant');

  -- 2 Heifers
  insert into animals (id, account_id, farm_id, tag_number, name, breed, sex, birth_date, category, status)
  values
    (v_heif1, v_account_id, v_farm_id, 'N-001', 'Princesa', 'Holstein', 'female', v_today - 548, 'heifer', 'active'),
    (v_heif2, v_account_id, v_farm_id, 'N-002', 'Reina',    'Girolando','female', v_today - 480, 'heifer', 'active');

  -- 2 Male calves
  insert into animals (id, account_id, farm_id, tag_number, name, breed, sex, birth_date, category, status)
  values
    (v_calf_m1, v_account_id, v_farm_id, 'T-001', 'Torito', 'Holstein',  'male', v_today - 90, 'calf', 'active'),
    (v_calf_m2, v_account_id, v_farm_id, 'T-002', 'Negrito','Girolando', 'male', v_today - 60, 'calf', 'active');

  -- 2 Female calves
  insert into animals (id, account_id, farm_id, tag_number, name, breed, sex, birth_date, category, status)
  values
    (v_calf_f1, v_account_id, v_farm_id, 'T-003', 'Manchita', 'Holstein',  'female', v_today - 75, 'calf', 'active'),
    (v_calf_f2, v_account_id, v_farm_id, 'T-004', 'Pintada',  'Girolando', 'female', v_today - 45, 'calf', 'active');

  -- 1 Bull
  insert into animals (id, account_id, farm_id, tag_number, name, breed, sex, birth_date, category, status)
  values
    (v_bull, v_account_id, v_farm_id, 'T-100', 'Sansón', 'Gyr', 'male', v_today - 2555, 'bull', 'active');

  -- 2 Registered genetics animals
  insert into animals (id, account_id, farm_id, tag_number, name, breed, sex, birth_date, category, status,
                       registry_number, registry_association, repro_status)
  values
    (v_reg1, v_account_id, v_farm_id, 'R-001', 'Élite 1', 'Holstein', 'female', v_today - 1095,
     'cow', 'active', 'REG-HOL-00123', 'ASOHOLSTEIN', 'open'),
    (v_reg2, v_account_id, v_farm_id, 'R-002', 'Élite 2', 'Gyr', 'male', v_today - 1460,
     'bull', 'active', 'REG-GYR-00456', 'ASOCEBU', null);

  -- Repro events: services for 3 pregnant cows with expected_calving_date in next 30-60 days
  insert into repro_events (account_id, farm_id, animal_id, type, date, service_method,
                             result, expected_calving_date, recorded_by)
  values
    (v_account_id, v_farm_id, v_preg1, 'service', v_today - 253, 'ai',
     'pregnant', v_today + 30, p_user_id),
    (v_account_id, v_farm_id, v_preg2, 'service', v_today - 240, 'natural',
     'pregnant', v_today + 43, p_user_id),
    (v_account_id, v_farm_id, v_preg3, 'service', v_today - 223, 'ai',
     'pregnant', v_today + 60, p_user_id);

  -- Milk records: last 7 days for 8 production cows
  insert into milk_records (account_id, farm_id, date, session, cows_milked,
                             liters_produced, liters_sold, price_per_liter, recorded_by)
  select
    v_account_id, v_farm_id,
    v_today - s,
    'total',
    8,
    round((160 + random() * 40)::numeric, 2),
    round((140 + random() * 30)::numeric, 2),
    1850,
    p_user_id
  from generate_series(0, 6) as s;

  -- 5 Alerts
  -- 2 calving_due (for 2 of the 3 pregnant cows)
  insert into alerts (account_id, farm_id, animal_id, type, due_date, status, message)
  values
    (v_account_id, v_farm_id, v_preg1, 'calving_due', v_today + 30, 'pending',
     'Esperanza tiene fecha probable de parto en 30 días'),
    (v_account_id, v_farm_id, v_preg2, 'calving_due', v_today + 43, 'pending',
     'Dulce tiene fecha probable de parto en 43 días');

  -- 1 pregnancy_check_due
  insert into alerts (account_id, farm_id, animal_id, type, due_date, status, message)
  values
    (v_account_id, v_farm_id, v_cow1, 'pregnancy_check_due', v_today + 5, 'pending',
     'Margarita pendiente de diagnóstico de gestación');

  -- 2 health_due (deworming)
  insert into health_events (id, account_id, farm_id, type, product, date, next_due_date,
                              group_label, recorded_by)
  values
    (v_health1, v_account_id, v_farm_id, 'deworming', 'Ivermectina 1%',
     v_today - 90, v_today + 3, 'Hato completo', p_user_id),
    (v_health2, v_account_id, v_farm_id, 'vaccine', 'Brucela S19',
     v_today - 180, v_today + 10, 'Novillas', p_user_id);

  insert into alerts (account_id, farm_id, type, due_date, status, source_table, source_id, message)
  values
    (v_account_id, v_farm_id, 'health_due', v_today + 3, 'pending',
     'health_events', v_health1, 'Vence desparasitación del hato: Ivermectina 1%'),
    (v_account_id, v_farm_id, 'health_due', v_today + 10, 'pending',
     'health_events', v_health2, 'Vence vacunación de novillas: Brucela S19');

end;
$$;
