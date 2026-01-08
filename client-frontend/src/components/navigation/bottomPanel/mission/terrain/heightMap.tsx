import { ChangeEvent, useEffect, useState } from "react";
import TerrainChart from "./chart";
import { Button } from "@/components/ui/button";
import { useMission } from "@/stores/mission";
import { LatLng, LatLngAlt } from "@libs/world/latlng";
import { useThrottle } from "@uidotdev/usehooks";
import { filterLatLngAltCmds, getCommandLocationAlt } from "@libs/commands/helpers";
import { adjustAltitudeForDisplay, calculateCumulativeDistances, calculateInterpolatedAltitudes, generateInterpolatedPath, getTerrain, getTerrainElevationAtPoint } from "@libs/world/terrain";
import NumericInput from "@/components/ui/numericInput";
import { CommandDescription, MissionCommand } from "@libs/commands/command";
import { Mission } from "@libs/mission/mission";

// Helper function to get selected commands (keeping this here as it's UI-specific)
function getSelectedCommands(selectedWPs: number[], mission: MissionCommand<CommandDescription>[], waypoints: Mission<CommandDescription>) {
  const selectedNodes = (selectedWPs.length == 0 ? mission : mission.filter((_, i) => selectedWPs.includes(i)))
  return selectedNodes.map((x) => {
    if (x.type == "RF.Group") {
      return waypoints.flatten(x.params.name)
    } else {
      return [x]
    }
  }).flat()
}

