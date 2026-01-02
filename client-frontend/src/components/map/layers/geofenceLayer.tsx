import { useMission } from "@/stores/mission";
import { filterLatLngCmds, getCommandLocation } from "@libs/commands/helpers";
import { LayerGroup, Polygon } from "react-leaflet";
import DraggableMarker from "../draggableMarker";
import { useRFMap } from "@/stores/map";

const fenceOptions = { color: 'red', fillOpacity: 0.1 }

export default function GeofenceLayer() {
  const { mission, selectedSubMission, setMission, selectedCommandIDs, dialect } = useMission()
  const { viewable } = useRFMap()

  // check if visible
  if (!viewable["geofence"] && selectedSubMission !== "Geofence") return

  function onMove(lat: number, lng: number, id: number) {
    const a = mission.findNthPosition(selectedSubMission, id)
    if (a == null) return
    const [subMission, pos] = a
    const b = mission.clone()
    b.changeParam(pos, subMission, (wp) => { if ("latitude" in wp.params) { wp.params.latitude = lat; wp.params.longitude = lng } return wp })
    setMission(b)
    return
  }

  return (
    <LayerGroup>
      {selectedSubMission == "Geofence" ? filterLatLngCmds(mission.flatten("Geofence"), dialect).map((waypoint, idx) => {
        let active = false
        let x = mission.findNthPosition("Geofence", idx)
        if (x && x[0] == selectedSubMission && selectedCommandIDs.includes(x[1])) {
          active = true
        }
        return <DraggableMarker key={idx} position={getCommandLocation(waypoint, dialect)} onMove={(lat, lng) => onMove(lat, lng, idx)} active={active} />
      }) : null
      }
      <Polygon pathOptions={fenceOptions} positions={filterLatLngCmds(mission.flatten("Geofence"), dialect).map(x => getCommandLocation(x, dialect))} />
    </LayerGroup>
  )

}

