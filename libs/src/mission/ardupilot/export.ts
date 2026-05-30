import { CommandParams, DialectCommand, RFCommand } from '@libs/commands/command'
import { Mission } from '../mission'
import { mavCmdDescription } from './commands'
import { dubinsBetweenDubins, localiseDubinsPath } from '@libs/dubins/dubinWaypoints'
import { g2l } from '@libs/world/conversion'
import { dubinsPoint, Curve } from '@libs/dubins/types'
import { haversineDistance } from '@libs/world/distance'
import { LatLng } from '@libs/world/latlng'
import { Result } from '@libs/util/try-catch'
import { makeCommand } from '@libs/commands/helpers'
import { ardupilot } from './ardupilot'

/** Tolerance for comparing lat/lng values (~0.1 m at the equator). */
const LATLNG_EPS = 1e-6

export function convertArdupilot(
  mission: Mission<(typeof mavCmdDescription)[number]>
): DialectCommand<(typeof mavCmdDescription)[number]>[] {
  const flattened = mission.flatten('Main')
  const reference = mission.getReferencePoint()
  const result: DialectCommand<(typeof mavCmdDescription)[number]>[] = []

  let i = 0
  while (i < flattened.length) {
    const cmd = flattened[i]

    if (cmd.type === 'RF.DubinsPath') {
      // Batch consecutive RF.DubinsPath commands and convert together
      const dubinsCmds: Extract<RFCommand, { type: 'RF.DubinsPath' }>[] = []
      while (i < flattened.length && flattened[i].type === 'RF.DubinsPath') {
        dubinsCmds.push(flattened[i] as Extract<RFCommand, { type: 'RF.DubinsPath' }>)
        i++
      }
      result.push(...dubinsRun2MAV(dubinsCmds, reference))
    } else if (cmd.type.startsWith('D.')) {
      result.push(cmd as DialectCommand<(typeof mavCmdDescription)[number]>)
      i++
    } else {
      result.push(...RF2MAV(cmd as RFCommand, reference))
      i++
    }
  }

  return result
}

// Helper to create basic Mavlink command
function createMavCmd<CMD extends (typeof mavCmdDescription)[number]>(
  type: CMD['type'],
  params: CommandParams<CMD>
): DialectCommand<CMD> {
  //@ts-ignore
  return {
    type: type,
    frame: 3, // Global Relative Alt
    params: params
  }
}

export type MavCommand = {
  frame: number
  type: (typeof mavCmdDescription)[number]['value']

  param1: number
  param2: number
  param3: number
  param4: number
  param5: number
  param6: number
  param7: number

  autocontinue: number
}

export function MAV2MAVparam(
  command: DialectCommand<(typeof mavCmdDescription)[number]>
): MavCommand {
  const cmdDesc = mavCmdDescription.find((x) => x.type == command.type)
  return {
    type: cmdDesc.value,
    frame: command.frame,
    autocontinue: 1,
    param1: cmdDesc?.parameters[0]
      ? command.params[cmdDesc.parameters[0].label.toLowerCase() as keyof typeof command.params]
      : 0,
    param2: cmdDesc?.parameters[1]
      ? command.params[cmdDesc.parameters[1].label.toLowerCase() as keyof typeof command.params]
      : 0,
    param3: cmdDesc?.parameters[2]
      ? command.params[cmdDesc.parameters[2].label.toLowerCase() as keyof typeof command.params]
      : 0,
    param4: cmdDesc?.parameters[3]
      ? command.params[cmdDesc.parameters[3].label.toLowerCase() as keyof typeof command.params]
      : 0,
    param5: cmdDesc?.parameters[4]
      ? command.params[cmdDesc.parameters[4].label.toLowerCase() as keyof typeof command.params]
      : 0,
    param6: cmdDesc?.parameters[5]
      ? command.params[cmdDesc.parameters[5].label.toLowerCase() as keyof typeof command.params]
      : 0,
    param7: cmdDesc?.parameters[6]
      ? command.params[cmdDesc.parameters[6].label.toLowerCase() as keyof typeof command.params]
      : 0
  }
}

