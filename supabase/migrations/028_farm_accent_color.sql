-- Color de acento por finca — señal visual en el header para que un
-- operador que trabaje en más de una finca note de inmediato en cuál
-- está parado al cambiar de finca (FarmSelector), evitando que registre
-- datos en la finca equivocada por error.
-- Paleta cerrada (no color picker libre) elegida en la UI de
-- FarmSettingsPage — el check de formato aquí solo valida que sea un hex
-- válido, no restringe a la paleta (si en el futuro se agregan más
-- opciones, no hace falta migración nueva).
alter table farms add column if not exists accent_color text not null default '#16a34a';

alter table farms drop constraint if exists farms_accent_color_format;
alter table farms add constraint farms_accent_color_format
  check (accent_color ~ '^#[0-9a-fA-F]{6}$');
