import { create } from 'zustand'

import { ardupilot, MavCommand } from '@libs/mission/ardupilot/ardupilot'
import { Mission } from '@libs/mission/mission'
import { RFCommand } from '@libs/mission/RFCommands'
import { LatLng } from '@libs/world/latlng'
import { Dialect } from '@libs/mission/dialect'

export const tools = [
  { name: "Takeoff" },
  { name: "Waypoint" },
  { name: "Payload" },
  { name: "Land" }
]

type ArdupilotState = {
  dialectId: 'ardupilot'
  tool: typeof tools[number]["name"]
  currentSubMission: string
  dialect: Dialect<MavCommand>
  mission: Mission<MavCommand>
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
}

const createDialectState = (id: DialectId, referencePoint: LatLng): DialectState => {
  switch (id) {
    case 'ardupilot':
    default:
      return {
        tool: "Takeoff",
        currentSubMission: "Main",
        dialectId: 'ardupilot',
        dialect: ardupilot,
        mission: new Mission<MavCommand>(referencePoint),
      }
  }
}

export const useMission = create<DialectState & Actions>((set, get) => ({
  ...createDialectState('ardupilot', { lat: 0, lng: 0 }),

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
  }
}))
