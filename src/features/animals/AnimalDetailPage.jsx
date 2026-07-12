import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { format, differenceInMonths, differenceInYears } from 'date-fns'
import { ArrowLeft, Pencil } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Skeleton from '../../components/ui/Skeleton'
import db from '../../lib/db'
import { cn } from '../../lib/utils'
import { calcGDP } from '../../lib/rules/weights'
import { HEALTH_EVENT_TYPES } from '../../lib/rules/health'

const CATEGORY_LABEL = {
  calf: 'Ternero/a', heifer: 'Novilla', cow: 'Vaca',
  young_bull: 'Torete', bull: 'Toro', steer: 'Novillo',
}
const REPRO_STATUS_LABEL = {
  open: 'Vacía', served: 'Servida', pregnant: 'Preñada', dry: 'Seca', fresh: 'Recién parida',
}
const REPRO_STATUS_VARIANT = {
  pregnant: 'pregnant', served: 'served', dry: 'dry', fresh: 'fresh',
}
const EVENT_LABEL = {
  heat:             { label: 'Celo',           emoji: '🔴' },
  service:          { label: 'Servicio',        emoji: '💉' },
  pregnancy_check:  { label: 'Chequeo preñez', emoji: '🔍' },
  calving:          { label: 'Parto',           emoji: '🐄' },
  abortion:         { label: 'Aborto',          emoji: '⚠️' },
  dry_off:          { label: 'Secado',          emoji: '💧' },
}
const HEALTH_TYPE_MAP = Object.fromEntries(HEALTH_EVENT_TYPES.map((t) => [t.value, t]))
const METHOD_LABEL = { bascula: 'Báscula', cinta: 'Cinta' }

function WeightTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground">{payload[0].value} kg</p>
      <p className="text-muted-foreground">{label}</p>
    </div>
  )
}

function ageLabel(birthDate) {
  if (!birthDate) return 'Edad desconocida'
  const d = new Date(birthDate)
  const years = differenceInYears(new Date(), d)
  if (years >= 1) {
    const months = differenceInMonths(new Date(), d) % 12
    return `${years} año${years > 1 ? 's' : ''}${months ? ` ${months}m` : ''}`
  }
  const months = differenceInMonths(new Date(), d)
  return `${months} mes${months !== 1 ? 'es' : ''}`
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex justify-between items-start py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground flex-shrink-0 mr-4">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-card rounded-2xl shadow-sm overflow-hidden px-4">
      {title && (
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pt-3 pb-1">{title}</p>
      )}
      {children}
    </div>
  )
}

