import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/shared/AppLayout'
import HomePage from './features/dashboard/HomePage'
import AnimalsPage from './features/animals/AnimalsPage'
import RegisterSheet from './features/reproduction/RegisterSheet'
import AlertsPage from './features/alerts/AlertsPage'
import MorePage from './features/more/MorePage'
import LoginPage from './features/auth/LoginPage'
import SignupPage from './features/auth/SignupPage'
import { useSessionStore } from './stores/sessionStore'

export default function App() {
  const init = useSessionStore((s) => s.init)

  useEffect(() => { init() }, [init])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<SignupPage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/animales" element={<AnimalsPage />} />
        <Route path="/registrar" element={<RegisterSheet />} />
        <Route path="/alertas" element={<AlertsPage />} />
        <Route path="/mas" element={<MorePage />} />
      </Route>
    </Routes>
  )
}
