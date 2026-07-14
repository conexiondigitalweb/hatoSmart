import { UserPlus, Upload, ClipboardList, BellRing } from 'lucide-react'

const STEPS = [
  {
    icon: UserPlus,
    title: 'Crea tu cuenta gratis',
    body: 'Sin tarjeta de crédito. En dos minutos tienes tu finca configurada.',
  },
  {
    icon: Upload,
    title: 'Carga tus animales',
    body: 'Uno por uno, o de una vez importando tu Excel — no vuelves a digitar lo que ya tienes.',
  },
  {
    icon: ClipboardList,
    title: 'Registra el día a día',
    body: 'Ordeño, pesajes, sanidad, reproducción — cada uno en menos de un minuto, desde el potrero.',
  },
  {
    icon: BellRing,
    title: 'Recibe alertas automáticas',
    body: 'HatoSmart avisa cuándo pesar, vacunar o esperar un parto — vos solo revisas y actúas.',
  },
]

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-background py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Cómo funciona</h2>
          <p className="mt-3 text-muted-foreground">Cuatro pasos, y ya estás llevando tu finca desde el celular.</p>
        </div>

        <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {/* Línea conectora — solo visible en desktop, detrás de los círculos */}
          <div className="hidden lg:block absolute top-7 left-[12.5%] right-[12.5%] h-0.5 bg-border -z-0" />

          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 w-14 h-14 rounded-full bg-brand-green text-white flex items-center justify-center shadow-sm">
                <Icon className="w-6 h-6" />
              </div>
              <span className="mt-3 text-xs font-bold text-brand-green">PASO {i + 1}</span>
              <h3 className="mt-1 font-semibold text-foreground">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-[220px]">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
