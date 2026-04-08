import { expect, test } from "bun:test";
import { exportQGCWaypoints } from "@libs/mission/ardupilot/export";
import { Mission } from "@libs/mission/mission";
import { ardupilot } from "../ardupilot";
import { makeCommand } from "@libs/commands/helpers";

test(".waypoints export uses QGC WPL 110 and includes reference waypoint + mission waypoint", async () => {
  const reference = { lat: 10.1, lng: 20.2 };
  const mission = new Mission<typeof ardupilot.commandDescriptions[number]>(reference);
  mission.pushToMission("Main", makeCommand("RF.Waypoint", { latitude: 10.11, longitude: 20.02, altitude: 123 }, ardupilot))

  const exported = exportQGCWaypoints(mission);
  expect(exported.error).toBeNull();

  const text = await exported.data!.text();
  const lines = text.trimEnd().split("\n");

  expect(lines[0]).toBe("QGC WPL 110");
  console.log(lines)
  expect(lines.length).toBe(3); // header + reference WP + 1 mission WP

  const refCols = lines[1].split("\t");
  expect(refCols[0]).toBe("0"); // seq
  expect(refCols[1]).toBe("1"); // current
  expect(refCols[2]).toBe("0"); // frame
  expect(refCols[3]).toBe("16"); // MAV_CMD_NAV_WAYPOINT
  expect(refCols[8]).toBe(String(reference.lat)); // param5 (lat)
  expect(refCols[9]).toBe(String(reference.lng)); // param6 (lng)
  expect(refCols[10]).toBe("1"); // param6 (lng)

  const wpCols = lines[2].split("\t");
  expect(wpCols[0]).toBe("1");
  expect(wpCols[1]).toBe("0");
  expect(wpCols[1]).toBe("0");
  expect(wpCols[3]).toBe("16");
  expect(wpCols[8]).toBe("10.11");
  expect(wpCols[9]).toBe("20.22");
  expect(wpCols[10]).toBe("123"); // param7 (alt)
});

test(".waypoints export uses QGC WPL 110 and includes reference waypoint + mission waypoint", async () => {
  const reference = { lat: 10.1, lng: 20.2 };
  const mission = new Mission<typeof ardupilot.commandDescriptions[number]>(reference);
  mission.pushToMission("Main", makeCommand("D.MAV_CMD_NAV_TAKEOFF", { latitude: 10.11, longitude: 21.02, altitude: 123 }, ardupilot))
  mission.pushToMission("Main", makeCommand("D.MAV_CMD_NAV_WAYPOINT", { latitude: 10.11, longitude: 20.02, altitude: 123 }, ardupilot))
  mission.pushToMission("Main", makeCommand("D.MAV_CMD_NAV_WAYPOINT", { latitude: 11.11, longitude: 20.02, altitude: 123 }, ardupilot))
  mission.pushToMission("Main", makeCommand("D.MAV_CMD_NAV_WAYPOINT", { latitude: 11.11, longitude: 21.02, altitude: 123 }, ardupilot))
  mission.pushToMission("Main", makeCommand("D.MAV_CMD_NAV_WAYPOINT", { latitude: 10.11, longitude: 21.02, altitude: 123 }, ardupilot))
  mission.pushToMission("Main", makeCommand("D.MAV_CMD_NAV_LAND", { latitude: 10.11, longitude: 20.02, altitude: 0 }, ardupilot))

  const exported = exportQGCWaypoints(mission);
  expect(exported.error).toBeNull();
});


