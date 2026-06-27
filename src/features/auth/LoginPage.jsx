import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { useFarmStore } from '../../stores/farmStore'
import Button from '../../components/ui/Button'

const schema = z.object({
  email: z.string().min(1, 'Ingresa tu correo').email('Correo inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

const inputCls = (hasError) =>
  `w-full min-h-[48px] px-4 py-3 rounded-xl border bg-white text-[#2b3240] text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3dbf5e] transition-shadow ${
    hasError ? 'border-red-400' : 'border-gray-200'
  }`

export default function LoginPage() {
  const navigate = useNavigate()
  const setFarms = useFarmStore((s) => s.setFarms)
  const setActiveFarm = useFarmStore((s) => s.setActiveFarm)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
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
    <div className="min-h-screen bg-[#2b3240] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-3xl font-bold">
            <span className="text-white">Hato</span><span className="text-[#3dbf5e]">Smart</span>
          </span>
          <p className="text-gray-400 text-sm mt-2">Gestión ganadera inteligente</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-300">Correo electrónico</label>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              className={inputCls(!!errors.email)}
              {...register('email')}
            />
            {errors.email && <span className="text-xs text-red-400">{errors.email.message}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-300">Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              className={inputCls(!!errors.password)}
              {...register('password')}
            />
            {errors.password && <span className="text-xs text-red-400">{errors.password.message}</span>}
          </div>

          {serverError && (
            <p className="text-red-400 text-sm text-center bg-red-900/20 rounded-lg px-3 py-2">
              {serverError}
            </p>
          )}

          <Button type="submit" loading={isSubmitting} className="w-full mt-2">
            Iniciar sesión
          </Button>

          <button
            type="button"
            onClick={() => alert('Funcionalidad próximamente')}
            className="text-center text-gray-400 text-sm w-full mt-1 hover:text-gray-300"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="text-[#3dbf5e] font-medium">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
