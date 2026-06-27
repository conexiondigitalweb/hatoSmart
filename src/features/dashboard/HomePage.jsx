import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format, addDays } from 'date-fns'
import { useFarmStore } from '../../stores/farmStore'
import db from '../../lib/db'
import Card from '../../components/ui/Card'

function MetricCard({ emoji, label, value, sub }) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <span className="text-2xl">{emoji}</span>
      <p className="text-2xl font-bold text-[#2b3240] leading-none mt-1">{value}</p>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </Card>
  )
}

function AlertRow({ emoji, message, daysUntil }) {
  const urgency = daysUntil <= 7 ? 'text-red-500' : 'text-orange-500'
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <span className="text-xl flex-shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#2b3240] leading-snug">{message}</p>
      </div>
      <span className={`text-xs font-semibold flex-shrink-0 ${urgency}`}>
        {daysUntil === 0 ? 'Hoy' : daysUntil < 0 ? `Hace ${Math.abs(daysUntil)}d` : `${daysUntil}d`}
      </span>
    </div>
  )
}

function EmptyState({ emoji, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <span className="text-5xl">{emoji}</span>
      <div>
        <p className="font-semibold text-[#2b3240]">{title}</p>
        <p className="text-sm text-gray-400 mt-1 leading-relaxed">{description}</p>
      </div>
      {onAction && (
        <button
          onClick={onAction}
          className="mt-2 min-h-[48px] px-6 rounded-xl bg-[#3dbf5e] text-white font-semibold text-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

const QUICK_LINKS = [
  { emoji: '🥛', titleKey: 'modules.milk',         desc: 'Registra la producción de hoy', to: '/registrar' },
  { emoji: '🐄', titleKey: 'modules.animals',       desc: 'Ver todos los animales',        to: '/animales' },
  { emoji: '🔔', titleKey: 'modules.alerts',        desc: 'Revisa las alertas activas',    to: '/alertas' },
  { emoji: '⚖️', titleKey: 'modules.weights',       desc: 'Registra pesajes',              to: '/registrar' },
]

const DAIRY_ORIENTATIONS = ['dairy', 'dual']

export default function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const activeFarm = useFarmStore((s) => s.activeFarm)
  const [metrics, setMetrics] = useState(null)
  const [upcomingAlerts, setUpcomingAlerts] = useState([])
  const [animalCounts, setAnimalCounts] = useState({})
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const in15days = format(addDays(today, 15), 'yyyy-MM-dd')

  useEffect(() => {
    if (!activeFarm) return
    loadDashboard()
  }, [activeFarm?.id])

  const loadDashboard = async () => {
    const farmId = activeFarm.id

    // Milk metrics (today)
    const milkToday = await db.milk_records
      .where('[farm_id+date+session]').equals([farmId, todayStr, 'total'])
      .first()
      .catch(() => null)

    // Fallback: try any record from last 7 days for the farm
    let milkRecord = milkToday
    if (!milkRecord) {
      milkRecord = await db.milk_records
        .where('farm_id').equals(farmId)
        .reverse()
        .first()
        .catch(() => null)
    }

    setMetrics(milkRecord ?? null)

    // Animal counts by category
    const animals = await db.animals
      .where('farm_id').equals(farmId)
      .filter((a) => !a.deleted_at && a.status === 'active')
      .toArray()

    const counts = animals.reduce((acc, a) => {
      acc[a.category] = (acc[a.category] ?? 0) + 1
      return acc
    }, {})
    setAnimalCounts({ total: animals.length, ...counts })

    // Upcoming alerts (next 15 days + overdue)
    const alerts = await db.alerts
      .where('farm_id').equals(farmId)
      .filter((a) => a.status === 'pending' && a.due_date <= in15days)
      .sortBy('due_date')
    setUpcomingAlerts(alerts.slice(0, 5))
  }

  const isDairy = DAIRY_ORIENTATIONS.includes(activeFarm?.orientation)

  const diffDays = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00')
    return Math.round((d - today) / 86400000)
  }

  const alertEmoji = (type) => {
    const map = { calving_due: '🐮', pregnancy_check_due: '🔬', dry_off_due: '🚿', health_due: '💉', possible_heat: '❤️‍🔥', low_stock: '📦' }
    return map[type] ?? '🔔'
  }

  return (
    <div className="p-4 flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#2b3240]">{activeFarm?.name ?? 'Mi finca'}</h1>
        <p className="text-sm text-gray-400">
          {format(today, "EEEE d 'de' MMMM", { locale: undefined })}
        </p>
      </div>

      {/* Dairy / Dual metrics */}
      {isDairy && (
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Producción</p>
          {metrics ? (
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                emoji="🥛"
                label="Litros hoy"
                value={metrics.liters_produced ?? '—'}
                sub={metrics.liters_sold ? `${metrics.liters_sold}L vendidos` : undefined}
              />
              <MetricCard
                emoji="🐄"
                label="Vacas ordeñadas"
                value={metrics.cows_milked ?? '—'}
                sub={
                  metrics.liters_produced && metrics.cows_milked
                    ? `${(metrics.liters_produced / metrics.cows_milked).toFixed(1)}L/vaca`
                    : undefined
                }
              />
            </div>
          ) : (
            <Card>
              <EmptyState
                emoji="🥛"
                title="Sin producción registrada"
                description="Registra el ordeño de hoy para ver tus métricas aquí."
                actionLabel="Registrar ordeño"
                onAction={() => navigate('/registrar')}
              />
            </Card>
          )}
        </section>
      )}

      {/* Animal counts */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Inventario — {animalCounts.total ?? 0} animales activos
        </p>
        {animalCounts.total > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'cow',       emoji: '🐮', label: 'Vacas' },
              { key: 'heifer',    emoji: '🐄', label: 'Novillas' },
              { key: 'calf',      emoji: '🐣', label: 'Terneros' },
              { key: 'bull',      emoji: '🐂', label: 'Toros' },
              { key: 'young_bull',emoji: '🐃', label: 'Toretes' },
              { key: 'steer',     emoji: '🥩', label: 'Novillos' },
            ].filter((c) => animalCounts[c.key]).map((c) => (
              <MetricCard
                key={c.key}
                emoji={c.emoji}
                label={c.label}
                value={animalCounts[c.key]}
              />
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              emoji="🐄"
              title="Sin animales"
              description="Agrega tu primer animal para comenzar."
              actionLabel="Agregar animal"
              onAction={() => navigate('/animales')}
            />
          </Card>
        )}
      </section>

      {/* Upcoming alerts */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Próximas alertas
        </p>
        {upcomingAlerts.length > 0 ? (
          <Card className="p-4">
            {upcomingAlerts.map((a) => (
              <AlertRow
                key={a.id}
                emoji={alertEmoji(a.type)}
                message={a.message ?? a.type}
                daysUntil={diffDays(a.due_date)}
              />
            ))}
          </Card>
        ) : (
          <Card>
            <EmptyState
              emoji="✅"
              title="Sin alertas próximas"
              description="No hay alertas en los próximos 15 días."
            />
          </Card>
        )}
      </section>

      {/* Quick links */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Accesos rápidos</p>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_LINKS.map(({ emoji, titleKey, desc, to }) => (
            <Card
              key={titleKey}
              className="flex flex-col gap-2 p-4"
              onClick={() => navigate(to)}
            >
              <span className="text-3xl">{emoji}</span>
              <p className="font-semibold text-[#2b3240] text-sm">{t(titleKey)}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
