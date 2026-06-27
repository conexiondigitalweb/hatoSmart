create table if not exists health_event_animals (
  health_event_id uuid not null references health_events,
  animal_id uuid not null references animals,
  primary key (health_event_id, animal_id)
);
