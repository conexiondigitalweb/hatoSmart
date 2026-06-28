import { subDays } from 'date-fns'
import { supabase } from '../supabase'
import db from '../db'
import { getPendingItems, dequeue } from './queue'
import { useSyncStore } from '../../stores/syncStore'

// ── Push (Dexie → Supabase) ────────────────────────────────────────────────

export async function runSync() {
  if (!navigator.onLine) return

  const items = await getPendingItems()
  if (items.length === 0) {
    useSyncStore.getState().setSynced()
    return
  }

  for (const item of items) {
    try {
      const payload = JSON.parse(item.payload)

      if (item.operation === 'upsert') {
        const { error } = await supabase.from(item.table_name).upsert(payload)
        if (error) throw error
      } else if (item.operation === 'delete') {
        const { error } = await supabase
          .from(item.table_name)
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', item.record_id)
        if (error) throw error
      }

      await dequeue(item.local_id)
    } catch {
      useSyncStore.getState().setError()
      return
    }
  }

  useSyncStore.getState().setSynced()
}

// ── Pull (Supabase → Dexie) ────────────────────────────────────────────────

export async function pullFromSupabase(farmId) {
  if (!navigator.onLine || !farmId) return

  const now = new Date()
  const ago90 = subDays(now, 90).toISOString().slice(0, 10)
  const ago180 = subDays(now, 180).toISOString().slice(0, 10)
  const synced = { sync_status: 'synced', last_synced_at: now.toISOString() }

  try {
    // Animals — all active
    const { data: animals } = await supabase
      .from('animals')
      .select('*')
      .eq('farm_id', farmId)
      .is('deleted_at', null)
    if (animals?.length) {
      await db.animals.bulkPut(animals.map((r) => ({ ...r, ...synced })))
    }

    // Repro events — last 180 days
    const { data: reproEvents } = await supabase
      .from('repro_events')
      .select('*')
      .eq('farm_id', farmId)
      .gte('date', ago180)
      .is('deleted_at', null)
    if (reproEvents?.length) {
      await db.repro_events.bulkPut(reproEvents.map((r) => ({ ...r, ...synced })))
    }

    // Milk records — last 90 days
    const { data: milkRecords } = await supabase
      .from('milk_records')
      .select('*')
      .eq('farm_id', farmId)
      .gte('date', ago90)
      .is('deleted_at', null)
    if (milkRecords?.length) {
      await db.milk_records.bulkPut(milkRecords.map((r) => ({ ...r, ...synced })))
    }

    // Weighings — last 90 days
    const { data: weighings } = await supabase
      .from('weighings')
      .select('*')
      .eq('farm_id', farmId)
      .gte('date', ago90)
      .is('deleted_at', null)
    if (weighings?.length) {
      await db.weighings.bulkPut(weighings.map((r) => ({ ...r, ...synced })))
    }

    // Health events — last 90 days
    const { data: healthEvents } = await supabase
      .from('health_events')
      .select('*')
      .eq('farm_id', farmId)
      .gte('date', ago90)
      .is('deleted_at', null)
    if (healthEvents?.length) {
      await db.health_events.bulkPut(healthEvents.map((r) => ({ ...r, ...synced })))
    }

    // Alerts — pending only
    const { data: alerts } = await supabase
      .from('alerts')
      .select('*')
      .eq('farm_id', farmId)
      .eq('status', 'pending')
    if (alerts?.length) {
      await db.alerts.bulkPut(alerts.map((r) => ({ ...r, ...synced })))
    }

    useSyncStore.getState().setSynced()
  } catch {
    // Network error — keep local data intact, don't overwrite
    useSyncStore.getState().setOffline()
  }
}
