import type { Dispatch, SetStateAction } from "react";
import { bound, dubinsPoint, Path } from "./types";
import { XY } from "@libs/math/types";
import { applyBounds, dubinsBetweenDubins, getBounds, getTunableDubinsParameters, setTunableDubinsParameter, setTunableParameter, splitDubinsRuns, waypointToDubins } from "./dubinWaypoints";
import { Mission } from "@libs/mission/mission";
import { DialectCommandDescription } from "@libs/commands/command";
import { Plane } from "@libs/vehicle/types";
import { Dialect } from "@libs/mission/dialect";
import { res } from "@libs/optimisation/types";

// This function is a closure that takes in the waypoints and returns a function that takes in the tunable parameters and returns the total length of the path
export function createEvaluate(wps: dubinsPoint[], optimisationFunction: (path: Path<XY>) => number) {
  // copy the dubins points
  let localWPS: dubinsPoint[] = []
  for (let x = 0; x < wps.length; x++) {
    localWPS.push({ ...wps[x] })
  }

  function evaluate(x: number[]): number {
    setTunableDubinsParameter(localWPS, x)
    let path = dubinsBetweenDubins(localWPS)
    const flatPath = path.flatMap((x) => [x.turnA, x.straight, x.turnB])
    return optimisationFunction(flatPath)
  }
  return evaluate
}

export function staticEvaluate(dialect: Dialect<DialectCommandDescription>, waypoints: Mission<DialectCommandDescription>, activeMission: string, optimisationFunction: (path: Path<XY>) => number, vehicle: Plane) {
  let activeWaypoints = waypoints.mainLine(dialect, activeMission)

  const reference = waypoints.getReferencePoint(dialect)

  let dubinSections = splitDubinsRuns(activeWaypoints)
  let fitness = 0

  // optimise each section of the path
  for (const section of dubinSections) {

    let dubinsPoints: dubinsPoint[] = section.run.map((x) => waypointToDubins(x.cmd, reference, dialect))

    let startingParams = [...getTunableDubinsParameters(dubinsPoints)]
    let bounds: bound[] = [...getBounds(dubinsPoints, vehicle)]
    applyBounds(startingParams, bounds)

    let evaluate = createEvaluate(dubinsPoints, optimisationFunction)
    fitness += evaluate(startingParams)
  }
  return fitness

}

export function bakeDubins(
  dialect: Dialect<DialectCommandDescription>,
  waypoints: Mission<DialectCommandDescription>,
  activeMission: string,
  optimisationmethod: (initialGuess: readonly number[], bounds: bound[], fn: (a: number[]) => number) => res,
  setWaypoints: Dispatch<SetStateAction<Mission<DialectCommandDescription>>>,
  optimisationFunction: (path: Path<XY>) => number, vehicle: Plane
) {
  let mainLine = waypoints.mainLine(dialect, activeMission)

  const startTime = performance.now()

  // get reference waypoint
  const reference = waypoints.getReferencePoint(dialect)

  let dubinSections = splitDubinsRuns(mainLine)
  let endingFitness = 0
  let startingFitness = 0

  let curWaypoints = waypoints.clone()

  // optimise each section of the path
  for (const section of dubinSections) {

    let dubinsPoints: dubinsPoint[] = section.run.map((x) => waypointToDubins(x.cmd, reference, dialect))

    let startingParams = [...getTunableDubinsParameters(dubinsPoints)]
    let bounds: bound[] = [...getBounds(dubinsPoints, vehicle)]
    applyBounds(startingParams, bounds)

    let evaluate = createEvaluate(dubinsPoints, optimisationFunction)
    startingFitness += evaluate(startingParams)
    console.log(startingFitness)

    let result = optimisationmethod(startingParams, bounds, evaluate) // 2041
    console.log(result)
    applyBounds(result.finalVals, bounds)
    endingFitness += evaluate(result.finalVals)
    console.log("fitness: ", result.fitness, "  took: ", result.time)

    setTunableParameter(section.run, result.finalVals)
    // Apply the updated command parameters back onto the cloned waypoint tree.
    // The `mainLine` representation stores the original flattened index in
    // `item.id`, so we can use that directly to locate the corresponding
    // command inside `curWaypoints`.

    for (const item of section.run) {
      // Only Dubins commands have tunable parameters we modified.
      if (item.cmd.type !== "RF.DubinsPath") continue;

      const position = curWaypoints.findNthPosition(activeMission, item.id);
      if (!position) continue;

      const [missionName, idx] = position;
      const missionNodes = curWaypoints.get(missionName);

      const targetNode = missionNodes[idx];
      if (targetNode) {
        // Safety check – ensure we are overwriting the same command type.
        console.assert(item.cmd.type === targetNode.type, "Waypoint type mismatch");
        // Replace the command with the optimised one.
        missionNodes[idx] = { ...item.cmd }
      }
    }
  }
  setWaypoints(curWaypoints)
  const endTime = performance.now()
  return { s: startingFitness, e: endingFitness, t: endTime - startTime }
}

