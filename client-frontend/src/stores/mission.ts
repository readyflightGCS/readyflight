import { create } from 'zustand'

import { ardupilot } from '@libs/mission/ardupilot/ardupilot'
import { Mission } from '@libs/mission/mission'
import { LatLng } from '@libs/world/latlng'
import { Dialect } from '@libs/mission/dialect'
import { Vehicle } from '@libs/vehicle/types'
import { defaultPlane } from '@libs/vehicle/copter'
import { mavCmds } from '@libs/mission/ardupilot/commands'
import { RFCommand } from '@libs/commands/readyflightCommands'

export const tools = [
  { name: "Takeoff" },
  { name: "Waypoint" },
  { name: "Payload" },
  { name: "Land" }
]

type ArdupilotState = {
  dialectId: 'ardupilot'
  dialect: Dialect<typeof mavCmds[number]>
  mission: Mission<typeof mavCmds[number]>
}

// union of all dialects
export type DialectState = ArdupilotState

export type DialectId = DialectState["dialectId"]

export type DialectCommand =
  DialectState extends { mission: Mission<infer C> } ? C | RFCommand : never

type Actions = {
  switchDialect: (id: DialectId) => void
  addCommand: (cmd: DialectCommand) => void
  setTool: (tool: typeof tools[number]["name"]) => void
  setSelectedSubMission: (name: string) => void
  setSelectedCommandIDs: (n: number[]) => void
  setMission: (m: Mission<typeof mavCmds[number]>) => void
  setVehicle: (v: Vehicle) => void
}

const createDialectState = (id: DialectId, referencePoint: LatLng): DialectState => {
  switch (id) {
    case 'ardupilot':
    default:
      return {
        dialectId: 'ardupilot',
        dialect: ardupilot,
        mission: new Mission<typeof mavCmds[number]>(referencePoint),
      }
  }
}

type GenericState = {
  tool: typeof tools[number]["name"]
  selectedSubMission: string
  vehicle: Vehicle
  selectedCommandIDs: number[]
}

export const useMission = create<DialectState & GenericState & Actions>((set, get) => ({
  ...createDialectState('ardupilot', { lat: 0, lng: 0 }),

  tool: "Takeoff",
  selectedSubMission: "Main",
  selectedCommandIDs: [],
  vehicle: defaultPlane,

  switchDialect: (id) => {
    const ref = get().mission.getReferencePoint()
    set(createDialectState(id, ref))
  },

  addCommand: (cmd) => {
    const current = get().mission
    const cloned = current.clone()
    cloned.pushToMission('Main', cmd)
    set({ mission: cloned })
  },
  setTool: (tool) => {
    set({ tool: tool })
  },
  setMission: (m) => {
    set({ mission: m })
  },
  setSelectedCommandIDs: (n) => set({ selectedCommandIDs: n }),
  setSelectedSubMission: (name) => set({ selectedSubMission: name }),
  setVehicle: (v) => set({ vehicle: v })
}))
