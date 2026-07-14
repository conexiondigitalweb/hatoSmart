import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Sparkles } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { cn } from '../../../lib/utils'
import { BILLING_PERIODS, PLANS, formatCOP, calcPricing } from '../pricing'

export default function PricingSection() {
  const [periodId, setPeriodId] = useState('mensual')
  const period = BILLING_PERIODS.find((p) => p.id === periodId)

  return (
    <section id="precios" className="bg-muted/40 py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Precios simples, sin letra pequeña</h2>
          <p className="mt-3 text-muted-foreground">Empieza gratis. Crece a un plan pago cuando tu finca lo pida, no antes.</p>
        </div>

        {/* Toggle de período */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex flex-wrap justify-center gap-1 bg-card rounded-2xl p-1.5 shadow-sm">
            {BILLING_PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriodId(p.id)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
                  periodId === p.id ? 'bg-brand-green text-white' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {p.label}
                {p.discount > 0 && (
                  <span className={cn('ml-1.5 text-xs', periodId === p.id ? 'text-white/80' : 'text-brand-green')}>
                    -{Math.round(p.discount * 100)}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan) => {
            const { monthly, totalForPeriod, savings } = calcPricing(plan.basePrice, period)
            const isFree = plan.basePrice === 0

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative bg-card rounded-3xl p-6 lg:p-7 flex flex-col',
                  plan.highlighted ? 'shadow-lg ring-2 ring-brand-green' : 'shadow-sm'
                )}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-green text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3" /> Más popular
                  </span>
                )}

                <h3 className="font-bold text-lg text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-0.5 mb-5">{plan.tagline}</p>

                <div className="mb-1">
                  {isFree ? (
                    <span className="text-3xl font-extrabold text-foreground">$0</span>
                  ) : (
                    <>
                      <span className="text-3xl font-extrabold text-foreground">{formatCOP(monthly)}</span>
                      <span className="text-sm text-muted-foreground">/mes</span>
                    </>
                  )}
                </div>

                <div className="h-9 mb-5">
                  {!isFree && period.months > 1 && (
                    <div className="text-xs text-muted-foreground">
                      Facturado {formatCOP(totalForPeriod)} cada {period.months} meses
                      {savings > 0 && (
                        <span className="block text-brand-green font-semibold mt-0.5">
                          Ahorras {formatCOP(savings)} vs. mensual
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <ul className="flex flex-col gap-2.5 mb-7 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button asChild variant={plan.highlighted ? 'primary' : 'outline'} className="w-full">
                  <Link to="/registro">{plan.cta}</Link>
                </Button>
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Precios en pesos colombianos (COP), sin IVA incluido. El período largo se cobra por adelantado.
        </p>
      </div>
    </section>
  )
}
