import { useMission } from "@/stores/mission";
import { filterLatLngCmds, getCommandLocation } from "@libs/commands/helpers";
import { avgLatLng } from "@libs/world/latlng";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, LocateFixed, MousePointerClick, RotateCcw, RotateCw } from "lucide-react";

export function LatLngEditor() {
  const { mission, setMission, selectedSubMission, selectedCommandIDs, setTool, dialect } = useMission();

  const curMission = mission.get(selectedSubMission);

  // all nodes if selected has none, or selected nodes
  let wps = selectedCommandIDs.length === 0 ? curMission : curMission.filter((_, id) => selectedCommandIDs.includes(id));

  // all indexes if selected has none, or all selected indexes
  let wpsIds: number[] = selectedCommandIDs.length === 0 ? curMission.map((_, index) => index) : selectedCommandIDs

  const leaves = wps.map((x) => mission.flattenNode(x)).reduce((cur, acc) => (acc.concat(cur)), [])

  const avgll = avgLatLng(filterLatLngCmds(leaves, dialect).map((x) => getCommandLocation(x, dialect)))
  if (avgll == undefined) {
    return null
  }
  const { lat, lng } = avgll

  function nudge(x: number, y: number) {
    let temp = mission.clone()
    temp.changeManyParams(wpsIds, selectedSubMission, (cmd) => {
      if ("latitude" in cmd.params && typeof cmd.params.latitude == "number" && typeof cmd.params.longitude == "number") {
        cmd.params.latitude += 0.0001 * y;
        cmd.params.longitude += 0.0001 * x;
      }
      return cmd;
    }, true);
    setMission(temp);
  }

  function move() {
    const inLat = prompt("Enter latitude");
    const inLng = prompt("Enter Longitude");
    if (inLat === null || inLng === null) { return }
    const newLat = parseFloat(inLat)
    const newLng = parseFloat(inLng)
    const leaves = wps.map((x) => mission.flattenNode(x)).reduce((cur, acc) => (acc.concat(cur)), [])

    const avgll = avgLatLng(filterLatLngCmds(leaves, dialect).map((x) => getCommandLocation(x, dialect)))
    if (avgll == undefined) return
    const { lat, lng } = avgll
    let temp = mission.clone();
    temp.changeManyParams(wpsIds, selectedSubMission, (cmd) => {
      if ("latitude" in cmd.params && "longitude" in cmd.params && typeof cmd.params.latitude == "number" && typeof cmd.params.longitude == "number") {
        cmd.params.latitude += newLat - lat
        cmd.params.longitude += newLng - lng
      }
      return cmd;
    }, true)
    setMission(temp)
  }

  function rotateDeg(deg: number) {

    const angleRadians = (deg * Math.PI) / 180;

    let temp = mission.clone()
    temp.changeManyParams(wpsIds, selectedSubMission, (cmd) => {
      if ("latitude" in cmd.params && typeof cmd.params.latitude == "number" && typeof cmd.params.longitude == "number") {

        const x = (cmd.params.longitude - lng) * Math.cos(lat * Math.PI / 180);
        const y = cmd.params.latitude - lat;

        const newX = x * Math.cos(angleRadians) - y * Math.sin(angleRadians);
        const newY = x * Math.sin(angleRadians) + y * Math.cos(angleRadians);

        cmd.params.longitude = newX / Math.cos(lat * Math.PI / 180) + lng;
        cmd.params.latitude = newY + lat;
      }

      return cmd;
    }, true)
    setMission(temp);
  }

  function rotate() {
    const angleDegrees = prompt("Enter rotation angle in degrees");
    if (!angleDegrees) return;
    rotateDeg(Number(angleDegrees))
  }

  function place() {
    setTool("Place")
  }

  return (
    <>
      <div className="p-2">
        <label><span className="ml-[4px]">Latitude</span>
          <div className="border-2 border-input rounded-lg w-40 flex overflow-hidden">
            <button onMouseDown={() => nudge(0, -1)} className="h-[21px] w-[21px] flex items-center justify-center bg-muted"><ArrowDown className="h-5 w-5 inline" /></button>
            <span className="w-[2px] bg-input h-[100%] h-[21px]" />
            <span className="flex-grow text-center">{lat.toFixed(6)}</span>
            <span className="w-[2px] bg-input h-[100%] h-[21px]" />
            <button onMouseDown={() => nudge(0, 1)} className="h-[21px] w-[21px] flex items-center justify-center bg-muted"><ArrowUp className="h-5 w-5 inline" /></button>
          </div>
        </label>
      </div>

      <div className="p-2">
        <label><span className="ml-[4px]">Longitude</span>
          <div className="border-2 border-input rounded-lg w-40 flex overflow-hidden">
            <button onMouseDown={() => nudge(-1, 0)} className="h-[21px] w-[21px] flex items-center justify-center bg-muted"><ArrowLeft className="h-5 w-5 inline" /></button>
            <span className="w-[2px] bg-input h-[100%] h-[21px]" />
            <span className="flex-grow text-center">{lng.toFixed(6)}</span>
            <span className="w-[2px] bg-input h-[100%] h-[21px]" />
            <button onMouseDown={() => nudge(1, 0)} className="h-[21px] w-[21px] flex items-center justify-center bg-muted"><ArrowRight className="h-5 w-5 inline" /></button>
          </div>
        </label>
      </div>

      <div className="p-2">
        <label><span className="ml-[4px]"></span>
          <div className="border-2 border-input rounded-lg w-40 overflow-hidden flex">
            <button onMouseDown={move} className="h-[21px] flex-grow bg-muted flex items-center justify-evenly"><LocateFixed className="h-5 w-5 inline" />Move</button>
            <span className="w-[2px] bg-input h-[100%] h-[21px]" />
            <button onMouseDown={place} className="h-[21px] flex-grow bg-muted flex items-center justify-evenly"><MousePointerClick className="w-5 h-5 inline" />Place</button>
          </div>
        </label>
      </div>

      {selectedCommandIDs.length == 0 || selectedCommandIDs.length > 1 ? <div className="p-2">
        <label><span className="ml-[4px]"></span>
          <div className="border-2 border-input rounded-lg w-40 flex overflow-hidden">
            <button onMouseDown={() => rotateDeg(5)} className="h-[21px] w-[21px] flex items-center justify-center bg-muted"><RotateCcw className="h-5 w-5 inline" /></button>
            <span className="w-[2px] bg-input h-[100%] h-[21px]" />
            <button onMouseDown={rotate} className="flex-grow text-center bg-muted">Rotate</button>
            <span className="w-[2px] bg-input h-[100%] h-[21px]" />
            <button onMouseDown={() => rotateDeg(-5)} className="h-[21px] w-[21px] flex items-center justify-center bg-muted"><RotateCw className="h-5 w-5 inline" /></button>
          </div>
        </label>
      </div> : null}
    </>
  );
};

