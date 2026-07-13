import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useSessionStore } from '../../stores/sessionStore'
import { useFarmStore } from '../../stores/farmStore'
import { hasMinRole } from '../../lib/rules/roles'
import Card from '../../components/ui/Card'

const SECTIONS = [
  {
    title: 'Mi finca',
    items: [
      { emoji: '⚙️', label: 'Configuración de la finca', to: '/configuracion', minRole: 'owner' },
      { emoji: '🏡', label: 'Mis fincas', to: '/seleccionar-finca' },
      { emoji: '🔑', label: 'Unirme a otra finca', to: '/unirse' },
    ],
  },
  {
    title: 'Catálogos',
    items: [
      { emoji: '💉', label: 'Protocolos sanitarios', to: '/protocolos', minRole: 'admin' },
    ],
  },
  {
    title: 'Historial',
    items: [
      { emoji: '⚖️', label: 'Historial de pesajes', to: '/pesajes' },
      { emoji: '🩺', label: 'Historial de salud', to: '/salud' },
    ],
  },
  {
    title: 'Cuenta',
    items: [
      { emoji: '👥', label: 'Gestión de usuarios', to: '/usuarios', minRole: 'owner' },
      { emoji: '👤', label: 'Mi perfil', to: '/perfil' },
    ],
  },
]

export default function MorePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const clearSession = useSessionStore((s) => s.clearSession)
  const activeFarm = useFarmStore((s) => s.activeFarm)
  const setFarms = useFarmStore((s) => s.setFarms)
  const setActiveFarm = useFarmStore((s) => s.setActiveFarm)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    clearSession()
    setFarms([])
    setActiveFarm(null)
    navigate('/login', { replace: true })
  }

  return (
    <div className="p-4 flex flex-col gap-6">
      <h1 className="text-xl font-bold text-foreground">{t('nav.more')}</h1>

      {SECTIONS.map(({ title, items }) => {
        const visibleItems = items.filter((item) => !item.minRole || hasMinRole(activeFarm?.role, item.minRole))
        if (visibleItems.length === 0) return null
        return (
          <div key={title} className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">{title}</p>
            <div className="flex flex-col gap-2">
              {visibleItems.map(({ emoji, label, to }) => (
                <Card
                  key={to}
                  className="flex items-center gap-4 min-h-[56px] p-4"
                  onClick={() => navigate(to)}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="font-medium text-foreground">{label}</span>
                  <span className="ml-auto text-muted-foreground text-lg">›</span>
                </Card>
              ))}
            </div>
          </div>
        )
      })}

      <Card
        className="flex items-center gap-4 min-h-[56px] p-4 border border-red-100"
        onClick={handleLogout}
      >
        <LogOut className="w-6 h-6 text-red-500" />
        <span className="font-medium text-red-500">Cerrar sesión</span>
      </Card>
    </div>
  )
}
