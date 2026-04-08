import { CommandDescription, MissionCommand } from "@libs/commands/command";
import { Mission } from "@libs/mission/mission";
import { Result, tryCatch } from "@libs/util/try-catch";
import { Vehicle } from "@libs/vehicle/types";
import { RFJSON1Schema } from "./schema";

export async function importRFJSON1(blob: Blob): Promise<Result<{ mission: Mission<CommandDescription>, vehicle: Vehicle }>> {
  let x = await blob.text()
  let parsed = await tryCatch(JSON.parse(x))
  if (parsed.error !== null) {
    return {
      error: parsed.error,
      data: null
    }
  }
  let data = RFJSON1Schema.safeParse(parsed.data)
  if (data.success === false) {
    return {
      error: new Error("Does not match RFJSON1 format"),
      data: null
    }
  }

  return {
    error: null,
    data: {
      vehicle: data.data.vehicle,
      mission: new Mission(data.data.explicitReferencePoint, new Map(data.data.mission.map(x => {
        return [x.name, x.commands as MissionCommand<CommandDescription>[]]
      })))
    }
  }

}
