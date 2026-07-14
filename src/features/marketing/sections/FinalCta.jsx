import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Button from '../../../components/ui/Button'

export default function FinalCta() {
  return (
    <section className="bg-brand-green py-16 lg:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Tu finca no espera — y llevarla al día tampoco debería costarte tiempo
        </h2>
        <p className="mt-3 text-white/85">
          Crea tu cuenta gratis hoy y ten tus primeros animales cargados en minutos.
        </p>
        <div className="mt-7">
          <Button asChild size="lg" className="bg-white text-brand-green hover:bg-white/90">
            <Link to="/registro">
              Empieza gratis <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
