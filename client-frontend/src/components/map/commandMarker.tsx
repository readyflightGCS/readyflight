import { ReactNode } from "react"
import { Circle } from "react-leaflet"
import DraggableMarker from "./draggableMarker"
import { LatLng } from "@libs/world/latlng"
import ArrowHead from "./arrows"
import { worldOffset } from "@libs/world/distance"
import NonDestChip from "./nonDestChip"
import { useMission } from "@/stores/mission"
import { getMinTurnRadius } from "@libs/dubins/dubinWaypoints"
import { useRFMap } from "@/stores/map"
import { RFCommand } from "@libs/commands/readyflightCommands"
import { DialectCommand } from "@libs/commands/command"

type props = {
  basePosition: LatLng,
  command: { cmd: (DialectCommand | RFCommand), id: number, other: (DialectCommand | RFCommand)[] }
  onMove: (lat: number, lng: number, id: number) => void,
  onClick: (id: number) => void,
  active: boolean,
}

export default function CommandMarker({ basePosition, onMove, command, onClick, active }: props) {

  const { mission, selectedSubMission, selectedCommandIDs, vehicle } = useMission()
  const { viewable } = useRFMap()

  let items: ReactNode[] = []

  let a = 0

  // Add loiter radius
  if (viewable["loiter radius"] && (command.cmd.type === "D_MAV_CMD_NAV_LOITER_UNLIM" || command.cmd.type === "D_MAV_CMD_NAV_LOITER_TURNS" || command.cmd.type === "D_MAV_CMD_NAV_LOITER_TIME")) {

    // make sure the right radius is used, default to plane specific, otherwise use command param
    // @ts-ignore
    let radius = command.cmd.params.radius
    if (radius === 0 && vehicle.type === "Plane") {
      radius = getMinTurnRadius(vehicle.maxBank, vehicle.cruiseAirspeed)
    }

    let direction = 0;

    if (radius < 0) {
      direction = 180
      radius *= -1
    }

    items.push(<Circle
      key={a++}
      center={basePosition}
      radius={radius}
      fill={undefined}
      color={"#5353FA"}
      dashArray={"10, 10"}
    />)

    items.push(<ArrowHead
      key={a++}
      center={worldOffset(basePosition, radius, 0)}
      direction={90 + direction}
    />)
    items.push(<ArrowHead
      key={a++}
      center={worldOffset(basePosition, radius, Math.PI)}
      direction={270 + direction}
    />)
  }

  // draw accept radius around waypoints
  if (viewable["accept radius"] && command.id === 16) {

    // make sure the right radius is used, default to plane specific, otherwise use command param
    // @ts-ignore
    let radius = command.cmd.params["accept radius"]
    if (radius === 0) {
      // default aparently ??
      radius = 90
    }

    items.push(<Circle
      key={a++}
      center={basePosition}
      radius={radius}
      fill={undefined}
      dashArray={"10, 10"}
    />)

  }
  return (
    <div>
      <DraggableMarker
        position={basePosition}
        onMove={(lat, lng) => onMove(lat, lng, command.id)}
        active={active}
        onClick={() => onClick(command.id)}
      />
      {items}

      {command.other.map((cmd, id) => {
        const isActive = (() => {
          const x = mission.findNthPosition(selectedSubMission, command.id + 1 + id);
          return x?.[0] === selectedSubMission && selectedCommandIDs.includes(x[1]);
        })()

        return (
          <NonDestChip
            key={id}
            name={cmd.label}
            offset={id}
            position={basePosition}
            active={isActive}
            onClick={() => onClick(command.id + id + 1)}
          />
        );
      })}
    </div>
  )
}
