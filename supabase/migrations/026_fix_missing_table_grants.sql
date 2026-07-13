-- Fix: "permission denied for table farm_invitations" en ManageUsersPage.
--
-- Causa real confirmada vía information_schema.role_table_grants (no es un
-- problema de las políticas RLS de la migración 025, que están correctas):
-- CREATE TABLE no otorga privilegios a otros roles por sí solo. Las tablas
-- originales del proyecto (weighings, memberships, etc.) tienen
-- SELECT/INSERT/UPDATE/DELETE para `authenticated` porque las creó el
-- privilegio por defecto configurado al iniciar el proyecto de Supabase —
-- pero farm_invitations (025) y health_protocols (021), ambas creadas
-- después vía migración, solo terminaron con REFERENCES/TRIGGER/TRUNCATE.
-- Postgres rechaza el acceso a nivel de GRANT antes siquiera de evaluar
-- RLS, así que las políticas nunca llegaban a correr — de ahí el error de
-- "permission denied" en vez de un simple resultado vacío (que sería el
-- síntoma típico de un rechazo de RLS).
--
-- health_protocols tiene el mismo problema latente aunque no fue lo
-- reportado (nunca se había probado ProtocolsPage contra producción) — se
-- corrige aquí también para no repetir este mismo bug ahí.
grant select, insert, update on public.farm_invitations to authenticated;
grant select, insert, update on public.health_protocols to authenticated;
