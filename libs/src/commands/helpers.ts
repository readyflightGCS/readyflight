import { Dialect } from "@libs/mission/dialect";
import { Command, CommandDescription, MissionCommand } from "./command";

export function getCommandLabel(cmd: MissionCommand<CommandDescription>, dialect: Dialect<CommandDescription>) {
  switch (cmd.type) {
    case "RF.Waypoint": {
      return "Waypoint"
    }
    default:
      return dialect.getCommandLabel(cmd)
  }
}
