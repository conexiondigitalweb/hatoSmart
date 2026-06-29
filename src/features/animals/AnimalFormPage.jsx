import { useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLiveQuery } from 'dexie-react-hooks'
import { useFarmStore } from '../../stores/farmStore'
import { useSessionStore } from '../../stores/sessionStore'
import { suggestCategory } from '../../lib/rules/categories'
import { enqueue } from '../../lib/sync/queue'
import { supabase } from '../../lib/supabase'
import db from '../../lib/db'
import Button from '../../components/ui/Button'

const schema = z.object({
  tag_number: z.string().min(1, 'El arete es requerido'),
  internal_code: z.string().optional(),
  name: z.string().optional(),
  breed: z.string().optional(),
  sex: z.enum(['female', 'male'], { required_error: 'Selecciona el sexo' }),
  birth_date: z.string().optional(),
  category: z.string().optional(),
  origin: z.string().optional(),
  mother_id: z.string().optional(),
  external_father: z.string().optional(),
  lot: z.string().optional(),
  registry_number: z.string().optional(),
  registry_association: z.string().optional(),
  notes: z.string().optional(),
})

const inputCls = 'w-full h-12 px-4 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
const selectCls = 'w-full h-12 px-4 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer'

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}


export default function AnimalFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const activeFarm = useFarmStore((s) => s.activeFarm)
  const user = useSessionStore((s) => s.user)
  const isEdit = !!id

  const existing = useLiveQuery(() => id ? db.animals.get(id) : null, [id])
  const females = useLiveQuery(
    () => activeFarm
      ? db.animals.where('farm_id').equals(activeFarm.id)
          .filter((a) => a.sex === 'female' && !a.deleted_at).toArray()
      : [],
    [activeFarm?.id]
  )

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  })

  // Populate form when editing
  useEffect(() => {
    if (existing) reset(existing)
  }, [existing])

  // Auto-suggest category when sex or birth_date changes
  const watchSex = watch('sex')
  const watchBirth = watch('birth_date')
  useEffect(() => {
    if (!isEdit && watchSex && watchBirth) {
      const suggested = suggestCategory({ sex: watchSex, birth_date: watchBirth })
      if (suggested) setValue('category', suggested)
    }
  }, [watchSex, watchBirth, isEdit])

  const onSubmit = async (data) => {
    const animalId = isEdit ? id : crypto.randomUUID()
    const { data: { user: liveUser } } = await supabase.auth.getUser()
    const uid = liveUser?.id ?? user?.id

    const record = {
      id: animalId,
      account_id: activeFarm.account_id,
      farm_id: activeFarm.id,
      ...data,
      birth_date: data.birth_date || null,
      mother_id: data.mother_id || null,
      status: existing?.status ?? 'active',
      sync_status: 'pending',
    }

    // Photo upload if a file was selected
    const fileInput = document.getElementById('photo-input')
    if (fileInput?.files?.[0]) {
      const file = fileInput.files[0]
      const path = `${activeFarm.id}/${animalId}.jpg`
      const { error: uploadErr } = await supabase.storage
        .from('animal-photos')
        .upload(path, file, { upsert: true })
      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage.from('animal-photos').getPublicUrl(path)
        record.photo_url = publicUrl
      }
    }

    await db.animals.put(record)
    await enqueue('animals', animalId, 'upsert', record)
    toast.success(isEdit ? 'Animal actualizado ✓' : 'Animal creado ✓')
    navigate(isEdit ? `/animales/${id}` : '/animales')
  }

  if (isEdit && existing === undefined) {
    return <div className="p-4 text-center text-sm text-gray-400 mt-8">Cargando...</div>
  }

  return (
    <div className="flex flex-col pb-28">
      {/* Header */}
      <div className="bg-card px-4 py-4 border-b border-border flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-foreground text-lg leading-none">‹</button>
        <h1 className="text-lg font-bold text-foreground flex-1">
          {isEdit ? 'Editar animal' : 'Agregar animal'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 flex flex-col gap-5">
        {/* Foto */}
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Foto (opcional)</label>
          <input
            id="photo-input"
            type="file"
            accept="image/*"
            capture="environment"
            className="w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-brand-green file:text-white file:font-semibold"
          />
        </div>

        {/* Identificación */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide -mb-2">Identificación</p>
        <Field label="Arete *" error={errors.tag_number?.message}>
          <input type="text" placeholder="Ej: 0145" className={inputCls} {...register('tag_number')} />
        </Field>
        <Field label="Código interno">
          <input type="text" placeholder="Ej: A-023" className={inputCls} {...register('internal_code')} />
        </Field>
        <Field label="Nombre">
          <input type="text" placeholder="Ej: Margarita" className={inputCls} {...register('name')} />
        </Field>

        {/* Biológicos */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide -mb-2">Datos biológicos</p>
        <Field label="Sexo *" error={errors.sex?.message}>
          <div className="flex gap-2">
            {[{ v: 'female', l: '♀ Hembra' }, { v: 'male', l: '♂ Macho' }].map(({ v, l }) => (
              <button key={v} type="button"
                onClick={() => setValue('sex', v)}
                className={`flex-1 h-12 rounded-xl border-2 text-sm font-semibold transition-all ${
                  watchSex === v
                    ? 'border-brand-green bg-green-50 text-brand-green'
                    : 'border-border bg-card text-muted-foreground'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Fecha de nacimiento">
          <input type="date" className={inputCls} {...register('birth_date')} />
        </Field>
        <Field label="Categoría">
          <select className={selectCls} {...register('category')}>
            <option value="">Seleccionar categoría</option>
            <option value="calf">Ternero/a (ambos sexos, &lt;6 meses)</option>
            <option value="heifer">Novilla (hembra joven)</option>
            <option value="cow">Vaca</option>
            <option value="young_bull">Torete (macho joven)</option>
            <option value="bull">Toro</option>
            <option value="steer">Novillo (macho castrado)</option>
          </select>
        </Field>
        <Field label="Raza">
          <input type="text" placeholder="Ej: Holstein, Gyr, Girolando" className={inputCls} {...register('breed')} />
        </Field>

        {/* Trazabilidad */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide -mb-2">Origen y trazabilidad</p>
        <Field label="Origen">
          <select className={selectCls} {...register('origin')}>
            <option value="">Seleccionar origen</option>
            <option value="born">Nacido en finca</option>
            <option value="purchased">Comprado</option>
            <option value="transferred">Trasladado</option>
          </select>
        </Field>
        <Field label="Madre">
          <select className={inputCls} {...register('mother_id')}>
            <option value="">Sin madre registrada</option>
            {(females ?? []).map((f) => (
              <option key={f.id} value={f.id}>{f.name || f.tag_number}</option>
            ))}
          </select>
        </Field>
        <Field label="Padre / Pajilla">
          <input type="text" placeholder="Nombre o código del toro/pajilla" className={inputCls} {...register('external_father')} />
        </Field>
        <Field label="Lote">
          <input type="text" placeholder="Ej: Lote A" className={inputCls} {...register('lot')} />
        </Field>

        {/* Registro */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide -mb-2">Registro genético (opcional)</p>
        <Field label="N° Registro">
          <input type="text" className={inputCls} {...register('registry_number')} />
        </Field>
        <Field label="Asociación">
          <input type="text" placeholder="Ej: ASOHOLSTEIN" className={inputCls} {...register('registry_association')} />
        </Field>
        <Field label="Observaciones">
          <textarea rows={3} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" {...register('notes')} />
        </Field>

        <Button type="submit" loading={isSubmitting} className="w-full">
          {isEdit ? 'Guardar cambios' : 'Agregar animal'}
        </Button>
      </form>
    </div>
  )
}