function RF2MAV(
  cmd: RFCommand,
  reference: LatLng
): DialectCommand<(typeof mavCmdDescription)[number]>[] {
  const rfCmd = cmd as RFCommand

  switch (rfCmd.type) {
    case 'RF.Waypoint': {
      return [
        createMavCmd('D.MAV_CMD_NAV_WAYPOINT', {
          hold: 0,
          'accept radius': 0,
          'pass radius': 0,
          yaw: 0,
          latitude: rfCmd.params.latitude,
          longitude: rfCmd.params.longitude,
          altitude: rfCmd.params.altitude
        })
      ]
    }
    case 'RF.Takeoff': {
      return [
        createMavCmd('D.MAV_CMD_NAV_TAKEOFF', {
          pitch: rfCmd.params.pitch ?? 0,
          yaw: rfCmd.params.yaw ?? 0,
          latitude: rfCmd.params.latitude,
          longitude: rfCmd.params.longitude,
          altitude: rfCmd.params.altitude
        })
      ]
    }
    case 'RF.Land': {
      return [
        createMavCmd('D.MAV_CMD_NAV_LAND', {
          'abort alt': rfCmd.params['abort alt'],
          'land mode': rfCmd.params['land mode'],
          'yaw angle': rfCmd.params['yaw angle'],
          latitude: rfCmd.params.latitude,
          longitude: rfCmd.params.longitude,
          altitude: rfCmd.params.altitude
        })
      ]
    }
    case 'RF.Group': {
      console.warn('Encountered unflattened Group command in Ardupilot export')
      return []
    }
    case 'RF.SetServo': {
      return [
        createMavCmd('D.MAV_CMD_DO_SET_SERVO', {
          'servo instance': rfCmd.params.instance,
          pwm: rfCmd.params.pwm
        })
      ]
    }
    case 'RF.DubinsPath': {
      // Should not reach here — DubinsPath runs are batched in convertArdupilot
      return []
    }
  }
}

/**
 * Converts a consecutive run of RF.DubinsPath commands into MAVLink navigation commands.
 *
 * Each RF.DubinsPath command is a single point (lat/lng/alt/radius/gap/heading). A run of
 * N points produces N-1 Dubins segments, each expanded into:
 *   [optional loiter Turn A] → [waypoint at straight.end] → [optional loiter Turn B] → [waypoint at endpoint]
 *
 * Post-processing combines adjacent loiters on the same circle and removes duplicate
 * adjacent waypoints at the same location.
 */
