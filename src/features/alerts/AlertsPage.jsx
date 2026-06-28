import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { format, differenceInCalendarDays } from 'date-fns'
import { useFarmStore } from '../../stores/farmStore'
import db from '../../lib/db'
import EmptyState from '../../components/ui/EmptyState'

const ALERT_CONFIG = {
  calving_due:           { emoji: '🟣', label: 'Partos próximos',       color: 'bg-purple-50 border-purple-200' },
  pregnancy_check_due:   { emoji: '🔵', label: 'Chequeos de preñez',    color: 'bg-blue-50 border-blue-200' },
  possible_heat:         { emoji: '🟡', label: 'Posibles celos',         color: 'bg-yellow-50 border-yellow-200' },
  dry_off_due:           { emoji: '🟠', label: 'Secados',               color: 'bg-orange-50 border-orange-200' },
  health_due:            { emoji: '🔴', label: 'Sanidad',               color: 'bg-red-50 border-red-200' },
  low_stock:             { emoji: '⚪', label: 'Inventario bajo',        color: 'bg-gray-50 border-gray-200' },
}

const TYPE_ORDER = ['calving_due', 'pregnancy_check_due', 'dry_off_due', 'possible_heat', 'health_due', 'low_stock']

function daysBadge(dueDate) {
  const diff = differenceInCalendarDays(new Date(dueDate + 'T00:00'), new Date())
  if (diff < 0) return { text: `Vencida hace ${Math.abs(diff)}d`, cls: 'text-red-600 font-bold' }
  if (diff === 0) return { text: 'Hoy', cls: 'text-red-600 font-bold' }
  if (diff <= 7) return { text: `${diff}d`, cls: 'text-orange-500 font-semibold' }
  return { text: `${diff}d`, cls: 'text-gray-500' }
}

export default function AlertsPage() {
  const navigate = useNavigate()
  const activeFarm = useFarmStore((s) => s.activeFarm)

  const alerts = useLiveQuery(
    () => activeFarm
      ? db.alerts
          .where('farm_id').equals(activeFarm.id)
          .filter((a) => a.status === 'pending')
          .toArray()
      : [],
    [activeFarm?.id]
  )

  const handleDone = async (alertId, alertType, animalId) => {
    await db.alerts.update(alertId, { status: 'done' })
    if (alertType === 'calving_due' && animalId) {
      navigate(`/registrar/repro?animalId=${animalId}`)
    }
  }

  const handleDismiss = async (alertId) => {
    await db.alerts.update(alertId, { status: 'dismissed' })
  }

  if (alerts === undefined) {
    return <div className="p-4 text-center text-sm text-gray-400 mt-8">Cargando...</div>
  }

  // Group and sort
  const grouped = {}
  for (const a of alerts) {
    if (!grouped[a.type]) grouped[a.type] = []
    grouped[a.type].push(a)
  }
  for (const type of Object.keys(grouped)) {
    grouped[type].sort((a, b) => a.due_date.localeCompare(b.due_date))
  }

  const hasAlerts = alerts.length > 0

  return (
    <div className="p-4 flex flex-col gap-4 pb-28">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#2b3240]">Alertas</h1>
        {hasAlerts && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {alerts.length}
          </span>
        )}
      </div>

      {!hasAlerts ? (
        <EmptyState
          icon="✅"
          title="Sin alertas pendientes"
          description="¡Todo en orden! Las alertas de partos, celos, chequeos y sanidad aparecerán aquí."
        />
      ) : (
        TYPE_ORDER.filter((t) => grouped[t]?.length).map((type) => {
          const cfg = ALERT_CONFIG[type] ?? { emoji: '🔔', label: type, color: 'bg-gray-50 border-gray-200' }
          return (
            <div key={type}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {cfg.emoji} {cfg.label}
              </p>
              <div className="flex flex-col gap-2">
                {grouped[type].map((alert) => {
                  const badge = daysBadge(alert.due_date)
                  return (
                    <div
                      key={alert.id}
                      className={`rounded-2xl border p-4 ${cfg.color}`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#2b3240] leading-snug">
                            {alert.message ?? type}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {format(new Date(alert.due_date + 'T00:00'), 'dd/MM/yyyy')}
                          </p>
                        </div>
                        <span className={`text-sm flex-shrink-0 ${badge.cls}`}>{badge.text}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDone(alert.id, alert.type, alert.animal_id)}
                          className="flex-1 min-h-[40px] rounded-xl bg-[#3dbf5e] text-white text-xs font-semibold"
                        >
                          {type === 'calving_due' ? '🐄 Registrar parto' : '✓ Marcar como hecha'}
                        </button>
                        <button
                          onClick={() => handleDismiss(alert.id)}
                          className="min-h-[40px] px-4 rounded-xl bg-white border border-gray-200 text-gray-500 text-xs font-semibold"
                        >
                          Descartar
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
