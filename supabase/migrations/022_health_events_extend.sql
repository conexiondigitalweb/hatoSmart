-- Vincula eventos sanitarios a un protocolo del catálogo y registra costo.
-- También amplía los tipos de evento permitidos (cirugía, revisión veterinaria).
alter table health_events
  add column if not exists protocol_id uuid references health_protocols(id),
  add column if not exists cost numeric(10,2);

alter table health_events drop constraint if exists health_events_type_check;
alter table health_events add constraint health_events_type_check
  check (type in ('vaccine','deworming','treatment','surgery','checkup','illness','other'));

create index if not exists idx_health_events_protocol on health_events (protocol_id);
