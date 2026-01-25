import { convertArdupilot } from "./export"
import { Dialect } from "../dialect"
import { mavCmdDescription } from "./commands"

export const ardupilot: Dialect<typeof mavCmdDescription[number]> = {
  name: "ardupilot",
  commandDescriptions: mavCmdDescription,
  convert: convertArdupilot,
  getCommandLocation: (cmd) => {
    let a = mavCmdDescription.find(x => x.type == cmd.type)
    if (!a.hasLocation) {
      return null
    }
    //@ts-ignore
    let b = objectKeys(cmd.params).includes("latitude") ? cmd.params.latitude : null
    //@ts-ignore
    let c = objectKeys(cmd.params).includes("longitude") ? cmd.params.longitude : null
    if (b === null || c === null) {
      return null
    }
    return { lat: b, lng: c }
  },
  getCommandLocationAlt: (cmd) => {
    let a = mavCmdDescription.find(x => x.type == cmd.type)
    if (!a.hasLocation) {
      return null
    }
    //@ts-ignore
    let b = objectKeys(cmd.params).includes("latitude") ? cmd.params.latitude : null
    //@ts-ignore
    let c = objectKeys(cmd.params).includes("longitude") ? cmd.params.longitude : null
    //@ts-ignore
    let d = objectKeys(cmd.params).includes("altitude") ? cmd.params.altitude : null
    if (b === null || c === null || d === null) {
      return null
    }
    return { lat: b, lng: c, alt: d }
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

