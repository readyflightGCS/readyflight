import { createWithEqualityFn as create } from 'zustand/traditional'

import { Mission } from '@libs/mission/mission'
import { Vehicle } from '@libs/vehicle/types'
import { defaultPlane } from '@libs/vehicle/defaults'
import { DialectCommandDescription, MissionCommand } from '@libs/commands/command'
import { Dialect } from '@libs/mission/dialect'
import { dialects, DEFAULT_DIALECT_ID } from '@libs/mission/dialects'

type Actions = {
  switchDialect: (dialect: Dialect<DialectCommandDescription>) => void
  addCommand: (cmd: MissionCommand<DialectCommandDescription>) => void
  setSelectedSubMission: (name: string) => void
  setSelectedCommandIDs: (n: number[]) => void
  setMission: (m: Mission<DialectCommandDescription>) => void
  setVehicle: (v: Vehicle) => void
  clearSubMission: (name: string) => void
  deleteSubMission: (name: string) => void
  addSub: (name: string) => void
}

type State = {
  mission: Mission<DialectCommandDescription>
  dialect: Dialect<DialectCommandDescription>
  selectedSubMission: string
  vehicle: Vehicle
  selectedCommandIDs: number[]
}

const defaultDialect = dialects.find((d) => d.id === DEFAULT_DIALECT_ID) ?? dialects[0]

export const useMission = create<State & Actions>((set, get) => ({
  dialect: defaultDialect,
  mission: new Mission(defaultDialect),

  selectedSubMission: 'Main',
  selectedCommandIDs: [],
  vehicle: defaultPlane,

  switchDialect: (dialect) => {
    set({ dialect: dialect, mission: new Mission(dialect) })
  },

  addCommand: (cmd) => {
    const current = get().mission
    const cloned = current.clone()
    cloned.pushToMission('Main', cmd)
    set({ mission: cloned })
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
    set({ mission: temp, selectedSubMission: 'Main' })
  },
  addSub: (name) => {
    if (get().selectedSubMission == name) return

    const newWaypoints = get().mission.clone()
    try {
      newWaypoints.pushToMission(get().selectedSubMission, {
        type: 'RF.Group',
        frame: 0,
        params: { name: name }
      })
      set({ mission: newWaypoints })
    } catch {
      return
    }
  },
  setSelectedCommandIDs: (n) => set({ selectedCommandIDs: n }),
  setSelectedSubMission: (name) => set({ selectedSubMission: name }),
  setVehicle: (v) => set({ vehicle: v })
}))
