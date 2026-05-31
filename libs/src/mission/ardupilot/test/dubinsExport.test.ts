/**
 * Tests for the Ardupilot Dubins-path export.
 *
 * Spec (from requirements):
 *  - Each Dubins path starts and ends at an ArduPilot waypoint located at the
 *    exact Dubins point coordinates.
 *  - Straight sections end in a MAV_CMD_NAV_WAYPOINT.
 *  - Turn sections are represented by MAV_CMD_NAV_LOITER_TURNS (signed radius for
 *    direction; param4=1 for exit-on-tangent). Turns with |theta| ≤ 0.03 turns or
 *    radius = 0 are dropped.
 *  - Altitudes are linearly interpolated across the arc/straight lengths.
 *  - Two adjacent loiters on the same circle (same centre, radius and direction) are
 *    combined into a single loiter with summed turns; the intermediate waypoint is omitted.
 *  - A non-location command (e.g. SetServo) placed between Dubins points breaks the
 *    run so the surrounding loiters are kept separate.
 *  - A Dubins run can be preceded or followed by regular destination commands; the path
 *    is expanded from / to the first/last Dubins point only (context incorporation is a
 *    future enhancement).
 */
import { expect, test, describe } from 'bun:test'
import { convertArdupilot } from '@libs/mission/ardupilot/export'
import { Mission } from '@libs/mission/mission'
import { ardupilot } from '../ardupilot'
import { makeCommand } from '@libs/commands/helpers'
import { DialectCommand, MissionCommand } from '@libs/commands/command'
import { mavCmdDescription } from '../commands'

// ─── helpers ─────────────────────────────────────────────────────────────────

type Cmd = DialectCommand<(typeof mavCmdDescription)[number]>

/** Create an RF.DubinsPath command. */
function dp(
  lat: number,
  lng: number,
  alt: number,
  heading: number,
  radius: number,
  gap = 0
) {
  return makeCommand(
    'RF.DubinsPath',
    { latitude: lat, longitude: lng, altitude: alt, heading, radius, gap },
    ardupilot
  )
}

/** Build a mission from an array of commands and run convertArdupilot. */
function convert(cmds: MissionCommand<(typeof ardupilot.commandDescriptions)[number]>[]) {
  const mission = new Mission<(typeof ardupilot.commandDescriptions)[number]>(ardupilot)
  cmds.forEach((c) => mission.pushToMission('Main', c))
  return convertArdupilot(mission)
}

const isWP = (c: Cmd) => c.type === 'D.MAV_CMD_NAV_WAYPOINT'
const isLoiter = (c: Cmd) => c.type === 'D.MAV_CMD_NAV_LOITER_TURNS'
const lat = (c: Cmd) => (c.params as any).latitude as number
const lng = (c: Cmd) => (c.params as any).longitude as number
const alt = (c: Cmd) => (c.params as any).altitude as number
const turns = (c: Cmd) => (c.params as any).turns as number
const radius = (c: Cmd) => (c.params as any).radius as number

const EPS = 1e-5 // ~1 m tolerance for coordinate comparisons

// meters → degrees (equatorial approximation)
const m2deg = (meters: number) => meters / 111_111

// ─── single point ────────────────────────────────────────────────────────────

describe('single Dubins point', () => {
  test('produces exactly one waypoint at the specified location and altitude', () => {
    const out = convert([dp(1.5, 2.5, 120, 45, 80)])
    expect(out.length).toBe(1)
    expect(isWP(out[0])).toBe(true)
    expect(lat(out[0])).toBeCloseTo(1.5, 5)
    expect(lng(out[0])).toBeCloseTo(2.5, 5)
    expect(alt(out[0])).toBe(120)
  })
})

// ─── collinear two-point path (no turns) ─────────────────────────────────────

