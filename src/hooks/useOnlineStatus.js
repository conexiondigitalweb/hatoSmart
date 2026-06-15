import { useEffect } from 'react'
import { useSyncStore } from '../stores/syncStore'

export function useOnlineStatus() {
  const setOffline = useSyncStore((s) => s.setOffline)
  const setStatus = useSyncStore((s) => s.setStatus)
  const pendingCount = useSyncStore((s) => s.pendingCount)

  useEffect(() => {
    const handleOnline = () => setStatus(pendingCount > 0 ? 'pending' : 'synced')
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
