import { Dialect } from "@libs/mission/dialect";
import { CommandDescription, MissionCommand } from "./command";

export function getCommandLabel(cmd: MissionCommand<CommandDescription>, dialect: Dialect<CommandDescription>) {
  switch (cmd.type) {
    case "RF.Waypoint": {
      return "Waypoint"
    }
    case "RF.Group": {
      return `${cmd.params.name}`
    }
    default:
      return dialect.getCommandLabel(cmd)
  }
}

export function getCommandLocation(cmd: MissionCommand<CommandDescription>, dialect: Dialect<CommandDescription>) {
  switch (cmd.type) {
    case "RF.Waypoint": {
      return { lat: cmd.params.latitude as number, lng: cmd.params.longitude as number }
    }
  }
  return dialect.getCommandLocation(cmd)
}
export function filterLatLngCmds(cmds: MissionCommand<CommandDescription>[], dialect: Dialect<CommandDescription>) {
  return cmds.filter(x => getCommandLocation(x, dialect) !== null)
}