describe('two collinear Dubins points (heading north, point B directly north of A)', () => {
  // Heading = 0° (north), second point directly north → turnA ≈ 0, turnB ≈ 0
  const A_lat = 0,
    A_lng = 0
  const B_lat = m2deg(500),
    B_lng = 0 // 500 m north

  test('produces exactly 2 waypoints with no loiters', () => {
    const out = convert([dp(A_lat, A_lng, 100, 0, 50), dp(B_lat, B_lng, 100, 0, 50)])
    expect(out.every(isWP)).toBe(true)
    expect(out.some(isLoiter)).toBe(false)
    expect(out.length).toBe(2)
  })

  test('first waypoint is at A (exact)', () => {
    const out = convert([dp(A_lat, A_lng, 100, 0, 50), dp(B_lat, B_lng, 100, 0, 50)])
    expect(lat(out[0])).toBeCloseTo(A_lat, 5)
    expect(lng(out[0])).toBeCloseTo(A_lng, 5)
  })

  test('last waypoint is at B (exact Dubins point coordinates)', () => {
    const out = convert([dp(A_lat, A_lng, 100, 0, 50), dp(B_lat, B_lng, 100, 0, 50)])
    expect(lat(out[out.length - 1])).toBeCloseTo(B_lat, 5)
    expect(lng(out[out.length - 1])).toBeCloseTo(B_lng, 5)
  })

  test('no duplicate adjacent waypoints', () => {
    const out = convert([dp(A_lat, A_lng, 100, 0, 50), dp(B_lat, B_lng, 100, 0, 50)])
    for (let i = 0; i < out.length - 1; i++) {
      if (!isWP(out[i]) || !isWP(out[i + 1])) continue
      const samePos =
        Math.abs(lat(out[i]) - lat(out[i + 1])) < EPS &&
        Math.abs(lng(out[i]) - lng(out[i + 1])) < EPS
      expect(samePos).toBe(false)
    }
  })
})

// ─── two-point path with a significant turn ───────────────────────────────────

describe('two Dubins points requiring a turn', () => {
  // A is heading north, B is directly east heading east → right-hand turn required
  const A_lat = 0,
    A_lng = 0,
    A_hdg = 0
  const B_lat = 0,
    B_lng = m2deg(1000),
    B_hdg = 90 // 1 km east, heading east

  test('output contains at least one loiter', () => {
    const out = convert([dp(A_lat, A_lng, 100, A_hdg, 100), dp(B_lat, B_lng, 100, B_hdg, 100)])
    expect(out.some(isLoiter)).toBe(true)
  })

  test('first command is a waypoint at A', () => {
    const out = convert([dp(A_lat, A_lng, 100, A_hdg, 100), dp(B_lat, B_lng, 100, B_hdg, 100)])
    expect(isWP(out[0])).toBe(true)
    expect(lat(out[0])).toBeCloseTo(A_lat, 5)
    expect(lng(out[0])).toBeCloseTo(A_lng, 5)
  })

  test('last command is a waypoint at B (exact Dubins point coordinates)', () => {
    const out = convert([dp(A_lat, A_lng, 100, A_hdg, 100), dp(B_lat, B_lng, 100, B_hdg, 100)])
    expect(isWP(out[out.length - 1])).toBe(true)
    expect(lat(out[out.length - 1])).toBeCloseTo(B_lat, 5)
    expect(lng(out[out.length - 1])).toBeCloseTo(B_lng, 5)
  })

  test('loiter exit-tangent param is set to 1', () => {
    const out = convert([dp(A_lat, A_lng, 100, A_hdg, 100), dp(B_lat, B_lng, 100, B_hdg, 100)])
    const loiters = out.filter(isLoiter)
    for (const l of loiters) {
      expect((l.params as any)['']).toBe(1)
    }
  })

  test('right turn produces a positive radius (clockwise)', () => {
    // North → East is a right turn → positive radius in ArduPilot convention
    const out = convert([dp(A_lat, A_lng, 100, A_hdg, 100), dp(B_lat, B_lng, 100, B_hdg, 100)])
    const loiters = out.filter(isLoiter)
    expect(loiters.length).toBeGreaterThan(0)
    // At least one loiter should have a positive (clockwise) radius
    expect(loiters.some((l) => radius(l) > 0)).toBe(true)
  })

  test('left turn produces a negative radius (counter-clockwise)', () => {
    // North → West is a left turn → negative radius
    const out = convert([
      dp(0, 0, 100, 0, 100), // heading north
      dp(0, -m2deg(1000), 100, 270, 100) // 1 km west, heading west
    ])
    const loiters = out.filter(isLoiter)
    expect(loiters.length).toBeGreaterThan(0)
    expect(loiters.some((l) => radius(l) < 0)).toBe(true)
  })
})

