import { differenceInMonths } from 'date-fns'

// Returns category values that match the DB schema:
// calf | heifer | cow | young_bull | bull | steer
export function suggestCategory({ sex, birth_date, repro_events = [] }) {
  if (!birth_date) return null
  const ageMonths = differenceInMonths(new Date(), new Date(birth_date))
  const hasCalved = repro_events.some((e) => e.type === 'calving')

  if (sex === 'female') {
    if (ageMonths < 6) return 'calf'
    if (ageMonths < 24 && !hasCalved) return 'heifer'
    return 'cow'
  }

  if (sex === 'male') {
    if (ageMonths < 6) return 'calf'
    if (ageMonths < 24) return 'young_bull'
    return 'bull'
  }

  return null
}
