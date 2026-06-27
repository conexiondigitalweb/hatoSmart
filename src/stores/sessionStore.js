import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useSessionStore = create((set) => ({
  user: null,
  session: null,
  loading: true,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  clearSession: () => set({ user: null, session: null, loading: false }),

  // Call once at app startup (e.g. in App.jsx)
  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ session, user: session?.user ?? null, loading: false })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, loading: false })
    })
  },
}))
