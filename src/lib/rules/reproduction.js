import { addDays } from 'date-fns'

export function calcFPP(serviceDate, gestationDays = 283) {
  return addDays(new Date(serviceDate), gestationDays)
}

export function calcDryOffDate(fpp, dryOffDaysBefore = 60) {
  return addDays(new Date(fpp), -dryOffDaysBefore)
}

export function calcNextHeatDate(lastHeatOrServiceDate) {
  return addDays(new Date(lastHeatOrServiceDate), 21)
}

export function isHeatDue(lastHeatOrServiceDate, confirmedPregnant = false) {
  if (confirmedPregnant) return false
  return new Date() >= calcNextHeatDate(lastHeatOrServiceDate)
}
