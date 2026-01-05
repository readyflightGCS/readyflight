import { Dialect } from "@libs/mission/dialect";
import { CommandDescription, CommandParameterUnion, DialectCommandParams, MissionCommand } from "./command";
import { RFCommandDescription } from "./readyflightCommands";
import { objectKeys } from "@libs/util/types";

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

export function getCommandDescription(cmdType: MissionCommand<CommandDescription>["type"], dialect: Dialect<CommandDescription>) {
  //@ts-ignore
  if (RFCommandDescription.map(x => x.type).includes(cmdType)) {
    return RFCommandDescription.find(x => x.type == cmdType)
  } else {
    return dialect.commandDescriptions.find(x => x.type == cmdType)
  }
}

/*
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

/*
 * Construct a default command, or specify some parameters to apply
 * @param {T} name - The command name
 * @param {[K in keyof CommandParams<T>]?: number} params - An object containing key/value params for the command
 * @returns {ICommand<T>} The new command
 */
export function makeCommand<T extends CommandDescription>(type: MissionCommand<T>["type"], params: { [K in keyof DialectCommandParams<T>]?: number }, dialect: Dialect<T>): MissionCommand<T> {
  const newParams: Record<string, CommandParameterUnion["default"]> = {}
  let cmd: T | undefined = undefined
  if (RFCommandDescription.find(cmd => cmd.type === type)) {
    //@ts-ignore
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

export function filterLatLngCmds(cmds: MissionCommand<CommandDescription>[], dialect: Dialect<CommandDescription>) {
  return cmds.filter(x => getCommandLocation(x, dialect) !== null)
}

