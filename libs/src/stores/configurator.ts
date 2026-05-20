import { create } from 'zustand'

export const ConfiguratorTabs = ['Telemetry', 'Mission', 'Settings', 'Vehicle'] as const

export type ConfiguratorTab = (typeof ConfiguratorTabs)[number]

interface State {
  lastSelectedCommandIndex: number | null,
  setLastSelectedCommandIndex: (id: number) => void
  currentTab: ConfiguratorTab
  setTab: (tab: ConfiguratorTab) => void
  sidePanelOpen: boolean
  setSidePanelOpen: (state: boolean) => void
}

export const useEditor = create<State>((set) => ({
  lastSelectedCommandIndex: null,
  setLastSelectedCommandIndex: (id) => set({ lastSelectedCommandIndex: id }),
  sidePanelOpen: true,
  currentTab: 'Telemetry',
  setTab: (tab: ConfiguratorTab) => set({ currentTab: tab }),
  setSidePanelOpen: (state: boolean) => set({ sidePanelOpen: state })
}))
