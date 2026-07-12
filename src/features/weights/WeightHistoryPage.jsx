import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'
import { ArrowLeft, Plus } from 'lucide-react'
import { useFarmStore } from '../../stores/farmStore'
import { calcGDP } from '../../lib/rules/weights'
import db from '../../lib/db'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { cn } from '../../lib/utils'

const METHOD_LABEL = { bascula: 'Báscula', cinta: 'Cinta' }

export default function WeightHistoryPage() {
  const navigate   = useNavigate()
  const activeFarm = useFarmStore((s) => s.activeFarm)

  const weighings = useLiveQuery(
    () => activeFarm
      ? db.weighings.where('farm_id').equals(activeFarm.id)
          .filter((w) => !w.deleted_at)
          .sortBy('date')
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

  // weighings comes sorted ascending by date; compute per-animal GDP then
  // present the combined list newest-first.
  const rows = useMemo(() => {
    if (!weighings) return []
    const byAnimal = {}
    for (const w of weighings) {
      (byAnimal[w.animal_id] ??= []).push(w)
    }
    const gdpById = {}
    for (const list of Object.values(byAnimal)) {
      for (let i = 1; i < list.length; i++) {
        gdpById[list[i].id] = calcGDP(list[i - 1].weight_kg, list[i - 1].date, list[i].weight_kg, list[i].date)
      }
    }
    return [...weighings].reverse().map((w) => ({ ...w, gdp: gdpById[w.id] ?? null }))
  }, [weighings])

  const isLoading = weighings === undefined

  return (
    <div className="flex flex-col h-full">
      <div className="bg-card px-4 py-4 border-b border-border flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1">
          Historial de pesajes{rows.length ? ` (${rows.length})` : ''}
        </h1>
        <button
          onClick={() => navigate('/registrar/peso')}
          className="flex items-center gap-1 bg-brand-green text-white text-sm font-semibold h-9 px-3 rounded-xl active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Nuevo
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-28 flex flex-col gap-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)
        ) : rows.length === 0 ? (
          <EmptyState
            illustration="animals"
            title="Sin pesajes registrados"
            description="Registra el primer pesaje para comenzar a monitorear el GDP del hato."
            actionLabel="Registrar pesaje"
            onAction={() => navigate('/registrar/peso')}
          />
        ) : (
          rows.map((w) => {
            const animal = animalMap[w.animal_id]
            return (
              <button
                key={w.id}
                onClick={() => navigate(`/animales/${w.animal_id}`)}
                className="bg-card rounded-2xl shadow-sm p-4 flex flex-col gap-0.5 text-left w-full active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground text-sm truncate">
                    {animal?.name || animal?.tag_number || 'Animal'}
                  </p>
                  <span className="text-sm font-bold text-foreground">{w.weight_kg} kg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(w.date), 'dd/MM/yyyy')} · {METHOD_LABEL[w.method] ?? '—'}
                  </span>
                  {w.gdp !== null && (
                    <span className={cn('text-xs font-medium', w.gdp >= 0 ? 'text-brand-green' : 'text-destructive')}>
                      GDP {w.gdp.toFixed(2)} kg/día
                    </span>
                  )}
                </div>
                {w.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{w.notes}</p>}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
