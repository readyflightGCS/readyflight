import { RFCommand } from "./readyflightCommands"

export type CommandParameterN = {
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

export type CommandParameterS = {
  parameterType: "string"
  name: string
  label: string
  description: string
  default: number | null
  minLen: number | null
  maxLen: number | null
  options: string[]
}

export type DialectCommand = {
  type: `D_${string}`
  value: number
  label: string
  description: string
  hasLocation: boolean,
  isDestination: boolean
  parameters: (CommandParameterN | CommandParameterS)[]
}

export type Command = DialectCommand | RFCommand
