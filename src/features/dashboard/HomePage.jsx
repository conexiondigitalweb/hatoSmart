import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, addDays, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronRight, Milk, Beef, Bell } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useFarmStore } from '../../stores/farmStore'
import { useSessionStore } from '../../stores/sessionStore'
import { calcGDP } from '../../lib/rules/weights'
import { refreshPossibleHeatAlerts } from '../../lib/alerts/reproductionAlerts'
import db from '../../lib/db'
import Card from '../../components/ui/Card'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import MilkDashboard from '../milk/MilkDashboard'
import { cn } from '../../lib/utils'

const DAIRY_ORIENTATIONS = ['dairy', 'dual']

const ALERT_EMOJI = {
  calving_due: '🐮', pregnancy_check_due: '🔬', dry_off_due: '🚿',
  health_due: '💉', possible_heat: '❤️‍🔥', low_stock: '📦',
}
const ALERT_URGENCY = (daysUntil) => {
  if (daysUntil <= 0) return 'bg-red-100 text-red-700'
  if (daysUntil <= 7) return 'bg-amber-100 text-amber-700'
  return 'bg-blue-50 text-blue-700'
}

const CATEGORY_CHIPS = [
  { key: 'cow',       emoji: '🐮', label: 'Vacas' },
  { key: 'heifer',    emoji: '🐄', label: 'Novillas' },
  { key: 'calf',      emoji: '🐣', label: 'Terneros' },
  { key: 'bull',      emoji: '🐂', label: 'Toros' },
  { key: 'young_bull',emoji: '🐃', label: 'Toretes' },
  { key: 'steer',     emoji: '🥩', label: 'Novillos' },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function HomePage() {
  const navigate = useNavigate()
  const activeFarm = useFarmStore((s) => s.activeFarm)
  const user = useSessionStore((s) => s.user)

  const today = new Date()
  const in15days = format(addDays(today, 15), 'yyyy-MM-dd')
  const isDairy = DAIRY_ORIENTATIONS.includes(activeFarm?.orientation)
  const userName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'ganadero'
  const dateLabel = format(today, "EEEE, d 'de' MMMM", { locale: es })

  // On-demand recompute of possible_heat alerts — see reproductionAlerts.js
  // for why this runs on load instead of a cron/Edge Function.
  useEffect(() => {
    if (activeFarm?.id) refreshPossibleHeatAlerts(activeFarm.id).catch(() => {})
  }, [activeFarm?.id])

  // Reactive Dexie queries — auto-update when pullFromSupabase writes new data
  const animals = useLiveQuery(
    () => activeFarm
      ? db.animals.where('farm_id').equals(activeFarm.id)
          .filter((a) => !a.deleted_at && a.status === 'active')
          .toArray()
      : [],
    [activeFarm?.id]
  )

  const alertsRaw = useLiveQuery(
    () => activeFarm
      ? db.alerts.where('farm_id').equals(activeFarm.id)
          .filter((a) => a.status === 'pending' && a.due_date <= in15days)
          .sortBy('due_date')
      : [],
    [activeFarm?.id]
  )

  const weighings = useLiveQuery(
    () => activeFarm
      ? db.weighings.where('farm_id').equals(activeFarm.id)
          .filter((w) => !w.deleted_at)
          .sortBy('date')
      : [],
    [activeFarm?.id]
  )

  const healthEvents = useLiveQuery(
    () => activeFarm
      ? db.health_events.where('farm_id').equals(activeFarm.id)
          .filter((e) => !e.deleted_at)
          .toArray()
      : [],
    [activeFarm?.id]
  )

  const nextHealthAlert = useLiveQuery(
    () => activeFarm
      ? db.alerts.where('farm_id').equals(activeFarm.id)
          .filter((a) => a.status === 'pending' && a.type === 'health_due')
          .sortBy('due_date')
          .then((list) => list[0] ?? null)
      : null,
    [activeFarm?.id]
  )

  const loading = animals === undefined || alertsRaw === undefined || weighings === undefined || healthEvents === undefined

  const animalCounts = useMemo(() => {
    if (!animals) return {}
    return animals.reduce((acc, a) => {
      acc[a.category] = (acc[a.category] ?? 0) + 1
      return acc
    }, { total: animals.length })
  }, [animals])

  const animalMap = useMemo(
    () => Object.fromEntries((animals ?? []).map((a) => [a.id, a])),
    [animals]
  )

  const upcomingAlerts = useMemo(() => (alertsRaw ?? []).slice(0, 3), [alertsRaw])

  // weighings comes sorted ascending by date — group per animal to compute
  // GDP between consecutive weighings, same rule as AnimalDetailPage.
  const { lastWeighing, avgGdp } = useMemo(() => {
    if (!weighings?.length) return { lastWeighing: null, avgGdp: null }
    const byAnimal = {}
    for (const w of weighings) {
      (byAnimal[w.animal_id] ??= []).push(w)
    }
    const cutoff = format(subDays(today, 14), 'yyyy-MM-dd')
    const gdps = []
    for (const list of Object.values(byAnimal)) {
      for (let i = 1; i < list.length; i++) {
        if (list[i].date >= cutoff) {
          const g = calcGDP(list[i - 1].weight_kg, list[i - 1].date, list[i].weight_kg, list[i].date)
          if (g !== null) gdps.push(g)
        }
      }
    }
    return {
      lastWeighing: weighings[weighings.length - 1],
      avgGdp: gdps.length ? gdps.reduce((a, b) => a + b, 0) / gdps.length : null,
    }
  }, [weighings])

  const recentHealthCount = useMemo(() => {
    if (!healthEvents?.length) return 0
    const cutoff = format(subDays(today, 30), 'yyyy-MM-dd')
    return healthEvents.filter((e) => e.date >= cutoff).length
  }, [healthEvents])

  const diffDays = (dateStr) => Math.round((new Date(dateStr + 'T00:00') - today) / 86400000)

  return (
    <div className="p-4 flex flex-col gap-5 pb-8">
      {/* Greeting */}
      <div className="pt-2">
        <p className="text-sm text-muted-foreground capitalize">{dateLabel}</p>
        <h1 className="text-2xl font-bold text-foreground mt-0.5">
          {greeting()}, {userName} 👋
        </h1>
        {activeFarm && (
          <p className="text-base font-semibold text-brand-green mt-0.5">{activeFarm.name}</p>
        )}
      </div>

      {/* Dairy production section */}
      {isDairy && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Producción</h2>
            <button
              onClick={() => navigate('/ordeño')}
              className="text-xs font-semibold text-brand-green flex items-center gap-0.5"
            >
              Registrar <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {loading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </div>
          ) : (
            <MilkDashboard />
          )}
        </section>
      )}

      {/* Weighings section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pesajes</h2>
          <button
            onClick={() => navigate('/pesajes')}
            className="text-xs font-semibold text-brand-green flex items-center gap-0.5"
          >
            Ver todos <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        ) : lastWeighing ? (
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 flex flex-col gap-0.5">
              <p className="text-2xl font-bold text-foreground leading-none">{lastWeighing.weight_kg} kg</p>
              <p className="text-xs font-medium text-muted-foreground">
                {animalMap[lastWeighing.animal_id]?.name || animalMap[lastWeighing.animal_id]?.tag_number || 'Animal'}
              </p>
              <p className="text-xs text-muted-foreground/70">{format(new Date(lastWeighing.date), 'dd/MM/yyyy')}</p>
            </Card>
            <Card className="p-4 flex flex-col gap-0.5">
              <p className="text-2xl font-bold text-foreground leading-none">
                {avgGdp !== null ? avgGdp.toFixed(2) : '—'}
              </p>
              <p className="text-xs font-medium text-muted-foreground">GDP promedio</p>
              <p className="text-xs text-muted-foreground/70">
                {avgGdp !== null ? 'kg/día · últimos 14 días' : 'Sin datos suficientes'}
              </p>
            </Card>
          </div>
        ) : (
          <Card className="p-2">
            <EmptyState
              illustration="animals"
              title="Sin pesajes registrados"
              description="Registra el primer pesaje para comenzar a monitorear el GDP."
              actionLabel="Registrar pesaje"
              onAction={() => navigate('/registrar/peso')}
            />
          </Card>
        )}
      </section>

      {/* Health section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Sanidad</h2>
          <button
            onClick={() => navigate('/salud')}
            className="text-xs font-semibold text-brand-green flex items-center gap-0.5"
          >
            Ver todos <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        ) : nextHealthAlert || recentHealthCount > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 flex flex-col gap-0.5">
              <p className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                {nextHealthAlert ? nextHealthAlert.message : '—'}
              </p>
              <p className="text-xs font-medium text-muted-foreground">Próxima dosis</p>
              {nextHealthAlert && (
                <p className="text-xs text-muted-foreground/70">
                  {format(new Date(nextHealthAlert.due_date + 'T00:00'), 'dd/MM/yyyy')}
                </p>
              )}
            </Card>
            <Card className="p-4 flex flex-col gap-0.5">
              <p className="text-2xl font-bold text-foreground leading-none">{recentHealthCount}</p>
              <p className="text-xs font-medium text-muted-foreground">Eventos recientes</p>
              <p className="text-xs text-muted-foreground/70">últimos 30 días</p>
            </Card>
          </div>
        ) : (
          <Card className="p-2">
            <EmptyState
              illustration="alerts"
              title="Sin eventos sanitarios"
              description="Registra vacunas, desparasitaciones y tratamientos para comenzar el historial."
              actionLabel="Registrar evento"
              onAction={() => navigate('/registrar/salud')}
            />
          </Card>
        )}
      </section>

      {/* Animal inventory */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Inventario · {loading ? '—' : (animalCounts.total ?? 0)} animales
          </h2>
          <button
            onClick={() => navigate('/animales')}
            className="text-xs font-semibold text-brand-green flex items-center gap-0.5"
          >
            Ver todos <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {loading ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[1,2,3,4].map((i) => <Skeleton key={i} className="h-20 w-20 flex-shrink-0 rounded-2xl" />)}
          </div>
        ) : animalCounts.total > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORY_CHIPS.filter((c) => animalCounts[c.key]).map((c) => (
              <button
                key={c.key}
                onClick={() => navigate('/animales')}
                className="flex-shrink-0 bg-card rounded-2xl shadow-sm px-4 py-3 flex flex-col items-center gap-1 min-w-[72px] active:scale-95 transition-transform"
              >
                <span className="text-xl">{c.emoji}</span>
                <span className="text-lg font-bold text-foreground leading-none">{animalCounts[c.key]}</span>
                <span className="text-[11px] text-muted-foreground">{c.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <Card className="p-2">
            <EmptyState
              illustration="animals"
              title="Sin animales registrados"
              description="Agrega tu primer animal para empezar el seguimiento."
              actionLabel="Agregar animal"
              onAction={() => navigate('/animales/nuevo')}
            />
          </Card>
        )}
      </section>

      {/* Upcoming alerts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Alertas próximas</h2>
          {upcomingAlerts.length > 0 && (
            <button
              onClick={() => navigate('/alertas')}
              className="text-xs font-semibold text-brand-green flex items-center gap-0.5"
            >
              Ver todas <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1,2].map((i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}
          </div>
        ) : upcomingAlerts.length > 0 ? (
          <div className="flex flex-col gap-2">
            {upcomingAlerts.map((a) => {
              const days = diffDays(a.due_date)
              return (
                <Card
                  key={a.id}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  onClick={() => navigate('/alertas')}
                >
                  <span className="text-xl flex-shrink-0">{ALERT_EMOJI[a.type] ?? '🔔'}</span>
                  <p className="text-sm text-foreground flex-1 leading-snug truncate">{a.message ?? a.type}</p>
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0', ALERT_URGENCY(days))}>
                    {days <= 0 ? 'Hoy' : `${days}d`}
                  </span>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="p-2">
            <EmptyState
              illustration="done"
              title="Sin alertas próximas"
              description="Todo en orden para los próximos 15 días."
            />
          </Card>
        )}
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Acciones rápidas</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Milk,  label: 'Registrar ordeño',  sub: 'Producción de hoy',    to: '/ordeño',         show: isDairy },
            { icon: Beef,  label: 'Agregar animal',     sub: 'Nuevo en el hato',     to: '/animales/nuevo', show: true },
            { icon: Bell,  label: 'Ver alertas',        sub: 'Pendientes hoy',       to: '/alertas',        show: true },
          ].filter((q) => q.show).map(({ icon: Icon, label, sub, to }) => (
            <Card key={label} className="flex flex-col gap-2 p-4" onClick={() => navigate(to)}>
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <Icon className="w-5 h-5 text-brand-green" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
