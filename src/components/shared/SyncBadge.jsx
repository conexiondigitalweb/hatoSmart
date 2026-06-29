import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { useSyncStore } from '../../stores/syncStore'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { cn } from '../../lib/utils'

const STATUS_CONFIG = {
  synced:  { icon: CheckCircle2, cls: 'text-brand-green',      label: null },
  pending: { icon: RefreshCw,     cls: 'text-amber-500 animate-spin', label: (n) => `${n}` },
  error:   { icon: AlertCircle,   cls: 'text-destructive',     label: null },
  offline: { icon: CloudOff,      cls: 'text-muted-foreground', label: null },
}

export default function SyncBadge() {
  const status = useSyncStore((s) => s.status)
  const pendingCount = useSyncStore((s) => s.pendingCount)
  useOnlineStatus()

  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.synced
  const Icon = cfg.icon
  const label = cfg.label ? cfg.label(pendingCount) : null

  return (
    <div className={cn('flex items-center gap-1.5 text-xs font-medium', cfg.cls)}>
      <Icon className="w-4 h-4" />
      {label && (
        <span className="min-w-[18px] h-[18px] rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center px-1">
          {label}
        </span>
      )}
    </div>
  )
}
