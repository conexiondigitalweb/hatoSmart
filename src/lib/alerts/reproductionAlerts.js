import { format } from 'date-fns'
import db from '../db'
import { enqueue } from '../sync/queue'
import { runSync } from '../sync/engine'
import { calcPossibleHeatDate, isHeiferAgeEstimate } from '../rules/reproduction'

function buildMessage(animal, isEstimate) {
  const label = animal.name || animal.tag_number || 'Animal'
  return isEstimate
    ? `${label} — posible celo estimado (revisar peso y condición corporal)`
    : `${label} — posible celo estimado`
}

// Keeps the single pending `possible_heat` alert for this animal (if any)
// in sync with dueDateStr — same reuse-the-row pattern as health_due/
// calving_due, just upserted in place instead of only created once, since
// this alert's date can keep moving forward on its own (see case 3 in
// calcPossibleHeatDate). Passing null dismisses any existing alert.
async function syncAlert(animal, reproEvents, dueDateStr) {
  const existing = await db.alerts
    .where('animal_id').equals(animal.id)
    .filter((a) => a.type === 'possible_heat' && a.status === 'pending')
    .first()

  if (!dueDateStr) {
    if (existing) {
      await db.alerts.update(existing.id, { status: 'dismissed', sync_status: 'pending' })
      await enqueue('alerts', existing.id, 'upsert', { ...existing, status: 'dismissed' })
      runSync().catch(() => {})
    }
    return
  }

  const message = buildMessage(animal, isHeiferAgeEstimate(animal, reproEvents))
  if (existing && existing.due_date === dueDateStr && existing.message === message) return

  const alert = {
    id: existing?.id ?? crypto.randomUUID(),
    account_id: animal.account_id,
    farm_id: animal.farm_id,
    animal_id: animal.id,
    type: 'possible_heat',
    due_date: dueDateStr,
    status: 'pending',
    message,
    sync_status: 'pending',
  }
  await db.alerts.put(alert)
  await enqueue('alerts', alert.id, 'upsert', alert)
  runSync().catch(() => {})
}

// Recomputes one animal's suggested possible-heat date and keeps its alert
// in sync with it. Called immediately after saving a repro_event
// (ReproEventForm) so the ficha/alert update without waiting for the next
// dashboard load, and also from the batch refresh below.
export async function recalcPossibleHeat(animal, farmSettings) {
  const reproEvents = await db.repro_events.where('animal_id').equals(animal.id).toArray()
  const isResolved = animal.repro_status === 'pregnant' || animal.repro_status === 'dry'

  if (isResolved) {
    if (animal.possible_heat_date || animal.possible_heat_manual) {
      await db.animals.update(animal.id, { possible_heat_date: null, possible_heat_manual: false, sync_status: 'pending' })
      await enqueue('animals', animal.id, 'upsert', { ...animal, possible_heat_date: null, possible_heat_manual: false })
      runSync().catch(() => {})
    }
    await syncAlert(animal, reproEvents, null)
    return
  }

  // Manual override always wins — just keep the alert lined up with it.
  if (animal.possible_heat_manual) {
    await syncAlert(animal, reproEvents, animal.possible_heat_date ?? null)
    return
  }

  const suggested = calcPossibleHeatDate(animal, reproEvents, farmSettings)
  const suggestedStr = suggested ? format(suggested, 'yyyy-MM-dd') : null

  if (suggestedStr !== (animal.possible_heat_date ?? null)) {
    await db.animals.update(animal.id, { possible_heat_date: suggestedStr, sync_status: 'pending' })
    await enqueue('animals', animal.id, 'upsert', { ...animal, possible_heat_date: suggestedStr })
    runSync().catch(() => {})
  }

  await syncAlert(animal, reproEvents, suggestedStr)
}

// Batch pass over every eligible female in the farm. This is the "on
// demand" half of the design — see CLAUDE.md (Sesión 15) for the full
// rationale: two of the four cases (a heifer aging into breeding range,
// and an unresolved service rolling into its next 21-day cycle) have no
// repro_event to hook an immediate recalculation onto, they only change
// because calendar time passed. Recomputing on every HomePage/AlertsPage
// load is what catches those without needing a cron/Edge Function.
export async function refreshPossibleHeatAlerts(farmId) {
  if (!farmId) return

  const farm = await db.farms.get(farmId)
  const farmSettings = {
    voluntary_waiting_days: farm?.voluntary_waiting_days,
    heifer_min_breeding_months: farm?.heifer_min_breeding_months,
  }

  const animals = await db.animals
    .where('farm_id').equals(farmId)
    .filter((a) => !a.deleted_at && a.status === 'active' && a.sex === 'female' && a.category !== 'calf')
    .toArray()

  for (const animal of animals) {
    await recalcPossibleHeat(animal, farmSettings)
  }
}
