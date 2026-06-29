import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  date:            z.string().min(1),
  session:         z.enum(['am', 'pm', 'total']),
  cows_milked:     z.coerce.number().int().positive().optional(),
  liters_produced: z.coerce.number().positive('Ingresa los litros producidos'),
  liters_sold:     z.coerce.number().nonnegative().optional(),
  price_per_liter: z.coerce.number().nonnegative().optional(),
  notes:           z.string().optional(),
})

const numInput = 'w-full h-16 px-4 rounded-xl border border-border bg-card text-foreground text-3xl font-bold placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring text-center'

export default function MilkFormPage() {
  const navigate   = useNavigate()
  const activeFarm = useFarmStore((s) => s.activeFarm)
  const user       = useSessionStore((s) => s.user)

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    defaultValues: {
      date:    format(new Date(), 'yyyy-MM-dd'),
      session: 'total',
    },
  })

  useEffect(() => {
    const last = localStorage.getItem('hs_last_price_per_liter')
    if (last) setValue('price_per_liter', parseFloat(last))
  }, [])

  const session = watch('session')

  const onSubmit = async (data) => {
    const id = crypto.randomUUID()
    if (data.price_per_liter) {
      localStorage.setItem('hs_last_price_per_liter', String(data.price_per_liter))
    }
    const record = {
      id,
      account_id:      activeFarm.account_id,
      farm_id:         activeFarm.id,
      date:            data.date,
      session:         data.session,
      cows_milked:     data.cows_milked ?? null,
      liters_produced: data.liters_produced,
      liters_sold:     data.liters_sold ?? null,
      liters_internal: data.liters_produced - (data.liters_sold ?? 0),
      price_per_liter: data.price_per_liter ?? null,
      notes:           data.notes || null,
      recorded_by:     user?.id ?? null,
      sync_status:     'pending',
    }
    await db.milk_records.put(record)
    await enqueue('milk_records', id, 'upsert', record)
    console.log('[Sync] Pushing milk_record to Supabase…')
    runSync().catch(() => {}) // fire-and-forget; UI no espera al sync
    toast.success('Ordeño guardado ✓')
    navigate(-1)
  }

  const SESSION_OPTS = [
    { v: 'am',    l: 'AM',    emoji: '🌅' },
    { v: 'pm',    l: 'PM',    emoji: '🌇' },
    { v: 'total', l: 'Total', emoji: '📊' },
  ]

  return (
    <div className="flex flex-col pb-28">
      <div className="bg-card px-4 py-4 border-b border-border flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1">Registrar ordeño</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Fecha</label>
          <input type="date"
            className="h-12 px-4 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            {...register('date')} />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Jornada</label>
          <div className="grid grid-cols-3 gap-2">
            {SESSION_OPTS.map(({ v, l, emoji }) => (
              <button key={v} type="button"
                onClick={() => setValue('session', v)}
                className={cn(
                  'h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all font-semibold text-sm',
                  session === v
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
          <label className="text-sm font-medium text-foreground">Litros producidos *</label>
          <input type="number" step="0.1" placeholder="0.0"
            className={cn(numInput, errors.liters_produced && 'border-destructive')}
            {...register('liters_produced')} />
          {errors.liters_produced && (
            <span className="text-xs text-destructive text-center">{errors.liters_produced.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Vacas ordeñadas</label>
          <input type="number" placeholder="0" className={numInput} {...register('cows_milked')} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Litros vendidos</label>
          <input type="number" step="0.1" placeholder="0.0" className={numInput} {...register('liters_sold')} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Precio por litro</label>
          <input type="number" step="1" placeholder="0" className={numInput} {...register('price_per_liter')} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Observaciones</label>
          <textarea rows={2} placeholder="Opcional..."
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            {...register('notes')} />
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
          Guardar ordeño
        </Button>
      </form>
    </div>
  )
}
