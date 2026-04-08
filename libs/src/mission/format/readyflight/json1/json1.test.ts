import { expect, test } from "bun:test";
import { Mission } from "@libs/mission/mission";
import { exportRFJSON1 } from "./export";
import { importRFJSON1 } from "./import";
import { RFJSON1Schema } from "./schema";
import { ardupilot } from "@libs/mission/ardupilot/ardupilot";
import type { Vehicle } from "@libs/vehicle/types";
import { makeCommand } from "@libs/commands/helpers";
import { mavCmdDescription } from "@libs/mission/ardupilot/commands";

test("readyflight json1 export matches schema", async () => {
  const vehicle: Vehicle = { type: "Copter" };
  const mission = new Mission<typeof mavCmdDescription[number]>({ lat: 51.5, lng: -0.12 });
  mission.pushToMission("Main", makeCommand("RF.Waypoint", { latitude: 51.501, longitude: -0.121, altitude: 42 }, ardupilot))

  const exported = exportRFJSON1(mission, vehicle, ardupilot);
  expect(exported.error).toBeNull();
  expect(exported.data).toBeInstanceOf(Blob);

  const text = await exported.data!.text();
  const json = JSON.parse(text);
  const parsed = RFJSON1Schema.safeParse(json);
  expect(parsed.success).toBeTrue();

  if (parsed.success) {
    expect(parsed.data.missionID).toBe(mission.missionID);
    expect(parsed.data.dialect).toBe(ardupilot.name);
    expect(parsed.data.fileVersion).toMatch(/^01\.[A-F0-9][A-F0-9]$/);
    expect(parsed.data.exportTime).toBeInstanceOf(Date);
    expect(parsed.data.vehicle).toEqual(vehicle);
    expect(parsed.data.mission.find((m) => m.name === "Main")?.commands.length).toBe(1);
  }
});

test("readyflight json1 import accepts exported blob and returns mission + vehicle", async () => {
  const vehicle: Vehicle = { type: "Copter" };
  const mission = new Mission<typeof mavCmdDescription[number]>({ lat: 1, lng: 2 });
  mission.pushToMission("Main", makeCommand("RF.Waypoint", { latitude: 1.001, longitude: 2.002, altitude: 50 }, ardupilot))

  const exported = exportRFJSON1(mission, vehicle, ardupilot);
  expect(exported.error).toBeNull();

  const imported = await importRFJSON1(exported.data!);
  expect(imported.error).toBeNull();
  expect(imported.data).not.toBeNull();

  expect(imported.data!.vehicle).toEqual(vehicle);
  expect(imported.data!.mission).toBeInstanceOf(Mission);
  expect(imported.data!.mission.getMissions()).toContain("Main");
  expect(imported.data!.mission.get("Main").length).toBe(1);
});

test("readyflight json1 import rejects invalid payload", async () => {
  const invalid = new Blob([JSON.stringify({ hello: "world" })], { type: "application/json" });
  const imported = await importRFJSON1(invalid);
  expect(imported.error).not.toBeNull();
  expect(imported.data).toBeNull();
});

