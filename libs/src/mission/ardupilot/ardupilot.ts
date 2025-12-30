import { DialectCommand } from "@libs/commands/command"
import { Dialect } from "../dialect"
import { mavCmdDescription } from "./commands"

export const ardupilot: Dialect<typeof mavCmdDescription[number]> = {
  name: "ardupilot",
  commandDescriptions: mavCmdDescription,
  convert: (mission) => {
    let commands: DialectCommand<typeof mavCmdDescription[number]>[] = []
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
  getCommandLocation: (cmd) => {
    let a = mavCmdDescription.find(x => x.type == cmd.type)
    if (!a.hasLocation) {
      return null
    }
    //@ts-ignore
    let b = Object.keys(cmd.params).includes("Latitude") ? cmd.params.latitude : null
    //@ts-ignore
    let c = Object.keys(cmd.params).includes("Longitude") ? cmd.params.longitude : null
    if (b === null || c === null) {
      return null
    }
    return { lat: b, lng: c }
  },
  getCommandLabel: (cmd) => {
    let a = mavCmdDescription.find(x => x.type == cmd.type)
    return a.label
  },
  formats: [],
  supportedRFCommands: {
    "RF.DubinsPath": false,
    "RF.Group": false,
    "RF.SetServo": false,
    "RF.Land": false,
    "RF.Takeoff": false,
    "RF.Waypoint": true,
  }

}

