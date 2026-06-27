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
