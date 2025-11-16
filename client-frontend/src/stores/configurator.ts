import { create } from 'zustand'

export const ConfiguratorTabs = [
  "Telemetry",
  "Mission",
  "Settings"
] as const

export type ConfiguratorTab = typeof ConfiguratorTabs[number]

interface State {
  currentTab: ConfiguratorTab
  setTab: (tab: ConfiguratorTab) => void
  sidePanelOpen: boolean
  setSidePanelOpen: (state: boolean) => void
}

export const useEditorStore = create<State>((set) => ({
  sidePanelOpen: true,
  currentTab: "Telemetry",
  setTab: (tab: ConfiguratorTab) => set({ currentTab: tab }),
  setSidePanelOpen: (state: boolean) => set({ sidePanelOpen: state })
}))
