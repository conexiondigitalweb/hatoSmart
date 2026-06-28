import { create } from 'zustand'

export const useFarmStore = create((set) => ({
  activeFarm: null,
  farms: [],

  setActiveFarm: (farm) => {
    set({ activeFarm: farm })
    // Pull latest data from Supabase into Dexie whenever a farm is activated
    if (farm?.id) {
      import('../lib/sync/engine').then(({ pullFromSupabase }) =>
        pullFromSupabase(farm.id)
      )
    }
  },

  setFarms: (farms) => set({ farms }),
  addFarm: (farm) => set((state) => ({ farms: [...state.farms, farm] })),
  clearFarms: () => set({ activeFarm: null, farms: [] }),
}))
