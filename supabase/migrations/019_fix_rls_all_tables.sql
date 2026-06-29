-- Migration 019: Fix RLS policies for all event tables
-- Ensures authenticated users with farm membership can INSERT/SELECT/UPDATE their data.
-- Run in Supabase SQL Editor.

-- ── animals ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "animals_insert" ON public.animals;
DROP POLICY IF EXISTS "animals_select" ON public.animals;
DROP POLICY IF EXISTS "animals_update" ON public.animals;

CREATE POLICY "animals_select" ON public.animals
  FOR SELECT TO authenticated
  USING (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "animals_insert" ON public.animals
  FOR INSERT TO authenticated
  WITH CHECK (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "animals_update" ON public.animals
  FOR UPDATE TO authenticated
  USING (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ))
  WITH CHECK (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ));

-- ── repro_events ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "repro_events_insert" ON public.repro_events;
DROP POLICY IF EXISTS "repro_events_select" ON public.repro_events;
DROP POLICY IF EXISTS "repro_events_update" ON public.repro_events;

CREATE POLICY "repro_events_select" ON public.repro_events
  FOR SELECT TO authenticated
  USING (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "repro_events_insert" ON public.repro_events
  FOR INSERT TO authenticated
  WITH CHECK (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "repro_events_update" ON public.repro_events
  FOR UPDATE TO authenticated
  USING (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ))
  WITH CHECK (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ));

-- ── milk_records ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "milk_records_insert" ON public.milk_records;
DROP POLICY IF EXISTS "milk_records_select" ON public.milk_records;
DROP POLICY IF EXISTS "milk_records_update" ON public.milk_records;

CREATE POLICY "milk_records_select" ON public.milk_records
  FOR SELECT TO authenticated
  USING (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "milk_records_insert" ON public.milk_records
  FOR INSERT TO authenticated
  WITH CHECK (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "milk_records_update" ON public.milk_records
  FOR UPDATE TO authenticated
  USING (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ))
  WITH CHECK (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ));

-- ── milk_individual ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "milk_individual_insert" ON public.milk_individual;
DROP POLICY IF EXISTS "milk_individual_select" ON public.milk_individual;
DROP POLICY IF EXISTS "milk_individual_update" ON public.milk_individual;

CREATE POLICY "milk_individual_select" ON public.milk_individual
  FOR SELECT TO authenticated
  USING (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "milk_individual_insert" ON public.milk_individual
  FOR INSERT TO authenticated
  WITH CHECK (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "milk_individual_update" ON public.milk_individual
  FOR UPDATE TO authenticated
  USING (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ))
  WITH CHECK (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ));

-- ── weighings ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "weighings_insert" ON public.weighings;
DROP POLICY IF EXISTS "weighings_select" ON public.weighings;
DROP POLICY IF EXISTS "weighings_update" ON public.weighings;

CREATE POLICY "weighings_select" ON public.weighings
  FOR SELECT TO authenticated
  USING (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "weighings_insert" ON public.weighings
  FOR INSERT TO authenticated
  WITH CHECK (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "weighings_update" ON public.weighings
  FOR UPDATE TO authenticated
  USING (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ))
  WITH CHECK (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ));

-- ── health_events ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "health_events_insert" ON public.health_events;
DROP POLICY IF EXISTS "health_events_select" ON public.health_events;
DROP POLICY IF EXISTS "health_events_update" ON public.health_events;

CREATE POLICY "health_events_select" ON public.health_events
  FOR SELECT TO authenticated
  USING (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "health_events_insert" ON public.health_events
  FOR INSERT TO authenticated
  WITH CHECK (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "health_events_update" ON public.health_events
  FOR UPDATE TO authenticated
  USING (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ))
  WITH CHECK (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ));

-- ── alerts ────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "alerts_insert" ON public.alerts;
DROP POLICY IF EXISTS "alerts_select" ON public.alerts;
DROP POLICY IF EXISTS "alerts_update" ON public.alerts;

CREATE POLICY "alerts_select" ON public.alerts
  FOR SELECT TO authenticated
  USING (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "alerts_insert" ON public.alerts
  FOR INSERT TO authenticated
  WITH CHECK (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "alerts_update" ON public.alerts
  FOR UPDATE TO authenticated
  USING (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ))
  WITH CHECK (farm_id IN (
    SELECT farm_id FROM public.memberships WHERE user_id = auth.uid()
  ));

-- ── memberships (SELECT only — written by create_account_and_farm RPC) ───────

DROP POLICY IF EXISTS "memberships_select" ON public.memberships;

CREATE POLICY "memberships_select" ON public.memberships
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
