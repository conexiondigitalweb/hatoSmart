import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useFarmStore } from '../../stores/farmStore'
import { useSessionStore } from '../../stores/sessionStore'
import { enqueue } from '../../lib/sync/queue'
import { runSync } from '../../lib/sync/engine'
import { HEALTH_EVENT_TYPES, calcNextDueDate } from '../../lib/rules/health'
import db from '../../lib/db'
import Button from '../../components/ui/Button'
import { cn } from '../../lib/utils'

const schema = z.object({
  animal_id:      z.string().min(1, 'Selecciona un animal'),
  type:           z.enum(HEALTH_EVENT_TYPES.map((t) => t.value)),
  protocol_id:    z.string().optional(),
  product:        z.string().optional(),
  dose:           z.string().optional(),
  date:           z.string().min(1).refine((v) => v <= format(new Date(), 'yyyy-MM-dd'), 'La fecha no puede ser futura'),
  next_due_date:  z.string().optional(),
  cost:           z.string().optional()
    .refine((v) => !v || (!isNaN(v) && parseFloat(v) >= 0), 'El costo debe ser mayor o igual a 0'),
  responsible:    z.string().optional(),
  notes:          z.string().optional(),
})

const inputCls = 'w-full min-h-[48px] px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'
const selectCls = inputCls

