create or replace function create_demo_farm(p_user_id uuid)
returns void language plpgsql security definer as $$
declare
  v_account_id uuid := gen_random_uuid();
  v_farm_id    uuid := gen_random_uuid();

  -- Cows in production (8)
  v_cow1 uuid := gen_random_uuid();
  v_cow2 uuid := gen_random_uuid();
  v_cow3 uuid := gen_random_uuid();
  v_cow4 uuid := gen_random_uuid();
  v_cow5 uuid := gen_random_uuid();
  v_cow6 uuid := gen_random_uuid();
  v_cow7 uuid := gen_random_uuid();
  v_cow8 uuid := gen_random_uuid();

  -- Pregnant cows (3)
  v_preg1 uuid := gen_random_uuid();
  v_preg2 uuid := gen_random_uuid();
  v_preg3 uuid := gen_random_uuid();

  -- Heifers (2)
  v_heif1 uuid := gen_random_uuid();
  v_heif2 uuid := gen_random_uuid();

  -- Male calves (2)
  v_calf_m1 uuid := gen_random_uuid();
  v_calf_m2 uuid := gen_random_uuid();

  -- Female calves (2)
  v_calf_f1 uuid := gen_random_uuid();
  v_calf_f2 uuid := gen_random_uuid();

  -- Bull (1)
  v_bull uuid := gen_random_uuid();

  -- Registered genetics (2)
  v_reg1 uuid := gen_random_uuid();
  v_reg2 uuid := gen_random_uuid();

  -- Health events for alerts
  v_health1 uuid := gen_random_uuid();
  v_health2 uuid := gen_random_uuid();

  v_today date := current_date;
