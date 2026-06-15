import { Outlet } from 'react-router-dom'
import BottomNav from '../ui/BottomNav'
import SyncBadge from './SyncBadge'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      <header className="bg-white px-4 py-2 flex items-center justify-between border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <img src="/apple-touch-icon.png" alt="HatoSmart" className="w-10 h-10" />
          <span className="text-xl font-bold">
            <span className="text-[#2b3240]">Hato</span><span className="text-[#3dbf5e]">Smart</span>
          </span>
        </div>
        <SyncBadge />
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
