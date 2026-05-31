import { expect, test } from 'bun:test'
import { makeCommand } from '../helpers'
import { ardupilot } from '@libs/mission/ardupilot/ardupilot'

test('make command waypoint', () => {
  const a = makeCommand('D.MAV_CMD_NAV_WAYPOINT', {}, ardupilot)
  const p = a.params as { latitude: number; longitude: number; altitude: number }
  expect(a.type).toBe('D.MAV_CMD_NAV_WAYPOINT')
  expect(a.frame).toBe(0)
  expect(p.latitude).toBe(0)
  expect(p.longitude).toBe(0)
  expect(p.altitude).toBe(0)
})

test('make command RF.Waypoint', () => {
  const a = makeCommand('RF.Waypoint', {}, ardupilot)
  const p = a.params as { latitude: number; longitude: number; altitude: number }
  expect(a.type).toBe('RF.Waypoint')
  expect(a.frame).toBe(0)
  expect(p.latitude).toBe(0)
  expect(p.longitude).toBe(0)
  expect(p.altitude).toBe(100)
})

test('make command RF.Waypoint', () => {
  const a = makeCommand('RF.Waypoint', { latitude: 52, longitude: -3 }, ardupilot)
  const p = a.params as { latitude: number; longitude: number; altitude: number }
  expect(a.type).toBe('RF.Waypoint')
  expect(a.frame).toBe(0)
  expect(p.latitude).toBe(52)
  expect(p.longitude).toBe(-3)
  expect(p.altitude).toBe(100)
})
