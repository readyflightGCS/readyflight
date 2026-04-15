import { expect, test } from "bun:test";
import { makeCommand } from "../helpers";
import { ardupilot } from "@libs/mission/ardupilot/ardupilot";

test("make command waypoint", () => {
  const a = makeCommand("D.MAV_CMD_NAV_WAYPOINT", {}, ardupilot)
  expect(a.type).toBe("D.MAV_CMD_NAV_WAYPOINT")
  expect(a.frame).toBe(0)
  expect(a.params.latitude).toBe(0)
  expect(a.params.longitude).toBe(0)
  expect(a.params.altitude).toBe(0)
})

test("make command RF.Waypoint", () => {
  const a = makeCommand("RF.Waypoint", {}, ardupilot)
  expect(a.type).toBe("RF.Waypoint")
  expect(a.frame).toBe(0)
  expect(a.params.latitude).toBe(0)
  expect(a.params.longitude).toBe(0)
  expect(a.params.altitude).toBe(0)
})

test("make command RF.Waypoint", () => {
  const a = makeCommand("RF.Waypoint", { latitude: 52, longitude: -3 }, ardupilot)
  expect(a.type).toBe("RF.Waypoint")
  expect(a.frame).toBe(0)
  expect(a.params.latitude).toBe(52)
  expect(a.params.longitude).toBe(-3)
  expect(a.params.altitude).toBe(0)
})
