import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { differenceInMonths, differenceInYears } from 'date-fns'
import { useFarmStore } from '../../stores/farmStore'
import db from '../../lib/db'
import EmptyState from '../../components/ui/EmptyState'

const CATEGORIES = [
  { value: '', label: 'Todos' },
  { value: 'cow', label: 'Vacas' },
  { value: 'heifer', label: 'Novillas' },
  { value: 'calf', label: 'Terneros/as' },
  { value: 'bull', label: 'Toros' },
  { value: 'young_bull', label: 'Toretes' },
  { value: 'steer', label: 'Novillos' },
]

const CATEGORY_EMOJI = {
  cow: '🐮', heifer: '🐄', calf: '🐣',
  bull: '🐂', young_bull: '🐃', steer: '🥩',
}

const REPRO_BADGE = {
  pregnant: { label: 'Preñada', cls: 'bg-purple-100 text-purple-700' },
  dry:      { label: 'Seca',    cls: 'bg-gray-100 text-gray-600' },
  fresh:    { label: 'Recién parida', cls: 'bg-blue-100 text-blue-700' },
  served:   { label: 'Servida', cls: 'bg-yellow-100 text-yellow-700' },
}

function ageLabel(birthDate) {
  if (!birthDate) return ''
  const d = new Date(birthDate)
  const years = differenceInYears(new Date(), d)
  if (years >= 1) return `${years} año${years > 1 ? 's' : ''}`
  const months = differenceInMonths(new Date(), d)
  return `${months} mes${months !== 1 ? 'es' : ''}`
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-[#2b3240]">
            Animales {animals?.length ? `(${animals.length})` : ''}
          </h1>
        </div>
        <input
          type="search"
          placeholder="Buscar por nombre, arete o código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-gray-200 bg-[#f5f5f5] text-sm text-[#2b3240] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3dbf5e]"
        />
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCatFilter(c.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                catFilter === c.value
                  ? 'bg-[#3dbf5e] text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 pb-28">
        {animals === undefined ? (
          <p className="text-center text-gray-400 text-sm mt-8">Cargando...</p>
        ) : filtered.length === 0 && animals.length === 0 ? (
          <EmptyState
            icon="🐄"
            title="Sin animales registrados"
            description="Agrega tu primer animal para comenzar a hacer seguimiento del hato."
            action="Agregar animal"
            onAction={() => navigate('/animales/nuevo')}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="Sin resultados"
            description="No encontramos animales con esa búsqueda."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((a) => {
              const badge = REPRO_BADGE[a.repro_status]
              return (
                <div
                  key={a.id}
                  onClick={() => navigate(`/animales/${a.id}`)}
                  className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3 cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#f5f5f5] flex items-center justify-center text-2xl flex-shrink-0">
                    {a.photo_url
                      ? <img src={a.photo_url} alt={a.name} className="w-full h-full rounded-xl object-cover" />
                      : CATEGORY_EMOJI[a.category] ?? '🐄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#2b3240] text-sm truncate">
                        {a.name || a.tag_number || a.internal_code || '—'}
                      </p>
                      {badge && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${badge.cls}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {a.tag_number && `Arete: ${a.tag_number} · `}
                      {ageLabel(a.birth_date)}
                    </p>
                  </div>
                  <span className="text-gray-300 text-lg flex-shrink-0">›</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/animales/nuevo')}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-[#3dbf5e] text-white shadow-lg flex items-center justify-center text-2xl z-20 active:scale-95 transition-transform"
      >
        +
      </button>
    </div>
  )
}
