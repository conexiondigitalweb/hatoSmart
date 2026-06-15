import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useFarmStore } from '../../stores/farmStore'
import Card from '../../components/ui/Card'

const quickLinks = [
  { emoji: '🥛', titleKey: 'modules.milk', desc: 'Registra la producción de hoy', to: '/registrar' },
  { emoji: '🐄', titleKey: 'modules.animals', desc: 'Ver todos los animales', to: '/animales' },
  { emoji: '🔔', titleKey: 'modules.alerts', desc: 'Revisa las alertas activas', to: '/alertas' },
  { emoji: '⚖️', titleKey: 'modules.weights', desc: 'Registra pesajes', to: '/registrar' },
]

export default function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const activeFarm = useFarmStore((s) => s.activeFarm)

  return (
    <div className="p-4 flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-[#2b3240]">{activeFarm?.name ?? 'Mi finca'}</h1>
        <p className="text-sm text-gray-400">Bienvenido de nuevo</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {quickLinks.map(({ emoji, titleKey, desc, to }) => (
          <Card
            key={titleKey}
            className="flex flex-col gap-2 p-5"
            onClick={() => navigate(to)}
          >
            <span className="text-3xl">{emoji}</span>
            <p className="font-semibold text-[#2b3240] text-sm">{t(titleKey)}</p>
            <p className="text-xs text-gray-400">{desc}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
