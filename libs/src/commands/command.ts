import { LatLngAlt } from "@libs/world/latlng"
import { RFCommandDescription } from "./readyflightCommands"

type Expand<T> = T extends infer U ? { [K in keyof U]: U[K] } : never


// #########################################
// #          Command Description          #
// #########################################
//
// The shape of the definition of a command, when we want to add new dialects,
// their commands should conform to this description

export type CommandDescription = {
  type: string
  value: number
  label: string
  description: string
  hasLocation: boolean,
  isDestination: boolean
  // parameters types that it can accept.
  parameters: (CommandParameterUnion)[]
}

export type CommandParameterDescriptionN = {
  parameterType: "number"
  label: string
  description: string
  units: string | null
  minValue: number | null
  maxValue: number | null
  increment: number | null
  default: number | null
  options: number[]
}

export type CommandParameterDescriptionS = {
  parameterType: "string"
  label: string
  description: string
  default: number | null
  minLen: number | null
  maxLen: number | null
  options: string[]
}

export type CommandParameterDescriptionLLAA = {
  parameterType: "latlngaltarr"
  label: string
  description: string
}

// remember to add any new types to this union
export type CommandParameterUnion =
  CommandParameterDescriptionS |
  CommandParameterDescriptionN |
  CommandParameterDescriptionLLAA

// and remember to add it to this thing. TODO maybe derive this somehow
type ParameterTypeToValueType<T extends CommandParameterUnion> =
  T extends { parameterType: "number" } ? number :
  T extends { parameterType: "string" } ? string :
  T extends { parameterType: "latlngaltarr" } ? LatLngAlt[] :
  never



// #########################################
// #            Dialect Command            #
// #########################################
//
// This is the shape of the data in memory that we store about commands. 


// This is the definition for the parameters, it basically grabs all of the 
// parameters from the Command definition and puts the lowercase label against 
// the type of the parameter. For instance {name: string, altitude: number ..}
export type DialectCommandParams<CD extends CommandDescription> = {
  [K in CD["parameters"][number]as
  Lowercase<K["label"]> extends string
  ? Lowercase<K["label"]>
  : never
  ]: ParameterTypeToValueType<K>
}

export type DialectCommand<CD extends CommandDescription> =
  CD extends CommandDescription ?
  {
    type: CD["type"]
    frame: number
    params: Expand<DialectCommandParams<CD>>
  } : never

export type RFCommand = DialectCommand<typeof RFCommandDescription[number]>

// Type alias for cleaner code - represents any command that can be in a mission
export type MissionCommand<CD extends CommandDescription> =
  RFCommand | (DialectCommand<CD> & { type: `D_${string}` })

// Just a sanity check to make sure params type is working correctly
// let a: MissionCommand<CommandDescription> = { type: "RF.Waypoint", frame: 0, params: {} }
