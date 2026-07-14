// Landing pública de HatoSmart — se muestra en "/" a cualquier visitante
// SIN sesión activa (ver PrivateRoute.jsx: un usuario ya autenticado nunca
// llega aquí, sigue directo a su dashboard como siempre). Reachable también
// desde el catch-all de App.jsx, así que cualquier ruta rota para un
// visitante sin sesión termina aquí en vez de en un 404.
//
// ── Mapa de placeholders visuales (reemplazar cuando haya assets reales) ──
// Cada uno se ve en pantalla como el texto literal {{TOKEN}} dentro de un
// recuadro punteado (componente ImagePlaceholder.jsx), no solo en un
// comentario de código — así es imposible perderlo al revisar la página.
//
//   {{HERO_IMAGE}}                      → sections/Hero.jsx
//     Foto real de finca/ganado colombiano, celular en primer plano si se
//     puede. Aspect ratio 4:3 (1:1 en desktop), mínimo 1200×900px.
//
//   {{ILLUSTRATION_MODULO_ANIMALES}}     → sections/SolutionSection.jsx
//   {{ILLUSTRATION_MODULO_ORDENO}}       → sections/SolutionSection.jsx
//   {{ILLUSTRATION_MODULO_PESAJES}}      → sections/SolutionSection.jsx
//   {{ILLUSTRATION_MODULO_SANIDAD}}      → sections/SolutionSection.jsx
//   {{ILLUSTRATION_MODULO_REPRODUCCION}} → sections/SolutionSection.jsx
//   {{ILLUSTRATION_MODULO_ALERTAS}}      → sections/SolutionSection.jsx
//     Ilustraciones de Canva, una por módulo, aspect ratio 4:3, mismo
//     estilo/paleta entre las 6 para que se vean como un set.
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
import { ArrowRight } from 'lucide-react'
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/apple-touch-icon.png" alt="HatoSmart" className="w-8 h-8 rounded-lg" />
          <span className="text-lg font-bold text-white">
            Hato<span className="text-brand-green">Smart</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          <a href="#precios" className="hidden sm:block text-sm text-white/70 hover:text-white transition-colors">
            Precios
          </a>
          <Link to="/login" className="text-sm text-white/70 hover:text-white transition-colors px-2">
            Iniciar sesión
          </Link>
          <Button asChild size="sm">
            <Link to="/registro">
              Empieza gratis <ArrowRight className="w-3.5 h-3.5" />
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
