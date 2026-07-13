import { addDays, addMonths } from 'date-fns'

export function calcFPP(serviceDate, gestationDays = 283) {
  return addDays(new Date(serviceDate), gestationDays)
}

export function calcDryOffDate(fpp, dryOffDaysBefore = 60) {
  return addDays(new Date(fpp), -dryOffDaysBefore)
}

// Suggested "possible heat" date for a female with no confirmed pregnancy.
// Pure — no Dexie access — so it can be unit tested and reused both by the
// automatic alert generator (src/lib/alerts/reproductionAlerts.js) and by
// the ficha's manual-override display, so both always agree on what
// "automatic" would say. farmSettings = { voluntary_waiting_days,
// heifer_min_breeding_months } (farm-level, configurable in
// FarmSettingsPage — see rule 1 in CLAUDE.md's business rules).
//
// Only the 4 documented cases are covered:
// 1. Heifer, never served → birth_date + heifer_min_breeding_months.
// 2. Calved, no service since → calving_date + voluntary_waiting_days.
// 3. Served, no pregnancy_check confirming pregnant since → repeats every
//    21 days from the service date (returns the next upcoming occurrence).
// 4. pregnancy_check confirming pregnant after the last service → null.
// A raw 'heat' or 'abortion' event with nothing after it returns null
// (not enough signal to extrapolate) rather than guessing.
export function calcPossibleHeatDate(animal, reproEvents = [], farmSettings = {}) {
  if (animal.sex !== 'female') return null
  if (animal.repro_status === 'pregnant' || animal.repro_status === 'dry') return null

  const vwp = farmSettings.voluntary_waiting_days ?? 50
  const heiferMonths = farmSettings.heifer_min_breeding_months ?? 15

  const events = reproEvents.filter((e) => !e.deleted_at)
  const lastOf = (type) =>
    events.filter((e) => e.type === type).sort((a, b) => b.date.localeCompare(a.date))[0] ?? null

  const lastService = lastOf('service')
  const lastCalving = lastOf('calving')
  const lastPositiveCheck = events
    .filter((e) => e.type === 'pregnancy_check' && e.result === 'pregnant')
    .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null

  // Case 4 — confirmed pregnant after the last service.
  if (lastPositiveCheck && (!lastService || lastPositiveCheck.date >= lastService.date)) {
    return null
  }

  // Case 3 — served (or served again after a calving), not confirmed
  // pregnant since. "21+ días" → advance in 21-day steps until we reach
  // the next occurrence that hasn't passed yet.
  if (lastService && (!lastCalving || lastService.date >= lastCalving.date)) {
    const today = new Date()
    let candidate = addDays(new Date(lastService.date), 21)
    while (candidate < today) candidate = addDays(candidate, 21)
    return candidate
  }

  // Case 2 — calved, no service since.
  if (lastCalving && (!lastService || lastCalving.date > lastService.date)) {
    return addDays(new Date(lastCalving.date), vwp)
  }

  // Case 1 — heifer, never served.
  if (!lastService && animal.category === 'heifer' && animal.birth_date) {
    return addMonths(new Date(animal.birth_date), heiferMonths)
  }

  return null
}

// True when the suggested date is the wide, age-based heifer estimate
// (case 1) rather than a cycle-based one — used to adjust the alert/ficha
// copy ("Estimado, revisar peso y condición corporal").
export function isHeiferAgeEstimate(animal, reproEvents = []) {
  const hasService = reproEvents.filter((e) => !e.deleted_at).some((e) => e.type === 'service')
  return animal.category === 'heifer' && !hasService
}
