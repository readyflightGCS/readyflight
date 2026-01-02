import { useMission } from "@/stores/mission";
import { filterLatLngCmds, getCommandLocation } from "@libs/commands/helpers";
import { LayerGroup } from "react-leaflet";
import DraggableMarker from "../draggableMarker";
import GeofenceMarker from "../geofenceMarker";


export default function MarkerLayer() {
  const { mission, setMission, selectedCommandIDs, selectedSubMission, dialect } = useMission()
  const { viewable } = { viewable: { markers: true } }

  // check if they are visible
  if (!viewable["markers"] && selectedSubMission !== "Markers") return null

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
      {filterLatLngCmds(mission.flatten("Markers"), dialect).map((waypoint, idx) => {
        let active = false
        let x = mission.findNthPosition("Markers", idx)

        if (x && x[0] == selectedSubMission && selectedCommandIDs.includes(x[1])) {
          active = true
        }

        if (selectedSubMission == "Markers") {
          return <DraggableMarker key={idx} text={"" + idx} position={getCommandLocation(waypoint, dialect)} onMove={(lat, lng) => onMove(lat, lng, idx)} active={false} />
        } else {
          return <GeofenceMarker key={idx} text={"" + idx} position={getCommandLocation(waypoint, dialect)} active={false} />

        }
      })
      }
    </LayerGroup>
  )

}

