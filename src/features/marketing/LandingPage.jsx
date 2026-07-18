// Landing pública de HatoSmart — se muestra en "/" a cualquier visitante
// SIN sesión activa (ver PrivateRoute.jsx: un usuario ya autenticado nunca
// llega aquí, sigue directo a su dashboard como siempre). Reachable también
// desde el catch-all de App.jsx, así que cualquier ruta rota para un
// visitante sin sesión termina aquí en vez de en un 404.
//
// ── Mapa de placeholders visuales ──────────────────────────────────────────
// Resueltos con assets reales (Sesión 19): {{HERO_IMAGE}} (sections/Hero.jsx
// → public/images/landing/hero-finca.webp) y los 6 {{ILLUSTRATION_MODULO_X}}
// (sections/SolutionSection.jsx → public/images/landing/modulo-*.webp).
// Originales sin optimizar NO se versionan — ver scripts/optimize-landing-images.mjs
// para regenerar los .webp si algún día llegan reemplazos.
//
// Todavía pendientes (se ven en pantalla como el texto literal {{TOKEN}}
// dentro de una tarjeta con borde punteado, no solo en este comentario):
//
//   {{TESTIMONIO_1}}, {{TESTIMONIO_2}}   → sections/SocialProof.jsx
//     No son imágenes — son tarjetas de texto completas (nombre, finca,
//     cita) a reemplazar cuando haya testimonios reales. No se inventaron
//     nombres ni citas de personas reales en el placeholder actual.
//
// Adicional, fuera de este componente:
//   og:image en index.html apunta a /apple-touch-icon.png como placeholder
//   funcional — reemplazar por una imagen de 1200×630px pensada para
//   compartir en redes cuando exista.
import { Link } from 'react-router-dom'
import { ArrowRight, LogIn } from 'lucide-react'
import Button from '../../components/ui/Button'
import Hero from './sections/Hero'
import ProblemSection from './sections/ProblemSection'
import SolutionSection from './sections/SolutionSection'
import HowItWorks from './sections/HowItWorks'
import PricingSection from './sections/PricingSection'
import SocialProof from './sections/SocialProof'
import FinalCta from './sections/FinalCta'
import LandingFooter from './sections/LandingFooter'

function LandingNav() {
  return (
    <header className="sticky top-0 z-40 bg-brand-dark/95 backdrop-blur border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 shrink-0 min-w-0">
          <img src="/apple-touch-icon.png" alt="HatoSmart" className="w-8 h-8 rounded-lg shrink-0" />
          <span className="text-lg font-bold text-white whitespace-nowrap">
            Hato<span className="text-brand-green">Smart</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-4 shrink-0">
          <a href="#precios" className="hidden sm:block text-sm text-white/70 hover:text-white transition-colors whitespace-nowrap">
            Precios
          </a>
          <Link
            to="/login"
            aria-label="Iniciar sesión"
            className="hidden sm:block text-sm text-white/70 hover:text-white transition-colors px-2 whitespace-nowrap"
          >
            Iniciar sesión
          </Link>
          <Link
            to="/login"
            aria-label="Iniciar sesión"
            className="sm:hidden flex items-center justify-center w-9 h-9 text-white/70 hover:text-white transition-colors shrink-0"
          >
            <LogIn className="w-5 h-5" />
          </Link>
          <Button asChild size="sm" className="shrink-0 whitespace-nowrap">
            <Link to="/registro">
              Empieza gratis <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <HowItWorks />
        <PricingSection />
        <SocialProof />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  )
}
