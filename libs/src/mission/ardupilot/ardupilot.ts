import { Dialect } from "../dialect"
import { mavCmds } from "./commands"

export const ardupilot: Dialect<(typeof mavCmds)[number]> = {
  name: "ardupilot",
  commands: mavCmds,
  convert: (mission) => {
    let commands: typeof mavCmds[number][] = []
    for (let _ of mission.get("main")) {
      //if typeof c is MavCommand commands.push(c)
      //
      //else switch on c,
      // flatten group
      // calculate dubins path in mavcommands
      // etc.

    }
    return commands
  },
  formats: [],
  supportedRFCommands: {
    "DubinsPath": false,
    "Group": false,
    "SetServo": false,
    "Land": false,
    "Takeoff": false,
    "Waypoint": false,
  }

}

