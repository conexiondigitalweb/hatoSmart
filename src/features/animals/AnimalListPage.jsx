import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { differenceInMonths, differenceInYears } from 'date-fns'
import { Search, Plus, ChevronRight } from 'lucide-react'
import { useFarmStore } from '../../stores/farmStore'
import db from '../../lib/db'
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { cn } from '../../lib/utils'

const CATEGORIES = [
  { value: '',          label: 'Todos' },
  { value: 'cow',       label: 'Vacas' },
  { value: 'heifer',    label: 'Novillas' },
  { value: 'calf',      label: 'Terneros' },
  { value: 'bull',      label: 'Toros' },
  { value: 'young_bull',label: 'Toretes' },
  { value: 'steer',     label: 'Novillos' },
]

const REPRO_BADGE_VARIANT = {
  pregnant: 'pregnant',
  dry:      'dry',
  fresh:    'fresh',
  served:   'served',
}
const REPRO_LABEL = {
  pregnant: 'Preñada', dry: 'Seca', fresh: 'Recién parida', served: 'Servida',
}

function ageLabel(birthDate) {
  if (!birthDate) return ''
  const d = new Date(birthDate)
  const years = differenceInYears(new Date(), d)
  if (years >= 1) return `${years} año${years > 1 ? 's' : ''}`
  const months = differenceInMonths(new Date(), d)
  return `${months} mes${months !== 1 ? 'es' : ''}`
}

function initials(animal) {
  if (animal.name) return animal.name.slice(0, 2).toUpperCase()
  if (animal.tag_number) return animal.tag_number.slice(0, 2)
  return '??'
}

export default function AnimalListPage() {
  const navigate = useNavigate()
  const activeFarm = useFarmStore((s) => s.activeFarm)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')

  const animals = useLiveQuery(
    () => activeFarm
      ? db.animals
          .where('farm_id').equals(activeFarm.id)
          .filter((a) => !a.deleted_at && a.status === 'active')
          .sortBy('tag_number')
      : [],
    [activeFarm?.id]
  )

  const filtered = (animals ?? []).filter((a) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      a.tag_number?.toLowerCase().includes(q) ||
      a.name?.toLowerCase().includes(q) ||
      a.internal_code?.toLowerCase().includes(q)
    const matchCat = !catFilter || a.category === catFilter
    return matchSearch && matchCat
  })

  const isLoading = animals === undefined

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="bg-card px-4 pt-4 pb-3 border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-foreground">
            Animales{animals?.length ? ` (${animals.length})` : ''}
          </h1>
          <button
            onClick={() => navigate('/animales/nuevo')}
            className="flex items-center gap-1 bg-brand-green text-white text-sm font-semibold h-9 px-3 rounded-xl active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Nuevo
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar por nombre, arete o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-9 pr-4 rounded-full border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Category filter chips */}
        <div className="flex gap-2 mt-2.5 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCatFilter(c.value)}
              className={cn(
                'flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all',
                catFilter === c.value
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-green-50 hover:text-brand-green'
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 pb-28 flex flex-col gap-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 bg-card rounded-2xl shadow-sm">
              <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 && animals.length === 0 ? (
          <EmptyState
            illustration="animals"
            title="Sin animales registrados"
            description="Agrega tu primer animal para comenzar el seguimiento del hato."
            actionLabel="Agregar animal"
            onAction={() => navigate('/animales/nuevo')}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            illustration="search"
            title="Sin resultados"
            description="No encontramos animales con esa búsqueda o filtro."
          />
        ) : (
          filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => navigate(`/animales/${a.id}`)}
              className="bg-card rounded-2xl shadow-sm p-4 flex items-center gap-3 text-left w-full active:scale-[0.98] transition-transform"
            >
              <Avatar className="w-12 h-12 flex-shrink-0">
                {a.photo_url && <AvatarImage src={a.photo_url} alt={a.name} />}
                <AvatarFallback>{initials(a)}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground text-sm truncate">
                    {a.name || a.tag_number || '—'}
                  </p>
                  {a.repro_status && REPRO_LABEL[a.repro_status] && (
                    <Badge variant={REPRO_BADGE_VARIANT[a.repro_status] ?? 'default'}>
                      {REPRO_LABEL[a.repro_status]}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {a.tag_number && `#${a.tag_number} · `}
                  {ageLabel(a.birth_date)}
                </p>
              </div>

              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/animales/nuevo')}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-brand-green text-white shadow-lg flex items-center justify-center z-20 active:scale-95 transition-transform"
        aria-label="Agregar animal"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>
    </div>
  )
}
