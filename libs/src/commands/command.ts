import { LatLngAlt } from "@libs/world/latlng"
import { RFCommandDescription } from "./readyflightCommands"

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

export type CommandDescription = {
  type: string
  value: number
  label: string
  description: string
  hasLocation: boolean,
  isDestination: boolean
  parameters: (CommandParameterDescriptionN | CommandParameterDescriptionS | CommandParameterDescriptionLLAA)[]
}

// Helper type to map parameterType to value type
type ParameterTypeToValueType<T extends CommandParameterDescriptionN | CommandParameterDescriptionS | CommandParameterDescriptionLLAA> =
  T extends { parameterType: "number" } ? number :
  T extends { parameterType: "string" } ? string :
  T extends { parameterType: "latlngaltarr" } ? LatLngAlt[] :
  never

// Generic types that work with any command description array
// These types allow you to create type-safe command types from any array of CommandDescription

// Extract command type names from a command description array
export type CommandNameFromDescriptions<T extends readonly CommandDescription[]> = T[number]["type"]

// Extract parameter names (lowercased) for a specific command from a description array
export type CommandParamsNamesFromDescriptions<
  T extends readonly CommandDescription[],
  CmdName extends CommandNameFromDescriptions<T>
> = Lowercase<NonNullable<Extract<T[number], { type: CmdName }>["parameters"][number]>["label"]>

// Map parameter names to their value types based on parameterType field
export type CommandParamsFromDescriptions<
  T extends readonly CommandDescription[],
  CmdName extends CommandNameFromDescriptions<T>
> = {
    [K in Extract<T[number], { type: CmdName }>["parameters"][number]as Lowercase<K["label"]> extends string ? Lowercase<K["label"]> : never]:
    ParameterTypeToValueType<K>
  }

// A single command instance for a specific command type
export type ICommandFromDescriptions<
  T extends readonly CommandDescription[],
  CmdName extends CommandNameFromDescriptions<T>
> = {
  type: Extract<T[number], { type: CmdName }>["type"]
  frame: number
  params: CommandParamsFromDescriptions<T, CmdName>
}

// Types for working with a single CommandDescription
// Map parameter names to their value types for a single command description
export type CommandParamsFromSingle<CD extends CommandDescription> = {
  [K in CD["parameters"][number]as Lowercase<K["label"]> extends string ? Lowercase<K["label"]> : never]:
  ParameterTypeToValueType<K>
}

// A single command instance from a single command description
export type ICommandFromSingle<CD extends CommandDescription> = {
  type: CD["type"]
  frame: number
  params: CommandParamsFromSingle<CD>
}

// Union type of all commands from a command description array or a single command description
// Usage examples:
//   - Full type safety: DialectCommand<typeof MyCommandDescription> (array)
//   - Generic type safety: DialectCommand<CommandDescription> (single)
//   - Specific command: DialectCommand<MySpecificCommandDescription> (single)
export type DialectCommand<T extends readonly CommandDescription[] | CommandDescription> =
  // Check if T is an array (readonly array check comes first for specificity)
  T extends readonly CommandDescription[]
  ? {
    [K in CommandNameFromDescriptions<T>]: ICommandFromDescriptions<T, K>
  }[CommandNameFromDescriptions<T>]
  : // Otherwise, treat as a single CommandDescription
  T extends CommandDescription
  ? ICommandFromSingle<T>
  : never

// ReadyFlight-specific types (using the generic types)
export type CommandName = CommandNameFromDescriptions<typeof RFCommandDescription>

export type CommandParamsNames<T extends CommandName> = CommandParamsNamesFromDescriptions<typeof RFCommandDescription, T>

export type CommandParams<T extends CommandName> = CommandParamsFromDescriptions<typeof RFCommandDescription, T>

export type ICommand<T extends CommandName> = ICommandFromDescriptions<typeof RFCommandDescription, T>

export type RFCommand = DialectCommand<typeof RFCommandDescription>

// Type alias for cleaner code - represents any command that can be in a mission
export type MissionCommand<CD extends CommandDescription> = RFCommand | DialectCommand<CD>