begin
  -- Account
  insert into accounts (id, name, plan, country, default_locale, owner_user_id)
  values (v_account_id, 'Cuenta Demo HatoSmart', 'free', 'CO', 'es-CO', p_user_id);

  -- Farm
  insert into farms (id, account_id, name, commercial_name, orientation, country, region,
                     currency, units, locale, gestation_days, dry_off_days_before_calving, settings)
  values (v_farm_id, v_account_id, 'Finca El Progreso', 'El Progreso', 'dual',
          'CO', 'Antioquia', 'COP', 'metric', 'es-CO', 283, 60, '{}');

  -- Membership
  insert into memberships (account_id, farm_id, user_id, role)
  values (v_account_id, v_farm_id, p_user_id, 'owner');

  -- 8 Cows in production
  insert into animals (id, account_id, farm_id, tag_number, name, breed, sex, birth_date, category, status, repro_status)
  values
    (v_cow1, v_account_id, v_farm_id, 'V-001', 'Margarita', 'Holstein', 'female', v_today - 1460, 'cow', 'active', 'open'),
    (v_cow2, v_account_id, v_farm_id, 'V-002', 'Paloma',    'Holstein', 'female', v_today - 1825, 'cow', 'active', 'open'),
    (v_cow3, v_account_id, v_farm_id, 'V-003', 'Rosita',    'Gyr',      'female', v_today - 2190, 'cow', 'active', 'open'),
    (v_cow4, v_account_id, v_farm_id, 'V-004', 'Blanquita', 'Girolando','female', v_today - 1642, 'cow', 'active', 'open'),
    (v_cow5, v_account_id, v_farm_id, 'V-005', 'Linda',     'Holstein', 'female', v_today - 1900, 'cow', 'active', 'fresh'),
    (v_cow6, v_account_id, v_farm_id, 'V-006', 'Canela',    'Girolando','female', v_today - 2555, 'cow', 'active', 'open'),
    (v_cow7, v_account_id, v_farm_id, 'V-007', 'Estrella',  'Gyr',      'female', v_today - 1280, 'cow', 'active', 'open'),
    (v_cow8, v_account_id, v_farm_id, 'V-008', 'Lulú',      'Holstein', 'female', v_today - 2000, 'cow', 'active', 'open');

  -- 3 Pregnant cows
  insert into animals (id, account_id, farm_id, tag_number, name, breed, sex, birth_date, category, status, repro_status)
  values
    (v_preg1, v_account_id, v_farm_id, 'V-009', 'Esperanza', 'Holstein',  'female', v_today - 1825, 'cow', 'active', 'pregnant'),
    (v_preg2, v_account_id, v_farm_id, 'V-010', 'Dulce',     'Girolando', 'female', v_today - 2100, 'cow', 'active', 'pregnant'),
    (v_preg3, v_account_id, v_farm_id, 'V-011', 'Fortuna',   'Gyr',       'female', v_today - 1500, 'cow', 'active', 'pregnant');

  -- 2 Heifers
  insert into animals (id, account_id, farm_id, tag_number, name, breed, sex, birth_date, category, status)
  values
    (v_heif1, v_account_id, v_farm_id, 'N-001', 'Princesa', 'Holstein', 'female', v_today - 548, 'heifer', 'active'),
    (v_heif2, v_account_id, v_farm_id, 'N-002', 'Reina',    'Girolando','female', v_today - 480, 'heifer', 'active');

  -- 2 Male calves
  insert into animals (id, account_id, farm_id, tag_number, name, breed, sex, birth_date, category, status)
  values
    (v_calf_m1, v_account_id, v_farm_id, 'T-001', 'Torito', 'Holstein',  'male', v_today - 90, 'calf', 'active'),
    (v_calf_m2, v_account_id, v_farm_id, 'T-002', 'Negrito','Girolando', 'male', v_today - 60, 'calf', 'active');

  -- 2 Female calves
  insert into animals (id, account_id, farm_id, tag_number, name, breed, sex, birth_date, category, status)
  values
    (v_calf_f1, v_account_id, v_farm_id, 'T-003', 'Manchita', 'Holstein',  'female', v_today - 75, 'calf', 'active'),
    (v_calf_f2, v_account_id, v_farm_id, 'T-004', 'Pintada',  'Girolando', 'female', v_today - 45, 'calf', 'active');

  -- 1 Bull
  insert into animals (id, account_id, farm_id, tag_number, name, breed, sex, birth_date, category, status)
  values
    (v_bull, v_account_id, v_farm_id, 'T-100', 'Sansón', 'Gyr', 'male', v_today - 2555, 'bull', 'active');

  -- 2 Registered genetics animals
  insert into animals (id, account_id, farm_id, tag_number, name, breed, sex, birth_date, category, status,
                       registry_number, registry_association, repro_status)
  values
    (v_reg1, v_account_id, v_farm_id, 'R-001', 'Élite 1', 'Holstein', 'female', v_today - 1095,
     'cow', 'active', 'REG-HOL-00123', 'ASOHOLSTEIN', 'open'),
    (v_reg2, v_account_id, v_farm_id, 'R-002', 'Élite 2', 'Gyr', 'male', v_today - 1460,
     'bull', 'active', 'REG-GYR-00456', 'ASOCEBU', null);

  -- Repro events: services for 3 pregnant cows with expected_calving_date in next 30-60 days
  insert into repro_events (account_id, farm_id, animal_id, type, date, service_method,
                             result, expected_calving_date, recorded_by)
  values
    (v_account_id, v_farm_id, v_preg1, 'service', v_today - 253, 'ai',
     'pregnant', v_today + 30, p_user_id),
    (v_account_id, v_farm_id, v_preg2, 'service', v_today - 240, 'natural',
     'pregnant', v_today + 43, p_user_id),
    (v_account_id, v_farm_id, v_preg3, 'service', v_today - 223, 'ai',
     'pregnant', v_today + 60, p_user_id);

  -- Milk records: last 7 days for 8 production cows
  insert into milk_records (account_id, farm_id, date, session, cows_milked,
                             liters_produced, liters_sold, price_per_liter, recorded_by)
  select
    v_account_id, v_farm_id,
    v_today - s,
    'total',
    8,
    round((160 + random() * 40)::numeric, 2),
    round((140 + random() * 30)::numeric, 2),
    1850,
    p_user_id
  from generate_series(0, 6) as s;

  -- 5 Alerts
  -- 2 calving_due (for 2 of the 3 pregnant cows)
  insert into alerts (account_id, farm_id, animal_id, type, due_date, status, message)
  values
    (v_account_id, v_farm_id, v_preg1, 'calving_due', v_today + 30, 'pending',
     'Esperanza tiene fecha probable de parto en 30 días'),
    (v_account_id, v_farm_id, v_preg2, 'calving_due', v_today + 43, 'pending',
     'Dulce tiene fecha probable de parto en 43 días');

  -- 1 pregnancy_check_due
  insert into alerts (account_id, farm_id, animal_id, type, due_date, status, message)
  values
    (v_account_id, v_farm_id, v_cow1, 'pregnancy_check_due', v_today + 5, 'pending',
     'Margarita pendiente de diagnóstico de gestación');

  -- 2 health_due (deworming)
  insert into health_events (id, account_id, farm_id, type, product, date, next_due_date,
                              group_label, recorded_by)
  values
    (v_health1, v_account_id, v_farm_id, 'deworming', 'Ivermectina 1%',
     v_today - 90, v_today + 3, 'Hato completo', p_user_id),
    (v_health2, v_account_id, v_farm_id, 'vaccine', 'Brucela S19',
     v_today - 180, v_today + 10, 'Novillas', p_user_id);

  insert into alerts (account_id, farm_id, type, due_date, status, source_table, source_id, message)
  values
    (v_account_id, v_farm_id, 'health_due', v_today + 3, 'pending',
     'health_events', v_health1, 'Vence desparasitación del hato: Ivermectina 1%'),
    (v_account_id, v_farm_id, 'health_due', v_today + 10, 'pending',
     'health_events', v_health2, 'Vence vacunación de novillas: Brucela S19');

end;
$$;
