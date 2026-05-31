import { create } from 'zustand'
import { tabRegistry } from '@/components/tabs/tabRegistry'

interface State {
  lastSelectedCommandIndex: number | null
  setLastSelectedCommandIndex: (id: number) => void
  currentTab: (typeof tabRegistry)[number]["name"]
  setTab: (tab: (typeof tabRegistry)[number]["name"]) => void
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
