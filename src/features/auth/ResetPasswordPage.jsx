import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useSessionStore } from '../../stores/sessionStore'
import { useFarmStore } from '../../stores/farmStore'
import Button from '../../components/ui/Button'
import PasswordInput from '../../components/ui/PasswordInput'

const fieldCls = 'w-full h-12 px-4 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow'

// Reached from the recovery link Supabase emails out (resetPasswordForEmail
// redirectTo). The client has `detectSessionInUrl: true` (src/lib/supabase.js),
// so by the time this mounts the recovery token in the URL has already been
// exchanged for a real session — sessionStore.init() (App.jsx) picks it up
// the same way it picks up any other session, so we just read it from there
// instead of re-parsing the URL ourselves.
export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const user = useSessionStore((s) => s.user)
  const loading = useSessionStore((s) => s.loading)
  const clearSession = useSessionStore((s) => s.clearSession)
  const setFarms = useFarmStore((s) => s.setFarms)
  const setActiveFarm = useFarmStore((s) => s.setActiveFarm)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Mínimo 8 caracteres'); return }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return }

    setSubmitting(true)
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password })
      if (updateErr) throw updateErr

      // The recovery link leaves the user with a real, logged-in session —
      // sign out so they land on /login and go in deliberately with the
      // new password, matching the flow asked for, instead of silently
      // dropping them inside the app from an email link.
      await supabase.auth.signOut()
      clearSession()
      setFarms([])
      setActiveFarm(null)
      toast.success('Contraseña restablecida ✓ Inicia sesión con tu nueva contraseña.')
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.message ?? 'No se pudo restablecer la contraseña')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 flex flex-col items-center justify-center p-6">
        <div className="bg-card rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-9 h-9 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Enlace no válido o expirado</h2>
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
            Solicita un nuevo enlace para restablecer tu contraseña.
          </p>
          <Link to="/olvide-contrasena" className="block mt-6">
            <Button className="w-full">Solicitar nuevo enlace</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/apple-touch-icon.png" alt="HatoSmart" className="w-16 h-16 rounded-2xl shadow-lg mx-auto mb-4" />
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-foreground">Hato</span><span className="text-brand-green">Smart</span>
          </h1>
        </div>

        <div className="bg-card rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-5">Nueva contraseña</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Nueva contraseña</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                className={fieldCls}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Confirmar contraseña</label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className={fieldCls}
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-center">
                {error}
              </div>
            )}

            <Button type="submit" loading={submitting} className="w-full mt-1">
              Restablecer contraseña
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