// ─── altitude interpolation ──────────────────────────────────────────────────

describe('altitude interpolation', () => {
  test('all intermediate commands have altitude between start and end alt', () => {
    const out = convert([
      dp(0, 0, 100, 0, 100),
      dp(0, m2deg(1000), 200, 90, 100)
    ])
    for (const c of out) {
      expect(alt(c)).toBeGreaterThanOrEqual(100 - 0.01)
      expect(alt(c)).toBeLessThanOrEqual(200 + 0.01)
    }
  })

  test('endpoint waypoint altitude equals the last Dubins point altitude exactly', () => {
    const out = convert([
      dp(0, 0, 100, 0, 100),
      dp(0, m2deg(1000), 250, 90, 100)
    ])
    expect(alt(out[out.length - 1])).toBe(250)
  })

  test('entry waypoint altitude equals the first Dubins point altitude exactly', () => {
    const out = convert([
      dp(0, 0, 75, 0, 100),
      dp(0, m2deg(1000), 200, 90, 100)
    ])
    expect(alt(out[0])).toBe(75)
  })
})

// ─── 3-point path with known geometry ────────────────────────────────────────

describe('three-point Dubins run using known geometry', () => {
  // This geometry mirrors the dubinsWaypoint.test.ts fixtures:
  //   A = (0 m, 0 m)  heading north, radius 4
  //   B = (0 m, 10 m north) heading north, radius 4  → segment A→B is straight
  //   C = (10 m east, 10 m north) heading south, radius 4 → segment B→C has turnB ≈ π/2
  const m = m2deg(1)
  const A = dp(0, 0, 100, 0, 4)
  const B = dp(10 * m, 0, 150, 0, 4)
  const C = dp(10 * m, 10 * m, 200, 180, 4)

  test('first command is a waypoint at A', () => {
    const out = convert([A, B, C])
    expect(isWP(out[0])).toBe(true)
    expect(lat(out[0])).toBeCloseTo(0, 5)
    expect(lng(out[0])).toBeCloseTo(0, 5)
    expect(alt(out[0])).toBe(100)
  })

  test('last command is a waypoint at C (exact coordinates and altitude)', () => {
    const out = convert([A, B, C])
    const last = out[out.length - 1]
    expect(isWP(last)).toBe(true)
    expect(lat(last)).toBeCloseTo(10 * m, 5)
    expect(lng(last)).toBeCloseTo(10 * m, 5)
    expect(alt(last)).toBe(200)
  })

  test('output contains at least one loiter (B→C has turnB ≈ π/2)', () => {
    const out = convert([A, B, C])
    expect(out.some(isLoiter)).toBe(true)
  })

  test('no duplicate adjacent waypoints at the same location', () => {
    const out = convert([A, B, C])
    for (let i = 0; i < out.length - 1; i++) {
      if (!isWP(out[i]) || !isWP(out[i + 1])) continue
      const samePos =
        Math.abs(lat(out[i]) - lat(out[i + 1])) < EPS &&
        Math.abs(lng(out[i]) - lng(out[i + 1])) < EPS
      expect(samePos).toBe(false)
    }
  })

  test('altitudes are monotonically interpolated (100 → 200)', () => {
    const out = convert([A, B, C])
    for (const c of out) {
      expect(alt(c)).toBeGreaterThanOrEqual(100 - 0.01)
      expect(alt(c)).toBeLessThanOrEqual(200 + 0.01)
    }
  })
})

// ─── SetServo breaks the Dubins run ──────────────────────────────────────────