function dubinsRun2MAV(
  cmds: Extract<RFCommand, { type: 'RF.DubinsPath' }>[],
  reference: LatLng
): DialectCommand<(typeof mavCmdDescription)[number]>[] {
  if (cmds.length === 0) return []

  if (cmds.length === 1) {
    const p = cmds[0].params
    return [
      createMavCmd('D.MAV_CMD_NAV_WAYPOINT', {
        hold: 0,
        'accept radius': 0,
        'pass radius': 0,
        yaw: NaN,
        latitude: p.latitude,
        longitude: p.longitude,
        altitude: p.altitude
      })
    ]
  }

  const dPoints: dubinsPoint[] = cmds.map((cmd) => ({
    pos: g2l(reference, { lat: cmd.params.latitude, lng: cmd.params.longitude }),
    radius: cmd.params.radius,
    heading: cmd.params.heading,
    tunable: true,
    passbyRadius: cmd.params.gap,
    bounds: {}
  }))

  const path = dubinsBetweenDubins(dPoints)
  const dubinsPaths = path.map((x) => localiseDubinsPath(x, reference))

  const raw: DialectCommand<(typeof mavCmdDescription)[number]>[] = []

  // Entry waypoint at the first Dubins point (exact user-specified coordinates)
  raw.push(
    createMavCmd('D.MAV_CMD_NAV_WAYPOINT', {
      hold: 0,
      'accept radius': 0,
      'pass radius': 0,
      yaw: NaN,
      latitude: cmds[0].params.latitude,
      longitude: cmds[0].params.longitude,
      altitude: cmds[0].params.altitude
    })
  )

  for (let j = 0; j < dubinsPaths.length; j++) {
    const section = dubinsPaths[j]
    const startAlt = cmds[j].params.altitude
    const endAlt = cmds[j + 1].params.altitude

    const turnALen = Math.abs(section.turnA.theta * section.turnA.radius)
    const straightLen = haversineDistance(section.straight.start, section.straight.end)
    const turnBLen = Math.abs(section.turnB.theta * section.turnB.radius)
    const totalDist = turnALen + straightLen + turnBLen

    // ── Turn A ──────────────────────────────────────────────────────────────
    const absThetaA = Math.abs(section.turnA.theta / (Math.PI * 2))
    if (absThetaA > 0.03 && section.turnA.radius > 0) {
      raw.push(
        createMavCmd('D.MAV_CMD_NAV_LOITER_TURNS', {
          turns: Number(absThetaA.toFixed(4)),
          '': 1, // exit tangent
          altitude: calculateInterpolatedAltitude(startAlt, endAlt, turnALen, totalDist),
          radius: Number((section.turnA.radius * Math.sign(section.turnA.theta)).toFixed(4)),
          latitude: section.turnA.center.lat,
          longitude: section.turnA.center.lng
        })
      )
    }

    // ── Straight section endpoint ────────────────────────────────────────────
    // Omit when the straight end is at the same location as the Dubins endpoint
    // (happens when Turn B is zero — the straight already reaches the endpoint)
    const straightEndLat = section.straight.end.lat
    const straightEndLng = section.straight.end.lng
    const endLat = cmds[j + 1].params.latitude
    const endLng = cmds[j + 1].params.longitude
    const straightIsAtEndpoint =
      Math.abs(straightEndLat - endLat) < LATLNG_EPS &&
      Math.abs(straightEndLng - endLng) < LATLNG_EPS

    if (!straightIsAtEndpoint) {
      raw.push(
        createMavCmd('D.MAV_CMD_NAV_WAYPOINT', {
          hold: 0,
          'accept radius': 0,
          'pass radius': 0,
          yaw: 0,
          latitude: straightEndLat,
          longitude: straightEndLng,
          altitude: calculateInterpolatedAltitude(startAlt, endAlt, turnALen + straightLen, totalDist)
        })
      )
    }

    // ── Turn B ──────────────────────────────────────────────────────────────
    const absThetaB = Math.abs(section.turnB.theta / (Math.PI * 2))
    if (absThetaB > 0.03 && section.turnB.radius > 0) {
      raw.push(
        createMavCmd('D.MAV_CMD_NAV_LOITER_TURNS', {
          turns: Number(absThetaB.toFixed(4)),
          '': 1, // exit tangent
          altitude: endAlt,
          radius: Number((section.turnB.radius * Math.sign(section.turnB.theta)).toFixed(4)),
          latitude: section.turnB.center.lat,
          longitude: section.turnB.center.lng
        })
      )
    }

    // ── Endpoint waypoint ────────────────────────────────────────────────────
    // Always use exact Dubins point coordinates as the endpoint.
    // For intermediate segments, skip when the adjacent turns are on the same circle —
    // those loiters will be combined by simplifyDubinsOutput() and the waypoint between
    // them would interrupt the combined arc.
    const isLastSegment = j === dubinsPaths.length - 1
    const nextSection = isLastSegment ? undefined : dubinsPaths[j + 1]
    const turnsShareCircle =
      nextSection !== undefined && areSameCircle(section.turnB, nextSection.turnA)

    if (!turnsShareCircle) {
      raw.push(
        createMavCmd('D.MAV_CMD_NAV_WAYPOINT', {
          hold: 0,
          'accept radius': 0,
          'pass radius': 0,
          yaw: 0,
          latitude: cmds[j + 1].params.latitude,
          longitude: cmds[j + 1].params.longitude,
          altitude: cmds[j + 1].params.altitude
        })
      )
    }
  }

  return simplifyDubinsOutput(raw)
}

/**
 * Returns true when two Dubins turn arcs lie on the same physical circle:
 * same centre (within ~0.1 m), same radius, same rotation direction.
 */
