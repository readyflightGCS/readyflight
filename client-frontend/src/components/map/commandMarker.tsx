import { ReactNode } from 'react'
import { Circle } from 'react-leaflet'
import DraggableMarker from './draggableMarker'
import { LatLng } from '@libs/world/latlng'
import ArrowHead from './arrows'
import { worldOffset } from '@libs/world/distance'
import NonDestChip from './nonDestChip'
import { useMission } from '@libs/stores/mission'
import { getMinTurnRadius } from '@libs/dubins/dubinWaypoints'
import { useRFMap } from '@libs/stores/map'
import { DialectCommandDescription, MissionCommand } from '@libs/commands/command'
import { getCommandLabel } from '@libs/commands/helpers'

type props = {
  basePosition: LatLng
  command: {
    cmd: MissionCommand<DialectCommandDescription>
    id: number
    other: MissionCommand<DialectCommandDescription>[]
  }
  onMove: (lat: number, lng: number, id: number) => void
  onClick: (id: number) => void
  onDoubleClick: (id: number) => void
  active: boolean
}

export default function CommandMarker({
  basePosition,
  onMove,
  command,
  onClick,
  onDoubleClick,
  active
}: props) {
  const { mission, selectedSubMission, selectedCommandIDs, vehicle } = useMission()
  const { viewable } = useRFMap()
  const dialect = useMission((s) => s.dialect)

  const items: ReactNode[] = []

  let a = 0

  // Add loiter radius — driven by drawRadius on the command description
  const cmdDesc = dialect.commandDescriptions.find((d) => d.type === command.cmd.type)
  const drawRadiusParam = cmdDesc?.drawRadius

  if (viewable['loiter radius'] && drawRadiusParam) {
    // make sure the right radius is used, default to plane specific, otherwise use command param
    let radius = (command.cmd.params as Record<string, number>)[drawRadiusParam] as number
    if (radius === 0 && vehicle.type === 'Plane') {
      radius = getMinTurnRadius(vehicle.maxBank, vehicle.cruiseAirspeed)
    }

    let direction = 0

    if (radius < 0) {
      direction = 180
      radius *= -1
    }

    items.push(
      <Circle
        key={a++}
        center={basePosition}
        radius={radius}
        fill={undefined}
        color={'#5353FA'}
        dashArray={'10, 10'}
      />
    )

    items.push(
      <ArrowHead
        key={a++}
        center={worldOffset(basePosition, radius, 0)}
        direction={90 + direction}
      />
    )
    items.push(
      <ArrowHead
        key={a++}
        center={worldOffset(basePosition, radius, Math.PI)}
        direction={270 + direction}
      />
    )
  }

  // draw accept radius around waypoints
  if (viewable['accept radius'] && command.id === 16) {
    // make sure the right radius is used, default to plane specific, otherwise use command param
    let radius = command.cmd.params['accept radius']
    if (radius === 0) {
      // default aparently ??
      radius = 90
    }

    items.push(
      <Circle
        key={a++}
        center={basePosition}
        radius={radius}
        fill={undefined}
        dashArray={'10, 10'}
      />
    )
  }
  return (
    <div>
      <DraggableMarker
        position={basePosition}
        onMove={(lat, lng) => onMove(lat, lng, command.id)}
        active={active}
        onClick={() => onClick(command.id)}
        onDoubleClick={() => {
          onDoubleClick(command.id)
        }}
      />
      {items}

      {command.other.map((cmd, id) => {
        const isActive = (() => {
          const x = mission.findNthPosition(selectedSubMission, command.id + 1 + id)
          return x?.[0] === selectedSubMission && selectedCommandIDs.includes(x[1])
        })()

        return (
          <NonDestChip
            key={id}
            name={getCommandLabel(cmd, dialect)}
            offset={id}
            position={basePosition}
            active={isActive}
            onClick={() => onClick(command.id + id + 1)}
            onDoubleClick={() => {
              onDoubleClick(command.id + id + 1)
            }}
          />
        )
      })}
    </div>
  )
}
