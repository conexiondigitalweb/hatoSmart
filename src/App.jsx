import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSessionStore } from './stores/sessionStore'
import AppLayout from './components/shared/AppLayout'
import PrivateRoute from './components/shared/PrivateRoute'
import LoginPage from './features/auth/LoginPage'
import SignupPage from './features/auth/SignupPage'
import OnboardingWizard from './features/farms/OnboardingWizard'
import FarmSelector from './features/farms/FarmSelector'
import HomePage from './features/dashboard/HomePage'
import AnimalListPage from './features/animals/AnimalListPage'
import AnimalDetailPage from './features/animals/AnimalDetailPage'
import AnimalFormPage from './features/animals/AnimalFormPage'
import MilkFormPage from './features/milk/MilkFormPage'
import RegisterSheet from './features/reproduction/RegisterSheet'
import ReproEventForm from './features/reproduction/ReproEventForm'
import AlertsPage from './features/alerts/AlertsPage'
import MorePage from './features/more/MorePage'

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

      {/* Private routes — need session + active farm */}
      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/animales" element={<AnimalListPage />} />
          <Route path="/animales/nuevo" element={<AnimalFormPage />} />
          <Route path="/animales/:id" element={<AnimalDetailPage />} />
          <Route path="/animales/:id/editar" element={<AnimalFormPage />} />
          <Route path="/ordeño" element={<MilkFormPage />} />
          <Route path="/registrar" element={<RegisterSheet />} />
          <Route path="/registrar/repro" element={<ReproEventForm />} />
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