function areSameCircle(
  c1: Curve<LatLng>,
  c2: Curve<LatLng>
): boolean {
  return (
    Math.abs(c1.center.lat - c2.center.lat) < LATLNG_EPS &&
    Math.abs(c1.center.lng - c2.center.lng) < LATLNG_EPS &&
    Math.abs(c1.radius - c2.radius) < 0.01 &&
    Math.sign(c1.theta) === Math.sign(c2.theta)
  )
}

/**
 * Post-processes a raw Dubins command list:
 * 1. Combines adjacent loiters on the same circle into one (summed turns).
 * 2. Removes duplicate adjacent waypoints at the same location, keeping the
 *    second occurrence (which carries exact Dubins point coordinates).
 */
function simplifyDubinsOutput(
  cmds: DialectCommand<(typeof mavCmdDescription)[number]>[]
): DialectCommand<(typeof mavCmdDescription)[number]>[] {
  const out: DialectCommand<(typeof mavCmdDescription)[number]>[] = []
  let i = 0
  while (i < cmds.length) {
    const cur = cmds[i]
    const next = cmds[i + 1]

    if (!next) {
      out.push(cur)
      break
    }

    // Combine consecutive loiter turns on the same circle
    if (
      cur.type === 'D.MAV_CMD_NAV_LOITER_TURNS' &&
      next.type === 'D.MAV_CMD_NAV_LOITER_TURNS'
    ) {
      const cp = cur.params as any
      const np = next.params as any
      if (
        Math.abs(cp.latitude - np.latitude) < LATLNG_EPS &&
        Math.abs(cp.longitude - np.longitude) < LATLNG_EPS &&
        cp.radius === np.radius
      ) {
        out.push(
          createMavCmd('D.MAV_CMD_NAV_LOITER_TURNS', {
            turns: Number((cp.turns + np.turns).toFixed(4)),
            '': 1,
            altitude: np.altitude, // use altitude of the second (exit) loiter
            radius: cp.radius,
            latitude: cp.latitude,
            longitude: cp.longitude
          })
        )
        i += 2
        continue
      }
    }

    // Remove duplicate adjacent waypoints — keep the second (exact endpoint coords)
    if (
      cur.type === 'D.MAV_CMD_NAV_WAYPOINT' &&
      next.type === 'D.MAV_CMD_NAV_WAYPOINT'
    ) {
      const cp = cur.params as any
      const np = next.params as any
      if (
        Math.abs(cp.latitude - np.latitude) < LATLNG_EPS &&
        Math.abs(cp.longitude - np.longitude) < LATLNG_EPS
      ) {
        out.push(next) // keep second — it holds exact Dubins endpoint coords
        i += 2
        continue
      }
    }

    out.push(cur)
    i++
  }
  return out
}

function calculateInterpolatedAltitude(
  startAlt: number,
  endAlt: number,
  segmentDistance: number,
  totalDistance: number
): number {
  if (totalDistance === 0) return startAlt
  return startAlt + (segmentDistance / totalDistance) * (endAlt - startAlt)
}

export function exportQGCWaypoints(
  mission: Mission<(typeof mavCmdDescription)[number]>
): Result<Blob> {
  let returnString = 'QGC WPL 110\n'

  const reference = mission.getReferencePoint()
  const mavCommands = convertArdupilot(mission)

  // QGC format expects the first point to be the reference point as a waypoint command
  // @ts-ignore REMOVE ONCE MAKECOMMAND DOES BETTER TYPE LIMITING
  returnString += waypointString(
    0,
    MAV2MAVparam(
      makeCommand(
        'D.MAV_CMD_NAV_WAYPOINT',
        { latitude: reference.lat, longitude: reference.lng },
        ardupilot
      )
    )
  )

  mavCommands.forEach((x, i) => {
    returnString += waypointString(i + 1, MAV2MAVparam(x))
  })

  return { data: new Blob([returnString]), error: null }
}

function waypointString(i: number, wp: MavCommand): string {
  return `${i}\t${i == 0 ? '1' : '0'}\t${wp.frame}\t${wp.type}\t${wp.param1}\t${wp.param2}\t${wp.param3}\t${wp.param4}\t${wp.param5}\t${wp.param6}\t${wp.param7}\t${wp.autocontinue}\n`
}
