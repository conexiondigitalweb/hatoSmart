import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Button from '../../components/ui/Button'
import { cn } from '../../lib/utils'

const schema = z.object({
  email: z.string().min(1, 'Ingresa tu correo').email('Correo inválido'),
})

const fieldCls = (hasError) =>
  cn(
    'w-full h-12 px-4 rounded-xl border bg-white text-sm text-foreground placeholder:text-muted-foreground',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow',
    hasError ? 'border-destructive' : 'border-border'
  )

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
  })

  const onSubmit = async ({ email }) => {
    setServerError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/restablecer-contrasena`,
    })
    // Supabase doesn't error when the email simply doesn't exist — only a
    // real failure (rate limit, network) reaches this branch — so showing
    // it here doesn't leak whether an account exists.
    if (error) {
      setServerError(error.message)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 flex flex-col items-center justify-center p-6">
        <div className="bg-card rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-9 h-9 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Revisa tu correo</h2>
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
            Si el correo existe en HatoSmart, te llegará un enlace para restablecer tu contraseña.
          </p>
          <Link to="/login" className="block mt-6">
            <Button variant="outline" className="w-full">Volver a iniciar sesión</Button>
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
          <h2 className="text-lg font-semibold text-foreground mb-2">¿Olvidaste tu contraseña?</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Ingresa tu correo y te enviaremos un enlace para restablecerla.
          </p>

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

            {serverError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-center">
                {serverError}
              </div>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full mt-1">
              Enviar enlace
            </Button>
          </form>
        </div>

        <p className="text-center text-muted-foreground text-sm mt-5">
          <Link to="/login" className="text-brand-green font-semibold hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
