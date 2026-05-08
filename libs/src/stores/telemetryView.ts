import { createWithEqualityFn as create } from 'zustand/traditional'

export type TelemetryView = 'telemetry' | 'indicators' | 'mixed'

type State = {
  view: TelemetryView
}

type Actions = {
  setView: (v: TelemetryView) => void
}

export const useTelemetryView = create<State & Actions>((set) => ({
  view: 'telemetry',

  setView: (v) => set({ view: v })
}))