export default function AnimalDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const animal    = useLiveQuery(() => db.animals.get(id), [id])
  const mother    = useLiveQuery(() => animal?.mother_id ? db.animals.get(animal.mother_id) : null, [animal?.mother_id])
  const reproEvents   = useLiveQuery(() => db.repro_events.where('animal_id').equals(id).reverse().sortBy('date'), [id])
  const weighings     = useLiveQuery(() => db.weighings.where('animal_id').equals(id).reverse().sortBy('date'), [id])
  const healthEvents  = useLiveQuery(() => db.health_events.where('animal_id').equals(id).reverse().sortBy('date'), [id])

  if (animal === undefined) {
    return (
      <div className="p-4 flex flex-col gap-3">
        <Skeleton className="h-48 rounded-none" />
        <Skeleton className="h-10 mx-4 rounded-xl" />
        <Skeleton className="h-40 mx-4 rounded-2xl" />
      </div>
    )
  }
  if (!animal) {
    return <div className="p-4 text-center text-muted-foreground text-sm mt-8">Animal no encontrado.</div>
  }

  const lastWeight = weighings?.[0]
  const prevWeight = weighings?.[1]
  const gdp = lastWeight && prevWeight
    ? calcGDP(prevWeight.weight_kg, prevWeight.date, lastWeight.weight_kg, lastWeight.date)?.toFixed(2)
    : null
  const weightChartData = weighings?.length >= 2
    ? [...weighings].reverse().map((w) => ({ date: w.date, label: format(new Date(w.date), 'dd/MM'), weight: w.weight_kg }))
    : []

  const lastRepro = reproEvents?.[0]
  const fpp = lastRepro?.expected_calving_date
  const lastHealthEvent = healthEvents?.[0]

  const tabs = animal.sex === 'female'
    ? ['info', 'repro', 'peso', 'sanidad']
    : ['info', 'peso', 'sanidad']

  return (
    <div className="flex flex-col pb-28">
      {/* Hero header */}
      <div className="bg-brand-dark px-4 pt-4 pb-6 relative overflow-hidden">
        {/* Decorative circle */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-brand-green/10" />
        <div className="absolute -right-4 top-16 w-24 h-24 rounded-full bg-brand-green/10" />

        <div className="relative flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-white/80 font-medium flex-1 truncate text-sm">
            {animal.name || animal.tag_number || 'Animal'}
          </span>
          <button
            onClick={() => navigate(`/animales/${id}/editar`)}
            className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-brand-green"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>

        <div className="relative flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center text-4xl flex-shrink-0 overflow-hidden">
            {animal.photo_url
              ? <img src={animal.photo_url} alt={animal.name} className="w-full h-full object-cover" />
              : (animal.sex === 'female' ? '🐮' : '🐂')}
          </div>
          <div>
            <p className="text-white font-bold text-xl leading-tight">
              {animal.name || animal.tag_number || '—'}
            </p>
            {animal.tag_number && animal.name && (
              <p className="text-white/60 text-xs mt-0.5">Arete #{animal.tag_number}</p>
            )}
            <div className="flex items-center flex-wrap gap-1.5 mt-2">
              <span className="text-xs bg-white/15 text-white/90 px-2.5 py-1 rounded-full">
                {CATEGORY_LABEL[animal.category] ?? animal.category}
              </span>
              <span className="text-xs bg-white/15 text-white/90 px-2.5 py-1 rounded-full">
                {ageLabel(animal.birth_date)}
              </span>
              {animal.repro_status && REPRO_STATUS_LABEL[animal.repro_status] && (
                <span className="text-xs bg-brand-green/30 text-green-300 px-2.5 py-1 rounded-full font-medium">
                  {REPRO_STATUS_LABEL[animal.repro_status]}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4">
        <Tabs defaultValue="info">
          <TabsList>
            {tabs.map((t) => (
              <TabsTrigger key={t} value={t}>
                {{ info: 'Info', repro: 'Repro', peso: 'Peso', sanidad: 'Sanidad' }[t]}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* INFO */}
          <TabsContent value="info" className="flex flex-col gap-3">
            <Section title="Identificación">
              <InfoRow label="Arete"          value={animal.tag_number} />
              <InfoRow label="Código interno" value={animal.internal_code} />
              <InfoRow label="Nombre"         value={animal.name} />
              <InfoRow label="Raza"           value={animal.breed} />
              <InfoRow label="Sexo"           value={animal.sex === 'female' ? 'Hembra' : 'Macho'} />
              <InfoRow label="Nacimiento"     value={animal.birth_date ? format(new Date(animal.birth_date), 'dd/MM/yyyy') : null} />
              <InfoRow label="Edad"           value={ageLabel(animal.birth_date)} />
            </Section>
            <Section title="Origen y trazabilidad">
              <InfoRow label="Origen" value={{ born: 'Nacido en finca', purchased: 'Comprado', transferred: 'Transferido' }[animal.origin]} />
              <InfoRow label="Madre"  value={mother ? (mother.name || mother.tag_number) : null} />
              <InfoRow label="Padre"  value={animal.external_father} />
              <InfoRow label="Lote"   value={animal.lot} />
            </Section>
            {(animal.registry_number || animal.registry_association) && (
              <Section title="Registro genético">
                <InfoRow label="N° Registro" value={animal.registry_number} />
                <InfoRow label="Asociación"  value={animal.registry_association} />
              </Section>
            )}
            {animal.notes && (
              <Section title="Observaciones">
                <p className="text-sm text-foreground py-3">{animal.notes}</p>
              </Section>
            )}
          </TabsContent>

          {/* REPRO */}
          {animal.sex === 'female' && (
            <TabsContent value="repro" className="flex flex-col gap-3">
              <Section title="Estado reproductivo">
                <InfoRow label="Estado" value={REPRO_STATUS_LABEL[animal.repro_status] ?? '—'} />
                {fpp && <InfoRow label="Fecha probable parto" value={format(new Date(fpp), 'dd/MM/yyyy')} />}
                {lastRepro && (
                  <InfoRow
                    label="Último evento"
                    value={`${EVENT_LABEL[lastRepro.type]?.emoji} ${EVENT_LABEL[lastRepro.type]?.label} · ${format(new Date(lastRepro.date), 'dd/MM/yyyy')}`}
                  />
                )}
              </Section>
              <Button onClick={() => navigate(`/registrar/repro?animalId=${id}`)} className="w-full">
                Registrar evento reproductivo
              </Button>
              {reproEvents?.length > 0 && (
                <Section title="Historial">
                  {reproEvents.map((e) => (
                    <div key={e.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                      <span className="text-xl">{EVENT_LABEL[e.type]?.emoji}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{EVENT_LABEL[e.type]?.label}</p>
                        {e.result && <p className="text-xs text-muted-foreground">{e.result === 'pregnant' ? 'Preñada' : 'Vacía'}</p>}
                      </div>
                      <span className="text-xs text-muted-foreground">{format(new Date(e.date), 'dd/MM/yy')}</span>
                    </div>
                  ))}
                </Section>
              )}
            </TabsContent>
          )}

          {/* PESO */}
          <TabsContent value="peso" className="flex flex-col gap-3">
            <Section title="Último pesaje">
              <InfoRow label="Peso"             value={lastWeight ? `${lastWeight.weight_kg} kg` : '—'} />
              <InfoRow label="Fecha"            value={lastWeight ? format(new Date(lastWeight.date), 'dd/MM/yyyy') : null} />
              <InfoRow label="GDP"              value={gdp ? `${gdp} kg/día` : null} />
              <InfoRow label="Método"           value={lastWeight?.method ? METHOD_LABEL[lastWeight.method] : null} />
              <InfoRow label="Condición corporal" value={lastWeight?.body_condition ? String(lastWeight.body_condition) : null} />
            </Section>
            <Button onClick={() => navigate(`/registrar/peso?animalId=${id}`)} className="w-full">
              Registrar pesaje
            </Button>
            {weightChartData.length > 0 && (
              <div className="bg-card rounded-2xl shadow-sm p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Evolución de peso</p>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={weightChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={32} domain={['dataMin - 5', 'dataMax + 5']} />
                    <Tooltip content={<WeightTooltip />} />
                    <Line type="monotone" dataKey="weight" stroke="#16a34a" strokeWidth={2} dot={{ r: 3, fill: '#16a34a' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {weighings?.length > 0 && (
              <Section title="Historial">
                {weighings.map((w, i) => {
                  const older = weighings[i + 1]
                  const rowGdp = older ? calcGDP(older.weight_kg, older.date, w.weight_kg, w.date) : null
                  return (
                    <div key={w.id} className="flex flex-col gap-0.5 py-2.5 border-b border-border last:border-0">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{format(new Date(w.date), 'dd/MM/yyyy')}</span>
                        <span className="text-sm font-semibold text-foreground">{w.weight_kg} kg</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">{METHOD_LABEL[w.method] ?? '—'}</span>
                        {rowGdp !== null && (
                          <span className={cn('text-xs font-medium', rowGdp >= 0 ? 'text-brand-green' : 'text-destructive')}>
                            GDP {rowGdp.toFixed(2)} kg/día
                          </span>
                        )}
                      </div>
                      {w.notes && <p className="text-xs text-muted-foreground mt-0.5">{w.notes}</p>}
                    </div>
                  )
                })}
              </Section>
            )}
          </TabsContent>

          {/* SANIDAD */}
          <TabsContent value="sanidad" className="flex flex-col gap-3">
            <Section title="Último evento">
              <InfoRow label="Evento" value={lastHealthEvent ? `${HEALTH_TYPE_MAP[lastHealthEvent.type]?.emoji ?? ''} ${lastHealthEvent.product || HEALTH_TYPE_MAP[lastHealthEvent.type]?.label || '—'}` : '—'} />
              <InfoRow label="Fecha" value={lastHealthEvent ? format(new Date(lastHealthEvent.date), 'dd/MM/yyyy') : null} />
              <InfoRow label="Próxima dosis" value={lastHealthEvent?.next_due_date ? format(new Date(lastHealthEvent.next_due_date), 'dd/MM/yyyy') : null} />
            </Section>
            <Button onClick={() => navigate(`/registrar/salud?animalId=${id}`)} className="w-full">
              Registrar evento sanitario
            </Button>
            {healthEvents?.length > 0 ? (
              <Section title="Historial">
                {healthEvents.map((e) => {
                  const cfg = HEALTH_TYPE_MAP[e.type] ?? { emoji: '📋', label: e.type }
                  return (
                    <div key={e.id} className="flex flex-col gap-0.5 py-2.5 border-b border-border last:border-0">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">
                          <span className="mr-1">{cfg.emoji}</span>{e.product || cfg.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{format(new Date(e.date), 'dd/MM/yyyy')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          {cfg.label}{e.dose ? ` · ${e.dose}` : ''}{e.responsible ? ` · Dr(a). ${e.responsible}` : ''}
                        </span>
                        {e.cost != null && <span className="text-xs font-medium text-foreground">${e.cost}</span>}
                      </div>
                      {e.next_due_date && (
                        <p className="text-xs text-amber-600 mt-0.5">
                          Próxima dosis: {format(new Date(e.next_due_date), 'dd/MM/yyyy')}
                        </p>
                      )}
                      {e.notes && <p className="text-xs text-muted-foreground mt-0.5">{e.notes}</p>}
                    </div>
                  )
                })}
              </Section>
            ) : (
              <p className="text-center text-muted-foreground text-sm py-8">Sin eventos sanitarios registrados.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
