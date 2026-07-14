import { Beef, Milk, Scale, Syringe, HeartPulse, Bell } from 'lucide-react'
import ImagePlaceholder from '../ImagePlaceholder'

const MODULES = [
  {
    icon: Beef,
    name: 'Animales',
    benefit: 'La ficha completa de cada animal, siempre a la mano.',
    placeholder: 'ILLUSTRATION_MODULO_ANIMALES',
  },
  {
    icon: Milk,
    name: 'Ordeño',
    benefit: 'Registra la producción de hoy en segundos, por vaca o por hato.',
    placeholder: 'ILLUSTRATION_MODULO_ORDENO',
  },
  {
    icon: Scale,
    name: 'Pesajes',
    benefit: 'Mira la ganancia de peso real, no la que crees que tienen.',
    placeholder: 'ILLUSTRATION_MODULO_PESAJES',
  },
  {
    icon: Syringe,
    name: 'Sanidad',
    benefit: 'Vacunas, tratamientos y próximas dosis, sin adivinar fechas.',
    placeholder: 'ILLUSTRATION_MODULO_SANIDAD',
  },
  {
    icon: HeartPulse,
    name: 'Reproducción',
    benefit: 'Servicios, preñeces y partos bajo control, con alertas de celo.',
    placeholder: 'ILLUSTRATION_MODULO_REPRODUCCION',
  },
  {
    icon: Bell,
    name: 'Alertas',
    benefit: 'HatoSmart te avisa antes de que se te pase algo importante.',
    placeholder: 'ILLUSTRATION_MODULO_ALERTAS',
  },
]

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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map(({ icon: Icon, name, benefit, placeholder }) => (
            <div key={name} className="bg-card rounded-2xl shadow-sm overflow-hidden flex flex-col">
              {/* Placeholder de ilustración de Canva por módulo — ver mapa de
                  placeholders en LandingPage.jsx */}
              <ImagePlaceholder
                token={placeholder}
                hint="Ilustración estilo Canva · 4:3"
                className="aspect-[4/3] rounded-none border-0 border-b border-border"
              />
              <div className="p-5">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-brand-green" />
                  </div>
                  <h3 className="font-semibold text-foreground">{name}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{benefit}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
