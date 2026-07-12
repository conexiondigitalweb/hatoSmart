import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { toast } from 'sonner'

export default function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      // Check for a new service worker every hour so installed PWAs
      // (which rarely reload on their own) eventually notice updates.
      setInterval(() => registration.update(), 60 * 60 * 1000)
    },
  })

  useEffect(() => {
    if (!needRefresh) return
    toast('Nueva versión disponible', {
      description: 'Actualiza para obtener las últimas mejoras.',
      duration: Infinity,
      action: {
        label: 'Actualizar',
        onClick: () => updateServiceWorker(true),
      },
    })
  }, [needRefresh, updateServiceWorker])

  return null
}
