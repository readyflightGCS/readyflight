import { convertArdupilot, exportQGCWaypoints } from "./export"
import { Dialect } from "../dialect"
import { mavCmdDescription } from "./commands"
import { exportRFJSON1 } from "../format/readyflight/json1/export"
import { importRFJSON1 } from "../format/readyflight/json1/import"
import { decodePacket } from "./mavlink-decoder"
import { Attitude } from "./mavlink-assets/messages/attitude"
import { GlobalPositionInt } from "./mavlink-assets/messages/global-position-int"
import { GpsRawInt } from "./mavlink-assets/messages/gps-raw-int"
import { SysStatus } from "./mavlink-assets/messages/sys-status"
import { Statustext } from "./mavlink-assets/messages/statustext"

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
  name: "mavlink-ardupilot",
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
  fileFormats: [
    {
      name: "Readyflight JSON",
      id: "RFJSON1",
      export: (mission, vehicle) => exportRFJSON1(mission, vehicle, ardupilot),
      import: (blob) => importRFJSON1(blob),
      ext: ".json"
    },
    {
      name: ".waypoints",
      id: "QGCmission",
      export: (mission, _) => exportQGCWaypoints(mission),
      ext: ".waypoints"
    }
  ],
  supportedRFCommands: {
    "RF.DubinsPath": false,
    "RF.Group": false,
    "RF.SetServo": false,
    "RF.Land": false,
    "RF.Takeoff": false,
    "RF.Waypoint": true,
  },
  handleTelemetryMessage: (data, setVehicleState) => {
    const msg = decodePacket(data)
    if (!msg) return

    console.log(`[mavlink] ${msg._message_name}`, msg)

    if (msg instanceof GlobalPositionInt) {
      setVehicleState({
        lat: msg.lat / 1e7,
        lon: msg.lon / 1e7,
        alt: msg.alt / 1000,
        relativeAlt: msg.relative_alt / 1000,
        heading: msg.hdg !== 65535 ? msg.hdg / 100 : null,
      })
    } else if (msg instanceof Attitude) {
      const toDeg = (r: number) => r * (180 / Math.PI)
      setVehicleState({
        roll: toDeg(msg.roll),
        pitch: toDeg(msg.pitch),
        yaw: toDeg(msg.yaw),
      })
    } else if (msg instanceof GpsRawInt) {
      setVehicleState({
        gpsSatellites: msg.satellites_visible,
        gpsFixType: msg.fix_type,
        groundspeed: msg.vel !== 65535 ? msg.vel / 100 : null,
      })
    } else if (msg instanceof SysStatus) {
      setVehicleState({
        batteryVoltage: msg.voltage_battery !== 65535 ? msg.voltage_battery / 1000 : null,
        batteryCurrent: msg.current_battery !== -1 ? msg.current_battery / 100 : null,
        batteryRemaining: msg.battery_remaining,
      })
    } else if (msg instanceof Statustext) {
      console.log(`[mavlink] STATUSTEXT [sev=${msg.severity}] ${msg.text}`)
    }
  }
}
