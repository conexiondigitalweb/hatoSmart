import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { useFarmStore } from '../../stores/farmStore'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

const schema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const setFarms = useFarmStore((s) => s.setFarms)
  const setActiveFarm = useFarmStore((s) => s.setActiveFarm)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email, password }) => {
    setServerError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setServerError('Correo o contraseña incorrectos.')
      } else {
        setServerError(error.message)
      }
      return
    }

    // Load farms for this user
    const { data: memberships } = await supabase
      .from('memberships')
      .select('farm_id, role, farms(*)')
      .eq('user_id', (await supabase.auth.getUser()).data.user.id)

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
          <div className="flex items-center justify-center gap-2 mb-1">
            <img src="/apple-touch-icon.png" alt="HatoSmart" className="w-10 h-10" />
            <span className="text-2xl font-bold">
              <span className="text-[#2b3240]">Hato</span><span className="text-[#3dbf5e]">Smart</span>
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-1">Gestión ganadera inteligente</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
            placeholder="••••••••"
            error={errors.password?.message}
            className="bg-white"
            {...register('password')}
          />

          {serverError && (
            <p className="text-red-400 text-sm text-center bg-red-900/20 rounded-lg px-3 py-2">
              {serverError}
            </p>
          )}

          <Button type="submit" loading={isSubmitting} className="w-full mt-2">
            Iniciar sesión
          </Button>
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