export default function HeightMap() {
  const { selectedSubMission, setSelectedSubMission, mission, dialect, setMission, setSelectedCommandIDs, selectedCommandIDs } = useMission();
  const [terrainData, setTerrainData] = useState<LatLngAlt[]>([]);
  const throttledValue = useThrottle(mission, 500);

  const curMission = mission.get(selectedSubMission);
  const wps = mission.flatten(selectedSubMission);
  const wpsLocs = wps.map((x) => getCommandLocationAlt(x, dialect)).filter((x) => x !== undefined)

  let locations: LatLng[] = [];

  // Get new terrain data throttled
  useEffect(() => {
    if (wps.length < 2) return;
    getTerrain(locations).then((data) => {
      if (data) {
        setTerrainData(data);
      }
    });
  }, [throttledValue]);

  if (wps.length < 2) {
    return (
      <div className="h-[150px] flex w-full items-center justify-center">Place two or more waypoints for height map</div>
    );
  }

  // Calculate cumulative distances using the extracted function
  const waypointCumulativeDistances = calculateCumulativeDistances(wpsLocs);
  const totalDistance = waypointCumulativeDistances[waypointCumulativeDistances.length - 1];

  // Generate interpolated path using the extracted function
  locations = generateInterpolatedPath(wpsLocs, totalDistance);

  // Calculate terrain distances (cumulative distances along the fetched terrain path)
  const currentTerrainDistances = calculateCumulativeDistances(terrainData);

  // Calculate minimum terrain height
  const minOverallTerrainHeight = terrainData.length > 0
    ? Math.min(...terrainData.map(td => td.alt))
    : 0;

  // Prepare terrain profile for the chart (normalized elevation)
  const terrainProfileForChart = terrainData.map((td, index) => ({
    distance: parseFloat(currentTerrainDistances[index]?.toFixed(1) || "0"),
    elevation: td.alt - (terrainData[0]?.alt ?? 0)
  }));

  // Prepare command positions for the chart
  const commandPositionsForChart = wpsLocs.map(({ alt, lat, lng }, index) => {
    const wp = wps[index];
    const baseTerrainElevation = terrainData[0]?.alt ?? 0;
    const terrainElevationAtPoint = getTerrainElevationAtPoint(terrainData, { lat, lng });

    const adjustedAltitude = adjustAltitudeForDisplay(
      alt,
      wp.frame,
      terrainElevationAtPoint,
      baseTerrainElevation
    );

    const loc = mission.findNthPosition(selectedSubMission, index)
    const isSelected = loc?.[0] === selectedSubMission && selectedCommandIDs.includes(loc[1])

    return {
      id: index,
      distance: waypointCumulativeDistances[index],
      alt: adjustedAltitude,
      lat,
      lng,
      selected: isSelected,
    };
  });

  // Get selected commands for parameter editing
  const selected = getSelectedCommands(selectedCommandIDs, curMission, mission);

  // for parameters, check which are the same
  const frameValues = filterLatLngAltCmds(selected, dialect).map(obj => obj.frame);
  const frameAllSame = frameValues.every(val => val === frameValues[0]);
  const frameVal = frameAllSame ? frameValues[0] : undefined

  const altValues = filterLatLngAltCmds(selected, dialect).map(obj => obj.params["altitude"]);
  const altAllSame = altValues.every(val => val === altValues[0]);
  const altVal = altAllSame ? altValues[0] : undefined

  // update in change if altitude
  function onChange(event: { target: { name: string, value: number } }) {
    const newWps = mission.clone()
    newWps.changeManyParams(selectedCommandIDs.length === 0 ? curMission.map((_, i) => i) : selectedCommandIDs, selectedSubMission, (cmd: any) => {
      cmd.params["altitude"] = event.target.value
      return cmd
    }, true)
    setMission(newWps)
  }

  const handleCommandClick = (e: React.MouseEvent<SVGElement>, id: number) => {
    const loc = mission.findNthPosition(selectedSubMission, id)
    if (loc !== undefined) {
      setSelectedCommandIDs([loc[1]])
      setSelectedSubMission(loc[0])
    }
  };

  // change the reference frame of all selected commands
  function changeFrame(e: ChangeEvent<HTMLSelectElement>) {
    if (![0, 3, 10].includes(Number(e.target.value))) return
    const val = Number(e.target.value) as 0 | 3 | 10

    const temp = mission.clone()
    temp.changeManyParams(selectedCommandIDs.length === 0 ? curMission.map((_, i) => i) : selectedCommandIDs, selectedSubMission, (x) => {
      if ("altitude" in x.params) {
        x.frame = val
      }
      return x
    }, true)
    setMission(temp)
  }

  // linearly interpolate the heights of the waypoints
  function autoHeight() {
    if (selectedCommandIDs.length < 2) return

    // Get selected commands using the helper function
    const selectedCommands = getSelectedCommands(selectedCommandIDs, curMission, mission);

    // Find indices in the flattened waypoints array that correspond to selected commands with lat/lng/alt
    const flattenedIDs: number[] = []
    let selectedCommandIndex = 0

    for (let i = 0; i < wps.length && selectedCommandIndex < selectedCommands.length; i++) {
      const wp = wps[i]
      const selectedCmd = selectedCommands[selectedCommandIndex]

      // Check if this flattened waypoint matches the current selected command
      if (wp === selectedCmd && "altitude" in wp.params && "latitude" in wp.params && "longitude" in wp.params) {
        flattenedIDs.push(i)
        selectedCommandIndex++
      }
    }

    if (flattenedIDs.length < 2) return

    // Filter waypoints to only include those with the required parameters
    const validWaypoints = wps.filter(wp =>
      "altitude" in wp.params && "latitude" in wp.params && "longitude" in wp.params
    ) as Array<{ params: { latitude: number; longitude: number; altitude: number } }>;

    if (validWaypoints.length < 2) return;

    const { interpolatedAltitudes } = calculateInterpolatedAltitudes(validWaypoints, 0, validWaypoints.length - 1);

    // Apply the interpolated altitudes to the waypoints
    const newWps = mission.clone()

    // Update altitudes for intermediate waypoints
    for (let i = 1; i < flattenedIDs.length - 1; i++) {
      const pos = mission.findNthPosition(selectedSubMission, flattenedIDs[i])
      if (pos === undefined || i - 1 >= interpolatedAltitudes.length) continue

      newWps.changeParam(pos[1], pos[0], (x) => {
        if ("altitude" in x.params) {
          x.params["altitude"] = interpolatedAltitudes[i - 1]
        }
        return x
      }, true)
    }
    setMission(newWps)
  }


  return (
    <div className="w-full p-2">
      <div className="flex flex-row gap-2">
        <label>
          <span className="block">Altitude</span>
          <NumericInput name="altitude" onChange={onChange} value={altVal} />
        </label>
        <label>
          <span className="block">Frame</span>
          <select value={frameAllSame ? "" + frameVal : ""} onChange={changeFrame} className="w-40 h-[25px] border-input bg-card">
            {!frameAllSame ? <option value="" disabled>--</option> : null}
            <option value="3">Relative</option>
            <option value="0">AMSL</option>
            <option value="10">Terrain</option>
          </select>
        </label>
        {selected.length > 2 ?
          <Button variant="active" onClick={autoHeight} >Auto Height</Button>
          : null}
      </div>
      <TerrainChart
        commandPositions={commandPositionsForChart}
        terrainProfile={terrainProfileForChart}
        onCommandClick={handleCommandClick}
      />
    </div>
  );
}
