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
