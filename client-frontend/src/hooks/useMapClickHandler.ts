import type { LeafletMouseEvent } from 'leaflet'

import { useEditor } from '@libs/stores/configurator'
import { useMission } from '@libs/stores/mission'
import { RFCommand } from '@libs/commands/command'

export function useMapClickHandler() {
  const currentTab = useEditor((s) => s.currentTab)

  const setMission = useMission((s) => s.setMission)
  const mission = useMission((s) => s.mission)
  const selectedSubMission = useMission((s) => s.selectedSubMission)
  const setSelectedCommandIDs = useMission((s) => s.setSelectedCommandIDs)
  const lastSelectedCommandIndex = useEditor((s) => s.setLastSelectedCommandIndex)

  return (e: LeafletMouseEvent) => {
    switch (currentTab) {
      case 'Mission': {
        const cmd: RFCommand = {
          type: 'RF.Waypoint',
          frame: 0,
          params: {
            latitude: e.latlng.lat,
            longitude: e.latlng.lng,
            altitude: 100
          }
        }
        const a = mission.clone()
        const newIndex = mission.get(selectedSubMission).length
        a.pushToMission(selectedSubMission, cmd)
        setMission(a)
        setSelectedCommandIDs([newIndex])
        lastSelectedCommandIndex(newIndex)
        break
      }

      case 'Telemetry':
        break
      case 'Settings':
        break
      default: {
        const _exhaustiveCheck: never = currentTab
        return _exhaustiveCheck
      }
    }
  }
}
