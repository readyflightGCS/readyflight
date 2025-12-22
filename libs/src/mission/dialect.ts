import { RFCommand, Mission, CommandDescription } from "./mission"

export type Dialect<DialectCommand extends CommandDescription> = {
  name: string
  convert: (mission: Mission<DialectCommand>) => DialectCommand[] // idk if we'll need something like this ?? maybe just another format but with an "internal" flag
  supportedRFCommands: { [K in RFCommand["type"]]: boolean }
  formats: {
    name: string,
    export: (mission: Mission<DialectCommand>) => Blob //notably this takes a mission as we want to preseve as much info as possible when converting
    import: (mission: Blob) => Mission<DialectCommand>
  }[]
}

