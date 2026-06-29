import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { format, differenceInCalendarDays } from 'date-fns'
import { Bell } from 'lucide-react'
import { useFarmStore } from '../../stores/farmStore'
import db from '../../lib/db'
import EmptyState from '../../components/ui/EmptyState'
import { cn } from '../../lib/utils'

// Border-left color per type
const ALERT_CONFIG = {
  calving_due:          { label: 'Parto próximo',      borderCls: 'border-l-purple-400',  bgCls: 'bg-purple-50' },
  pregnancy_check_due:  { label: 'Chequeo de preñez',  borderCls: 'border-l-blue-400',    bgCls: 'bg-blue-50'   },
  possible_heat:        { label: 'Posible celo',        borderCls: 'border-l-yellow-400',  bgCls: 'bg-yellow-50' },
  dry_off_due:          { label: 'Secado',              borderCls: 'border-l-orange-400',  bgCls: 'bg-orange-50' },
  health_due:           { label: 'Sanidad',             borderCls: 'border-l-red-400',     bgCls: 'bg-red-50'    },
  low_stock:            { label: 'Inventario bajo',     borderCls: 'border-l-gray-300',    bgCls: 'bg-gray-50'   },
}

function urgencyGroup(daysUntil) {
  if (daysUntil <= 0) return 'HOY'
  if (daysUntil <= 7) return 'ESTA SEMANA'
  return 'PRÓXIMAMENTE'
}

function UrgencyBadge({ days }) {
  if (days < 0) return <span className="text-xs font-bold text-red-600">Vencida {Math.abs(days)}d</span>
  if (days === 0) return <span className="text-xs font-bold text-red-600">Hoy</span>
  if (days <= 7)  return <span className="text-xs font-semibold text-amber-600">{days}d</span>
  return <span className="text-xs text-muted-foreground">{days}d</span>
}

export default function AlertsPage() {
  const navigate   = useNavigate()
  const activeFarm = useFarmStore((s) => s.activeFarm)

  const alerts = useLiveQuery(
    () => activeFarm
      ? db.alerts.where('farm_id').equals(activeFarm.id)
          .filter((a) => a.status === 'pending').toArray()
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
    return <div className="p-4 text-center text-sm text-muted-foreground mt-8">Cargando...</div>
  }

  if (!alerts.length) {
    return (
      <div className="p-4 pb-28">
        <h1 className="text-xl font-bold text-foreground mb-6">Alertas</h1>
        <EmptyState
          illustration="done"
          title="Sin alertas pendientes"
          description="Todo en orden. Las alertas de partos, celos, chequeos y sanidad aparecerán aquí."
        />
      </div>
    )
  }

  // Sort and group by urgency
  const sorted = [...alerts].sort((a, b) => a.due_date.localeCompare(b.due_date))
  const groups = { 'HOY': [], 'ESTA SEMANA': [], 'PRÓXIMAMENTE': [] }
  for (const a of sorted) {
    const days = differenceInCalendarDays(new Date(a.due_date + 'T00:00'), new Date())
    groups[urgencyGroup(days)].push({ ...a, _days: days })
  }

  return (
    <div className="p-4 pb-28 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Bell className="w-5 h-5 text-brand-green" />
        <h1 className="text-xl font-bold text-foreground flex-1">Alertas</h1>
        <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
          {alerts.length}
        </span>
      </div>

      {Object.entries(groups).filter(([, items]) => items.length > 0).map(([groupLabel, items]) => (
        <section key={groupLabel}>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            {groupLabel}
          </p>
          <div className="flex flex-col gap-2">
            {items.map((alert) => {
              const cfg = ALERT_CONFIG[alert.type] ?? { label: alert.type, borderCls: 'border-l-gray-300', bgCls: 'bg-gray-50' }
              return (
                <div
                  key={alert.id}
                  className={cn(
                    'rounded-2xl border-l-4 p-4 shadow-sm',
                    cfg.borderCls,
                    cfg.bgCls
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {cfg.label}
                      </p>
                      <p className="text-sm font-semibold text-foreground leading-snug mt-0.5">
                        {alert.message ?? alert.type}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(alert.due_date + 'T00:00'), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <UrgencyBadge days={alert._days} />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDone(alert.id, alert.type, alert.animal_id)}
                      className="flex-1 h-10 rounded-xl bg-brand-green text-white text-xs font-semibold active:scale-95 transition-transform"
                    >
                      {alert.type === 'calving_due' ? '🐄 Registrar parto' : '✓ Marcar hecha'}
                    </button>
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      className="h-10 px-4 rounded-xl bg-white border border-border text-muted-foreground text-xs font-semibold active:scale-95 transition-transform"
                    >
                      Descartar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
