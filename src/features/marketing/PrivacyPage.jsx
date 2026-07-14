import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

// Placeholder — el contenido legal real se redacta en una sesión aparte.
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-green mb-8">
        <ArrowLeft className="w-4 h-4" /> Volver al inicio
      </Link>
      <h1 className="text-2xl font-bold text-foreground mb-2">Política de privacidad</h1>
      <p className="text-muted-foreground max-w-sm">
        Próximamente. Estamos redactando el contenido legal completo — vuelve pronto.
      </p>
    </div>
  )
}
