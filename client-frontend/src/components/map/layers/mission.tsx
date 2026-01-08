import { useMission } from "@/stores/mission";
import { avgLatLng, LatLng } from "@libs/world/latlng";
import { LayerGroup, Polyline } from "react-leaflet";
import InsertBtn from "../insertButton";
import CommandMarker from "../commandMarker";
import { getCommandLocation } from "@libs/commands/helpers";

const limeOptions = { color: 'lime' }
const noshow = ["Markers", "Geofence"]

export default function ActiveLayer() {
  const { setSelectedSubMission, setSelectedCommandIDs, mission, dialect, selectedSubMission, setMission, selectedCommandIDs } = useMission()

  let a = 0;


  if (noshow.includes(selectedSubMission)) return null

  // store each destination in an array, with non destinations in other (to be stacked as they act in the same location)
  const mainLine = mission.mainLine(dialect, selectedSubMission)

  // create a button between each latlng command
  let insertBtns = []
  for (let i = 0; i < mainLine.length - 1; i++) {
    const avg = avgLatLng([getCommandLocation(mainLine[i].cmd, dialect), getCommandLocation(mainLine[i + 1].cmd, dialect)]) as LatLng
    insertBtns.push(
      <InsertBtn key={a++} lat={avg.lat} lng={avg.lng} onClick={() => handleInsert(mainLine[i + 1].id, avg.lat, avg.lng)} />
    )
  }

  // handle insert at specific id
  function handleInsert(id: number, lat: number, lng: number) {
    const a = mission.clone()
    a.insert(id, selectedSubMission, { type: "RF.Waypoint", frame: 0, params: { latitude: lat, longitude: lng, altitude: 10 } })
    setMission(a);
  }

  function onMove(lat: number, lng: number, id: number) {
    const a = mission.findNthPosition(selectedSubMission, id)
    if (a == null) return
    const [subMission, pos] = a
    const b = mission.clone()
    b.changeParam(pos, subMission, (wp) => { if ("latitude" in wp.params) { wp.params.latitude = lat; wp.params.longitude = lng } return wp })
    setMission(b)
    return
  }

  // handle when marker is clicked 
  function handleMarkerClick(id: number) {
    const a = mission.findNthPosition(selectedSubMission, id)
    if (!a) return
    setSelectedSubMission(a[0])
    setSelectedCommandIDs([a[1]])
  }

  // handle when marker is double clicked 
  function handleDoubleClick(id: number) {
    console.log("Deleting")
    const temp = mission.clone()
    const wp = mission.get(selectedSubMission)[id]
    if (wp.type == "RF.Group" && ["Landing", "Takeoff"].includes(wp.params.name as string)) {
      temp.removeSubMission(wp.params.name as string)
    }
    temp.pop(selectedSubMission, id)
    setMission(temp)
    setSelectedCommandIDs([])
  }

  return (
    <LayerGroup>
      {mainLine.map((command, _) => {
        const position = getCommandLocation(command.cmd, dialect);
        const isActive = (() => {
          const x = mission.findNthPosition(selectedSubMission, command.id);
          return x?.[0] === selectedSubMission && selectedCommandIDs.includes(x[1]);
        })();


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
        );
      })}

      <Polyline pathOptions={limeOptions} positions={mainLine.map(x => getCommandLocation(x.cmd, dialect))} />
      {insertBtns}
    </LayerGroup>
  )

}
