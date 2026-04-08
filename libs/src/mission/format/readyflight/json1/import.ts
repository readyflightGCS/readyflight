import { CommandDescription, MissionCommand } from "@libs/commands/command";
import { Mission } from "@libs/mission/mission";
import { Result, tryCatch } from "@libs/util/try-catch";
import { Vehicle } from "@libs/vehicle/types";
import { RFJSON1Schema } from "./schema";

export async function importRFJSON1(blob: Blob): Promise<Result<{ mission: Mission<CommandDescription>, vehicle: Vehicle }>> {

  let fileText = await tryCatch(blob.text())
  if (fileText.error !== null) {
    return {
      error: fileText.error,
      data: null
    }
  }

  let parsedJSON = await tryCatch(JSON.parse(fileText.data))
  if (parsedJSON.error !== null) {
    return {
      error: parsedJSON.error,
      data: null
    }
  }

  let missionObj = RFJSON1Schema.safeParse(parsedJSON.data)
  if (missionObj.success === false) {
    return {
      error: new Error("Does not match RFJSON1 format"),
      data: null
    }
  }

  return {
    error: null,
    data: {
      vehicle: missionObj.data.vehicle,
      mission: new Mission(missionObj.data.explicitReferencePoint, new Map(missionObj.data.mission.map(x => {
        // A bit hacky; We don't currently validate each individual command
        return [x.name, x.commands as MissionCommand<CommandDescription>[]]
      })))
    }
  }

}
