import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useFarmStore } from '../../stores/farmStore'
import db from '../../lib/db'
import Button from '../../components/ui/Button'
import PasswordInput from '../../components/ui/PasswordInput'
import { cn } from '../../lib/utils'
import { PENDING_INVITE_CODE_KEY, fetchInvitePreview } from '../../lib/inviteCode'
import { ROLE_LABELS } from '../../lib/rules/roles'

const schema = z.object({
  email:    z.string().min(1, 'Ingresa tu correo').email('Correo inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

const fieldCls = (hasError) =>
  cn(
    'w-full h-12 px-4 rounded-xl border bg-white text-sm text-foreground placeholder:text-muted-foreground',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow',
    hasError ? 'border-destructive' : 'border-border'
  )

// Redeems a stashed invite code after successful auth (signup or login),
// so joining a farm never needs a separate /unirse confirmation click.
// "Ya eres miembro" is treated as success (idempotent — the code may have
// already been redeemed in a previous attempt).
async function redeemPendingInvite(code) {
  const { data, error } = await supabase.rpc('redeem_farm_invitation', { p_code: code })
  if (error && !error.message?.includes('Ya eres miembro')) throw error
  if (data) return data
  // "Ya eres miembro" path: find the farm_id from the invitation preview
  // is not available anymore (code may be marked used) — fall back to
  // reloading the user's memberships, handled by the caller.
  return null
}

export default function LoginPage() {
  const navigate = useNavigate()
  const setFarms = useFarmStore((s) => s.setFarms)
  const setActiveFarm = useFarmStore((s) => s.setActiveFarm)
  const [serverError, setServerError] = useState('')
  const [invite, setInvite] = useState(null) // { farmName, role } | { error } | null

  const pendingCode = localStorage.getItem(PENDING_INVITE_CODE_KEY)

  useEffect(() => {
    if (!pendingCode) return
    fetchInvitePreview(pendingCode)
      .then((preview) => setInvite(preview))
      .catch((err) => {
        // Invalid/expired code — don't block a normal login over it, just
        // stop suggesting it and clear it so it isn't retried after auth.
        localStorage.removeItem(PENDING_INVITE_CODE_KEY)
        setInvite({ error: err.message })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  })

  const onSubmit = async ({ email, password }) => {
    setServerError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setServerError(
        error.message.includes('Invalid login credentials')
          ? 'Correo o contraseña incorrectos.'
          : error.message
      )
      return
    }

    const codeToRedeem = invite && !invite.error ? pendingCode : null

    if (codeToRedeem) {
      try {
        const result = await redeemPendingInvite(codeToRedeem)
        localStorage.removeItem(PENDING_INVITE_CODE_KEY)
        if (result?.farm_id) {
          const { data: farmRow } = await supabase.from('farms').select('*').eq('id', result.farm_id).single()
          if (farmRow) {
            const farm = { ...farmRow, role: result.role }
            await db.accounts.put({ id: result.account_id, sync_status: 'synced' })
            await db.farms.put({ ...farmRow, sync_status: 'synced' })
            setFarms([farm])
            setActiveFarm(farm)
            toast.success(`Te uniste a ${farm.name} ✓`)
            navigate('/')
            return
          }
        }
      } catch (err) {
        toast.error(err.message ?? 'No se pudo canjear el código de invitación')
      }
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { data: memberships } = await supabase
      .from('memberships')
      .select('farm_id, role, farms(*)')
      .eq('user_id', user.id)

    const farms = (memberships ?? []).map((m) => ({ ...m.farms, role: m.role }))
    setFarms(farms)

    if (farms.length === 0) {
      navigate('/onboarding')
    } else if (farms.length === 1) {
      setActiveFarm(farms[0])
      navigate('/')
    } else {
      navigate('/seleccionar-finca')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/apple-touch-icon.png" alt="HatoSmart" className="w-16 h-16 rounded-2xl shadow-lg mx-auto mb-4" />
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-foreground">Hato</span><span className="text-brand-green">Smart</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Gestión ganadera inteligente</p>
        </div>

        {invite && !invite.error && (
          <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 text-center mb-4">
            Inicia sesión para unirte a <strong>{invite.farmName}</strong> como <strong>{ROLE_LABELS[invite.role]}</strong>
          </div>
        )}

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-5">Iniciar sesión</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Correo electrónico</label>
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                autoComplete="email"
                className={fieldCls(!!errors.email)}
                {...register('email')}
              />
              {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Contraseña</label>
              <PasswordInput
                placeholder="••••••••"
                autoComplete="current-password"
                className={fieldCls(!!errors.password)}
                {...register('password')}
              />
              {errors.password && <span className="text-xs text-destructive">{errors.password.message}</span>}
            </div>

            {serverError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-center">
                {serverError}
              </div>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full mt-1">
              Iniciar sesión
            </Button>
          </form>

          <button
            type="button"
            onClick={() => alert('Funcionalidad próximamente')}
            className="text-center text-muted-foreground text-sm w-full mt-4 hover:text-brand-green transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <p className="text-center text-muted-foreground text-sm mt-5">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="text-brand-green font-semibold hover:underline">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
