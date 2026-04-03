import { CommandDescription } from "@libs/commands/command";
import { Mission } from "@libs/mission/mission";
import { Vehicle } from "@libs/vehicle/types";
import { RFJSON1 } from "./schema";
import { Dialect } from "@libs/mission/dialect";

export function exportRFJSON1<CD extends CommandDescription>(mission: Mission<CD>, vehicle: Vehicle, dialect: Dialect<CD>) {
  let missionObj: RFJSON1 = {
    RFVersion: "Readyflight:00.00.00", // replace with git derived string
    fileVersion: "01.00",
    exportTime: new Date(),
    dialect: dialect.name,
    vehicle: vehicle,
    mission: mission.getMissions().map((submission) => ({
      name: submission,
      commands: mission.get(submission).map((cmd) => (cmd))
    }))
  }
  console.log(missionObj)
  const str = JSON.stringify(missionObj)
  return str

}
