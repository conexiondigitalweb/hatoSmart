import { Beef, Milk, Scale, Syringe, HeartPulse, Bell } from 'lucide-react'
import { cn } from '../../../lib/utils'

// Orden fijo: Animales, Ordeño, Pesaje, Sanidad, Reproducción, Alertas —
// coincide con el orden de los assets modulo-*.webp y con la rotación
// alternada de abajo (una por índice, no aleatoria, para que quede estable
// entre reloads en vez de "temblar" cada vez que React re-renderiza).
const MODULES = [
  {
    icon: Beef,
    name: 'Animales',
    benefit: 'La ficha completa de cada animal, siempre a la mano.',
    image: '/images/landing/modulo-animales.webp',
  },
  {
    icon: Milk,
    name: 'Ordeño',
    benefit: 'Registra la producción de hoy en segundos, por vaca o por hato.',
    image: '/images/landing/modulo-ordeno.webp',
  },
  {
    icon: Scale,
    name: 'Pesajes',
    benefit: 'Mira la ganancia de peso real, no la que crees que tienen.',
    image: '/images/landing/modulo-pesaje.webp',
  },
  {
    icon: Syringe,
    name: 'Sanidad',
    benefit: 'Vacunas, tratamientos y próximas dosis, sin adivinar fechas.',
    image: '/images/landing/modulo-sanidad.webp',
  },
  {
    icon: HeartPulse,
    name: 'Reproducción',
    benefit: 'Servicios, preñeces y partos bajo control, con alertas de celo.',
    image: '/images/landing/modulo-reproduccion.webp',
  },
  {
    icon: Bell,
    name: 'Alertas',
    benefit: 'HatoSmart te avisa antes de que se te pase algo importante.',
    image: '/images/landing/modulo-alertas.webp',
  },
]

// Rotación alternada por tarjeta (estética "polaroid pegada en la pared" —
// evita que se vea como una cuadrícula perfectamente alineada).
const ROTATIONS = ['-rotate-[3deg]', 'rotate-[2deg]', '-rotate-[2deg]', 'rotate-[3deg]', '-rotate-[2deg]', 'rotate-[2deg]']

export default function SolutionSection() {
  return (
    <section className="bg-muted/40 py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Todo lo que hoy anotas en la libreta, en un solo lugar
          </h2>
          <p className="mt-3 text-muted-foreground">
            Seis módulos pensados para el día a día de una finca real, no para llenar formularios.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-14 lg:gap-y-16">
          {MODULES.map(({ icon: Icon, name, benefit, image }, i) => (
            <div key={name} className="flex flex-col items-center text-center">
              <div
                className={cn(
                  'w-full max-w-[280px] transition-transform duration-300 ease-out hover:rotate-0 hover:scale-105',
                  ROTATIONS[i]
                )}
              >
                <img
                  src={image}
                  alt={`Módulo ${name} de HatoSmart`}
                  width={800}
                  height={1000}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto drop-shadow-xl"
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Icon className="w-4 h-4 text-brand-green flex-shrink-0" />
                <h3 className="font-semibold text-foreground">{name}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1 max-w-[240px]">{benefit}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
