import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Uncaught render error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-background">
          <p className="text-4xl">⚠️</p>
          <h1 className="text-lg font-bold text-foreground">Algo salió mal</h1>
          <p className="text-sm text-muted-foreground max-w-xs">
            Ocurrió un error inesperado en la app. Intenta recargar — si el problema persiste, avísale al equipo de soporte.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="h-11 px-6 rounded-xl bg-brand-green text-white text-sm font-semibold active:scale-95 transition-transform"
          >
            Recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
