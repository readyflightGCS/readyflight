import { Mission } from "./mission"
import { LatLng, LatLngAlt } from "@libs/world/latlng"
import { CommandDescription, DialectCommand, RFCommand } from "@libs/commands/command"

export type Dialect<CD extends CommandDescription> = {
  name: string
  convert: (mission: Mission<CD>) => DialectCommand<CD>[] // idk if we'll need something like this ?? maybe just another format but with an "internal" flag

  // a list of supported commands that this dialect can compile from
  supportedRFCommands: { [K in RFCommand["type"]]: boolean }

  // the command definitions that this dialect supports
  commandDescriptions: CD[]

  getCommandLocation: (command: DialectCommand<CD>) => (LatLng | null)
  getCommandLocationAlt: (command: DialectCommand<CD>) => (LatLngAlt | null)
  getCommandLabel: (command: DialectCommand<CD>) => string

  // file formats that this dialect imports/exports
  formats: {
    name: string,
    export: (mission: Mission<CD>) => Blob //notably this takes a mission as we want to preseve as much info as possible when converting
    import: (mission: Blob) => Mission<CommandDescription>
  }[]
}

