import type { LeafletMouseEvent } from 'leaflet'

import { useEditor } from '@libs/stores/configurator'
import { useMission } from '@libs/stores/mission'
import { useRFMap } from '@libs/stores/map'
import { DialectCommandDescription, MissionCommand } from '@libs/commands/command'
import { avgLatLng } from '@libs/world/latlng'
import { filterLatLngCmds, getCommandLocation, makeCommand } from '@libs/commands/helpers'

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

  const setTerrainPreview = useRFMap((s) => s.setTerrainPreview)

  return (e: LeafletMouseEvent) => {
    switch (currentTab) {
      case 'Mission': {
        switch (tool) {
          case 'land': {
            const cmd = makeCommand(
              'RF.Land',
              {
                latitude: e.latlng.lat,
                longitude: e.latlng.lng
              },
              dialect
            )
            const a = mission.clone()
            const newIndex = mission.get(selectedSubMission).length
            a.pushToMission(selectedSubMission, cmd)
            setMission(a)
            setSelectedCommandIDs([newIndex])
            lastSelectedCommandIndex(newIndex)
            break
          }

          case 'takeoff': {
            const cmd = makeCommand(
              'RF.Takeoff',
              {
                latitude: e.latlng.lat,
                longitude: e.latlng.lng
              },
              dialect
            )
            const a = mission.clone()
            const newIndex = mission.get(selectedSubMission).length
            a.pushToMission(selectedSubMission, cmd)
            setMission(a)
            setSelectedCommandIDs([newIndex])
            lastSelectedCommandIndex(newIndex)
            break
          }
          case 'waypoint': {
            const cmd = makeCommand(
              'RF.Waypoint',
              {
                latitude: e.latlng.lat,
                longitude: e.latlng.lng
              },
              dialect
            )
            const a = mission.clone()
            const newIndex = mission.get(selectedSubMission).length
            a.pushToMission(selectedSubMission, cmd)
            setMission(a)
            setSelectedCommandIDs([newIndex])
            lastSelectedCommandIndex(newIndex)
            break
          }

          case 'place': {
            const subMission = mission.get(selectedSubMission)

            let wps: MissionCommand<DialectCommandDescription>[] = []
            let wpsIds: number[] = []
            if (selectedCommandIDs.length === 0) {
              wps = subMission
              wpsIds = subMission.map((_, index) => index)
            } else {
              wps = subMission.filter((_, id) => selectedCommandIDs.includes(id))
              wpsIds = selectedCommandIDs
            }

            const leaves = wps
              .map((x) => mission.flattenNode(x))
              .reduce((cur, acc) => acc.concat(cur), [])

            const avgll = avgLatLng(
              filterLatLngCmds(leaves, dialect).map((x) => getCommandLocation(x, dialect))
            )
            if (avgll == undefined) {
              return mission
            }
            const { lat, lng } = avgll
            const waypointsUpdated = mission.clone()

            waypointsUpdated.changeManyParams(
              wpsIds,
              selectedSubMission,
              (cmd) => {
                if ('latitude' in cmd.params && 'longitude' in cmd.params) {
                  cmd.params.latitude += e.latlng.lat - lat
                  cmd.params.longitude += e.latlng.lng - lng
                }
                return cmd
              },
              true
            )
            setMission(waypointsUpdated)
          }
        }
        setTool('waypoint')
        break
      }

      case 'Telemetry':
        break

      case 'Settings': {
        if (tool === 'selectCache') {
          // Preserve the current radius — only the centre is being picked.
          const currentRadius = useRFMap.getState().terrainPreview?.radiusKm ?? 5
          setTerrainPreview({ pos: e.latlng, radiusKm: currentRadius })
          setTool('waypoint')
        }
        break
      }

      case 'Vehicle':
        break

      default: {
        const _exhaustiveCheck: never = currentTab
        return _exhaustiveCheck
      }
    }
  }
}
