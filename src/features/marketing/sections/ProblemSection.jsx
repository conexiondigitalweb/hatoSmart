import { TrendingUp, Notebook, AlarmClockOff, ShieldAlert } from 'lucide-react'

const PAIN_POINTS = [
  {
    icon: TrendingUp,
    title: 'El hato crece y el control se pierde',
    body: 'Con 20 animales te los sabes de memoria. Con 80, ya no — y ahí empiezan los errores: servicios repetidos, vacunas dobles, crías sin registrar.',
  },
  {
    icon: Notebook,
    title: 'Todo depende de la libreta (o de la memoria)',
    body: 'Si se moja, se pierde o simplemente no la llenaste ese día, el dato ya no existe. Y si el que lleva la cuenta falta un día, la finca queda a ciegas.',
  },
  {
    icon: AlarmClockOff,
    title: 'Se pasan las fechas importantes',
    body: 'Un pesaje que no se hizo a tiempo, un servicio que no se repitió a los 21 días, una vacuna vencida — nadie se acuerda de todo, todos los días.',
  },
  {
    icon: ShieldAlert,
    title: 'No hay trazabilidad cuando la piden',
    body: 'El ICA, un comprador o un programa de certificación te pide el historial de un animal — y armar eso a mano, de memoria, es casi imposible.',
  },
]

export default function ProblemSection() {
  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            ¿Te suena familiar?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Son los mismos problemas que le pasan a cualquier finca que todavía lleva el control en papel o de memoria.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {PAIN_POINTS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-card rounded-2xl shadow-sm p-6 flex gap-4">
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
