import { DialectCommand } from "@libs/commands/command"
import { Mission } from "./mission"
import { RFCommand } from "./RFCommands"

export type Dialect<DC extends DialectCommand> = {
  name: string
  convert: (mission: Mission<DC>) => DC[] // idk if we'll need something like this ?? maybe just another format but with an "internal" flag

  // a list of supported commands that this dialect can compile from
  supportedRFCommands: { [K in RFCommand["type"]]: boolean }

  // the command definitions that this dialect supports
  commands: DC[]

  // file formats that this dialect imports/exports
  formats: {
    name: string,
    export: (mission: Mission<DC>) => Blob //notably this takes a mission as we want to preseve as much info as possible when converting
    import: (mission: Blob) => Mission<DialectCommand>
  }[]
}

