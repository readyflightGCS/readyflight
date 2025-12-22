import { Mission } from "./mission"
import { RFCommand } from "./RFCommands"

export type BaseDialectCommand = {
  type: number
  params: Record<string, unknown>
}

export type Dialect<DialectCommand extends BaseDialectCommand> = {
  name: string
  convert: (mission: Mission<DialectCommand>) => DialectCommand[] // idk if we'll need something like this ?? maybe just another format but with an "internal" flag
  supportedRFCommands: { [K in RFCommand["type"]]: boolean }
  formats: {
    name: string,
    export: (mission: Mission<DialectCommand>) => Blob //notably this takes a mission as we want to preseve as much info as possible when converting
    import: (mission: Blob) => Mission<DialectCommand>
  }[]
}

