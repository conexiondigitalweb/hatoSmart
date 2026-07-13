-- Rescata la función create_account_and_farm, que existía únicamente creada
-- a mano en el SQL Editor de Supabase desde la Sesión 5 (nunca se había
-- versionado). Es la única función que usa el onboarding para crear
-- account + farm + membership('owner') en una sola transacción.
--
-- El cuerpo de abajo es una copia EXACTA de lo que devuelve
-- pg_get_functiondef() contra la base de datos en producción — no se
-- modificó ningún detalle (firma, SECURITY DEFINER, search_path, lógica).
create or replace function public.create_account_and_farm(
  p_account_name text,
  p_farm_name text,
  p_farm_commercial_name text,
  p_orientation text,
  p_currency text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  v_account_id uuid;
  v_farm_id uuid;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  -- Crear account
  INSERT INTO public.accounts (name, plan, country, default_locale, owner_user_id)
  VALUES (p_account_name, 'free', 'CO', 'es-CO', v_user_id)
  RETURNING id INTO v_account_id;

  -- Crear farm
  INSERT INTO public.farms (account_id, name, commercial_name, orientation, currency, locale, country)
  VALUES (v_account_id, p_farm_name, p_farm_commercial_name, p_orientation, p_currency, 'es-CO', 'CO')
  RETURNING id INTO v_farm_id;

  -- Crear membership
  INSERT INTO public.memberships (account_id, farm_id, user_id, role)
  VALUES (v_account_id, v_farm_id, v_user_id, 'owner');

  RETURN jsonb_build_object(
    'account_id', v_account_id,
    'farm_id', v_farm_id
  );
END;
$function$;
