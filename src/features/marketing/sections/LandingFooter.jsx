import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'

// Sin redes sociales todavía — agregar íconos aquí cuando existan cuentas
// reales de HatoSmart (Instagram/Facebook/etc). No inventar handles.
export default function LandingFooter() {
  return (
    <footer className="bg-brand-dark py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src="/apple-touch-icon.png" alt="HatoSmart" className="w-8 h-8 rounded-lg" />
            <span className="text-lg font-bold text-white">
              Hato<span className="text-brand-green">Smart</span>
            </span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/60">
            <Link to="/terminos" className="hover:text-white transition-colors">Términos y condiciones</Link>
            <Link to="/privacidad" className="hover:text-white transition-colors">Política de privacidad</Link>
            {/* Placeholder de contacto — reemplazar por la bandeja de soporte real */}
            <a href="mailto:hola@hatosmart.com" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> hola@hatosmart.com
            </a>
          </nav>
        </div>

        <p className="text-center sm:text-left text-xs text-white/40 mt-6">
          © {new Date().getFullYear()} HatoSmart. Gestión ganadera inteligente, hecha para Colombia.
        </p>
      </div>
    </footer>
  )
}
