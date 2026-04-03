import { VehicleSchema } from "@libs/vehicle/types";
import { z } from "zod";

export const RFJSON1Schema = z.object({
  RFVersion: z.string(),
  fileVersion: z.string().regex(/^01.[A-F0-9][A-F0-9]$/),
  exportTime: z.coerce.date(),
  dialect: z.string(),
  vehicle: VehicleSchema,
  mission: z.array(z.object({
    name: z.string(),
    commands: z.array(z.object().passthrough()) // update later to narrow more
  }))
})

export type RFJSON1 = z.infer<typeof RFJSON1Schema>
