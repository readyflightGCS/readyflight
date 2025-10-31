import { create } from 'zustand'

export const ConfiguratorTabs = [
  "Telemetry",
  "Mission"
] as const

export type ConfiguratorTab = typeof ConfiguratorTabs[number]

interface State {
  currentTab: ConfiguratorTab
  setTab: (tab: ConfiguratorTab) => void
}

export const useEditorStore = create<State>((set) => ({
  currentTab: "Telemetry",
  setTab: (tab: ConfiguratorTab) => set({ currentTab: tab })
}))
