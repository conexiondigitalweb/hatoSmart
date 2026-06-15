import { create } from 'zustand'

export const useFarmStore = create((set) => ({
  activeFarm: null,
  farms: [],
  setActiveFarm: (farm) => set({ activeFarm: farm }),
  setFarms: (farms) => set({ farms }),
  addFarm: (farm) => set((state) => ({ farms: [...state.farms, farm] })),
}))
