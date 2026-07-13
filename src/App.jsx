import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { useSessionStore } from './stores/sessionStore'
import { PENDING_INVITE_CODE_KEY } from './lib/inviteCode'
import AppLayout from './components/shared/AppLayout'
import PrivateRoute from './components/shared/PrivateRoute'
import RequireRole from './components/shared/RequireRole'
import LoginPage from './features/auth/LoginPage'
import SignupPage from './features/auth/SignupPage'
import OnboardingWizard from './features/farms/OnboardingWizard'
import FarmSelector from './features/farms/FarmSelector'
import JoinFarmPage from './features/farms/JoinFarmPage'
import ManageUsersPage from './features/farms/ManageUsersPage'
import HomePage from './features/dashboard/HomePage'
import AnimalListPage from './features/animals/AnimalListPage'
import AnimalDetailPage from './features/animals/AnimalDetailPage'
import AnimalFormPage from './features/animals/AnimalFormPage'
import MilkFormPage from './features/milk/MilkFormPage'
import RegisterSheet from './features/reproduction/RegisterSheet'
import ReproEventForm from './features/reproduction/ReproEventForm'
import WeightFormPage from './features/weights/WeightFormPage'
import WeightHistoryPage from './features/weights/WeightHistoryPage'
import HealthEventFormPage from './features/health/HealthEventFormPage'
import HealthHistoryPage from './features/health/HealthHistoryPage'
import ProtocolsPage from './features/health/ProtocolsPage'
import AlertsPage from './features/alerts/AlertsPage'
import MorePage from './features/more/MorePage'

// Lazy: pulls in the xlsx library (~500kB) only when the import screen is visited
const ImportAnimalsPage = lazy(() => import('./features/animals/ImportAnimalsPage'))

export default function App() {
  const init = useSessionStore((s) => s.init)

  useEffect(() => { init() }, [init])

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<SignupPage />} />

      {/* Auth required, no farm needed */}
      <Route path="/onboarding" element={<OnboardingWizardGuard />} />
      <Route path="/seleccionar-finca" element={<FarmSelectorGuard />} />
      <Route path="/unirse" element={<JoinFarmPageGuard />} />

      {/* Private routes — need session + active farm */}
      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/animales" element={<AnimalListPage />} />
          <Route path="/animales/nuevo" element={<RequireRole role="admin"><AnimalFormPage /></RequireRole>} />
          <Route path="/animales/importar" element={
            <RequireRole role="admin">
              <Suspense fallback={<div className="p-4 text-center text-sm text-muted-foreground mt-8">Cargando...</div>}>
                <ImportAnimalsPage />
              </Suspense>
            </RequireRole>
          } />
          <Route path="/animales/:id" element={<AnimalDetailPage />} />
          <Route path="/animales/:id/editar" element={<RequireRole role="admin"><AnimalFormPage /></RequireRole>} />
          <Route path="/ordeño" element={<MilkFormPage />} />
          <Route path="/registrar" element={<RegisterSheet />} />
          <Route path="/registrar/repro" element={<ReproEventForm />} />
          <Route path="/registrar/peso" element={<WeightFormPage />} />
          <Route path="/pesajes" element={<WeightHistoryPage />} />
          <Route path="/registrar/salud" element={<HealthEventFormPage />} />
          <Route path="/salud" element={<HealthHistoryPage />} />
          <Route path="/protocolos" element={<RequireRole role="admin"><ProtocolsPage /></RequireRole>} />
          <Route path="/usuarios" element={<RequireRole role="owner"><ManageUsersPage /></RequireRole>} />
          <Route path="/alertas" element={<AlertsPage />} />
          <Route path="/mas" element={<MorePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// Guard: must be logged in to reach onboarding/farm-selector
function OnboardingWizardGuard() {
  const user = useSessionStore((s) => s.user)
  const loading = useSessionStore((s) => s.loading)
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <OnboardingWizard />
}

function FarmSelectorGuard() {
  const user = useSessionStore((s) => s.user)
  const loading = useSessionStore((s) => s.loading)
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <FarmSelector />
}

function JoinFarmPageGuard() {
  const user = useSessionStore((s) => s.user)
  const loading = useSessionStore((s) => s.loading)
  const [searchParams] = useSearchParams()
  if (loading) return null
  if (!user) {
    // Stash the code so it survives the login/signup detour — the ?code=
    // query param would otherwise be lost once we redirect away from here.
    const code = searchParams.get('code')
    if (code) localStorage.setItem(PENDING_INVITE_CODE_KEY, code)
    return <Navigate to="/login" replace />
  }
  return <JoinFarmPage />
}
