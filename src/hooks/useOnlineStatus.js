import { useEffect } from 'react'
import { useSyncStore } from '../stores/syncStore'

export function useOnlineStatus() {
  const setOffline = useSyncStore((s) => s.setOffline)
  const setStatus = useSyncStore((s) => s.setStatus)
  const pendingCount = useSyncStore((s) => s.pendingCount)

  useEffect(() => {
    const handleOnline = async () => {
      setStatus(pendingCount > 0 ? 'pending' : 'synced')
      if (pendingCount > 0) {
        console.log('[Sync] Back online — flushing pending queue…')
        const { runSync } = await import('../lib/sync/engine')
        runSync().catch(() => {})
      }
    }
    const handleOffline = () => setOffline()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    if (!navigator.onLine) setOffline()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [pendingCount, setOffline, setStatus])

  return navigator.onLine
}
