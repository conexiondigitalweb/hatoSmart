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
