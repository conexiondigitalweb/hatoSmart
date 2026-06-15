import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'

const menuItems = [
  { emoji: '🏡', label: 'Mis fincas', to: '/fincas' },
  { emoji: '⚙️', label: 'Configuración', to: '/configuracion' },
  { emoji: '👤', label: 'Mi perfil', to: '/perfil' },
  { emoji: '🚪', label: 'Cerrar sesión', to: '/login' },
]

export default function MorePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-xl font-bold text-[#2b3240]">{t('nav.more')}</h1>
      <div className="flex flex-col gap-2">
        {menuItems.map(({ emoji, label, to }) => (
          <Card
            key={to}
            className="flex items-center gap-4 min-h-[56px]"
            onClick={() => navigate(to)}
          >
            <span className="text-2xl">{emoji}</span>
            <span className="font-medium text-[#2b3240]">{label}</span>
            <span className="ml-auto text-gray-300 text-lg">›</span>
          </Card>
        ))}
      </div>
    </div>
  )
}
