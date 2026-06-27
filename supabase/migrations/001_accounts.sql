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
