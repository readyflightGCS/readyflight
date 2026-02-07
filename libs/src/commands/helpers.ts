import { Dialect } from "@libs/mission/dialect";
import { CommandDescription, CommandParameterUnion, DialectCommandParams, MissionCommand, RFCommand } from "./command";
import { RFCommandDescription } from "./readyflightCommands";
import { objectKeys } from "@libs/util/types";
import { LatLng, LatLngAlt } from "@libs/world/latlng";


/**
 * Get the label for a command. Check the Readyflight commands first, then fallback to the dialect for labels.
 * @param cmd 
 * @param dialect 
 * @returns The label or name of the command
 * @todo possibly replace the readyflight ones with a better way of getting the label (probably from the command description) and just make an exception for Group
 */
export function getCommandLabel(cmd: MissionCommand<CommandDescription>, dialect: Dialect<CommandDescription>) {
  switch (cmd.type) {
    case "RF.Waypoint": return "Waypoint"
    case "RF.DubinsPath": return "Dubins Path"
    case "RF.Land": return "Land"
    case "RF.Takeoff": return "Takeoff"
    case "RF.SetServo": return "Set Servo"
    case "RF.Group": {
      return `${cmd.params.name}`
    }
    default:
      // throw type error here if we've not covered all RF commands
      let exhaustiveCheck: `D_${string}` = cmd.type
      return dialect.getCommandLabel(cmd)
  }
}

/**
 * Gets the geographic location of a command if applicable.
 * @param cmd - The mission command to extract location from
 * @param dialect - The dialect to use for custom command location resolution
 * @returns The latitude/longitude coordinates if the command has a location, null otherwise
 */
export function getCommandLocation(cmd: MissionCommand<CommandDescription>, dialect: Dialect<CommandDescription>): LatLng | null {
  switch (cmd.type) {
    case "RF.Waypoint": return { lat: cmd.params.latitude, lng: cmd.params.longitude }
    case "RF.DubinsPath": return null
    case "RF.Land": return { lat: cmd.params.latitude, lng: cmd.params.longitude }
    case "RF.Takeoff": return { lat: cmd.params.latitude, lng: cmd.params.longitude }
    case "RF.SetServo": return null
    case "RF.Group": return null
    default: {
      let exhaustiveCheck: `D_${string}` = cmd.type
      return dialect.getCommandLocation(cmd)
    }
  }
}

/**
 * Gets the location and altitude information from a mission command.
 * 
 * @param cmd - The mission command to extract location data from
 * @param dialect - The dialect used to handle commands not explicitly matched
 * @returns The latitude, longitude, and altitude object, or null if the command type has no location
 * 
 * @remarks
 * This function handles specific ReadyFlight command types (Waypoint, Land, Takeoff) that contain
 * location data. For command types without location data (DubinsPath, SetServo, Group) or custom
 * dialect-specific commands, it returns null or delegates to the dialect's implementation.
 */
export function getCommandLocationAlt(cmd: MissionCommand<CommandDescription>, dialect: Dialect<CommandDescription>): LatLngAlt {
  switch (cmd.type) {
    case "RF.Waypoint": return { lat: cmd.params.latitude, lng: cmd.params.longitude, alt: cmd.params.altitude }
    case "RF.DubinsPath": return null
    case "RF.Land": return { lat: cmd.params.latitude, lng: cmd.params.longitude, alt: cmd.params.altitude }
    case "RF.Takeoff": return { lat: cmd.params.latitude, lng: cmd.params.longitude, alt: cmd.params.altitude }
    case "RF.SetServo": return null
    case "RF.Group": return null
    default: {
      let exhaustiveCheck: `D_${string}` = cmd.type
      return dialect.getCommandLocationAlt(cmd)
    }
  }
}


/**
 * Retrieves the command description for a given command type from either the ReadyFlight or dialect-specific command descriptions.
 * @param cmdType - The type of the mission command to look up.
 * @param dialect - The dialect containing command descriptions.
 * @returns The command description matching the given type, or `undefined` if not found.
 */
