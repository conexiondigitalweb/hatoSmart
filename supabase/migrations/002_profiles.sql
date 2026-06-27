create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  locale text not null default 'es-CO',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
