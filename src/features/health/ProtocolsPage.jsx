import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useFarmStore } from '../../stores/farmStore'
import { enqueue } from '../../lib/sync/queue'
import { runSync } from '../../lib/sync/engine'
import { HEALTH_EVENT_TYPES } from '../../lib/rules/health'
import db from '../../lib/db'
import Button from '../../components/ui/Button'
import { Dialog, DialogContent, DialogTitle } from '../../components/ui/Dialog'
import EmptyState from '../../components/ui/EmptyState'
import { cn } from '../../lib/utils'

const TYPE_MAP = Object.fromEntries(HEALTH_EVENT_TYPES.map((t) => [t.value, t]))

const schema = z.object({
  name: z.string().min(1, 'Ingresa un nombre'),
  type: z.enum(HEALTH_EVENT_TYPES.map((t) => t.value)),
  periodicity_days: z.string().optional()
    .refine((v) => !v || /^\d+$/.test(v), 'Debe ser un número entero positivo'),
  notes: z.string().optional(),
})

const inputCls = 'w-full min-h-[48px] px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'

export default function ProtocolsPage() {
  const navigate = useNavigate()
  const activeFarm = useFarmStore((s) => s.activeFarm)
  const [editing, setEditing] = useState(null) // null = closed, {} = new, {...} = editing
  const [deleting, setDeleting] = useState(null)

  const protocols = useLiveQuery(
    () => activeFarm
      ? db.health_protocols.where('farm_id').equals(activeFarm.id)
          .filter((p) => !p.deleted_at)
          .toArray()
      : [],
    [activeFarm?.id]
  )

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    defaultValues: { name: '', type: 'vaccine', periodicity_days: '', notes: '' },
  })

  useEffect(() => {
    if (editing) {
      reset({
        name: editing.name ?? '',
        type: editing.type ?? 'vaccine',
        periodicity_days: editing.periodicity_days ? String(editing.periodicity_days) : '',
        notes: editing.notes ?? '',
      })
    }
  }, [editing, reset])

  const type = watch('type')

  const onSubmit = async (data) => {
    const id = editing?.id ?? crypto.randomUUID()
    const record = {
      id,
      account_id: activeFarm.account_id,
      farm_id: activeFarm.id,
      name: data.name,
      type: data.type,
      periodicity_days: data.periodicity_days ? parseInt(data.periodicity_days, 10) : null,
      notes: data.notes || null,
      sync_status: 'pending',
    }
    await db.health_protocols.put(record)
    await enqueue('health_protocols', id, 'upsert', record)
    runSync().catch(() => {})
    toast.success(editing?.id ? 'Protocolo actualizado ✓' : 'Protocolo creado ✓')
    setEditing(null)
  }

  const confirmDelete = async () => {
    const record = { ...deleting, deleted_at: new Date().toISOString(), sync_status: 'pending' }
    await db.health_protocols.put(record)
    await enqueue('health_protocols', deleting.id, 'upsert', record)
    runSync().catch(() => {})
    toast.success('Protocolo eliminado ✓')
    setDeleting(null)
  }

  const isLoading = protocols === undefined

  return (
    <>
      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null) }}>
        <DialogContent>
          <DialogTitle>{editing?.id ? 'Editar protocolo' : 'Nuevo protocolo'}</DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">Nombre del producto *</label>
              <input type="text" placeholder="Ej: Aftosa, Ivermectina 1%" className={inputCls} {...register('name')} />
              {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">Tipo de evento</label>
              <select className={inputCls} value={type} onChange={(e) => setValue('type', e.target.value)}>
                {HEALTH_EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">Periodicidad (días, opcional)</label>
              <input type="number" placeholder="Ej: 180" className={inputCls} {...register('periodicity_days')} />
              {errors.periodicity_days && <span className="text-xs text-destructive">{errors.periodicity_days.message}</span>}
              <span className="text-xs text-muted-foreground">Déjalo vacío si no aplica refuerzo periódico (ej. cirugías).</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">Notas (opcional)</label>
              <textarea rows={2} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" {...register('notes')} />
            </div>

            <div className="flex gap-3 mt-1">
              <button type="button" onClick={() => setEditing(null)}
                className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold text-foreground">
                Cancelar
              </button>
              <Button type="submit" loading={isSubmitting} className="flex-1">
                Guardar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null) }}>
        <DialogContent>
          <DialogTitle>Eliminar protocolo</DialogTitle>
          <p className="text-sm text-muted-foreground">
            ¿Eliminar <strong>{deleting?.name}</strong> del catálogo? Los eventos ya registrados con este protocolo no se verán afectados.
          </p>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setDeleting(null)}
              className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold text-foreground">
              Cancelar
            </button>
            <button onClick={confirmDelete}
              className="flex-1 h-11 rounded-xl bg-destructive text-white text-sm font-semibold">
              Eliminar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col pb-28">
        <div className="bg-card px-4 py-4 border-b border-border flex items-center gap-3 sticky top-0 z-10 shadow-sm">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground flex-1">Protocolos sanitarios</h1>
          <button
            onClick={() => setEditing({})}
            className="flex items-center gap-1 bg-brand-green text-white text-sm font-semibold h-9 px-3 rounded-xl active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Nuevo
          </button>
        </div>

        <div className="p-4 flex flex-col gap-2">
          {isLoading ? null : protocols.length === 0 ? (
            <EmptyState
              illustration="alerts"
              title="Sin protocolos registrados"
              description="Crea protocolos (vacunas, desparasitantes, etc.) para agilizar el registro de eventos sanitarios."
              actionLabel="Nuevo protocolo"
              onAction={() => setEditing({})}
            />
          ) : (
            protocols.map((p) => (
              <div key={p.id} className="bg-card rounded-2xl shadow-sm p-4 flex items-center gap-3">
                <span className="text-2xl flex-shrink-0">{TYPE_MAP[p.type]?.emoji ?? '📋'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {TYPE_MAP[p.type]?.label ?? p.type}
                    {p.periodicity_days ? ` · cada ${p.periodicity_days} días` : ''}
                  </p>
                </div>
                <button onClick={() => setEditing(p)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </button>
                <button onClick={() => setDeleting(p)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Trash2 className={cn('w-4 h-4 text-muted-foreground')} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
