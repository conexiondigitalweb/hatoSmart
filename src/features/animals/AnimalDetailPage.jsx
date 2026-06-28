import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { format, differenceInMonths, differenceInYears } from 'date-fns'
import db from '../../lib/db'

const CATEGORY_LABEL = {
  calf: 'Ternero/a', heifer: 'Novilla', cow: 'Vaca',
  young_bull: 'Torete', bull: 'Toro', steer: 'Novillo',
}
const REPRO_STATUS_LABEL = {
  open: 'Vacía', served: 'Servida', pregnant: 'Preñada',
  dry: 'Seca', fresh: 'Recién parida',
}
const EVENT_LABEL = {
  heat: { label: 'Celo', emoji: '🔴' },
  service: { label: 'Servicio', emoji: '💉' },
  pregnancy_check: { label: 'Chequeo preñez', emoji: '🔍' },
  calving: { label: 'Parto', emoji: '🐄' },
  abortion: { label: 'Aborto', emoji: '⚠️' },
  dry_off: { label: 'Secado', emoji: '💧' },
}

function ageLabel(birthDate) {
  if (!birthDate) return 'Edad desconocida'
  const d = new Date(birthDate)
  const years = differenceInYears(new Date(), d)
  if (years >= 1) {
    const months = differenceInMonths(new Date(), d) % 12
    return `${years} año${years > 1 ? 's' : ''}${months ? ` ${months} mes${months > 1 ? 'es' : ''}` : ''}`
  }
  const months = differenceInMonths(new Date(), d)
  return `${months} mes${months !== 1 ? 'es' : ''}`
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 pt-3 pb-1">{title}</p>
      {children}
    </div>
  )
}

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="flex justify-between items-start px-4 py-2.5 border-t border-gray-100 first:border-0">
      <span className="text-sm text-gray-500 flex-shrink-0 mr-4">{label}</span>
      <span className="text-sm font-medium text-[#2b3240] text-right">{value}</span>
    </div>
  )
}

