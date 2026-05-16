import { Circle, LayerGroup, Polyline } from 'react-leaflet'
import { ReactNode } from 'react'
import { useMission } from '@libs/stores/mission'
import {
  dubinsBetweenDubins,
  localiseDubinsPath,
  splitDubinsRuns,
  waypointToDubins
} from '@libs/dubins/dubinWaypoints'
import Arc from '../arc'
import { getCommandLocation } from '@libs/commands/helpers'

const curveOptions = { color: '#ff0000' }
const straightOptions = { color: '#bb0000' }
const noshow = ['Markers', 'Geofence']

export default function DubinsLayer() {
  const mission = useMission(s => s.mission)
  const selectedSubMission = useMission(s => s.selectedSubMission)
  const dialect = useMission(s => s.dialect)

  // return early if we are on Markers or Geofence
  if (noshow.includes(selectedSubMission)) return null

  // get reference waypoint
  const reference = mission.getReferencePoint(dialect)

  const activeWPs = mission.flatten(selectedSubMission)
  const mainLine = mission.mainLine(dialect, selectedSubMission)

  // we need at least two commands for dubins path
  if (activeWPs.length < 2) {
    return
  }

  const markers: ReactNode[] = []
  const lines: ReactNode[] = []
  const passByCircles: ReactNode[] = []

  let key = 0
  const dubinsSections = splitDubinsRuns(mainLine)
  for (const section of dubinsSections) {

    // add pass by circles
    section.run.map((x, i) => {
      if (
        i != 0 &&
        x.cmd.type === 'RF.DubinsPath' &&
        i < section.run.length - 1 &&
        x.cmd.params.gap > 0
      )
        passByCircles.push(
          <Circle
            center={getCommandLocation(x.cmd, dialect)}
            radius={x.cmd.params.gap}
            key={key++}
          />
        )
    })

    // generate dubins path
    const dubinsPoints = section.run.map((x) => waypointToDubins(x.cmd, reference, dialect))
    const path = dubinsBetweenDubins(dubinsPoints)
    const localisedPath = path.map((x) => localiseDubinsPath(x, reference))

    localisedPath.map((c) => {
      // curve
      lines.push(<Arc key={key++} curve={c.turnA} pathOptions={curveOptions} />)
      // straight
      lines.push(
        <Polyline
          key={key++}
          pathOptions={straightOptions}
          positions={[c.straight.start, c.straight.end]}
        />
      )
      // curve
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
