import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'
import { ArrowLeft, Plus } from 'lucide-react'
import { useFarmStore } from '../../stores/farmStore'
import { HEALTH_EVENT_TYPES } from '../../lib/rules/health'
import db from '../../lib/db'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { cn } from '../../lib/utils'

const TYPE_MAP = Object.fromEntries(HEALTH_EVENT_TYPES.map((t) => [t.value, t]))

export default function HealthHistoryPage() {
  const navigate   = useNavigate()
  const activeFarm = useFarmStore((s) => s.activeFarm)
  const [typeFilter, setTypeFilter] = useState('')

  const events = useLiveQuery(
    () => activeFarm
      ? db.health_events.where('farm_id').equals(activeFarm.id)
          .filter((e) => !e.deleted_at)
          .reverse().sortBy('date')
      : [],
    [activeFarm?.id]
  )

  const animals = useLiveQuery(
    () => activeFarm
      ? db.animals.where('farm_id').equals(activeFarm.id).filter((a) => !a.deleted_at).toArray()
      : [],
    [activeFarm?.id]
  )

  const animalMap = useMemo(
    () => Object.fromEntries((animals ?? []).map((a) => [a.id, a])),
    [animals]
  )

  const filtered = useMemo(
    () => (events ?? []).filter((e) => !typeFilter || e.type === typeFilter),
    [events, typeFilter]
  )

  const isLoading = events === undefined

  return (
    <div className="flex flex-col h-full">
      <div className="bg-card px-4 pt-4 pb-3 border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground flex-1">
            Historial sanitario{filtered.length ? ` (${filtered.length})` : ''}
          </h1>
          <button
            onClick={() => navigate('/registrar/salud')}
            className="flex items-center gap-1 bg-brand-green text-white text-sm font-semibold h-9 px-3 rounded-xl active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Nuevo
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setTypeFilter('')}
            className={cn(
              'flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all',
              typeFilter === '' ? 'bg-brand-green text-white shadow-sm' : 'bg-muted text-muted-foreground'
            )}
          >
            Todos
          </button>
          {HEALTH_EVENT_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={cn(
                'flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all',
                typeFilter === t.value ? 'bg-brand-green text-white shadow-sm' : 'bg-muted text-muted-foreground'
              )}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-28 flex flex-col gap-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)
        ) : filtered.length === 0 ? (
          <EmptyState
            illustration="alerts"
            title="Sin eventos sanitarios"
            description="Registra vacunas, desparasitaciones y tratamientos para comenzar el historial."
            actionLabel="Registrar evento"
            onAction={() => navigate('/registrar/salud')}
          />
        ) : (
          filtered.map((e) => {
            const animal = animalMap[e.animal_id]
            const cfg = TYPE_MAP[e.type] ?? { emoji: '📋', label: e.type }
            return (
              <button
                key={e.id}
                onClick={() => e.animal_id && navigate(`/animales/${e.animal_id}`)}
                className="bg-card rounded-2xl shadow-sm p-4 flex flex-col gap-0.5 text-left w-full active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-foreground text-sm truncate flex-1">
                    <span className="mr-1">{cfg.emoji}</span>
                    {e.product || cfg.label}
                  </p>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{format(new Date(e.date), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {animal?.name || animal?.tag_number || 'Animal'} · {cfg.label}
                    {e.dose ? ` · ${e.dose}` : ''}
                  </span>
                  {e.cost != null && (
                    <span className="text-xs font-medium text-foreground">${e.cost}</span>
                  )}
                </div>
                {e.next_due_date && (
                  <p className="text-xs text-amber-600 mt-0.5">Próxima dosis: {format(new Date(e.next_due_date), 'dd/MM/yyyy')}</p>
                )}
                {e.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{e.notes}</p>}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
