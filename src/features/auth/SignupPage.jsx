import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, X, Mail } from 'lucide-react'
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
  full_name: z.string().min(1, 'Ingresa tu nombre').min(2, 'Mínimo 2 caracteres'),
  email:     z.string().min(1, 'Ingresa tu correo').email('Correo inválido'),
  password:  z.string().min(1, 'Ingresa una contraseña').min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe tener al menos un número'),
  confirm_password: z.string().min(1, 'Confirma tu contraseña'),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
})

const PWD_RULES = [
  { label: 'Mínimo 8 caracteres',    test: (v) => v.length >= 8 },
  { label: 'Al menos una mayúscula', test: (v) => /[A-Z]/.test(v) },
  { label: 'Al menos un número',     test: (v) => /[0-9]/.test(v) },
]

const fieldCls = (hasError) =>
  cn(
    'w-full h-12 px-4 rounded-xl border bg-white text-sm text-foreground placeholder:text-muted-foreground',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow',
    hasError ? 'border-destructive' : 'border-border'
  )

export default function SignupPage() {
  const navigate = useNavigate()
  const setFarms = useFarmStore((s) => s.setFarms)
  const setActiveFarm = useFarmStore((s) => s.setActiveFarm)
  const [serverError, setServerError] = useState('')
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [invite, setInvite] = useState(null) // { farmName, role } | { error } | null
  const [existingEmail, setExistingEmail] = useState(false)

  const pendingCode = localStorage.getItem(PENDING_INVITE_CODE_KEY)

  useEffect(() => {
    if (!pendingCode) return
    fetchInvitePreview(pendingCode)
      .then((preview) => setInvite(preview))
      .catch((err) => {
        // Invalid/expired code caught right away, before the user fills in
        // anything — clear it so a normal signup isn't retried against it.
        localStorage.removeItem(PENDING_INVITE_CODE_KEY)
        setInvite({ error: err.message })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  })

  const pwdValue = watch('password') ?? ''

  const onSubmit = async ({ full_name, email, password }) => {
    setServerError('')
    setExistingEmail(false)
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name } },
    })
    if (error) {
      if (error.message.includes('already registered')) {
        setExistingEmail(true)
        setServerError(
          invite && !invite.error
            ? `Ya existe una cuenta con este correo. Inicia sesión para unirte a ${invite.farmName}, o usa un correo distinto si quieres una cuenta separada.`
            : 'Ya existe una cuenta con este correo. Inicia sesión, o usa un correo distinto si quieres una cuenta separada.'
        )
      } else {
        setServerError(error.message)
      }
      return
    }

    const codeToRedeem = invite && !invite.error ? pendingCode : null

    // No session yet means email confirmation is required — the code stays
    // stashed and gets redeemed by LoginPage right after the user confirms
    // and logs in, so there's still no separate /unirse click.
    if (!data.session) { setNeedsConfirmation(true); return }

    if (codeToRedeem) {
      try {
        const { data: result, error: redeemError } = await supabase.rpc('redeem_farm_invitation', { p_code: codeToRedeem })
        if (redeemError) throw redeemError
        localStorage.removeItem(PENDING_INVITE_CODE_KEY)
        const { data: farmRow } = await supabase.from('farms').select('*').eq('id', result.farm_id).single()
        const farm = { ...farmRow, role: result.role }
        await db.accounts.put({ id: result.account_id, sync_status: 'synced' })
        await db.farms.put({ ...farmRow, sync_status: 'synced' })
        setFarms([farm])
        setActiveFarm(farm)
        toast.success(`Cuenta creada — te uniste a ${farm.name} ✓`)
        navigate('/')
        return
      } catch (err) {
        toast.error(err.message ?? 'La cuenta se creó, pero no se pudo canjear el código de invitación')
        navigate('/onboarding')
        return
      }
    }

    navigate('/onboarding')
  }

  if (needsConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 flex flex-col items-center justify-center p-6">
        <div className="bg-card rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-9 h-9 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Revisa tu correo</h2>
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
            Te enviamos un enlace de confirmación. Una vez verificado podrás iniciar sesión
            {invite && !invite.error ? ` y quedarás unido a ${invite.farmName} automáticamente.` : '.'}
          </p>
          <Link to="/login" className="block mt-6">
            <Button variant="outline" className="w-full">Ir a iniciar sesión</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (invite?.error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 flex flex-col items-center justify-center p-6">
        <div className="bg-card rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
          <h2 className="text-xl font-bold text-foreground">Código de invitación no válido</h2>
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{invite.error}</p>
          <Link to="/registro" className="block mt-6">
            <Button variant="outline" className="w-full">Continuar sin código</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <img src="/apple-touch-icon.png" alt="HatoSmart" className="w-16 h-16 rounded-2xl shadow-lg mx-auto mb-3" />
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-foreground">Hato</span><span className="text-brand-green">Smart</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Es gratis para empezar</p>
        </div>

        {invite && !invite.error && (
          <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 text-center mb-4">
            Te están invitando a unirte a <strong>{invite.farmName}</strong> como <strong>{ROLE_LABELS[invite.role]}</strong>
          </div>
        )}

        <div className="bg-card rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-5">Crear cuenta</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Nombre completo</label>
              <input type="text" placeholder="Juan Pérez" autoComplete="name"
                className={fieldCls(!!errors.full_name)} {...register('full_name')} />
              {errors.full_name && <span className="text-xs text-destructive">{errors.full_name.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Correo electrónico</label>
              <input type="email" placeholder="correo@ejemplo.com" autoComplete="email"
                className={fieldCls(!!errors.email)} {...register('email')} />
              {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Contraseña</label>
              <PasswordInput placeholder="Mínimo 8 caracteres" autoComplete="new-password"
                className={fieldCls(!!errors.password)} {...register('password')} />
              <ul className="flex flex-col gap-1 mt-1">
                {PWD_RULES.map(({ label, test }) => {
                  const ok = test(pwdValue)
                  return (
                    <li key={label} className={cn('flex items-center gap-1.5 text-xs', ok ? 'text-brand-green' : 'text-muted-foreground')}>
                      {ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {label}
                    </li>
                  )
                })}
              </ul>
              {errors.password && <span className="text-xs text-destructive">{errors.password.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Confirmar contraseña</label>
              <PasswordInput placeholder="••••••••" autoComplete="new-password"
                className={fieldCls(!!errors.confirm_password)} {...register('confirm_password')} />
              {errors.confirm_password && <span className="text-xs text-destructive">{errors.confirm_password.message}</span>}
            </div>

            {serverError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-center flex flex-col gap-2">
                <span>{serverError}</span>
                {existingEmail && (
                  <Link to="/login" className="text-brand-green font-semibold hover:underline">
                    Iniciar sesión
                  </Link>
                )}
              </div>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full mt-1">
              Crear cuenta
            </Button>
          </form>
        </div>

        <p className="text-center text-muted-foreground text-sm mt-5">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-brand-green font-semibold hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
