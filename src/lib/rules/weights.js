import { differenceInDays } from 'date-fns'

export function calcGDP(previousWeight, previousDate, currentWeight, currentDate) {
  const days = differenceInDays(new Date(currentDate), new Date(previousDate))
  if (days <= 0) return null
  return (currentWeight - previousWeight) / days
}
