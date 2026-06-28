import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { useFarmStore } from '../../stores/farmStore'
import db from '../../lib/db'

function IconHome() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function IconAnimals() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M20 7c0 2.21-3.582 4-8 4S4 9.21 4 7m16 0c0-2.21-3.582-4-8-4S4 4.79 4 7m16 0v5c0 2.21-3.582 4-8 4s-8-1.79-8-4V7m16 10v-5M4 17v-5" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function IconBell() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}

function IconMenu() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

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
    `flex flex-col items-center justify-center gap-0.5 min-h-[48px] flex-1 text-xs font-medium transition-colors ${
      isActive ? 'text-[#3dbf5e]' : 'text-gray-400'
    }`

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <NavLink to="/" end className={linkClass}>
        <IconHome />
        <span>{t('nav.home')}</span>
      </NavLink>

      <NavLink to="/animales" className={linkClass}>
        <IconAnimals />
        <span>{t('nav.animals')}</span>
      </NavLink>

      <button
        onClick={() => navigate('/registrar')}
        className="flex flex-col items-center justify-center min-h-[48px] flex-1 gap-0.5"
      >
        <div className="w-12 h-12 rounded-full bg-[#3dbf5e] flex items-center justify-center shadow-lg text-white -mt-5">
          <IconPlus />
        </div>
        <span className="text-xs font-medium text-gray-400 mt-0.5">{t('nav.register')}</span>
      </button>

      <NavLink to="/alertas" className={linkClass}>
        <div className="relative">
          <IconBell />
          {pendingCount > 0 && (
            <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
        </div>
        <span>{t('nav.alerts')}</span>
      </NavLink>

      <NavLink to="/mas" className={linkClass}>
        <IconMenu />
        <span>{t('nav.more')}</span>
      </NavLink>
    </nav>
  )
}
