-- Enforcement real de memberships.role (owner > admin > worker), que hasta
-- ahora existía en el schema pero no lo usaba ninguna política RLS.
--
-- Jerarquía: owner (3) > admin (2) > worker (1). has_farm_role(farm, min)
-- es verdadero si el usuario actual tiene, en esa finca, un rol de rango
-- igual o mayor a min_role. Se usa exactamente igual que has_farm_access(),
-- pero además filtra por rango de rol.
create or replace function has_farm_role(p_farm_id uuid, p_min_role text)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from memberships
    where farm_id = p_farm_id
      and user_id = auth.uid()
      and case role
            when 'owner' then 3
            when 'admin' then 2
            when 'worker' then 1
            else 0
          end
          >=
          case p_min_role
            when 'owner' then 3
            when 'admin' then 2
            when 'worker' then 1
            else 0
          end
  );
$$;

-- ── animals: crear/editar queda en admin+, dar de alta un animal nuevo no
--    es un "registro diario" (a diferencia de ordeño/pesaje/sanidad/repro,
--    que siguen abiertos a cualquier rol vía las policies existentes) ──────
drop policy if exists "animals_insert" on public.animals;
create policy "animals_insert" on public.animals
  for insert to authenticated
  with check (has_farm_role(farm_id, 'admin'));

-- NOTA IMPORTANTE — gap conocido, documentado a propósito:
-- animals_update se deja SIN CAMBIOS (sigue abierta a cualquier miembro de
-- la finca) porque los eventos de reproducción que un worker sí puede
-- registrar (servicio, parto) actualizan animals.repro_status y, en el
-- caso de parto, crean el animal cría — ambos como efecto automático de un
-- registro diario permitido. La app es offline-first (Dexie → cola →
-- runSync hace upsert genérico a la tabla), no hay una RPC intermedia que
-- distinga "edición manual" de "efecto automático de un evento", y RLS no
-- puede diferenciar columnas dentro de un mismo UPDATE sin un trigger que
-- compare OLD/NEW. Se optó por reforzar esto solo en la UI (ver
-- ImportAnimalsPage/AnimalFormPage/AnimalDetailPage) en vez de bloquearlo
-- a nivel de base de datos. Si se necesita blindaje real a nivel de DB,
-- la solución correcta es mover esos efectos automáticos a una función
-- SECURITY DEFINER dedicada y sí restringir animals_update a admin+.

-- ── health_protocols: catálogo de configuración, igual que animals ───────
drop policy if exists "health_protocols_insert" on public.health_protocols;
create policy "health_protocols_insert" on public.health_protocols
  for insert to authenticated
  with check (has_farm_role(farm_id, 'admin'));

drop policy if exists "health_protocols_update" on public.health_protocols;
create policy "health_protocols_update" on public.health_protocols
  for update to authenticated
  using (has_farm_role(farm_id, 'admin'))
  with check (has_farm_role(farm_id, 'admin'));

-- ── farms: editar configuración de la finca requiere admin+ ──────────────
-- (eliminar la finca no tiene UI/feature todavía — ver CLAUDE.md; cuando
-- se construya, no puede depender solo de esta policy porque UPDATE no
-- distingue "cambiar moneda" de "poner deleted_at", va a necesitar su
-- propio mecanismo owner-only, ej. una RPC)
drop policy if exists "farms_update" on public.farms;
create policy "farms_update" on public.farms
  for update to authenticated
  using (has_farm_role(id, 'admin'));

-- ── memberships: agregar/quitar/cambiar rol de usuarios es exclusivo de
--    owner. Antes solo existían policies de select (propia) e insert
--    (verificando accounts.owner_user_id); ahora se usa has_farm_role de
--    forma consistente y se agregan las policies de update/delete que
--    nunca habían existido (sin ellas, cambiar rol o quitar a alguien
--    era imposible incluso para el dueño) ────────────────────────────────
drop policy if exists "memberships_insert" on public.memberships;
create policy "memberships_insert" on public.memberships
  for insert to authenticated
  with check (has_farm_role(farm_id, 'owner'));

-- Se mantiene memberships_select (ver auth.uid() = user_id) tal cual, y se
-- agrega una segunda policy para que el owner vea a TODOS los miembros de
-- su finca (antes nadie podía ver memberships de otros usuarios, ni el
-- dueño — imposible construir una pantalla de gestión de usuarios sin esto)
create policy "memberships_select_owner" on public.memberships
  for select to authenticated
  using (has_farm_role(farm_id, 'owner'));

create policy "memberships_update_owner" on public.memberships
  for update to authenticated
  using (has_farm_role(farm_id, 'owner'))
  with check (has_farm_role(farm_id, 'owner'));

create policy "memberships_delete_owner" on public.memberships
  for delete to authenticated
  using (has_farm_role(farm_id, 'owner'));
