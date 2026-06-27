import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

const schema = z.object({
  full_name: z.string().min(1, 'Ingresa tu nombre').min(2, 'Mínimo 2 caracteres'),
  email: z.string().min(1, 'Ingresa tu correo').email('Correo inválido'),
  password: z.string().min(1, 'Ingresa una contraseña').min(8, 'Mínimo 8 caracteres'),
  confirm_password: z.string().min(1, 'Confirma tu contraseña'),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
})

export default function SignupPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  })

  const onSubmit = async ({ full_name, email, password }) => {
    console.log('[SignupPage] onSubmit reached', { full_name, email })
    setServerError('')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        setServerError('Este correo ya está registrado. ¿Quieres iniciar sesión?')
      } else {
        setServerError(error.message)
      }
      return
    }

    // If Supabase requires email confirmation, session will be null
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
          <Input
            label="Nombre completo"
            placeholder="Juan Pérez"
            error={errors.full_name?.message}
            className="bg-white"
            {...register('full_name')}
          />
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="correo@ejemplo.com"
            error={errors.email?.message}
            className="bg-white"
            {...register('email')}
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="Mínimo 8 caracteres"
            error={errors.password?.message}
            className="bg-white"
            {...register('password')}
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            placeholder="••••••••"
            error={errors.confirm_password?.message}
            className="bg-white"
            {...register('confirm_password')}
          />

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
