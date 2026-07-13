import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useSessionStore } from '../../stores/sessionStore'
import { useFarmStore } from '../../stores/farmStore'
import { ROLE_LABELS } from '../../lib/rules/roles'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import PasswordInput from '../../components/ui/PasswordInput'
import { cn } from '../../lib/utils'

const inputCls = 'w-full h-12 px-4 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'

export default function ProfilePage() {
  const navigate = useNavigate()
  const user = useSessionStore((s) => s.user)
  const farms = useFarmStore((s) => s.farms)

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name ?? '')
  const [savingName, setSavingName] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const handleSaveName = async (e) => {
    e.preventDefault()
    setSavingName(true)
    try {
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id)
      if (profileErr) throw profileErr
      // Keeps auth metadata (used as the default in signup/session data) in sync too
      await supabase.auth.updateUser({ data: { full_name: fullName.trim() } })
      toast.success('Nombre actualizado ✓')
    } catch (err) {
      toast.error(err.message ?? 'No se pudo actualizar el nombre')
    } finally {
      setSavingName(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    if (newPassword.length < 8) {
      setPasswordError('Mínimo 8 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden')
      return
    }
    setSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Contraseña actualizada ✓')
    } catch (err) {
      setPasswordError(err.message ?? 'No se pudo cambiar la contraseña')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="flex flex-col pb-28">
      <div className="bg-card px-4 py-4 border-b border-border flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1">Mi perfil</h1>
      </div>

      <div className="p-4 flex flex-col gap-6">
        <form onSubmit={handleSaveName} className="flex flex-col gap-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Datos personales</p>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Nombre completo</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre"
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Correo electrónico</label>
            <input value={user?.email ?? ''} disabled className={cn(inputCls, 'opacity-60 cursor-not-allowed')} />
          </div>

          <Button type="submit" loading={savingName} className="w-full">
            Guardar nombre
          </Button>
        </form>

        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cambiar contraseña</p>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Nueva contraseña</label>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Confirmar contraseña</label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className={inputCls}
            />
          </div>

          {passwordError && <span className="text-xs text-destructive">{passwordError}</span>}

          <Button type="submit" loading={savingPassword} variant="outline" className="w-full">
            Actualizar contraseña
          </Button>
        </form>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Mis fincas ({farms.length})
          </p>
          <div className="flex flex-col gap-2">
            {farms.map((farm) => (
              <Card key={farm.id} className="p-4 flex items-center gap-3">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: farm.accent_color || '#16a34a' }}
                />
                <span className="flex-1 min-w-0 truncate font-medium text-sm text-foreground">{farm.name}</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-foreground flex-shrink-0">
                  {ROLE_LABELS[farm.role] ?? farm.role}
                </span>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