export function getCommandDescription(cmdType: MissionCommand<CommandDescription>["type"], dialect: Dialect<CommandDescription>) {
  if (cmdType.startsWith("RF.")) {
    return RFCommandDescription.find(x => x.type == cmdType)
  } else {
    return dialect.commandDescriptions.find(x => x.type == cmdType)
  }
}

/**
 * Coerce one command into another, carry over similar parameters
 * @param {Command} cmd - The from command
 * @param {T} type - The name of the target command type
 * @returns {ICommand<T>} Returns a default Command of type T, or with carried over parameters from cmd
 */
export function coerceCommand<T extends CommandDescription>(cmd: MissionCommand<CommandDescription>, type: MissionCommand<T>["type"], dialect: Dialect<T>): MissionCommand<T> {
  const newCmd = makeCommand(type, {}, dialect)
  const oldParams = new Set(objectKeys(cmd.params))

  // similar parameter names
  const same = Array.from(objectKeys(newCmd.params)).filter(x => oldParams.has(x))

  const params: { [K in keyof DialectCommandParams<T>]?: number } = {}
  same.forEach((paramName) => {
    const value = cmd.params[paramName as keyof typeof cmd.params]
    if (typeof value === 'number') {
      params[paramName as keyof DialectCommandParams<T>] = value
    }
  })

  return makeCommand(type, params, dialect)
}

/**
 * Construct a default command, or specify some parameters to apply
 * @param {T} name - The command name
 * @param {[K in keyof CommandParams<T>]?: number} params - An object containing key/value params for the command
 * @returns {ICommand<T>} The new command
 */
export function makeCommand<T extends CommandDescription>(
  type: MissionCommand<T>["type"],
  params: { [K in keyof DialectCommandParams<T>]?: number },
  dialect: Dialect<T>
): MissionCommand<T> {
  const newParams: Record<string, CommandParameterUnion["default"]> = {}
  let cmd: T | typeof RFCommandDescription[number] | undefined = undefined
  if (RFCommandDescription.find(cmd => cmd.type === type)) {
    cmd = RFCommandDescription.find(cmd => cmd.type === type)
  }
  if (cmd === undefined && dialect.commandDescriptions.find(cmd => cmd.type === type)) {
    cmd = dialect.commandDescriptions.find(cmd => cmd.type === type)
  }
  if (cmd === undefined) {
    throw new Error("CMD type not found")
  }

  cmd.parameters.forEach((param) => {
    if (param === null) { return }
    const paramKey = param.label.toLowerCase()
    if (paramKey in params) {
      newParams[paramKey] = params[paramKey as keyof typeof params] ?? 0
    } else {
      newParams[paramKey] = param.default ?? 0
    }
  })

  const params2 = newParams as DialectCommandParams<T>

  //@ts-ignore
  return {
    type: cmd.type,
    frame: 2,
    params: params2,
  }
}

/**
 * Filters mission commands to include only those that have a valid geographic location.
 * @param cmds - Array of mission commands to filter
 * @param dialect - The dialect used to interpret command descriptions
 * @returns Filtered array containing only commands that have a valid latitude/longitude location
 */
export function filterLatLngCmds(cmds: MissionCommand<CommandDescription>[], dialect: Dialect<CommandDescription>) {
  return cmds.filter(x => getCommandLocation(x, dialect) !== null)
}

/**
 * Filters mission commands to include only those that have a valid location and altitude.
 * @param cmds - Array of mission commands to filter
 * @param dialect - The dialect used to interpret command descriptions
 * @returns Array of mission commands that have a valid location and altitude
 */
export function filterLatLngAltCmds(cmds: MissionCommand<CommandDescription>[], dialect: Dialect<CommandDescription>) {
  return cmds.filter(x => getCommandLocationAlt(x, dialect) !== null)
}