import { create } from 'zustand'

export const ConfiguratorTabs = ['Telemetry', 'Mission', 'Settings', 'Vehicle'] as const

export type ConfiguratorTab = (typeof ConfiguratorTabs)[number]

interface State {
  lastSelectedCommandIndex: number | null
  setLastSelectedCommandIndex: (id: number) => void
  currentTab: ConfiguratorTab
  setTab: (tab: ConfiguratorTab) => void
  sidePanelOpen: boolean
  setSidePanelOpen: (state: boolean) => void
  tool: 'waypoint' | 'land' | 'takeoff' | 'place' | 'selectCache'
  setTool: (state: 'waypoint' | 'land' | 'takeoff' | 'place' | 'selectCache') => void
}

export const useEditor = create<State>((set) => ({
  lastSelectedCommandIndex: null,
  sidePanelOpen: true,
  currentTab: 'Telemetry',
  tool: 'waypoint',
  setLastSelectedCommandIndex: (lastSelectedCommandIndex) => set({ lastSelectedCommandIndex }),
  setTab: (currentTab) => set({ currentTab }),
  setSidePanelOpen: (sidePanelOpen) => set({ sidePanelOpen }),
  setTool: (tool) => set({ tool })
}))
