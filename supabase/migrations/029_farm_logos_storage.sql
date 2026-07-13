-- Bucket de Storage para logos de finca, mismo patrón de path que
-- animal-photos (creado a mano en el dashboard de Supabase en su momento,
-- sin dejar rastro en migraciones — ver Sesión 9 en CLAUDE.md sobre
-- objetos "sueltos"). Esta vez se versiona desde el principio.
insert into storage.buckets (id, name, public)
values ('farm-logos', 'farm-logos', true)
on conflict (id) do nothing;

-- Convención de path: `${farm_id}/logo.<ext>` — igual que animal-photos
-- usa `${farm_id}/${animal_id}.jpg`. storage.foldername(name) devuelve el
-- primer segmento de la ruta (el farm_id), y has_farm_role() ya existe
-- desde 024_role_enforcement.sql para el chequeo de rango de rol.
create policy "farm_logos_select" on storage.objects
  for select to public
  using (bucket_id = 'farm-logos');

create policy "farm_logos_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'farm-logos'
    and has_farm_role((storage.foldername(name))[1]::uuid, 'owner')
  );

create policy "farm_logos_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'farm-logos'
    and has_farm_role((storage.foldername(name))[1]::uuid, 'owner')
  );
