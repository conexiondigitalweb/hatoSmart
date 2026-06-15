import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export default function SignupPage() {
  const navigate = useNavigate()
  const { register, handleSubmit } = useForm()

  const onSubmit = () => {
    // TODO: supabase.auth.signUp
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#2b3240] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl">🐄</span>
          <h1 className="text-white text-2xl font-bold mt-3">HatoSmart</h1>
          <p className="text-gray-400 text-sm">Crea tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Nombre completo" placeholder="Juan Pérez" {...register('name')} />
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="correo@ejemplo.com"
            {...register('email')}
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="Mínimo 8 caracteres"
            {...register('password')}
          />
          <Button type="submit" className="w-full mt-2">
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
