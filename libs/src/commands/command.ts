import { LatLngAlt } from "@libs/world/latlng"
import { RFCommandDescription } from "./readyflightCommands"

type Expand<T> = T extends infer U ? { [K in keyof U]: U[K] } : never


// #########################################
// #          Command Description          #
// #########################################
//
// The shape of the definition of a command, when we want to add new dialects,
// their commands should conform to this description


/**
 * Describes the structure and metadata of a command.
 * @typedef {Object} CommandDescription
 * @property {string} type - The type identifier of the command.
 * @property {number} value - The numeric value associated with the command.
 * @property {string} label - A human-readable label for the command.
 * @property {string} description - A detailed description of what the command does.
 * @property {boolean} hasLocation - Indicates whether the command has a location associated with it.
 * @property {boolean} isDestination - Indicates whether the command represents a destination.
 * @property {CommandParameterUnion[]} parameters - An array of parameter types that the command can accept.
 */
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

/**
 * Describes a numeric command parameter with validation and configuration options.
 * @typedef {Object} CommandParameterDescriptionN
 * @property {string} parameterType - The type of the parameter, always "number".
 * @property {string} label - The display label for the parameter.
 * @property {string} description - A detailed description of what this parameter does.
 * @property {string | null} units - The units of measurement for this parameter, or null if not applicable.
 * @property {number | null} minValue - The minimum allowed value, or null if no minimum.
 * @property {number | null} maxValue - The maximum allowed value, or null if no maximum.
 * @property {number | null} increment - The step/increment value for adjustments, or null if no specific increment.
 * @property {number | null} default - The default value for this parameter, or null if no default.
 * @property {number[]} options - An array of valid numeric options for this parameter.
 */
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

/**
 * Describes a string command parameter.
 * @typedef {Object} CommandParameterDescriptionS
 * @property {string} parameterType - The type of the parameter, set to "string".
 * @property {string} label - A short label for the parameter.
 * @property {string} description - A detailed description of the parameter.
 * @property {string | null} default - The default value for the parameter, or null if no default is set.
 * @property {number | null} minLen - The minimum length of the string, or null if no minimum is enforced.
 * @property {number | null} maxLen - The maximum length of the string, or null if no maximum is enforced.
 * @property {string[]} options - An array of valid string options for the parameter.
 */
export type CommandParameterDescriptionS = {
  parameterType: "string"
  label: string
  description: string
  default: string | null
  minLen: number | null
  maxLen: number | null
  options: string[]
}

/**
 * Describes a command parameter of type latitude/longitude/altitude array.
 * @typedef {Object} CommandParameterDescriptionLLAA
 * @property {string} parameterType - The parameter type identifier, must be "latlngaltarr"
 * @property {string} label - A short label for this parameter
 * @property {string} description - A detailed description of what this parameter does
 * @property {LatLngAlt[]} default - The default value as an array of latitude/longitude/altitude coordinates
 */
export type CommandParameterDescriptionLLAA = {
  parameterType: "latlngaltarr"
  label: string
  description: string
  default: LatLngAlt[]
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