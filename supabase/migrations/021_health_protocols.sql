-- Catálogo de protocolos sanitarios (vacunas, desparasitantes, etc.) por finca
create table if not exists health_protocols (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts,
  farm_id uuid not null references farms,
  name text not null,
  type text not null
    check (type in ('vaccine','deworming','treatment','surgery','checkup','illness','other')),
  periodicity_days integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table health_protocols enable row level security;

create policy "health_protocols_select" on public.health_protocols
  for select to authenticated
  using (farm_id in (select farm_id from public.memberships where user_id = auth.uid()));

create policy "health_protocols_insert" on public.health_protocols
  for insert to authenticated
  with check (farm_id in (select farm_id from public.memberships where user_id = auth.uid()));

create policy "health_protocols_update" on public.health_protocols
  for update to authenticated
  using (farm_id in (select farm_id from public.memberships where user_id = auth.uid()))
  with check (farm_id in (select farm_id from public.memberships where user_id = auth.uid()));

create index if not exists idx_health_protocols_farm on health_protocols (farm_id);

create or replace trigger trg_health_protocols_updated_at
  before update on health_protocols
  for each row execute function update_updated_at_column();
