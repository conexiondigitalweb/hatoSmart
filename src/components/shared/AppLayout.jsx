import { useEffect } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { useFarmStore } from '../../stores/farmStore'
import BottomNav from '../ui/BottomNav'
import SyncBadge from './SyncBadge'

// Same brand green as the manifest/index.html default (vite.config.js,
// index.html <meta name="theme-color">) — used to restore the browser/PWA
// status bar color when there's no active farm, or after leaving AppLayout.
const DEFAULT_THEME_COLOR = '#16a34a'

export default function AppLayout() {
  const activeFarm = useFarmStore((s) => s.activeFarm)
  const accentColor = activeFarm?.accent_color || DEFAULT_THEME_COLOR

  // Mirrors the farm's accent color onto the actual browser/PWA chrome
  // (status bar, address bar tint on Android Chrome), not just the header
  // border — same reasoning as the border: a glance should be enough to
  // tell which farm you're in. The manifest.json theme_color stays fixed
  // (it's static, only read at install time) — this updates the live
  // <meta name="theme-color"> tag instead.
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', accentColor)
  }, [accentColor])

  useEffect(() => {
    return () => {
      const meta = document.querySelector('meta[name="theme-color"]')
      if (meta) meta.setAttribute('content', DEFAULT_THEME_COLOR)
    }
  }, [])

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
