import { subDays } from 'date-fns'
import { supabase } from '../supabase'
import db from '../db'
import { getPendingItems, dequeue } from './queue'
import { useSyncStore } from '../../stores/syncStore'

// ── Push (Dexie → Supabase) ────────────────────────────────────────────────

export async function runSync() {
  if (!navigator.onLine) {
    console.log('[Sync] Offline — skipping push')
    return
  }

  const items = await getPendingItems()
  if (items.length === 0) {
    useSyncStore.getState().setSynced()
    return
  }

  console.log(`[Sync] Starting push — ${items.length} item(s) pending`)
  let successCount = 0
  let errorCount = 0

  for (const item of items) {
    try {
      const payload = JSON.parse(item.payload)

      if (item.operation === 'upsert') {
        console.log(`[Sync] Pushing ${item.table_name} (${item.record_id}) to Supabase…`)
        const { error } = await supabase.from(item.table_name).upsert(payload)
        if (error) throw error
      } else if (item.operation === 'delete') {
        console.log(`[Sync] Soft-deleting ${item.table_name} (${item.record_id}) in Supabase…`)
        const { error } = await supabase
          .from(item.table_name)
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', item.record_id)
        if (error) throw error
      }

      // Mark synced in Dexie table + remove from queue
      const now = new Date().toISOString()
      try {
        await db[item.table_name].update(item.record_id, {
          sync_status: 'synced',
          last_synced_at: now,
        })
      } catch {
        // Table may not support the field — not critical
      }
      await dequeue(item.local_id)
      successCount++
      console.log(`[Sync] ✓ ${item.table_name} (${item.record_id}) synced`)
    } catch (err) {
      errorCount++
      console.warn(`[Sync] ✗ Failed to push ${item.table_name} (${item.record_id}):`, err?.message ?? err)
      // Continue with remaining items — don't abort the whole queue on one error
    }
  }

  console.log(`[Sync] Push complete — ${successCount} synced, ${errorCount} failed`)

  if (errorCount > 0 && successCount === 0) {
    useSyncStore.getState().setError()
  } else if (errorCount > 0) {
    useSyncStore.getState().setPendingCount(errorCount)
  } else {
    useSyncStore.getState().setSynced()
  }
}

// ── Pull (Supabase → Dexie) ────────────────────────────────────────────────

export async function pullFromSupabase(farmId) {
  if (!navigator.onLine || !farmId) {
    console.log('[Sync] Pull skipped — offline or no farmId')
    return
  }

  console.log(`[Sync] Starting pull for farm ${farmId}…`)

  const now = new Date()
  const ago90  = subDays(now, 90).toISOString().slice(0, 10)
  const ago180 = subDays(now, 180).toISOString().slice(0, 10)
  const synced = { sync_status: 'synced', last_synced_at: now.toISOString() }
  const counts = {}

  try {
    // Animals — all active
    const { data: animals, error: animalsErr } = await supabase
      .from('animals').select('*').eq('farm_id', farmId).is('deleted_at', null)
    if (animalsErr) throw animalsErr
    counts.animals = animals?.length ?? 0
    if (counts.animals) await db.animals.bulkPut(animals.map((r) => ({ ...r, ...synced })))

    // Repro events — last 180 days
    const { data: reproEvents, error: reproErr } = await supabase
      .from('repro_events').select('*').eq('farm_id', farmId).gte('date', ago180).is('deleted_at', null)
    if (reproErr) throw reproErr
    counts.repro_events = reproEvents?.length ?? 0
    if (counts.repro_events) await db.repro_events.bulkPut(reproEvents.map((r) => ({ ...r, ...synced })))

    // Milk records — last 90 days
    const { data: milkRecords, error: milkErr } = await supabase
      .from('milk_records').select('*').eq('farm_id', farmId).gte('date', ago90).is('deleted_at', null)
    if (milkErr) throw milkErr
    counts.milk_records = milkRecords?.length ?? 0
    if (counts.milk_records) await db.milk_records.bulkPut(milkRecords.map((r) => ({ ...r, ...synced })))

    // Weighings — last 90 days
    const { data: weighings, error: weighErr } = await supabase
      .from('weighings').select('*').eq('farm_id', farmId).gte('date', ago90).is('deleted_at', null)
    if (weighErr) throw weighErr
    counts.weighings = weighings?.length ?? 0
    if (counts.weighings) await db.weighings.bulkPut(weighings.map((r) => ({ ...r, ...synced })))

    // Health events — last 90 days
    const { data: healthEvents, error: healthErr } = await supabase
      .from('health_events').select('*').eq('farm_id', farmId).gte('date', ago90).is('deleted_at', null)
    if (healthErr) throw healthErr
    counts.health_events = healthEvents?.length ?? 0
    if (counts.health_events) await db.health_events.bulkPut(healthEvents.map((r) => ({ ...r, ...synced })))

    // Alerts — pending only
    const { data: alerts, error: alertsErr } = await supabase
      .from('alerts').select('*').eq('farm_id', farmId).eq('status', 'pending')
    if (alertsErr) throw alertsErr
    counts.alerts = alerts?.length ?? 0
    if (counts.alerts) await db.alerts.bulkPut(alerts.map((r) => ({ ...r, ...synced })))

    console.log(
      `[Sync] Pull complete — ${counts.animals} animals, ${counts.repro_events} repro_events, ` +
      `${counts.milk_records} milk_records, ${counts.weighings} weighings, ` +
      `${counts.health_events} health_events, ${counts.alerts} alerts`
    )
    useSyncStore.getState().setSynced()
  } catch (err) {
    console.error('[Sync] Pull failed:', err?.message ?? err)
    // Network error — keep local data intact
    useSyncStore.getState().setOffline()
  }
}
