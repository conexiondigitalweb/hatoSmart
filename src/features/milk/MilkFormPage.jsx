import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { useFarmStore } from '../../stores/farmStore'
import { useSessionStore } from '../../stores/sessionStore'
import { enqueue } from '../../lib/sync/queue'
import db from '../../lib/db'
import Button from '../../components/ui/Button'

const schema = z.object({
  date: z.string().min(1),
  session: z.enum(['am', 'pm', 'total']),
  cows_milked: z.coerce.number().int().positive('Ingresa el número de vacas').optional(),
  liters_produced: z.coerce.number().positive('Ingresa los litros producidos'),
  liters_sold: z.coerce.number().nonnegative().optional(),
  price_per_liter: z.coerce.number().nonnegative().optional(),
  notes: z.string().optional(),
})

const inputCls = 'w-full min-h-[56px] px-4 py-3 rounded-xl border border-gray-200 bg-white text-[#2b3240] text-xl font-semibold placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3dbf5e]'

export default function MilkFormPage() {
  const navigate = useNavigate()
  const activeFarm = useFarmStore((s) => s.activeFarm)
  const user = useSessionStore((s) => s.user)

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      session: 'total',
    },
  })

  // Remember last price from localStorage
  useEffect(() => {
    const lastPrice = localStorage.getItem('hs_last_price_per_liter')
    if (lastPrice) setValue('price_per_liter', parseFloat(lastPrice))
  }, [])

  const session = watch('session')

  const onSubmit = async (data) => {
    const id = crypto.randomUUID()
    if (data.price_per_liter) {
      localStorage.setItem('hs_last_price_per_liter', String(data.price_per_liter))
    }

    const record = {
      id,
      account_id: activeFarm.account_id,
      farm_id: activeFarm.id,
      date: data.date,
      session: data.session,
      cows_milked: data.cows_milked ?? null,
      liters_produced: data.liters_produced,
      liters_sold: data.liters_sold ?? null,
      liters_internal: data.liters_produced - (data.liters_sold ?? 0),
      price_per_liter: data.price_per_liter ?? null,
      notes: data.notes || null,
      recorded_by: user?.id ?? null,
      sync_status: 'pending',
    }

    await db.milk_records.put(record)
    await enqueue('milk_records', id, 'upsert', record)
    navigate(-1)
  }

  return (
    <div className="flex flex-col pb-28">
      <div className="bg-white px-4 py-4 border-b border-gray-100 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-gray-400 text-2xl leading-none">‹</button>
        <h1 className="text-lg font-bold text-[#2b3240] flex-1">Registrar ordeño</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 flex flex-col gap-5">
        {/* Fecha */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#2b3240]">Fecha</label>
          <input type="date" className={inputCls} {...register('date')} />
        </div>

        {/* Jornada */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#2b3240]">Jornada</label>
          <div className="grid grid-cols-3 gap-2">
            {[{ v: 'am', l: '🌅 AM' }, { v: 'pm', l: '🌇 PM' }, { v: 'total', l: '📊 Total' }].map(({ v, l }) => (
              <button key={v} type="button"
                onClick={() => setValue('session', v)}
                className={`min-h-[56px] rounded-xl border-2 font-semibold text-sm transition-all ${
                  session === v ? 'border-[#3dbf5e] bg-green-50 text-[#2b3240]' : 'border-gray-200 text-gray-500'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Litros producidos */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#2b3240]">Litros producidos *</label>
          <input
            type="number" step="0.1" placeholder="0.0"
            className={`${inputCls} ${errors.liters_produced ? 'border-red-400' : ''}`}
            {...register('liters_produced')}
          />
          {errors.liters_produced && <span className="text-xs text-red-500">{errors.liters_produced.message}</span>}
        </div>

        {/* Vacas ordeñadas */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#2b3240]">Vacas ordeñadas</label>
          <input type="number" placeholder="0" className={inputCls} {...register('cows_milked')} />
        </div>

        {/* Litros vendidos */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#2b3240]">Litros vendidos (opcional)</label>
          <input type="number" step="0.1" placeholder="0.0" className={inputCls} {...register('liters_sold')} />
        </div>

        {/* Precio */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#2b3240]">Precio por litro (opcional)</label>
          <input type="number" step="1" placeholder="0" className={inputCls} {...register('price_per_liter')} />
        </div>

        {/* Notas */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#2b3240]">Observaciones</label>
          <textarea rows={2} placeholder="Opcional..." className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[#2b3240] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#3dbf5e]" {...register('notes')} />
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full">
          Guardar ordeño
        </Button>
      </form>
    </div>
  )
}
