import { Dialect } from "../dialect"
import { mavCmds } from "./commands"


export const altFrame = {
  "global": 0,
  "mission": 2,
  "relative": 3,
  "terrain": 10
} as const
export type CommandName = typeof mavCmds[number]["name"]
export type CommandValue = typeof mavCmds[number]["value"]
export type CommandParamsNames<T extends CommandName> = Lowercase<NonNullable<
  Extract<
    typeof mavCmds[number],
    { name: T }
  >["parameters"][number]
>["label"]>

// Create a type to map command names to parameter objects, excluding `null` entries
export type CommandParams<T extends CommandName> = {
  [P in CommandParamsNames<T> as P extends string ? Lowercase<P> : never]: number
}

// specific command type
export type ICommand<T extends CommandName> = {
  frame: "altitude" extends CommandParamsNames<T> ? Exclude<typeof altFrame[keyof typeof altFrame], typeof altFrame["mission"]> : 2
  type: Extract<typeof mavCmds[number], { name: T }>["value"]
  autocontinue: number
  params: CommandParams<T>
}

// generic command type
export type MavCommand = { [K in CommandName]: ICommand<K> }[CommandName]




export const ardupilot: Dialect<MavCommand> = {
  name: "ardupilot",
  convert: (mission) => {
    let commands: MavCommand[] = []
    for (let c of mission.get("main")) {
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

