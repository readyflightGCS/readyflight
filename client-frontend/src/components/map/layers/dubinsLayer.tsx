import { Circle, LayerGroup, Polyline } from "react-leaflet";
import { ReactNode } from "react";
import { useMission } from "@libs/stores/mission";
import { dubinsBetweenDubins, localiseDubinsPath, splitDubinsRuns, waypointToDubins } from "@libs/dubins/dubinWaypoints";
import Arc from "../arc";
import { getCommandLocation } from "@libs/commands/helpers";

const curveOptions = { color: '#ff0000' }
const straightOptions = { color: '#bb0000' }
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
  let dubinsSections = splitDubinsRuns(mainLine)
  for (const section of dubinsSections) {
    section.run.map((x, i) => {
      if (i != 0 && x.cmd.type === "RF.DubinsPath" && i < section.run.length - 1 && x.cmd.params.gap > 0)
        passByCircles.push(<Circle center={getCommandLocation(x.cmd, dialect)} radius={x.cmd.params.gap} key={key++} />)
    })
    let dubinsPoints = section.run.map((x) => waypointToDubins(x.cmd, reference, dialect))
    let path = dubinsBetweenDubins(dubinsPoints)
    const localisedPath = path.map((x) => localiseDubinsPath(x, reference))
    localisedPath.map((c, _) => {
      lines.push(<Arc key={key++} curve={c.turnA} pathOptions={curveOptions} />)
      lines.push(<Polyline key={key++} pathOptions={straightOptions} positions={[c.straight.start, c.straight.end]} />)
      lines.push(<Arc key={key++} curve={c.turnB} pathOptions={straightOptions} />)
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
