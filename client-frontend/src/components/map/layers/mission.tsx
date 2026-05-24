import { useMission } from '@libs/stores/mission'
import { avgLatLng } from '@libs/world/latlng'
import { LayerGroup, Polyline } from 'react-leaflet'
import InsertBtn from '../insertButton'
import CommandMarker from '../commandMarker'
import { getCommandLocation } from '@libs/commands/helpers'
import { useVehicle } from '@libs/stores/vehicle'
import DraggableMarker from '../draggableMarker'
import { useEditor } from '@libs/stores/configurator'

const limeOptions = { color: 'lime' }
const noshow = ['Markers', 'Geofence']

import { useMap } from 'react-leaflet'
import { LatLngExpression } from 'leaflet'

type Props = {
  position: LatLngExpression
  heading: number
  lengthPx?: number
}

export function HeadingLine({ position, heading, lengthPx = 25 }: Props) {
  const map = useMap()

  const start = map.latLngToLayerPoint(position)

  const rad = (heading * Math.PI) / 180

  const dx = lengthPx * Math.sin(rad)
  const dy = -lengthPx * Math.cos(rad)

  const endPoint = {
    x: start.x + dx,
    y: start.y + dy
  }

  const endLatLng = map.layerPointToLatLng([endPoint.x, endPoint.y])

  const line = [position, endLatLng] as LatLngExpression[]

  return <Polyline positions={line} pathOptions={{ color: 'red' }} />
}

export default function ActiveLayer() {
  const {
    setSelectedSubMission,
    setSelectedCommandIDs,
    mission,
    dialect,
    selectedSubMission,
    setMission,
    selectedCommandIDs
  } = useMission()
  const v = useVehicle()
  const setLastSelectedCommandIndex = useEditor((s) => s.setLastSelectedCommandIndex)

  let a = 0
  if (noshow.includes(selectedSubMission)) return null

  // store each destination in an array, with non destinations in other (to be stacked as they act in the same location)
  const mainLine = mission.mainLine(dialect, selectedSubMission)

  // handle insert at specific id
  function handleInsert(id: number, lat: number, lng: number) {
    const a = mission.clone()
    a.insert(id, selectedSubMission, {
      type: 'RF.Waypoint',
      frame: 0,
      params: { latitude: lat, longitude: lng, altitude: 10 }
    })
    setMission(a)
  }

  // create a button between each latlng command
  const insertBtns = []
  const lineSegments = []
  for (let i = 0; i < mainLine.length - 1; i++) {
    if (mainLine[i].cmd.type == 'RF.DubinsPath' || mainLine[i + 1].cmd.type == 'RF.DubinsPath') {
      continue
    }
    const aPos = getCommandLocation(mainLine[i].cmd, dialect)
    const bPos = getCommandLocation(mainLine[i + 1].cmd, dialect)
    const avg = avgLatLng([aPos, bPos])
    insertBtns.push(
      <InsertBtn
        key={a++}
        lat={avg.lat}
        lng={avg.lng}
        onClick={() => handleInsert(mainLine[i + 1].id, avg.lat, avg.lng)}
      />
    )
    lineSegments.push(<Polyline key={a++} pathOptions={limeOptions} positions={[aPos, bPos]} />)
  }

  function onMove(lat: number, lng: number, id: number) {
    const a = mission.findNthPosition(selectedSubMission, id)
    if (a == null) return
    const [subMission, pos] = a
    const b = mission.clone()
    b.changeParam(pos, subMission, (wp) => {
      if ('latitude' in wp.params) {
        wp.params.latitude = lat
        wp.params.longitude = lng
      }
      return wp
    })
    setMission(b)
    return
  }

  // handle when marker is clicked
  function handleMarkerClick(id: number) {
    const a = mission.findNthPosition(selectedSubMission, id)
    if (!a) return
    setSelectedSubMission(a[0])
    setSelectedCommandIDs([a[1]])
    setLastSelectedCommandIndex(a[1])
  }

  // handle when marker is double clicked
  function handleDoubleClick(id: number) {
    const temp = mission.clone()
    const wp = mission.get(selectedSubMission)[id]
    if (wp.type == 'RF.Group' && ['Landing', 'Takeoff'].includes(wp.params.name as string)) {
      temp.removeSubMission(wp.params.name as string)
    }
    temp.pop(selectedSubMission, id)
    setMission(temp)
    setSelectedCommandIDs([])
  }

  return (
    <LayerGroup>
      {mainLine.map((command) => {
        const position = getCommandLocation(command.cmd, dialect)
        const isActive = (() => {
          const x = mission.findNthPosition(selectedSubMission, command.id)
          return x?.[0] === selectedSubMission && selectedCommandIDs.includes(x[1])
        })()

        return (
          <CommandMarker
            command={command}
            key={a++}
            basePosition={position}
            onMove={onMove}
            active={isActive}
            onClick={handleMarkerClick}
            onDoubleClick={handleDoubleClick}
          />
        )
      })}

      <DraggableMarker position={{ lat: v.lat, lng: v.lon }} active={false} />
      <HeadingLine position={[v.lat || 0, v.lon || 0]} heading={v.heading} />

      {insertBtns}
      {lineSegments}
    </LayerGroup>
  )
}
