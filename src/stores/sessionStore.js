import { create } from 'zustand'

export const useSessionStore = create((set) => ({
  user: null,
  session: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  clearSession: () => set({ user: null, session: null }),
}))
