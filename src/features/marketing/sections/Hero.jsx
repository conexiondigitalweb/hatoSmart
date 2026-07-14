import { Link } from 'react-router-dom'
import { ArrowRight, Play } from 'lucide-react'
import Button from '../../../components/ui/Button'
import ImagePlaceholder from '../ImagePlaceholder'

export default function Hero() {
  return (
    <section className="relative bg-brand-dark overflow-hidden">
      {/* Decorative circles — same motif as the animal detail hero header,
          ties the landing back to the app's own visual language */}
      <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-brand-green/10" />
      <div className="absolute -left-16 bottom-0 w-72 h-72 rounded-full bg-brand-green/10" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 lg:pt-12 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Deja la libreta.
              <br />
              <span className="text-brand-green">Controla tu finca</span> desde el celular.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-white/80 max-w-xl mx-auto lg:mx-0">
              HatoSmart lleva el registro de tus animales, ordeño, pesajes, sanidad y reproducción en un solo lugar —
              sin depender de la memoria, del papel ni de internet para anotar lo de hoy. Funciona incluso sin señal.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/registro">
                  Empieza gratis <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto bg-transparent border-white/30 text-white hover:bg-white/10">
                <a href="#como-funciona">
                  <Play className="w-4 h-4" /> Ver cómo funciona
                </a>
              </Button>
            </div>

            <p className="mt-4 text-xs text-white/50">
              Gratis hasta 19 animales · Sin tarjeta de crédito · Funciona sin internet
            </p>
          </div>

          <div>
            {/* {{HERO_IMAGE}} — foto real de finca/ganado colombiano o corral,
                idealmente con el celular/app en primer plano. Aspect ratio
                ideal 4:3 o 1:1, mínimo 1200×900px, buena luz natural. */}
            <ImagePlaceholder
              token="HERO_IMAGE"
              hint="Foto de finca/ganado con el celular en primer plano · 4:3 · mín. 1200×900px"
              dark
              className="aspect-[4/3] lg:aspect-square"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
