-- Invitación de usuarios a una finca existente vía código/PIN corto.
-- El owner genera el código (admin o worker, nunca owner); quien lo recibe
-- lo canjea y queda con esa membership sin pasar por create_account_and_farm.
create table if not exists farm_invitations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts,
  farm_id uuid not null references farms,
  code text not null unique,
  role text not null check (role in ('admin', 'worker')),
  created_by uuid not null references auth.users,
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_farm_invitations_farm on farm_invitations (farm_id);

alter table farm_invitations enable row level security;

-- Solo el owner de la finca ve/crea/invalida sus propios códigos. Nadie
-- más puede leer esta tabla directamente — el canje de un código pasa por
-- la función redeem_farm_invitation() de abajo, no por una query directa,
-- precisamente para que un usuario cualquiera no pueda listar códigos
-- ajenos ni adivinar cuáles están activos.
create policy "farm_invitations_select" on public.farm_invitations
  for select to authenticated
  using (has_farm_role(farm_id, 'owner'));

create policy "farm_invitations_insert" on public.farm_invitations
  for insert to authenticated
  with check (has_farm_role(farm_id, 'owner') and created_by = auth.uid());

create policy "farm_invitations_update" on public.farm_invitations
  for update to authenticated
  using (has_farm_role(farm_id, 'owner'))
  with check (has_farm_role(farm_id, 'owner'));

create or replace trigger trg_farm_invitations_updated_at
  before update on farm_invitations
  for each row execute function update_updated_at_column();

-- Valida y canjea un código: crea la membership del usuario autenticado
-- con el rol que traiga la invitación, y marca el código como usado.
-- SECURITY DEFINER porque quien canjea NO tiene (ni debe tener) permiso de
-- SELECT sobre farm_invitations — la única puerta de entrada es esta
-- función, que valida todo server-side antes de escribir nada.
create or replace function redeem_farm_invitation(p_code text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_invitation farm_invitations%rowtype;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesión para usar un código de invitación';
  end if;

  select * into v_invitation
  from farm_invitations
  where code = upper(trim(p_code))
    and deleted_at is null;

  if v_invitation.id is null then
    raise exception 'Código inválido';
  end if;

  if v_invitation.used_at is not null then
    raise exception 'Este código ya fue utilizado';
  end if;

  if v_invitation.expires_at <= now() then
    raise exception 'Este código expiró';
  end if;

  if exists (
    select 1 from memberships
    where farm_id = v_invitation.farm_id and user_id = v_user_id
  ) then
    raise exception 'Ya eres miembro de esta finca';
  end if;

  insert into memberships (account_id, farm_id, user_id, role)
  values (v_invitation.account_id, v_invitation.farm_id, v_user_id, v_invitation.role);

  update farm_invitations
  set used_at = now(), used_by = v_user_id
  where id = v_invitation.id;

  return jsonb_build_object(
    'farm_id', v_invitation.farm_id,
    'account_id', v_invitation.account_id,
    'role', v_invitation.role
  );
end;
$$;

-- Lista los miembros de una finca (con email, que solo vive en auth.users
-- y el cliente no puede consultar directamente) para la pantalla de
-- gestión de usuarios del owner. SECURITY DEFINER + chequeo de rol propio
-- adentro, en vez de depender de RLS sobre auth.users (que no aplica).
create or replace function get_farm_members(p_farm_id uuid)
returns table (
  membership_id uuid,
  member_user_id uuid,
  email text,
  full_name text,
  role text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not has_farm_role(p_farm_id, 'owner') then
    raise exception 'No autorizado';
  end if;

  return query
    select m.id, m.user_id, u.email::text, p.full_name, m.role, m.created_at
    from memberships m
    join auth.users u on u.id = m.user_id
    left join profiles p on p.id = m.user_id
    where m.farm_id = p_farm_id
    order by m.created_at asc;
end;
$$;
