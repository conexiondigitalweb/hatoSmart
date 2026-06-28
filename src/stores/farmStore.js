import { create } from 'zustand'

export const useFarmStore = create((set) => ({
  activeFarm: null,
  farms: [],

  setActiveFarm: (farm) => {
    set({ activeFarm: farm })
    if (farm?.id) {
      localStorage.setItem('hs_active_farm_id', farm.id)
      import('../lib/sync/engine').then(({ pullFromSupabase }) =>
        pullFromSupabase(farm.id)
      )
    }
  },

  setFarms: (farms) => set({ farms }),
  addFarm: (farm) => set((state) => ({ farms: [...state.farms, farm] })),
  clearFarms: () => set({ activeFarm: null, farms: [] }),
}))
