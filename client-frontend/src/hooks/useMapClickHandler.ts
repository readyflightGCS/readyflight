import type { LeafletMouseEvent } from 'leaflet'

import { useEditor } from '@libs/stores/configurator'
import { useMission } from '@libs/stores/mission'
import { DialectCommandDescription, MissionCommand, RFCommand } from '@libs/commands/command'
import { avgLatLng } from '@libs/world/latlng'
import { filterLatLngCmds, getCommandLocation } from '@libs/commands/helpers'

export function useMapClickHandler() {
  const currentTab = useEditor((s) => s.currentTab)
  const tool = useEditor((s) => s.tool)
  const setTool = useEditor((s) => s.setTool)

  const setMission = useMission((s) => s.setMission)
  const mission = useMission((s) => s.mission)
  const selectedSubMission = useMission((s) => s.selectedSubMission)
  const selectedCommandIDs = useMission((s) => s.selectedCommandIDs)
  const dialect = useMission((s) => s.dialect)
  const setSelectedCommandIDs = useMission((s) => s.setSelectedCommandIDs)
  const lastSelectedCommandIndex = useEditor((s) => s.setLastSelectedCommandIndex)

  return (e: LeafletMouseEvent) => {
    switch (currentTab) {
      case 'Mission': {
        let cmd: RFCommand
        switch (tool) {
          case 'land':
            cmd = cmd || {
              type: 'RF.Land',
              frame: 0,
              params: {
                latitude: e.latlng.lat,
                longitude: e.latlng.lng,
                altitude: 100,
                "land mode": 0,
                "yaw angle": 0,
                "abort alt": 0
              }
            }
          case 'takeoff':
            cmd = cmd || {
              type: 'RF.Takeoff',
              frame: 0,
              params: {
                latitude: e.latlng.lat,
                longitude: e.latlng.lng,
                altitude: 100,
                pitch: 10,
                yaw: 0
              }
            }
          case 'waypoint':
            cmd = cmd || {
              type: 'RF.Waypoint',
              frame: 0,
              params: {
                latitude: e.latlng.lat,
                longitude: e.latlng.lng,
                altitude: 100,
              }
            }
            const a = mission.clone()
            const newIndex = mission.get(selectedSubMission).length
            a.pushToMission(selectedSubMission, cmd)
            setMission(a)
            setSelectedCommandIDs([newIndex])
            lastSelectedCommandIndex(newIndex)
            break

          case 'place': {
            const subMission = mission.get(selectedSubMission);

            let wps: MissionCommand<DialectCommandDescription>[] = [];
            let wpsIds: number[] = [];
            if (selectedCommandIDs.length === 0) {
              wps = subMission;
              wpsIds = subMission.map((_, index) => index);
            } else {
              wps = subMission.filter((_, id) => selectedCommandIDs.includes(id));
              wpsIds = selectedCommandIDs;
            }

            const leaves = wps.map((x) => mission.flattenNode(x)).reduce((cur, acc) => (acc.concat(cur)), [])

            const avgll = avgLatLng(filterLatLngCmds(leaves, dialect).map((x) => getCommandLocation(x, dialect)))
            if (avgll == undefined) { return mission }
            const { lat, lng } = avgll
            let waypointsUpdated = mission.clone();

            waypointsUpdated.changeManyParams(wpsIds, selectedSubMission, (cmd) => {
              if ("latitude" in cmd.params && "longitude" in cmd.params) {
                cmd.params.latitude += e.latlng.lat - lat
                cmd.params.longitude += e.latlng.lng - lng
              }
              return cmd;
            }, true);
            setMission(waypointsUpdated)
          }
        }
        setTool("waypoint")
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
