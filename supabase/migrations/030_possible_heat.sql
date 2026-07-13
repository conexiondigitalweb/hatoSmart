-- Parámetros de reproducción configurables por finca (antes hardcodeados
-- en el código) — usados para calcular la fecha sugerida de posible celo.
-- Sin check constraint, igual que gestation_days/dry_off_days_before_calving
-- en 003_farms.sql.
alter table farms add column if not exists voluntary_waiting_days integer not null default 50;
alter table farms add column if not exists heifer_min_breeding_months integer not null default 15;

-- Fecha sugerida de posible celo por animal, y si esa fecha fue ajustada a
-- mano desde la ficha (AnimalDetailPage). Mientras possible_heat_manual sea
-- true, el recálculo automático (rules/reproduction.js + lib/alerts/
-- reproductionAlerts.js) respeta el valor guardado y no lo sobreescribe —
-- solo un nuevo evento reproductivo (service/calving/pregnancy_check/
-- dry_off) vuelve a poner manual en false y dispara un recálculo.
alter table animals add column if not exists possible_heat_date date;
alter table animals add column if not exists possible_heat_manual boolean not null default false;
