import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useSessionStore } from '../../stores/sessionStore'
import { useFarmStore } from '../../stores/farmStore'
import { hasMinRole } from '../../lib/rules/roles'
import Card from '../../components/ui/Card'

const baseMenuItems = [
  { emoji: '🏡', label: 'Mis fincas', to: '/seleccionar-finca' },
  { emoji: '🔑', label: 'Unirme a otra finca', to: '/unirse' },
  { emoji: '💉', label: 'Protocolos sanitarios', to: '/protocolos', minRole: 'admin' },
  { emoji: '👥', label: 'Gestión de usuarios', to: '/usuarios', minRole: 'owner' },
  { emoji: '⚙️', label: 'Configuración', to: '/configuracion' },
  { emoji: '👤', label: 'Mi perfil', to: '/perfil' },
]

export default function MorePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const clearSession = useSessionStore((s) => s.clearSession)
  const activeFarm = useFarmStore((s) => s.activeFarm)
  const setFarms = useFarmStore((s) => s.setFarms)
  const setActiveFarm = useFarmStore((s) => s.setActiveFarm)

  const menuItems = baseMenuItems.filter((item) => !item.minRole || hasMinRole(activeFarm?.role, item.minRole))

  const handleLogout = async () => {
    await supabase.auth.signOut()
    clearSession()
    setFarms([])
    setActiveFarm(null)
    navigate('/login', { replace: true })
  }

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

        <Card
          className="flex items-center gap-4 min-h-[56px] border-red-100"
          onClick={handleLogout}
        >
          <span className="text-2xl">🚪</span>
          <span className="font-medium text-red-500">Cerrar sesión</span>
        </Card>
      </div>
    </div>
  )
}