describe('non-location command between Dubins points breaks the run', () => {
  test('SetServo is preserved and lies between the two Dubins expansions', () => {
    const mission = new Mission<(typeof ardupilot.commandDescriptions)[number]>(ardupilot)
    // Run 1
    mission.pushToMission('Main', dp(0, 0, 100, 0, 100))
    mission.pushToMission('Main', dp(0, m2deg(500), 100, 90, 100))
    // Break
    mission.pushToMission(
      'Main',
      makeCommand('RF.SetServo', { instance: 3, pwm: 1800 }, ardupilot)
    )
    // Run 2
    mission.pushToMission('Main', dp(0, m2deg(1000), 100, 0, 100))
    mission.pushToMission('Main', dp(0, m2deg(1500), 100, 90, 100))

    const out = convertArdupilot(mission)

    const servoIdx = out.findIndex((c) => c.type === 'D.MAV_CMD_DO_SET_SERVO')
    expect(servoIdx).toBeGreaterThan(0)
    expect(servoIdx).toBeLessThan(out.length - 1)

    // The run before the servo should have ended with a WP
    expect(isWP(out[servoIdx - 1])).toBe(true)
    // The run after the servo should start with a WP
    expect(isWP(out[servoIdx + 1])).toBe(true)
  })
})

// ─── Dubins run preceded by a regular waypoint ───────────────────────────────

describe('Dubins run preceded and followed by regular waypoints', () => {
  test('regular waypoint before and after Dubins run is preserved', () => {
    const mission = new Mission<(typeof ardupilot.commandDescriptions)[number]>(ardupilot)
    mission.pushToMission(
      'Main',
      makeCommand('RF.Waypoint', { latitude: -0.001, longitude: 0, altitude: 100 }, ardupilot)
    )
    mission.pushToMission('Main', dp(0, 0, 100, 0, 50))
    mission.pushToMission('Main', dp(m2deg(500), 0, 100, 0, 50))
    mission.pushToMission(
      'Main',
      makeCommand('RF.Waypoint', { latitude: m2deg(500) + 0.001, longitude: 0, altitude: 100 }, ardupilot)
    )

    const out = convertArdupilot(mission)

    // First command: the preceding waypoint
    expect(isWP(out[0])).toBe(true)
    expect(lat(out[0])).toBeCloseTo(-0.001, 5)

    // Last command: the following waypoint
    expect(isWP(out[out.length - 1])).toBe(true)
    expect(lat(out[out.length - 1])).toBeCloseTo(m2deg(500) + 0.001, 5)
  })
})

// ─── loiter combination ───────────────────────────────────────────────────────

describe('adjacent loiters on the same circle are combined', () => {
  // Craft a 3-point path where B is a smooth pass-through so that
  // Turn B of A→B and Turn A of B→C are on the same circle.
  // The simplest setup: all 3 points collinear+same heading produces no turns,
  // so we instead verify the general invariant: no two consecutive loiters
  // at the same centre in the output.
  test('no two consecutive loiters at the same centre appear in the output', () => {
    const m = m2deg(1)
    const out = convert([
      dp(0, 0, 100, 0, 50),
      dp(10 * m, 0, 150, 0, 50),
      dp(10 * m, 10 * m, 200, 180, 50)
    ])

    for (let i = 0; i < out.length - 1; i++) {
      if (!isLoiter(out[i]) || !isLoiter(out[i + 1])) continue
      const sameCenter =
        Math.abs(lat(out[i]) - lat(out[i + 1])) < EPS &&
        Math.abs(lng(out[i]) - lng(out[i + 1])) < EPS
      // Same-circle adjacent loiters must have been combined → should not exist
      expect(sameCenter).toBe(false)
    }
  })
})

// ─── zero / near-zero turns are dropped ──────────────────────────────────────

describe('zero or near-zero turns are removed', () => {
  test('collinear path produces no loiters at all', () => {
    const out = convert([
      dp(0, 0, 100, 0, 50),
      dp(m2deg(1000), 0, 100, 0, 50)
    ])
    expect(out.some(isLoiter)).toBe(false)
  })

  test('three collinear points produce only waypoints', () => {
    const out = convert([
      dp(0, 0, 100, 0, 50),
      dp(m2deg(500), 0, 100, 0, 50),
      dp(m2deg(1000), 0, 100, 0, 50)
    ])
    expect(out.every(isWP)).toBe(true)
  })
})