export default function HealthEventFormPage() {
  const navigate    = useNavigate()
  const [params]    = useSearchParams()
  const activeFarm  = useFarmStore((s) => s.activeFarm)
  const user        = useSessionStore((s) => s.user)
  const preselectedId = params.get('animalId')

  const animals = useLiveQuery(
    () => activeFarm
      ? db.animals.where('farm_id').equals(activeFarm.id)
          .filter((a) => !a.deleted_at && a.status === 'active')
          .toArray()
      : [],
    [activeFarm?.id]
  )

  const protocols = useLiveQuery(
    () => activeFarm
      ? db.health_protocols.where('farm_id').equals(activeFarm.id)
          .filter((p) => !p.deleted_at)
          .toArray()
      : [],
    [activeFarm?.id]
  )

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    defaultValues: {
      animal_id: preselectedId ?? '',
      type:      'vaccine',
      date:      format(new Date(), 'yyyy-MM-dd'),
    },
  })

  useEffect(() => {
    if (preselectedId) setValue('animal_id', preselectedId)
  }, [preselectedId, setValue])

  const eventType   = watch('type')
  const protocolId  = watch('protocol_id')
  const date        = watch('date')
  const animalId    = watch('animal_id')

  const protocolsForType = (protocols ?? []).filter((p) => p.type === eventType)
  const selectedAnimal = useLiveQuery(() => animalId ? db.animals.get(animalId) : null, [animalId])

  // Changing event type invalidates any protocol picked for the previous type
  useEffect(() => {
    setValue('protocol_id', '')
  }, [eventType, setValue])

  // Autocomplete product + suggest next due date from the selected protocol
  useEffect(() => {
    if (!protocolId) return
    const protocol = protocolsForType.find((p) => p.id === protocolId)
    if (!protocol) return
    setValue('product', protocol.name)
    if (protocol.periodicity_days) {
      setValue('next_due_date', format(calcNextDueDate(date, protocol.periodicity_days), 'yyyy-MM-dd'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protocolId, date])

  const onSubmit = async (data) => {
    const eventId = crypto.randomUUID()
    const typeLabel = HEALTH_EVENT_TYPES.find((t) => t.value === data.type)?.label ?? data.type
    const record = {
      id: eventId,
      account_id: activeFarm.account_id,
      farm_id:    activeFarm.id,
      animal_id:  data.animal_id,
      type:       data.type,
      protocol_id: data.protocol_id || null,
      product:    data.product || null,
      dose:       data.dose || null,
      date:       data.date,
      next_due_date: data.next_due_date || null,
      cost:       data.cost ? parseFloat(data.cost) : null,
      responsible: data.responsible || null,
      notes:      data.notes || null,
      recorded_by: user?.id ?? null,
      sync_status: 'pending',
    }
    await db.health_events.put(record)
    await enqueue('health_events', eventId, 'upsert', record)

    if (data.next_due_date) {
      const alertId = crypto.randomUUID()
      const animalLabel = selectedAnimal?.name || selectedAnimal?.tag_number || 'Animal'
      const alert = {
        id: alertId,
        account_id: activeFarm.account_id,
        farm_id:    activeFarm.id,
        animal_id:  data.animal_id,
        type:       'health_due',
        due_date:   data.next_due_date,
        status:     'pending',
        source_table: 'health_events',
        source_id:  eventId,
        message:    `${animalLabel} — ${data.product || typeLabel} (próxima dosis)`,
        sync_status: 'pending',
      }
      await db.alerts.put(alert)
      await enqueue('alerts', alertId, 'upsert', alert)
    }

    console.log('[Sync] Pushing health_event to Supabase…')
    runSync().catch(() => {})
    toast.success('Evento sanitario guardado ✓')
    navigate(-1)
  }

  return (
    <div className="flex flex-col pb-28">
      <div className="bg-card px-4 py-4 border-b border-border flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1">Registrar evento sanitario</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Animal *</label>
          <select className={selectCls} disabled={!!preselectedId} {...register('animal_id')}>
            <option value="">Seleccionar animal</option>
            {(animals ?? []).map((a) => (
              <option key={a.id} value={a.id}>{a.name || a.tag_number || a.id.slice(0, 8)}</option>
            ))}
          </select>
          {errors.animal_id && <span className="text-xs text-destructive">{errors.animal_id.message}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Tipo de evento</label>
          <div className="grid grid-cols-3 gap-2">
            {HEALTH_EVENT_TYPES.map(({ value, emoji, label }) => (
              <button key={value} type="button"
                onClick={() => setValue('type', value)}
                className={cn(
                  'flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all',
                  eventType === value ? 'border-brand-green bg-green-50' : 'border-border'
                )}
              >
                <span className="text-xl">{emoji}</span>
                <span className="text-xs font-medium text-foreground text-center leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Protocolo (opcional)</label>
          <select className={selectCls} {...register('protocol_id')}>
            <option value="">Sin protocolo — producto libre</option>
            {protocolsForType.map((p) => (
              <option key={p.id} value={p.id}>{p.name}{p.periodicity_days ? ` (cada ${p.periodicity_days}d)` : ''}</option>
            ))}
          </select>
          {protocolsForType.length === 0 && (
            <span className="text-xs text-muted-foreground">Sin protocolos de este tipo en tu catálogo.</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Producto</label>
          <input type="text" placeholder="Ej: Ivermectina 1%" className={inputCls} {...register('product')} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Dosis</label>
          <input type="text" placeholder="Ej: 5ml, 2 tabletas" className={inputCls} {...register('dose')} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Fecha</label>
          <input type="date" className="h-12 px-4 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" {...register('date')} />
          {errors.date && <span className="text-xs text-destructive">{errors.date.message}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Próxima dosis (opcional)</label>
          <input type="date" className="h-12 px-4 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" {...register('next_due_date')} />
          <span className="text-xs text-muted-foreground">Se sugiere automáticamente si eliges un protocolo con periodicidad. Puedes editarla o dejarla vacía.</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Costo (opcional)</label>
          <input type="number" step="0.01" placeholder="0.00" className={inputCls} {...register('cost')} />
          {errors.cost && <span className="text-xs text-destructive">{errors.cost.message}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Veterinario (opcional)</label>
          <input type="text" placeholder="Nombre" className={inputCls} {...register('responsible')} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Observaciones</label>
          <textarea rows={2} placeholder="Opcional..."
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            {...register('notes')} />
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
          Guardar evento
        </Button>
      </form>
    </div>
  )
}
