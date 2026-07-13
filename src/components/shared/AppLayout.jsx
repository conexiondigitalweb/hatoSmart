import { Outlet, Link } from 'react-router-dom'
import { useFarmStore } from '../../stores/farmStore'
import BottomNav from '../ui/BottomNav'
import SyncBadge from './SyncBadge'

export default function AppLayout() {
  const activeFarm = useFarmStore((s) => s.activeFarm)
  const accentColor = activeFarm?.accent_color || '#16a34a'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Bottom border in the farm's accent color — the clearest signal,
          without a full header redesign, that you switched farms via
          FarmSelector. Matters most for a worker/admin on multiple farms:
          a glance at the header should be enough to know which farm a new
          record would be saved to. */}
      <header
        className="bg-card px-4 h-14 flex items-center justify-between sticky top-0 z-40 shadow-sm"
        style={{ borderBottom: `3px solid ${accentColor}` }}
      >
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <img src="/apple-touch-icon.png" alt="HatoSmart" className="w-8 h-8 rounded-lg flex-shrink-0" />
          <div className="flex flex-col min-w-0 leading-tight">
            <span className="text-xl font-bold tracking-tight">
              <span className="text-foreground">Hato</span>
              <span className="text-brand-green">Smart</span>
            </span>
            {activeFarm && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: accentColor }}
                />
                <span className="truncate">{activeFarm.name}</span>
              </span>
            )}
          </div>
        </Link>
        <SyncBadge />
      </header>

      <main className="flex-1 overflow-y-auto pb-24 animate-fade-in">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
