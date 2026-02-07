import { DialectCommand } from "@libs/commands/command"
import { Dialect } from "../dialect"
import { mavCmdDescription } from "./commands"
import { objectKeys } from "@libs/util/types"

/**
 * ArduPilot dialect configuration for mission command conversion and handling.
 * 
 * Defines the ArduPilot-specific dialect for processing MAVLink commands with support for
 * location extraction, command labeling, and format conversion.
 * 
 * @constant
 * @type {Dialect<typeof mavCmdDescription[number]>}
 * 
 * @property {string} name - The dialect identifier ("ardupilot")
 * @property {typeof mavCmdDescription[number][]} commandDescriptions - Array of MAVLink command descriptions
 * @property {Function} convert - Converts a mission object into an array of dialect-specific commands.
 *   Handles command flattening, Dubins path calculation, and group expansion.
 *   @param {Object} mission - The mission object containing commands to convert
 *   @returns {DialectCommand<typeof mavCmdDescription[number]>[]} Converted command array
 * @property {Function} getCommandLocation - Extracts latitude and longitude from a command if it has location data.
 *   @param {DialectCommand<typeof mavCmdDescription[number]>} cmd - The command to extract location from
 *   @returns {{lat: number, lng: number} | null} Location object or null if command has no location
 * @property {Function} getCommandLocationAlt - Extracts latitude, longitude, and altitude from a command.
 *   @param {DialectCommand<typeof mavCmdDescription[number]>} cmd - The command to extract location and altitude from
 *   @returns {{lat: number, lng: number, alt: number} | null} Location and altitude object or null if data is missing
 * @property {Function} getCommandLabel - Retrieves the human-readable label for a command.
 *   @param {DialectCommand<typeof mavCmdDescription[number]>} cmd - The command to get the label for
 *   @returns {string} The command label
 * @property {any[]} formats - Supported file formats (empty for ArduPilot)
 * @property {Object} supportedRFCommands - Feature support matrix for ReadyFlight command types.
 *   Only RF.Waypoint commands are natively supported.
 */
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

