import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { format, addDays } from 'date-fns'
import { useFarmStore } from '../../stores/farmStore'
import { useSessionStore } from '../../stores/sessionStore'
import { calcFPP } from '../../lib/rules/reproduction'
import { enqueue } from '../../lib/sync/queue'
import { runSync } from '../../lib/sync/engine'
import db from '../../lib/db'
import Button from '../../components/ui/Button'

const EVENT_TYPES = [
  { value: 'heat',             emoji: '🔴', label: 'Celo' },
  { value: 'service',          emoji: '💉', label: 'Servicio' },
  { value: 'pregnancy_check',  emoji: '🔍', label: 'Chequeo preñez' },
  { value: 'calving',          emoji: '🐄', label: 'Parto' },
  { value: 'abortion',         emoji: '⚠️', label: 'Aborto' },
  { value: 'dry_off',          emoji: '💧', label: 'Secado' },
]

const inputCls = 'w-full min-h-[48px] px-4 py-3 rounded-xl border border-gray-200 bg-white text-[#2b3240] text-sm focus:outline-none focus:ring-2 focus:ring-[#3dbf5e]'

export default function ReproEventForm() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const activeFarm = useFarmStore((s) => s.activeFarm)
  const user = useSessionStore((s) => s.user)

  const preselectedId = params.get('animalId')
  const [animalId, setAnimalId] = useState(preselectedId ?? '')
  const [eventType, setEventType] = useState('heat')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [serviceMethod, setServiceMethod] = useState('ai')
  const [sireText, setSireText] = useState('')
  const [checkResult, setCheckResult] = useState('pregnant')
  const [calfSex, setCalfSex] = useState('female')
  const [calfWeight, setCalfWeight] = useState('')
  const [calfAlive, setCalfAlive] = useState(true)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const females = useLiveQuery(
    () => activeFarm
      ? db.animals.where('farm_id').equals(activeFarm.id)
          .filter((a) => a.sex === 'female' && !a.deleted_at && a.status === 'active')
          .toArray()
      : [],
    [activeFarm?.id]
  )

  const selectedAnimal = useLiveQuery(
    () => animalId ? db.animals.get(animalId) : null,
    [animalId]
  )

  const handleSave = async () => {
    if (!animalId) { setError('Selecciona un animal'); return }
    setLoading(true)
    setError('')
    try {
      const { data: { user: liveUser } } = await (await import('../../lib/supabase')).supabase.auth.getUser()
      const uid = liveUser?.id ?? user?.id

      const eventId = crypto.randomUUID()
      const farmId = activeFarm.id
      const accountId = activeFarm.account_id

      // Compute FPP for service events
      const fpp = eventType === 'service' ? format(calcFPP(date, activeFarm.gestation_days ?? 283), 'yyyy-MM-dd') : null

      const event = {
        id: eventId,
        account_id: accountId,
        farm_id: farmId,
        animal_id: animalId,
        type: eventType,
        date,
        service_method: eventType === 'service' ? serviceMethod : null,
        external_sire: eventType === 'service' ? sireText || null : null,
        result: eventType === 'pregnancy_check' ? checkResult : null,
        expected_calving_date: fpp,
        calf_sex: eventType === 'calving' ? calfSex : null,
        calf_weight: eventType === 'calving' && calfWeight ? parseFloat(calfWeight) : null,
        notes: notes || null,
        recorded_by: uid,
        sync_status: 'pending',
      }

      await db.repro_events.put(event)
      await enqueue('repro_events', eventId, 'upsert', event)

      // ── Side effects ────────────────────────────────────────────────────

      if (eventType === 'service' && fpp) {
        // Alert: pregnancy check due in 45 days
        const checkAlertId = crypto.randomUUID()
        const checkDue = format(addDays(new Date(date), 45), 'yyyy-MM-dd')
        const checkAlert = {
          id: checkAlertId, account_id: accountId, farm_id: farmId,
          animal_id: animalId, type: 'pregnancy_check_due', due_date: checkDue,
          status: 'pending',
          message: `${selectedAnimal?.name || selectedAnimal?.tag_number || 'Animal'} — chequeo preñez`,
          sync_status: 'pending',
        }
        await db.alerts.put(checkAlert)
        await enqueue('alerts', checkAlertId, 'upsert', checkAlert)

        // Alert: calving due at FPP
        const calvingAlertId = crypto.randomUUID()
        const calvingAlert = {
          id: calvingAlertId, account_id: accountId, farm_id: farmId,
          animal_id: animalId, type: 'calving_due', due_date: fpp,
          status: 'pending',
          message: `${selectedAnimal?.name || selectedAnimal?.tag_number || 'Animal'} — parto probable`,
          sync_status: 'pending',
        }
        await db.alerts.put(calvingAlert)
        await enqueue('alerts', calvingAlertId, 'upsert', calvingAlert)

        // Update animal repro_status → 'served'
        await db.animals.update(animalId, { repro_status: 'served', sync_status: 'pending' })
        await enqueue('animals', animalId, 'upsert', { ...selectedAnimal, repro_status: 'served' })
      }

      if (eventType === 'pregnancy_check' && checkResult === 'pregnant') {
        await db.animals.update(animalId, { repro_status: 'pregnant', sync_status: 'pending' })
        await enqueue('animals', animalId, 'upsert', { ...selectedAnimal, repro_status: 'pregnant' })
      }

      if (eventType === 'dry_off') {
        // Cancel pending calving alerts for this animal
        const pendingCalving = await db.alerts
          .where('animal_id').equals(animalId)
          .filter((a) => a.type === 'calving_due' && a.status === 'pending')
          .toArray()
        for (const a of pendingCalving) {
          await db.alerts.update(a.id, { status: 'dismissed' })
        }
        await db.animals.update(animalId, { repro_status: 'dry', sync_status: 'pending' })
        await enqueue('animals', animalId, 'upsert', { ...selectedAnimal, repro_status: 'dry' })
      }

      if (eventType === 'calving') {
        // Create calf animal
        const calfId = crypto.randomUUID()
        const calf = {
          id: calfId,
          account_id: accountId,
          farm_id: farmId,
          sex: calfSex,
          category: 'calf',
          status: 'active',
          origin: 'born',
          mother_id: animalId,
          external_father: sireText || null,
          birth_date: date,
          sync_status: 'pending',
        }
        await db.animals.put(calf)
        await enqueue('animals', calfId, 'upsert', calf)
        await db.animals.update(animalId, { repro_status: 'fresh', sync_status: 'pending' })
        console.log('[Sync] Pushing repro_event (calving) to Supabase…')
        runSync().catch(() => {})
        navigate(`/animales/${calfId}/editar`)
        return
      }

      console.log('[Sync] Pushing repro_event to Supabase…')
      runSync().catch(() => {})
      navigate(-1)
    } catch (err) {
      setError(err.message ?? 'Error al guardar. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col pb-28">
      <div className="bg-white px-4 py-4 border-b border-gray-100 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-gray-400 text-2xl leading-none">‹</button>
        <h1 className="text-lg font-bold text-[#2b3240] flex-1">Evento reproductivo</h1>
      </div>

      <div className="p-4 flex flex-col gap-5">
        {/* Animal selector */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#2b3240]">Animal *</label>
          <select
            value={animalId}
            onChange={(e) => setAnimalId(e.target.value)}
            className={inputCls}
            disabled={!!preselectedId}
          >
            <option value="">Seleccionar animal</option>
            {(females ?? []).map((a) => (
              <option key={a.id} value={a.id}>{a.name || a.tag_number || a.id.slice(0,8)}</option>
            ))}
          </select>
        </div>

        {/* Tipo de evento */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#2b3240]">Tipo de evento</label>
          <div className="grid grid-cols-3 gap-2">
            {EVENT_TYPES.map(({ value, emoji, label }) => (
              <button key={value} type="button"
                onClick={() => setEventType(value)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${
                  eventType === value ? 'border-[#3dbf5e] bg-green-50' : 'border-gray-200'
                }`}
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-xs font-medium text-[#2b3240]">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Fecha */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#2b3240]">Fecha</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </div>

        {/* Campos condicionales */}
        {eventType === 'service' && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#2b3240]">Método</label>
              <div className="flex gap-2">
                {[{ v: 'ai', l: '💉 Inseminación' }, { v: 'natural', l: '🐂 Monta natural' }].map(({ v, l }) => (
                  <button key={v} type="button"
                    onClick={() => setServiceMethod(v)}
                    className={`flex-1 min-h-[48px] rounded-xl border-2 text-sm font-semibold transition-all ${
                      serviceMethod === v ? 'border-[#3dbf5e] bg-green-50 text-[#2b3240]' : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#2b3240]">Toro / Pajilla (opcional)</label>
              <input type="text" placeholder="Nombre o código" value={sireText} onChange={(e) => setSireText(e.target.value)} className={inputCls} />
            </div>
          </>
        )}

        {eventType === 'pregnancy_check' && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#2b3240]">Resultado</label>
            <div className="flex gap-2">
              {[{ v: 'pregnant', l: '✅ Preñada' }, { v: 'open', l: '❌ Vacía' }].map(({ v, l }) => (
                <button key={v} type="button"
                  onClick={() => setCheckResult(v)}
                  className={`flex-1 min-h-[48px] rounded-xl border-2 text-sm font-semibold transition-all ${
                    checkResult === v ? 'border-[#3dbf5e] bg-green-50 text-[#2b3240]' : 'border-gray-200 text-gray-500'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}

        {eventType === 'calving' && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#2b3240]">Sexo de la cría</label>
              <div className="flex gap-2">
                {[{ v: 'female', l: '♀ Ternera' }, { v: 'male', l: '♂ Ternero' }].map(({ v, l }) => (
                  <button key={v} type="button"
                    onClick={() => setCalfSex(v)}
                    className={`flex-1 min-h-[48px] rounded-xl border-2 text-sm font-semibold transition-all ${
                      calfSex === v ? 'border-[#3dbf5e] bg-green-50 text-[#2b3240]' : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#2b3240]">Peso al nacer (kg, opcional)</label>
              <input type="number" step="0.1" placeholder="0.0" value={calfWeight} onChange={(e) => setCalfWeight(e.target.value)} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#2b3240]">Padre / Pajilla (opcional)</label>
              <input type="text" placeholder="Nombre o código" value={sireText} onChange={(e) => setSireText(e.target.value)} className={inputCls} />
            </div>
          </>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#2b3240]">Observaciones</label>
          <textarea rows={2} placeholder="Opcional..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-[#2b3240] resize-none focus:outline-none focus:ring-2 focus:ring-[#3dbf5e]" />
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center bg-red-50 rounded-xl px-3 py-2">{error}</p>
        )}

        <Button onClick={handleSave} loading={loading} className="w-full">
          {eventType === 'calving' ? 'Registrar parto y crear cría' : 'Guardar evento'}
        </Button>
      </div>
    </div>
  )
}
