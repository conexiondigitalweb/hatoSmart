import { differenceInMonths } from 'date-fns'

export function suggestCategory({ sex, birth_date, repro_events = [] }) {
  const ageMonths = differenceInMonths(new Date(), new Date(birth_date))
  const hasCalved = repro_events.some((e) => e.event_type === 'calving')

  if (sex === 'female') {
    if (ageMonths < 6) return 'calf_female'
    if (ageMonths < 24 && !hasCalved) return 'heifer'
    return 'cow'
  }

  if (sex === 'male') {
    if (ageMonths < 6) return 'calf_male'
    if (ageMonths < 24) return 'steer'
    return 'bull'
  }

  return null
}
