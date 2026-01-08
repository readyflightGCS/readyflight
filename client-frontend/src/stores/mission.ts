import { createWithEqualityFn as create } from 'zustand/traditional'

import { ardupilot } from '@libs/mission/ardupilot/ardupilot'
import { Mission } from '@libs/mission/mission'
import { Vehicle } from '@libs/vehicle/types'
import { defaultPlane } from '@libs/vehicle/copter'
import { CommandDescription, MissionCommand } from '@libs/commands/command'
import { Dialect } from '@libs/mission/dialect'
import { mavCmdDescription } from '@libs/mission/ardupilot/commands'

export const tools = [
  { name: "Takeoff" },
  { name: "Waypoint" },
  { name: "Payload" },
  { name: "Land" },
  { name: "Place" }
] as const

type Actions = {
  switchDialect: (dialect: Dialect<CommandDescription>) => void
  addCommand: (cmd: MissionCommand<CommandDescription>) => void
  setTool: (tool: typeof tools[number]["name"]) => void
  setSelectedSubMission: (name: string) => void
  setSelectedCommandIDs: (n: number[]) => void
  setMission: (m: Mission<CommandDescription>) => void
  setVehicle: (v: Vehicle) => void
  clearSubMission: (name: string) => void
  deleteSubMission: (name: string) => void
  addSub: (name: string) => void
}

type State = {
  mission: Mission<CommandDescription>
  dialect: Dialect<CommandDescription>
  tool: typeof tools[number]["name"]
  selectedSubMission: string
  vehicle: Vehicle
  selectedCommandIDs: number[]
}

export const useMission = create<State & Actions>((set, get) => ({
  mission: new Mission<typeof mavCmdDescription[number]>(),
  dialect: ardupilot,

  tool: "Takeoff",
  selectedSubMission: "Main",
  selectedCommandIDs: [],
  vehicle: defaultPlane,

  switchDialect: (dialect) => {
    set({ dialect: dialect, mission: new Mission() })
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
  clearSubMission: (name) => {
    const temp = get().mission.clone()
    temp.set(name, [])
    set({ mission: temp })
  },
  deleteSubMission: (name) => {
    const temp = get().mission.clone()
    temp.removeSubMission(name)
    set({ mission: temp, selectedSubMission: "Main" })
  },
  addSub: (name) => {

    if (get().selectedSubMission == name) return

    let newWaypoints = get().mission.clone()
    try {
      newWaypoints.pushToMission(get().selectedSubMission, { type: "RF.Group", frame: 0, params: { name: name } })
      set({ mission: newWaypoints })
    } catch (err) {
      return
    }
  },
  setSelectedCommandIDs: (n) => set({ selectedCommandIDs: n }),
  setSelectedSubMission: (name) => set({ selectedSubMission: name }),
  setVehicle: (v) => set({ vehicle: v }),
}))