export default function AnimalDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('info')

  const animal = useLiveQuery(() => db.animals.get(id), [id])
  const mother = useLiveQuery(
    () => animal?.mother_id ? db.animals.get(animal.mother_id) : null,
    [animal?.mother_id]
  )
  const reproEvents = useLiveQuery(
    () => db.repro_events.where('animal_id').equals(id).reverse().sortBy('date'),
    [id]
  )
  const weighings = useLiveQuery(
    () => db.weighings.where('animal_id').equals(id).reverse().sortBy('date'),
    [id]
  )
  const healthEvents = useLiveQuery(
    () => db.health_events.where('animal_id').equals(id).reverse().sortBy('date'),
    [id]
  )

  if (animal === undefined) {
    return <div className="p-4 text-center text-gray-400 text-sm mt-8">Cargando...</div>
  }
  if (!animal) {
    return <div className="p-4 text-center text-gray-400 text-sm mt-8">Animal no encontrado.</div>
  }

  const lastWeight = weighings?.[0]
  const prevWeight = weighings?.[1]
  const gdp = lastWeight && prevWeight
    ? ((lastWeight.weight_kg - prevWeight.weight_kg) /
       Math.max(1, Math.round((new Date(lastWeight.date) - new Date(prevWeight.date)) / 86400000))).toFixed(2)
    : null

  const lastRepro = reproEvents?.[0]
  const fpp = lastRepro?.expected_calving_date

  return (
    <div className="flex flex-col pb-28">
      {/* Header */}
      <div className="bg-[#2b3240] px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="text-white/70 text-2xl leading-none">‹</button>
          <span className="text-white font-semibold flex-1 truncate">
            {animal.name || animal.tag_number || 'Animal'}
          </span>
          <button
            onClick={() => navigate(`/animales/${id}/editar`)}
            className="text-[#3dbf5e] text-sm font-semibold"
          >
            Editar
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl flex-shrink-0">
            {animal.photo_url
              ? <img src={animal.photo_url} alt={animal.name} className="w-full h-full rounded-2xl object-cover" />
              : (animal.sex === 'female' ? '🐮' : '🐂')}
          </div>
          <div>
            {animal.tag_number && (
              <p className="text-white/60 text-xs">Arete: {animal.tag_number}</p>
            )}
            <p className="text-white font-bold text-lg leading-tight">
              {animal.name || animal.tag_number || '—'}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                {CATEGORY_LABEL[animal.category] ?? animal.category}
              </span>
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                {ageLabel(animal.birth_date)}
              </span>
              {animal.repro_status && (
                <span className="text-xs bg-[#3dbf5e]/30 text-[#3dbf5e] px-2 py-0.5 rounded-full">
                  {REPRO_STATUS_LABEL[animal.repro_status]}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 bg-white/10 rounded-xl p-1">
          {(animal.sex === 'female'
            ? ['info', 'repro', 'peso', 'sanidad']
            : ['info', 'peso', 'sanidad']
          ).map((t) => {
            const labels = { info: 'Info', repro: 'Repro', peso: 'Peso', sanidad: 'Sanidad' }
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tab === t ? 'bg-white text-[#2b3240]' : 'text-white/70'
                }`}
              >
                {labels[t]}
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* INFO TAB */}
        {tab === 'info' && (
          <>
            <Section title="Identificación">
              <Row label="Arete" value={animal.tag_number} />
              <Row label="Código interno" value={animal.internal_code} />
              <Row label="Nombre" value={animal.name} />
              <Row label="Raza" value={animal.breed} />
              <Row label="Sexo" value={animal.sex === 'female' ? 'Hembra' : 'Macho'} />
              <Row label="Nacimiento" value={animal.birth_date ? format(new Date(animal.birth_date), 'dd/MM/yyyy') : null} />
              <Row label="Edad" value={ageLabel(animal.birth_date)} />
            </Section>
            <Section title="Origen y trazabilidad">
              <Row label="Origen" value={{ born: 'Nacido en finca', purchased: 'Comprado', transferred: 'Transferido' }[animal.origin]} />
              <Row label="Madre" value={mother ? (mother.name || mother.tag_number) : animal.mother_id ? '—' : null} />
              <Row label="Padre" value={animal.external_father} />
              <Row label="Lote" value={animal.lot} />
            </Section>
            {(animal.registry_number || animal.registry_association) && (
              <Section title="Registro genético">
                <Row label="N° Registro" value={animal.registry_number} />
                <Row label="Asociación" value={animal.registry_association} />
                <Row label="Procedencia" value={animal.breeder_origin} />
              </Section>
            )}
            {animal.notes && (
              <Section title="Observaciones">
                <p className="px-4 py-3 text-sm text-[#2b3240]">{animal.notes}</p>
              </Section>
            )}
          </>
        )}

        {/* REPRO TAB */}
        {tab === 'repro' && (
          <>
            <Section title="Estado reproductivo">
              <Row label="Estado" value={REPRO_STATUS_LABEL[animal.repro_status] ?? '—'} />
              {fpp && <Row label="Fecha probable parto" value={format(new Date(fpp), 'dd/MM/yyyy')} />}
              {lastRepro && <Row label="Último evento" value={`${EVENT_LABEL[lastRepro.type]?.emoji} ${EVENT_LABEL[lastRepro.type]?.label} · ${format(new Date(lastRepro.date), 'dd/MM/yyyy')}`} />}
            </Section>
            <button
              onClick={() => navigate(`/registrar/repro?animalId=${id}`)}
              className="w-full min-h-[48px] rounded-xl bg-[#3dbf5e] text-white font-semibold text-sm"
            >
              Registrar evento reproductivo
            </button>
            {reproEvents?.length > 0 && (
              <Section title="Historial reproductivo">
                {reproEvents.map((e) => (
                  <div key={e.id} className="px-4 py-2.5 border-t border-gray-100 first:border-0 flex items-center gap-3">
                    <span className="text-xl">{EVENT_LABEL[e.type]?.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#2b3240]">{EVENT_LABEL[e.type]?.label}</p>
                      {e.result && <p className="text-xs text-gray-400">{e.result === 'pregnant' ? 'Preñada' : 'Vacía'}</p>}
                    </div>
                    <span className="text-xs text-gray-400">{format(new Date(e.date), 'dd/MM/yy')}</span>
                  </div>
                ))}
              </Section>
            )}
          </>
        )}

        {/* PESO TAB */}
        {tab === 'peso' && (
          <>
            <Section title="Último pesaje">
              <Row label="Peso" value={lastWeight ? `${lastWeight.weight_kg} kg` : '—'} />
              <Row label="Fecha" value={lastWeight ? format(new Date(lastWeight.date), 'dd/MM/yyyy') : null} />
              <Row label="GDP" value={gdp ? `${gdp} kg/día` : null} />
              <Row label="Condición corporal" value={lastWeight?.body_condition} />
            </Section>
            <button
              onClick={() => navigate(`/registrar/peso?animalId=${id}`)}
              className="w-full min-h-[48px] rounded-xl bg-[#3dbf5e] text-white font-semibold text-sm"
            >
              Registrar pesaje
            </button>
            {weighings?.length > 0 && (
              <Section title="Historial de pesajes">
                {weighings.map((w) => (
                  <div key={w.id} className="px-4 py-2.5 border-t border-gray-100 first:border-0 flex justify-between">
                    <span className="text-sm text-[#2b3240]">{format(new Date(w.date), 'dd/MM/yyyy')}</span>
                    <span className="text-sm font-semibold text-[#2b3240]">{w.weight_kg} kg</span>
                  </div>
                ))}
              </Section>
            )}
          </>
        )}

        {/* SANIDAD TAB */}
        {tab === 'sanidad' && (
          <>
            <button
              onClick={() => navigate(`/registrar/salud?animalId=${id}`)}
              className="w-full min-h-[48px] rounded-xl bg-[#3dbf5e] text-white font-semibold text-sm"
            >
              Registrar evento sanitario
            </button>
            {healthEvents?.length > 0 ? (
              <Section title="Historial sanitario">
                {healthEvents.map((e) => (
                  <div key={e.id} className="px-4 py-2.5 border-t border-gray-100 first:border-0">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-[#2b3240]">{e.product ?? e.type}</p>
                      <span className="text-xs text-gray-400">{format(new Date(e.date), 'dd/MM/yy')}</span>
                    </div>
                    {e.diagnosis && <p className="text-xs text-gray-400 mt-0.5">{e.diagnosis}</p>}
                    {e.next_due_date && (
                      <p className="text-xs text-orange-500 mt-0.5">Próxima: {format(new Date(e.next_due_date), 'dd/MM/yyyy')}</p>
                    )}
                  </div>
                ))}
              </Section>
            ) : (
              <p className="text-center text-gray-400 text-sm py-8">Sin eventos sanitarios registrados.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
