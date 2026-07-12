import { addDays } from 'date-fns'

export const HEALTH_EVENT_TYPES = [
  { value: 'vaccine',    emoji: '💉', label: 'Vacuna' },
  { value: 'deworming',  emoji: '🪱', label: 'Desparasitación' },
  { value: 'treatment',  emoji: '💊', label: 'Tratamiento' },
  { value: 'surgery',    emoji: '🔪', label: 'Cirugía' },
  { value: 'checkup',    emoji: '🩺', label: 'Revisión veterinaria' },
  { value: 'illness',    emoji: '🤒', label: 'Enfermedad' },
  { value: 'other',      emoji: '📋', label: 'Otro' },
]

export function calcNextDueDate(eventDate, periodicityDays) {
  if (!periodicityDays) return null
  return addDays(new Date(eventDate), periodicityDays)
}
