import { create } from 'zustand'
import { supabase } from '../lib/supabase'

async function loadFarmsForUser(userId) {
  if (!userId) return

  const { useFarmStore } = await import('./farmStore')

  const { data, error } = await supabase
    .from('memberships')
    .select('farm_id, role, farms(*)')
    .eq('user_id', userId)

  if (error || !data?.length) return

  const farms = data.map((m) => m.farms ? { ...m.farms, role: m.role } : null).filter(Boolean)
  if (!farms.length) return

  useFarmStore.getState().setFarms(farms)

  // Restore previously active farm from localStorage, or default to first
  const stored = localStorage.getItem('hs_active_farm_id')
  const preferred = stored ? farms.find((f) => f.id === stored) : null
  const activeFarm = preferred ?? farms[0]
  useFarmStore.getState().setActiveFarm(activeFarm)

  // setActiveFarm triggers pullFromSupabase via dynamic import, but we also
  // call it explicitly here to guarantee pull on every app init/reload,
  // not just on login. Fire-and-forget — doesn't block the loading state.
  if (activeFarm?.id) {
    console.log(`[Session] Triggering pull on init for farm ${activeFarm.id}`)
    import('../lib/sync/engine').then(({ pullFromSupabase }) =>
      pullFromSupabase(activeFarm.id)
    )
  }
}

export const useSessionStore = create((set) => ({
  user: null,
  session: null,
  loading: true,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  clearSession: () => set({ user: null, session: null, loading: false }),

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      set({ session, user: session.user })
      await loadFarmsForUser(session.user.id)
    }

    set({ loading: false })

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session, user: session?.user ?? null })
      if (session?.user) {
        await loadFarmsForUser(session.user.id)
      } else {
        const { useFarmStore } = await import('./farmStore')
        useFarmStore.getState().clearFarms()
      }
      set({ loading: false })
    })
  },
}))
