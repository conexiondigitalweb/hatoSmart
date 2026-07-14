import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSessionStore } from '../../stores/sessionStore'
import { useFarmStore } from '../../stores/farmStore'
import LandingPage from '../../features/marketing/LandingPage'

export default function PrivateRoute() {
  const user = useSessionStore((s) => s.user)
  const loading = useSessionStore((s) => s.loading)
  const activeFarm = useFarmStore((s) => s.activeFarm)
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <img src="/apple-touch-icon.png" alt="HatoSmart" className="w-16 h-16 animate-pulse" />
          <p className="text-sm text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    // "/" is the one private path that isn't actually private for a signed
    // out visitor — it's the public marketing landing. Every other private
    // route (e.g. /animales) still bounces to /login as before; a logged
    // in user hitting "/" never sees this because this branch requires !user.
    if (location.pathname === '/') return <LandingPage />
    return <Navigate to="/login" replace />
  }
  if (!activeFarm) return <Navigate to="/onboarding" replace />

  return <Outlet />
}
