import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, PawPrint, Plus, Bell, MoreHorizontal } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useFarmStore } from '../../stores/farmStore'
import db from '../../lib/db'
import { cn } from '../../lib/utils'

export default function BottomNav() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const activeFarm = useFarmStore((s) => s.activeFarm)

  const pendingCount = useLiveQuery(
    () => activeFarm
      ? db.alerts.where('farm_id').equals(activeFarm.id).filter((a) => a.status === 'pending').count()
      : 0,
    [activeFarm?.id]
  ) ?? 0

  const linkClass = ({ isActive }) =>
    cn(
      'flex flex-col items-center justify-center gap-1 min-h-[56px] flex-1 text-[11px] font-medium transition-colors',
      isActive ? 'text-brand-green' : 'text-muted-foreground'
    )

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex items-end z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <NavLink to="/" end className={linkClass}>
        <Home className="w-5 h-5" />
        <span>{t('nav.home')}</span>
      </NavLink>

      <NavLink to="/animales" className={linkClass}>
        <PawPrint className="w-5 h-5" />
        <span>{t('nav.animals')}</span>
      </NavLink>

      {/* FAB central */}
      <div className="flex flex-col items-center justify-center flex-1 pb-2">
        <button
          onClick={() => navigate('/registrar')}
          className="w-14 h-14 rounded-full bg-brand-green text-white shadow-lg flex items-center justify-center -mt-6 active:scale-95 transition-transform"
          aria-label="Registrar"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </button>
        <span className="text-[11px] font-medium text-muted-foreground mt-0.5">{t('nav.register')}</span>
      </div>

      <NavLink to="/alertas" className={linkClass}>
        <div className="relative">
          <Bell className="w-5 h-5" />
          {pendingCount > 0 && (
            <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
        </div>
        <span>{t('nav.alerts')}</span>
      </NavLink>

      <NavLink to="/mas" className={linkClass}>
        <MoreHorizontal className="w-5 h-5" />
        <span>{t('nav.more')}</span>
      </NavLink>
    </nav>
  )
}
