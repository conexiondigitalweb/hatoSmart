import { Outlet, Link } from 'react-router-dom'
import BottomNav from '../ui/BottomNav'
import SyncBadge from './SyncBadge'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card px-4 h-14 flex items-center justify-between border-b border-border sticky top-0 z-40 shadow-sm">
        <Link to="/" className="flex items-center gap-2">
          <img src="/apple-touch-icon.png" alt="HatoSmart" className="w-8 h-8 rounded-lg" />
          <span className="text-xl font-bold tracking-tight">
            <span className="text-foreground">Hato</span>
            <span className="text-brand-green">Smart</span>
          </span>
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
