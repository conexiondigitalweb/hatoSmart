import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export default function LoginPage() {
  const navigate = useNavigate()
  const { register, handleSubmit } = useForm()

  const onSubmit = () => {
    // TODO: supabase.auth.signInWithPassword
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#2b3240] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl">🐄</span>
          <h1 className="text-white text-2xl font-bold mt-3">HatoSmart</h1>
          <p className="text-gray-400 text-sm">Gestión ganadera inteligente</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="correo@ejemplo.com"
            {...register('email')}
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            {...register('password')}
          />
          <Button type="submit" className="w-full mt-2">
            Iniciar sesión
          </Button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="text-[#3dbf5e] font-medium">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
