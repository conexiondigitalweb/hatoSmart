import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import Button from '../../components/ui/Button'

const schema = z.object({
  full_name: z.string().min(1, 'Ingresa tu nombre').min(2, 'Mínimo 2 caracteres'),
  email: z.string().min(1, 'Ingresa tu correo').email('Correo inválido'),
  password: z
    .string()
    .min(1, 'Ingresa una contraseña')
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe tener al menos un número'),
  confirm_password: z.string().min(1, 'Confirma tu contraseña'),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
})

const inputCls = (hasError) =>
  `w-full min-h-[48px] px-4 py-3 rounded-xl border bg-white text-[#2b3240] text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3dbf5e] transition-shadow ${
    hasError ? 'border-red-400' : 'border-gray-200'
  }`

const PWD_RULES = [
  { label: 'Mínimo 8 caracteres',    test: (v) => v.length >= 8 },
  { label: 'Al menos una mayúscula', test: (v) => /[A-Z]/.test(v) },
  { label: 'Al menos un número',     test: (v) => /[0-9]/.test(v) },
]

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      {children}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}

export default function SignupPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  })

  const pwdValue = watch('password') ?? ''

  const onSubmit = async ({ full_name, email, password }) => {
    setServerError('')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } },
    })

    if (error) {
      setServerError(
        error.message.includes('already registered')
          ? 'Este correo ya está registrado. ¿Quieres iniciar sesión?'
          : error.message
      )
      return
    }

    if (!data.session) {
      setNeedsConfirmation(true)
      return
    }

    navigate('/onboarding')
  }

  if (needsConfirmation) {
    return (
      <div className="min-h-screen bg-[#2b3240] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <span className="text-6xl">📧</span>
          <h2 className="text-white text-xl font-bold mt-4">Revisa tu correo</h2>
          <p className="text-gray-400 text-sm mt-2 leading-relaxed">
            Te enviamos un enlace de confirmación. Una vez verificado, podrás iniciar sesión.
          </p>
          <Link to="/login">
            <Button variant="secondary" className="w-full mt-6">
              Ir a iniciar sesión
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#2b3240] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-3xl font-bold">
            <span className="text-white">Hato</span><span className="text-[#3dbf5e]">Smart</span>
          </span>
          <p className="text-gray-400 text-sm mt-2">Es gratis para empezar</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Nombre completo" error={errors.full_name?.message}>
            <input
              type="text"
              placeholder="Juan Pérez"
              className={inputCls(!!errors.full_name)}
              {...register('full_name')}
            />
          </Field>

          <Field label="Correo electrónico" error={errors.email?.message}>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              className={inputCls(!!errors.email)}
              {...register('email')}
            />
          </Field>

          <Field label="Contraseña" error={errors.password?.message}>
            <input
              type="password"
              placeholder="Mínimo 8 caracteres"
              className={inputCls(!!errors.password)}
              {...register('password')}
            />
            <ul className="flex flex-col gap-1 mt-1">
              {PWD_RULES.map(({ label, test }) => {
                const ok = test(pwdValue)
                return (
                  <li key={label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-[#3dbf5e]' : 'text-gray-400'}`}>
                    <span>{ok ? '✓' : '✗'}</span>{label}
                  </li>
                )
              })}
            </ul>
          </Field>

          <Field label="Confirmar contraseña" error={errors.confirm_password?.message}>
            <input
              type="password"
              placeholder="••••••••"
              className={inputCls(!!errors.confirm_password)}
              {...register('confirm_password')}
            />
          </Field>

          {serverError && (
            <p className="text-red-400 text-sm text-center bg-red-900/20 rounded-lg px-3 py-2">
              {serverError}
            </p>
          )}

          <Button type="submit" loading={isSubmitting} className="w-full mt-2">
            Crear cuenta
          </Button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-[#3dbf5e] font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
