import { Circle, LayerGroup, Polyline } from "react-leaflet";
import { ReactNode } from "react";
import { useMission } from "@libs/stores/mission";
import Arc from "../arc";
import { dubinsBetweenDubins, localiseDubinsPath } from "@libs/dubins/dubinWaypoints";
import { getCommandLocation } from "@libs/commands/helpers";
import { dubinsPoint } from "@libs/dubins/types";
import { g2l } from "@libs/world/conversion";

const curveOptions = { color: '#ff0000' }
const straightOptions = { color: '#ffa500' }
const noshow = ["Markers", "Geofence"]

export default function DubinsLayer() {
  const { mission, selectedSubMission, dialect } = useMission()
  if (noshow.includes(selectedSubMission)) return null

  // get reference waypoint
  const reference = mission.getReferencePoint(dialect)

  const activeWPs = mission.flatten(selectedSubMission)
  const mainLine = mission.mainLine(dialect, selectedSubMission)

  if (activeWPs.length < 2) {
    return
  }
  let markers: ReactNode[] = []
  let lines: ReactNode[] = []
  let passByCircles: ReactNode[] = []

  let key = 0

  for (let i = 0; i < mainLine.length - 1; i++) {
    const curCmd = mainLine[i].cmd
    if (curCmd.type !== "RF.DubinsPath") {
      continue
    }
    let dubinsPoints: dubinsPoint[] = []
    if (i > 0) {
      const prevCmd = mainLine[i - 1].cmd
      dubinsPoints.push({ pos: g2l(reference, getCommandLocation(prevCmd, dialect)), bounds: {}, radius: 0, heading: 0, tunable: false, passbyRadius: 0 })
    }
    dubinsPoints = dubinsPoints.concat(curCmd.params.points.map((point) => {
      return { pos: g2l(reference, { lat: point.lat, lng: point.lng }), bounds: {}, radius: point.radius, heading: point.heading, tunable: true, passbyRadius: 0 }
    }))

    if (i < mainLine.length - 1) {
      const nextCmd = mainLine[i + 1].cmd
      dubinsPoints.push({ pos: g2l(reference, getCommandLocation(nextCmd, dialect)), bounds: {}, radius: 0, heading: 0, tunable: false, passbyRadius: 0 })
    }

    let path = dubinsBetweenDubins(dubinsPoints)
    const localisedPath = path.map((x) => localiseDubinsPath(x, reference))
    localisedPath.map((c, _) => {
      console.log(localisedPath)
      lines.push(<Arc key={key++} curve={c.turnA} pathOptions={curveOptions} />)
      lines.push(<Polyline key={key++} pathOptions={straightOptions} positions={[c.straight.start, c.straight.end]} />)
      lines.push(<Arc key={key++} curve={c.turnB} pathOptions={curveOptions} />)
    })
  }


  return (
    <LayerGroup>
      {markers}
      {lines}
      {passByCircles}
    </LayerGroup>
  )

}
