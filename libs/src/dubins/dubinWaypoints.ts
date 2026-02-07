// TODO: this file helps convert the Dubins mission commands into the MAVLINK compilant commands

import { modf, offset } from "@libs/math/geometry"
import { DubinsBetweenDiffRad } from "./dubins";
import { g2l, l2g } from "@libs/world/conversion";
import { crossProduct } from "@libs/math/vector";
import { deg2rad } from "@libs/math/geometry";
import { bound, DubinsPath, dubinsPoint, Path, Segment } from "./types";
import { XY } from "@libs/math/types";
import { LatLng } from "@libs/world/latlng";
import { getCommandLocation } from "@libs/commands/helpers";
import { MainLine } from "@libs/mission/mission";
import { Plane } from "@libs/vehicle/types";

/**
 * Identify all contiguous waypoint segments that require Dubins‑path generation.
 *
 * @remarks
 * A Dubins run is defined as any consecutive sequence of waypoints whose command
 * type is `69` (the Dubins‑path marker). Each returned segment includes:
 *
 * - the index at which the Dubins run begins in the original waypoint list  
 * - the full run of waypoints, including one waypoint before and after the run
 *   when available, ensuring the Dubins path can connect smoothly to adjacent
 *   mission legs  
 *
 * The function scans the waypoint list in order, grouping all adjacent Dubins
 * waypoints into sections. When a non‑Dubins waypoint is encountered, the
 * current section is closed and emitted.
 *
 * @param mainLine Ordered list of mission waypoints to analyze
 * @returns An array of Dubins‑run descriptors, each containing the start index
 * and the expanded waypoint slice needed for Dubins‑path computation
 */
export function splitDubinsRuns(mainLine: MainLine): { start: number, run: { cmd: LatLngAltCommand, id: number, other: Command[] }[] }[] {
  let dubinSections: { start: number, run: { cmd: LatLngAltCommand, id: number, other: Command[] }[] }[] = []

  let curSection: MainLine = []
  let start = 0
  for (let i = 0; i < mainLine.length; i++) {
    const curWaypoint = mainLine[i].cmd
    if (curWaypoint.type == 69) {
      if (curSection.length == 0) {
        start = i
        if (i > 0) {
          curSection.push(mainLine[i - 1])
        }
      }
      curSection.push(mainLine[i])
    } else {
      if (curSection.length > 0) {
        if (i < mainLine.length) {
          curSection.push(mainLine[i])
        }
        dubinSections.push({ start: start, run: curSection })
        curSection = []
      }
    }
  }
  if (curSection.length > 0) {
    dubinSections.push({ start: start, run: curSection })
  }
  return dubinSections
}

/**
 * Convert a Dubins path expressed in local ENU coordinates into a WGS84‑based
 * Dubins path anchored to a given geographic reference point.
 *
 * @remarks
 * Each component of the Dubins path—turn A, straight segment, and turn B—contains
 * one or more XY coordinates representing centers or endpoints in the local ENU
 * frame. This function transforms those coordinates into latitude/longitude
 * positions by applying the `l2g` conversion relative to the supplied reference.
 *
 * The returned structure preserves all non‑geometric fields from the original
 * path while replacing each XY coordinate with its corresponding geographic
 * location. This is typically used when a locally planned Dubins maneuver must
 * be exported or visualised in global WGS84 space.
 *
 * @param path Dubins path defined in local ENU coordinates
 * @param reference Geographic reference point used for ENU→WGS84 conversion
 * @returns A Dubins path with all coordinates expressed as WGS84 latitude/longitude
 */
export function localiseDubinsPath(path: DubinsPath<XY>, reference: LatLng): DubinsPath<LatLng> {
  return {
    turnA: { ...path.turnA, center: l2g(reference, path.turnA.center) },
    straight: { ...path.straight, start: l2g(reference, path.straight.start), end: l2g(reference, path.straight.end) },
    turnB: { ...path.turnB, center: l2g(reference, path.turnB.center) }
  }
}

/**
 * Converts a path from local XY coordinates to global latitude/longitude coordinates
 * @param {Path<XY>} path - The path in local XY coordinates
 * @param {LatLng} reference - The reference point used for coordinate conversion
 * @returns {Path<LatLng>} The path converted to latitude/longitude coordinates
 */
export function localisePath(path: Path<XY>, reference: LatLng): Path<LatLng> {
  let newPath: Path<LatLng> = []
  for (let segment of path) {
    switch (segment.type) {
      case "Curve": {
        let { center, ...rest } = segment
        let newCenter = l2g(reference, { x: center.x, y: center.y })
        let newSegment: Segment<LatLng> = { ...rest, center: newCenter }
        newPath.push(newSegment)
        break;
      }
      case "Straight": {
        let { start, end, ...rest } = segment
        let newStart = l2g(reference, { x: start.x, y: start.y })
        let newEnd = l2g(reference, { x: end.x, y: end.y })
        let newSegment: Segment<LatLng> = { ...rest, end: newEnd, start: newStart }
        newPath.push(newSegment)
        break
      }
    }
  }
  return newPath
}

/**
 * Generates a Dubins path between a list of waypoints
 * @param {dubinsPoint[]} wps - The list of waypoints
 * @returns {Path<XY>} The Dubins path
 */
