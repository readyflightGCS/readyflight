import { useMission } from '@libs/stores/mission'
import { avgLatLng } from '@libs/world/latlng'
import { LayerGroup, Marker, Polyline } from 'react-leaflet'
import InsertBtn from '../insertButton'
import CommandMarker from '../commandMarker'
import { getCommandLocation, getCommandLocationAlt } from '@libs/commands/helpers'
import { useVehicle } from '@libs/stores/vehicle'
import { useEditor } from '@libs/stores/configurator'
import { useMemo, createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as L from 'leaflet'
import { rfIconMap } from '@/lib/rfIcons'

const limeOptions = { color: 'lime' }
const noshow = ['Markers', 'Geofence']

import { useMap } from 'react-leaflet'
import { LatLngExpression } from 'leaflet'

type Props = {
  position: LatLngExpression
  heading: number
  lengthPx?: number
  offsetPx?: number
}

export function HeadingLine({ position, heading, lengthPx = 25, offsetPx = 0 }: Props) {
  const map = useMap()

  const start = map.latLngToLayerPoint(position)

  const rad = (heading * Math.PI) / 180

  const endDx = lengthPx * Math.sin(rad)
  const endDy = -lengthPx * Math.cos(rad)

  const startDx = offsetPx * Math.sin(rad)
  const startDy = -offsetPx * Math.cos(rad)

  const endPoint = {
    x: start.x + endDx,
    y: start.y + endDy
  }

  const startPoint = { x: start.x + startDx, y: start.y + startDy }

  const startLatLng = map.layerPointToLatLng([startPoint.x, startPoint.y])
  const endLatLng = map.layerPointToLatLng([endPoint.x, endPoint.y])

  const line = [startLatLng, endLatLng] as LatLngExpression[]

  return <Polyline positions={line} pathOptions={{ color: 'red' }} />
}

function VehicleMarker() {
  const lat = useVehicle((s) => s.lat)
  const lon = useVehicle((s) => s.lon)
  const heading = useVehicle((s) => s.heading)
  const vehicleIcon = useMission((s) => s.dialect.vehicleIcon)

  const icon = useMemo(() => {
    const IconComponent = rfIconMap[vehicleIcon]
    const svg = renderToStaticMarkup(
      createElement(IconComponent, { color: '#ffffff', size: 30, strokeWidth: 1.5 })
    )
    return L.divIcon({
      className: '',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      html: `<div style="transform:rotate(${(heading ?? 0) - 45}deg);width:30px;height:30px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.7))">${svg}</div>`
    })
  }, [vehicleIcon, heading])

  if (lat === null || lon === null) return null

  return (
    <>
      <Marker position={[lat, lon]} icon={icon} interactive={false} />
      <HeadingLine position={[lat, lon]} heading={heading ?? 0} lengthPx={70} offsetPx={20} />
    </>
  )
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
  const setLastSelectedCommandIndex = useEditor((s) => s.setLastSelectedCommandIndex)

  let a = 0
  if (noshow.includes(selectedSubMission)) return null

  // store each destination in an array, with non destinations in other (to be stacked as they act in the same location)
  const mainLine = mission.mainLine(selectedSubMission)

  // handle insert at specific id
  function handleInsert(id: number, lat: number, lng: number, altitude: number) {
    const a = mission.clone()
    a.insert(id, selectedSubMission, {
      type: 'RF.Waypoint',
      frame: 0,
      params: { latitude: lat, longitude: lng, altitude }
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
    const prevAlt = getCommandLocationAlt(mainLine[i].cmd, dialect)?.alt
    const nextAlt = getCommandLocationAlt(mainLine[i + 1].cmd, dialect)?.alt
    const altitude =
      typeof prevAlt === 'number' && typeof nextAlt === 'number' ? (prevAlt + nextAlt) / 2 : 100
    insertBtns.push(
      <InsertBtn
        key={a++}
        lat={avg.lat}
        lng={avg.lng}
        onClick={() => handleInsert(mainLine[i + 1].id, avg.lat, avg.lng, altitude)}
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

      <VehicleMarker />

      {insertBtns}
      {lineSegments}
    </LayerGroup>
  )
}
