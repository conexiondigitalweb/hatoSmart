import { Quote } from 'lucide-react'

// Placeholder de testimonios — a propósito SIN nombres ni citas inventadas.
// Reemplazar cada tarjeta cuando haya testimonios reales de ganaderos que
// usen HatoSmart (nombre, finca/vereda y una cita corta y real).
const PLACEHOLDER_COUNT = 2

export default function SocialProof() {
  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Lo que dicen los ganaderos</h2>
          <p className="mt-3 text-muted-foreground">
            Estamos reuniendo las primeras historias de fincas que ya usan HatoSmart.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border-2 border-dashed border-border bg-muted p-6 flex flex-col gap-4"
            >
              <Quote className="w-6 h-6 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground italic">
                Aquí irá el testimonio real de un ganadero que use HatoSmart — su cita textual sobre cómo le cambió el día a día de la finca.
              </p>
              <div className="flex items-center gap-3 mt-auto">
                <div className="w-10 h-10 rounded-full bg-border flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-3 w-28 rounded bg-border" />
                  <div className="h-2.5 w-20 rounded bg-border/70 mt-1.5" />
                </div>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground/70 text-center">
                {'{{TESTIMONIO_' + (i + 1) + '}}'} — pendiente
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