export function dubinsBetweenDubins(wps: dubinsPoint[]): DubinsPath<XY>[] {
  let path: DubinsPath<XY>[] = []
  for (let i = 0; i < wps.length - 1; i++) {
    const a = wps[i]
    const b = wps[i + 1]

    let adir = 0;
    let bdir = 0

    //figure out offset direction
    if (i > 0) {
      adir = crossProduct(wps[i - 1].pos, a.pos, b.pos) > 0 ? 1 : -1 // clamp to 1 and -1
    }
    if (i < wps.length - 2) {
      bdir = crossProduct(a.pos, b.pos, wps[i + 2].pos) > 0 ? 1 : -1
    }

    let offsetA = offset(a.pos, a.passbyRadius * adir, deg2rad(a.heading + 90))
    let offsetB = offset(b.pos, b.passbyRadius * bdir, deg2rad(b.heading + 90))
    const res = DubinsBetweenDiffRad(offsetA, offsetB, deg2rad(a.heading), deg2rad(b.heading), a.radius, b.radius)
    if (res.error) {
      console.error(res.error)
    } else {
      path.push(res.data)
    }
  }
  return path
}

/**
 * Extracts the tunable parameters from a list of waypoints
 * @param {dubinsPoint[]} wps - The list of waypoints
 * @returns {number[]} The tunable parameters
 */
export function getTunableDubinsParameters(wps: dubinsPoint[]): number[] {
  // heading | radius
  let ret: number[] = []
  for (const waypoint of wps) {
    if (waypoint.tunable) {
      ret.push(waypoint.heading)
      ret.push(waypoint.radius)
    }
  }
  return ret
}

/**
 * Calculates the minimum turn radius based on the maximum bank angle and velocity
 * @param {number} maxBank - The maximum bank angle
 * @param {number} velocity - The velocity
 * @returns {number} The minimum turn radius
 */
export function getMinTurnRadius(maxBank: number, velocity: number): number {
  return Math.pow(velocity, 2) / (9.8 * Math.tan(deg2rad(maxBank)))
}

/**
 * Calculates the bounds for the tunable parameters of a list of waypoints
 * @param {dubinsPoint[]} wps - The list of waypoints
 * @param {Plane} vehicle - The vehicle type
 * @returns {bound[]} The bounds for the tunable parameters
 */
export function getBounds(wps: dubinsPoint[], vehicle: Plane): bound[] {
  // heading | radius
  const bounds = []
  for (const waypoint of wps) {
    if (waypoint.tunable) {
      bounds.push({ min: 0, max: 360, circular: true })
      bounds.push({ min: Math.max(getMinTurnRadius(vehicle.maxBank, vehicle.cruiseAirspeed), waypoint.passbyRadius) })
    }
  }
  return bounds
}

/**
 * Applies bounds to the tunable parameters
 * @param {number[]} params - The tunable parameters
 * @param {bound[]} bounds - The bounds for the tunable parameters
 */
export function applyBounds(params: number[], bounds: bound[]): void {
  for (let i = 0; i < bounds.length; i++) {
    let bound = bounds[i]
    if (bound.min != undefined && bound.max != undefined && bound.circular) {
      let range = bound.max - bound.min
      let diff = params[i] - bound.min
      params[i] = bound.min + modf(diff, range)
    } else if (bound.min != undefined && params[i] < bound.min) {
      params[i] = bound.min
    } else if (bound.max != undefined && params[i] > bound.max) {
      params[i] = bound.max
    }
  }
}

/**
 * Converts a waypoint to a dubins point, Dubins points are in local XY coordinates
 * @param {LatLngCommand} cmd - The command with position
 * @param {LatLng} reference - The reference point used for coordinate conversion
 * @returns {dubinsPoint} The dubins point
 */
export function waypointToDubins(cmd: LatLngCommand, reference: LatLng): dubinsPoint {
  if (cmd.type == 69) {
    return { pos: g2l(reference, getCommandLocation(cmd)), bounds: {}, radius: cmd.params.radius, heading: cmd.params.heading, tunable: true, passbyRadius: cmd.params["fly-by distance"] }
  } else {
    return { pos: g2l(reference, getCommandLocation(cmd)), bounds: {}, radius: 0, heading: 0, tunable: false, passbyRadius: 0 }
  }
}

/**
 * Sets the tunable parameters for a list of waypoints
 * @param {Waypoint[]} wps - The list of waypoints
 * @param {number[]} params - The tunable parameters
 */
export function setTunableParameter(wps: MainLine, params: number[]): void {
  let paramI = 0
  for (let i = 0; i < wps.length; i++) {
    let cur = wps[i]
    if (cur.cmd.type == 69) {
      // radians
      cur.cmd.params.heading = modf(params[paramI++], 360)
      cur.cmd.params.radius = params[paramI++]
    }
  }
}

/**
 * Sets the tunable parameters for a list of dubins points
 * @param {dubinsPoint[]} wps - The list of dubins points
 * @param {number[]} params - The tunable parameters
 */
export function setTunableDubinsParameter(wps: dubinsPoint[], params: number[]): void {
  let paramI = 0
  for (let i = 0; i < wps.length; i++) {
    let cur = wps[i]
    if (cur.tunable) {
      // radians
      cur.heading = modf(params[paramI++], 360)
      cur.radius = params[paramI++]
    }
  }
}