import { useNavigate } from 'react-router-dom'
import { useFarmStore } from '../../stores/farmStore'
import Card from '../../components/ui/Card'

const ORIENTATION_LABELS = {
  dairy:    { emoji: '🥛', label: 'Lechería' },
  beef:     { emoji: '🥩', label: 'Carne' },
  dual:     { emoji: '🔄', label: 'Doble propósito' },
  genetics: { emoji: '🧬', label: 'Genética' },
  mixed:    { emoji: '📦', label: 'Mixto' },
}

export default function FarmSelector() {
  const navigate = useNavigate()
  const farms = useFarmStore((s) => s.farms)
  const setActiveFarm = useFarmStore((s) => s.setActiveFarm)

  const handleSelect = (farm) => {
    setActiveFarm(farm)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <img src="/apple-touch-icon.png" alt="HatoSmart" className="w-16 h-16 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-[#2b3240]">Selecciona tu finca</h1>
          <p className="text-sm text-gray-500 mt-1">Tienes acceso a varias fincas</p>
        </div>

        <div className="flex flex-col gap-3">
          {farms.map((farm) => {
            const ori = ORIENTATION_LABELS[farm.orientation] ?? { emoji: '🏡', label: farm.orientation }
            return (
              <Card
                key={farm.id}
                className="flex items-center gap-4 min-h-[72px]"
                onClick={() => handleSelect(farm)}
              >
                <span className="text-3xl">{ori.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#2b3240] truncate">{farm.name}</p>
                  {farm.commercial_name && (
                    <p className="text-xs text-gray-400 truncate">{farm.commercial_name}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{ori.label}</p>
                </div>
                <span className="text-gray-300 text-lg flex-shrink-0">›</span>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
