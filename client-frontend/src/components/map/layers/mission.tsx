import { LayerGroup, Polyline } from "react-leaflet";
import { useMission } from "@/stores/mission";
import CommandMarker from "../commandMarker";
import { avgLatLng, getLatLng, LatLng } from "@libs/world/latlng";
import InsertBtn from "../insertButton";

const limeOptions = { color: 'lime' }
const noshow = ["Markers", "Geofence"]

export default function MissionLayer() {
  const { mission, selectedSubMission, selectedCommandIDs, setSelectedSubMission, setSelectedCommandIDs, setMission } = useMission()
  if (noshow.includes(selectedSubMission)) return null

  // handle insert at specific id
  function handleInsert(id: number, lat: number, lng: number) {
    const a = mission.clone()
    a.insert(id, selectedSubMission, { type: "RF.Waypoint", label: "Waypoint", latitude: lat, longitude: lng, altitude: 100 })
    setMission(a);
  }

  // handle when marker is clicked 
  function handleMarkerClick(id: number) {
    const a = mission.findNthPosition(selectedSubMission, id)
    if (!a) return
    setSelectedSubMission(a[0])
    setSelectedCommandIDs([a[1]])
  }


  function onMove(lat: number, lng: number, id: number) {
    const a = mission.findNthPosition(selectedSubMission, id)
    if (a == null) return
    const [submission, pos] = a
    const b = mission.clone()
    b.changeParam(pos, submission, (wp) => { if ("latitude" in wp) { wp.latitude = lat; wp.longitude = lng } return wp })
    setMission(b)
  }

  let a = 0;
  let items = []
  let subMission = mission.get(selectedSubMission)

  for (let i = 0; i < subMission.length; i++) {
    const isActive = (() => {
      const x = mission.findNthPosition(selectedSubMission, i);
      return x?.[0] === selectedSubMission && selectedCommandIDs.includes(x[1]);
    })();
    let cur = subMission[i]
    switch (cur.type) {
      case "RF.Waypoint":
        items.push(
          <CommandMarker
            command={{ cmd: subMission[i], id: i, other: [] }}
            key={a++}
            basePosition={{ lat: cur.latitude, lng: cur.longitude }}
            onMove={onMove}
            active={isActive}
            onClick={handleMarkerClick}
          />
        )
    }
  }

  return (
    <LayerGroup>
      {items}
    </LayerGroup>
  )
}
