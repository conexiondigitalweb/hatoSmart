-- RPC de solo lectura para previsualizar una invitación ANTES de tener
-- sesión: el invitado abre /unirse?code=XXX sin cuenta todavía, y necesita
-- saber a qué finca y con qué rol se va a unir antes de que se le pida
-- crear la cuenta (y, si el código ya no sirve, enterarse de inmediato en
-- vez de crear una cuenta para nada). No usa auth.uid() en ningún punto,
-- a propósito, y se le da EXECUTE a anon además de authenticated.
create or replace function get_invitation_preview(p_code text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_invitation farm_invitations%rowtype;
  v_farm_name text;
begin
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

  select name into v_farm_name from farms where id = v_invitation.farm_id;

  return jsonb_build_object(
    'farm_name', v_farm_name,
    'role', v_invitation.role
  );
end;
$$;

grant execute on function get_invitation_preview(text) to anon, authenticated;
