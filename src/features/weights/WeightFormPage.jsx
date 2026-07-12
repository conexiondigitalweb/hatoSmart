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
import db from '../../lib/db'
import Button from '../../components/ui/Button'
import { cn } from '../../lib/utils'

const schema = z.object({
  animal_id: z.string().min(1, 'Selecciona un animal'),
  date:      z.string().min(1).refine((v) => v <= format(new Date(), 'yyyy-MM-dd'), 'La fecha no puede ser futura'),
  weight_kg: z.coerce.number().positive('Ingresa un peso válido'),
  method:    z.enum(['bascula', 'cinta']),
  notes:     z.string().optional(),
})

const numInput = 'w-full h-16 px-4 rounded-xl border border-border bg-card text-foreground text-3xl font-bold placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring text-center'
const selectCls = 'w-full min-h-[48px] px-4 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const METHOD_OPTS = [
  { v: 'bascula', l: 'Báscula', emoji: '⚖️' },
  { v: 'cinta',   l: 'Cinta',   emoji: '📏' },
]

export default function WeightFormPage() {
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

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    defaultValues: {
      animal_id: preselectedId ?? '',
      date:      format(new Date(), 'yyyy-MM-dd'),
      method:    'bascula',
    },
  })

  useEffect(() => {
    if (preselectedId) setValue('animal_id', preselectedId)
  }, [preselectedId, setValue])

  const method = watch('method')

  const onSubmit = async (data) => {
    const id = crypto.randomUUID()
    const record = {
      id,
      account_id: activeFarm.account_id,
      farm_id:    activeFarm.id,
      animal_id:  data.animal_id,
      date:       data.date,
      weight_kg:  data.weight_kg,
      method:     data.method,
      notes:      data.notes || null,
      recorded_by: user?.id ?? null,
      sync_status: 'pending',
    }
    await db.weighings.put(record)
    await enqueue('weighings', id, 'upsert', record)
    console.log('[Sync] Pushing weighing to Supabase…')
    runSync().catch(() => {})
    toast.success('Pesaje guardado ✓')
    navigate(-1)
  }

  return (
    <div className="flex flex-col pb-28">
      <div className="bg-card px-4 py-4 border-b border-border flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1">Registrar pesaje</h1>
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
          {errors.animal_id && (
            <span className="text-xs text-destructive">{errors.animal_id.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Fecha</label>
          <input type="date"
            className="h-12 px-4 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            {...register('date')} />
          {errors.date && (
            <span className="text-xs text-destructive">{errors.date.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Peso (kg) *</label>
          <input type="number" step="0.1" placeholder="0.0"
            className={cn(numInput, errors.weight_kg && 'border-destructive')}
            {...register('weight_kg')} />
          {errors.weight_kg && (
            <span className="text-xs text-destructive text-center">{errors.weight_kg.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Método</label>
          <div className="grid grid-cols-2 gap-2">
            {METHOD_OPTS.map(({ v, l, emoji }) => (
              <button key={v} type="button"
                onClick={() => setValue('method', v)}
                className={cn(
                  'h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all font-semibold text-sm',
                  method === v
                    ? 'border-brand-green bg-green-50 text-brand-green'
                    : 'border-border text-muted-foreground hover:border-brand-green/50'
                )}
              >
                <span className="text-xl">{emoji}</span>
                <span>{l}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Observaciones</label>
          <textarea rows={2} placeholder="Opcional..."
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            {...register('notes')} />
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
          Guardar pesaje
        </Button>
      </form>
    </div>
  )
}
