import { useTranslation } from 'react-i18next'
import { useSyncStore } from '../../stores/syncStore'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

const badgeConfig = {
  synced: { emoji: '✅', key: 'sync.synced', className: 'bg-green-50 text-green-700' },
  pending: { emoji: '⏳', key: 'sync.pending', className: 'bg-yellow-50 text-yellow-700' },
  error: { emoji: '❌', key: 'sync.error', className: 'bg-red-50 text-red-700' },
  offline: { emoji: '📵', key: 'sync.offline', className: 'bg-gray-100 text-gray-600' },
}

export default function SyncBadge() {
  const { t } = useTranslation()
  const status = useSyncStore((s) => s.status)
  const pendingCount = useSyncStore((s) => s.pendingCount)
  useOnlineStatus()

  const cfg = badgeConfig[status] ?? badgeConfig.synced

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.emoji}{' '}
      {status === 'pending'
        ? t(cfg.key, { count: pendingCount })
        : t(cfg.key)}
    </span>
  )
}
