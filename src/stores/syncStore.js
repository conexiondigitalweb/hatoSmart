import { create } from 'zustand'

export const useSyncStore = create((set) => ({
  status: 'synced', // 'synced' | 'pending' | 'error' | 'offline'
  pendingCount: 0,
  lastSyncAt: null,
  setStatus: (status) => set({ status }),
  setPendingCount: (count) =>
    set({ pendingCount: count, status: count > 0 ? 'pending' : 'synced' }),
  setSynced: () => set({ status: 'synced', pendingCount: 0, lastSyncAt: new Date() }),
  setError: () => set({ status: 'error' }),
  setOffline: () => set({ status: 'offline' }),
}))
