import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { useFarmStore } from '../../stores/farmStore'
import { useSessionStore } from '../../stores/sessionStore'
import db from '../../lib/db'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

const step1Schema = z.object({
  name: z.string().min(2, 'El nombre de la finca es requerido'),
  commercial_name: z.string().optional(),
})

const ORIENTATIONS = [
  { value: 'dairy',    emoji: '🥛', label: 'Lechería' },
  { value: 'beef',     emoji: '🥩', label: 'Carne' },
  { value: 'dual',     emoji: '🔄', label: 'Doble propósito' },
  { value: 'genetics', emoji: '🧬', label: 'Genética' },
  { value: 'mixed',    emoji: '📦', label: 'Mixto' },
]

const CURRENCIES = ['COP', 'USD', 'EUR']

const ANIMAL_RANGES = ['1-20', '21-50', '51-100', '100-500', '500+']

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i < current ? 'bg-[#3dbf5e] w-8' : i === current ? 'bg-[#3dbf5e] w-8' : 'bg-gray-200 w-4'
          }`}
        />
      ))}
    </div>
  )
}

function Step1({ onNext }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(step1Schema),
  })
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-[#2b3240]">¡Bienvenido a HatoSmart!</h2>
        <p className="text-gray-500 text-sm mt-1">Empecemos configurando tu finca.</p>
      </div>
      <form onSubmit={handleSubmit(onNext)} className="flex flex-col gap-4">
        <Input
          label="Nombre de la finca *"
          placeholder="Finca El Porvenir"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Nombre comercial (opcional)"
          placeholder="El Porvenir S.A.S."
          {...register('commercial_name')}
        />
        <Button type="submit" className="w-full mt-2">
          Continuar
        </Button>
      </form>
    </div>
  )
}

function Step2({ data, onNext, onBack }) {
  const [orientation, setOrientation] = useState(data.orientation ?? 'dual')
  const [currency, setCurrency] = useState(data.currency ?? 'COP')
  const [animalRange, setAnimalRange] = useState(data.animalRange ?? '21-50')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-[#2b3240]">Configura tu finca</h2>
        <p className="text-gray-500 text-sm mt-1">Esto nos ayuda a mostrar lo que más importa.</p>
      </div>

      <div>
        <p className="text-sm font-medium text-[#2b3240] mb-2">Orientación productiva *</p>
        <div className="grid grid-cols-3 gap-2">
          {ORIENTATIONS.map(({ value, emoji, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setOrientation(value)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                orientation === value
                  ? 'border-[#3dbf5e] bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-xs font-medium text-[#2b3240] text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-[#2b3240] mb-2">Moneda</p>
        <div className="flex gap-2">
          {CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={`flex-1 min-h-[48px] rounded-xl border-2 text-sm font-semibold transition-all ${
                currency === c
                  ? 'border-[#3dbf5e] bg-green-50 text-[#2b3240]'
                  : 'border-gray-200 bg-white text-gray-500'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-[#2b3240] mb-2">Número aproximado de animales</p>
        <div className="flex flex-wrap gap-2">
          {ANIMAL_RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setAnimalRange(r)}
              className={`min-h-[48px] px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                animalRange === r
                  ? 'border-[#3dbf5e] bg-green-50 text-[#2b3240]'
                  : 'border-gray-200 bg-white text-gray-500'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack} className="flex-1 border border-gray-200">
          Atrás
        </Button>
        <Button onClick={() => onNext({ orientation, currency, animalRange })} className="flex-1">
          Continuar
        </Button>
      </div>
    </div>
  )
}

function Step3({ data, onConfirm, onBack, loading, error }) {
  const orientationLabel = ORIENTATIONS.find((o) => o.value === data.orientation)
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-[#2b3240]">Todo listo</h2>
        <p className="text-gray-500 text-sm mt-1">Revisa los datos antes de crear tu finca.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Nombre</p>
          <p className="font-semibold text-[#2b3240] mt-0.5">{data.name}</p>
          {data.commercial_name && (
            <p className="text-sm text-gray-500">{data.commercial_name}</p>
          )}
        </div>
        <div className="p-4 border-b border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Orientación</p>
          <p className="font-semibold text-[#2b3240] mt-0.5">
            {orientationLabel?.emoji} {orientationLabel?.label}
          </p>
        </div>
        <div className="p-4 border-b border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Moneda</p>
          <p className="font-semibold text-[#2b3240] mt-0.5">{data.currency}</p>
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Animales aproximados</p>
          <p className="font-semibold text-[#2b3240] mt-0.5">{data.animalRange}</p>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center leading-relaxed">
        También cargaremos datos de demostración para que puedas explorar la app desde el primer día.
      </p>

      {error && (
        <p className="text-red-500 text-sm text-center bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack} className="flex-1 border border-gray-200" disabled={loading}>
          Atrás
        </Button>
        <Button onClick={onConfirm} loading={loading} className="flex-1">
          Crear mi finca
        </Button>
      </div>
    </div>
  )
}

export default function OnboardingWizard() {
  const navigate = useNavigate()
  const user = useSessionStore((s) => s.user)
  const setActiveFarm = useFarmStore((s) => s.setActiveFarm)
  const setFarms = useFarmStore((s) => s.setFarms)

  const [step, setStep] = useState(0)
  const [wizardData, setWizardData] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleStep1 = (values) => {
    setWizardData((prev) => ({ ...prev, ...values }))
    setStep(1)
  }

  const handleStep2 = (values) => {
    setWizardData((prev) => ({ ...prev, ...values }))
    setStep(2)
  }

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.rpc('create_account_and_farm', {
        p_account_name: wizardData.name,
        p_farm_name: wizardData.name,
        p_farm_commercial_name: wizardData.commercial_name || wizardData.name,
        p_orientation: wizardData.orientation,
        p_currency: wizardData.currency,
      })

      if (error) throw error

      const { account_id, farm_id } = data

      // Persist in Dexie for offline-first reads
      await db.accounts.put({ id: account_id, sync_status: 'synced' })
      await db.farms.put({
        id: farm_id,
        account_id,
        name: wizardData.name,
        commercial_name: wizardData.commercial_name || null,
        orientation: wizardData.orientation,
        currency: wizardData.currency,
        sync_status: 'synced',
      })

      const farm = { id: farm_id, account_id, name: wizardData.name,
        commercial_name: wizardData.commercial_name || null,
        orientation: wizardData.orientation, currency: wizardData.currency }
      setFarms([farm])
      setActiveFarm(farm)
      navigate('/')
    } catch (err) {
      setError(err.message ?? 'Error al crear la finca. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6">
        <StepIndicator current={step} total={3} />
        {step === 0 && <Step1 onNext={handleStep1} />}
        {step === 1 && (
          <Step2
            data={wizardData}
            onNext={handleStep2}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <Step3
            data={wizardData}
            onConfirm={handleConfirm}
            onBack={() => setStep(1)}
            loading={loading}
            error={error}
          />
        )}
      </div>
    </div>
  )
}
