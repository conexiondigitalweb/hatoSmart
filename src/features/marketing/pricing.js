// Datos y cálculo de precios para PricingSection — colocado junto a la
// landing (no en src/lib/rules) porque es contenido de marketing, no
// lógica de negocio de la app (no se sincroniza con farms/accounts).
export const BILLING_PERIODS = [
  { id: 'mensual', label: 'Mensual', months: 1, discount: 0 },
  { id: 'trimestral', label: 'Trimestral', months: 3, discount: 0.10 },
  { id: 'semestral', label: 'Semestral', months: 6, discount: 0.18 },
  { id: 'anual', label: 'Anual', months: 12, discount: 0.28 },
]

export const PLANS = [
  {
    id: 'gratis',
    name: 'Gratis',
    tagline: 'Para arrancar y perderle el miedo al celular',
    basePrice: 0,
    highlighted: false,
    features: ['Hasta 19 animales', '1 usuario', 'Todos los módulos', 'Sin acceso a Reportes'],
    cta: 'Empieza gratis',
  },
  {
    id: 'operativo',
    name: 'Operativo',
    tagline: 'Para el día a día de la finca',
    basePrice: 39900,
    highlighted: true,
    features: ['Animales ilimitados', 'Hasta 3 usuarios', 'Todos los módulos', 'Incluye Reportes'],
    cta: 'Elegir Operativo',
  },
  {
    id: 'finca-plus',
    name: 'Finca+',
    tagline: 'Para operaciones más grandes o con varios encargados',
    basePrice: 79900,
    highlighted: false,
    features: ['Animales ilimitados', 'Usuarios ilimitados', 'Todos los módulos', 'Reportes avanzados y exportables'],
    cta: 'Elegir Finca+',
  },
]

export function formatCOP(value) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
}

// Precio mensual equivalente con el descuento del período (redondeado a la
// decena para que no queden cifras raras), total facturado en ese período,
// y el ahorro en pesos frente a pagar mes a mes al precio lleno.
export function calcPricing(basePrice, period) {
  if (!basePrice) return { monthly: 0, totalForPeriod: 0, savings: 0 }
  const monthly = Math.round((basePrice * (1 - period.discount)) / 10) * 10
  const totalForPeriod = monthly * period.months
  const fullTotal = basePrice * period.months
  const savings = fullTotal - totalForPeriod
  return { monthly, totalForPeriod, savings }
}
