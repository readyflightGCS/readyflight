//// Readyflight supported commands



export type DubinsPath = {
  type: "DubinsPath"
  points: {
    latitude: number,
    longitude: number,
    altitude: number
    heading: number,
    offset: number,
    radius: number
  }[]
}

export type Group = {
  type: "Group"
  name: string
}

export type Waypoint = {
  type: "Waypoint"
  latitude: number,
  longitude: number,
  altitude: number // TODO make a generic type for Altitude that we can switch case over (AMSL, Relative, Terrain ...)
}

export type Takeoff = {
  type: "Takeoff"
  latitude: number,
  longitude: number,
  altitude: number
}

export type Land = {
  type: "Land"
  latitude: number,
  longitude: number,
  altitude: number
}

export type SetServo = {
  servoID: number,
  pwm: number
}

export type Command = DubinsPath | Group | Waypoint | Takeoff | Land | SetServo


export type Mission<dCommand> = Map<string, (Command | dCommand)[]>



//// Command Dialects & formats
// dialects are frameworks for commands ie. mavlink, multiwii, etc
// formats are internal/file formats ie. wpm2.json, .plan, .mission etc.


export type Dialect<dCommand> = {
  name: string
  convert: (mission: Mission<dCommand>) => dCommand[] // idk if we'll need something like this ?? maybe just another format but with an "internal" flag
  formats: {
    name: string,
    export: (mission: Mission<dCommand>) => Blob //notably this takes a mission as we want to preseve as much info as possible when converting
    import: (mission: Blob) => Mission<dCommand>
  }[]
}





//// MAVLINK stuff from waypoint maker just temporary while i test stuff

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


export const mavCmds = [{
  value: 16,
  name: "MAV_CMD_NAV_WAYPOINT",
  description: "Navigate to waypoint. This is intended for use in missions (for guided commands outside of missions use MAV_CMD_DO_REPOSITION).",
  hasLocation: true,
  isDestination: true,
  parameters: [{
    index: 1,
    label: "Hold",
    description: "Hold time. (ignored by fixed wing, time to stay at waypoint for rotary wing)",
    units: "s",
    minValue: 0,
    maxValue: null,
    increment: null,
    default: null,
    options: [],
  }, {
    index: 2,
    label: "Accept Radius",
    description: "Acceptance radius (if the sphere with this radius is hit, the waypoint counts as reached)",
    units: "m",
    minValue: 0,
    maxValue: null,
    increment: null,
    default: null,
    options: [],
  }, {
    index: 3,
    label: "Pass Radius",
    description: "0 to pass through the WP, if &gt; 0 radius to pass by WP. Positive value for clockwise orbit, negative value for counter-clockwise orbit. Allows trajectory control.",
    units: "m",
    minValue: null,
    maxValue: null,
    increment: null,
    default: null,
    options: [],
  }, {
    index: 4,
    label: "Yaw",
    description: "Desired yaw angle at waypoint (rotary wing). NaN to use the current system yaw heading mode (e.g. yaw towards next waypoint, yaw to home, etc.).",
    units: "deg",
    minValue: null,
    maxValue: null,
    increment: null,
    default: null,
    options: [],
  }, {
    index: 5,
    label: "Latitude",
    description: "Latitude",
    units: "",
    minValue: null,
    maxValue: null,
    increment: null,
    default: null,
    options: [],
  }, {
    index: 6,
    label: "Longitude",
    description: "Longitude",
    units: "",
    minValue: null,
    maxValue: null,
    increment: null,
    default: null,
    options: [],
  }, {
    index: 7,
    label: "Altitude",
    description: "Altitude",
    units: "m",
    minValue: null,
    maxValue: null,
    increment: null,
    default: null,
    options: [],
  }],
}, {
  value: 17,
  name: "MAV_CMD_NAV_LOITER_UNLIM",
  description: "Loiter around this waypoint an unlimited amount of time",
  hasLocation: true,
  isDestination: true,
  parameters: [null, null, {
    index: 3,
    label: "Radius",
    description: "Loiter radius around waypoint for forward-only moving vehicles (not multicopters). If positive loiter clockwise, else counter-clockwise",
    units: "m",
    minValue: null,
    maxValue: null,
    increment: null,
    default: null,
    options: [],
  }, {
      index: 4,
      label: "Yaw",
      description: "Desired yaw angle. NaN to use the current system yaw heading mode (e.g. yaw towards next waypoint, yaw to home, etc.).",
      units: "deg",
      minValue: null,
      maxValue: null,
      increment: null,
      default: null,
      options: [],
    }, {
      index: 5,
      label: "Latitude",
      description: "Latitude",
      units: "",
      minValue: null,
      maxValue: null,
      increment: null,
      default: null,
      options: [],
    }, {
      index: 6,
      label: "Longitude",
      description: "Longitude",
      units: "",
      minValue: null,
      maxValue: null,
      increment: null,
      default: null,
      options: [],
    }, {
      index: 7,
      label: "Altitude",
      description: "Altitude",
      units: "m",
      minValue: null,
      maxValue: null,
      increment: null,
      default: null,
      options: [],
    }],
}, {
  value: 18,
  name: "MAV_CMD_NAV_LOITER_TURNS",
  description: "Loiter around this waypoint for X turns",
  hasLocation: true,
  isDestination: true,
  parameters: [{
    index: 1,
    label: "Turns",
    description: "Number of turns.",
    units: "",
    minValue: 0,
    maxValue: null,
    increment: null,
    default: null,
    options: [],
  }, null, {
    index: 3,
    label: "Radius",
    description: "Radius around waypoint. If positive loiter clockwise, else counter-clockwise",
    units: "m",
    minValue: null,
    maxValue: null,
    increment: null,
    default: null,
    options: [],
  }, {
    index: 4,
    label: "",
    description: "Forward moving aircraft this sets exit xtrack location: 0 for center of loiter wp, 1 for exit location. Else, this is desired yaw angle. NaN to use the current system yaw heading mode (e.g. yaw towards next waypoint, yaw to home, etc.).",
    units: "",
    minValue: null,
    maxValue: null,
    increment: null,
    default: null,
    options: [],
  }, {
    index: 5,
    label: "Latitude",
    description: "Latitude",
    units: "",
    minValue: null,
    maxValue: null,
    increment: null,
    default: null,
    options: [],
  }, {
    index: 6,
    label: "Longitude",
    description: "Longitude",
    units: "",
    minValue: null,
    maxValue: null,
    increment: null,
    default: null,
    options: [],
  }, {
    index: 7,
    label: "Altitude",
    description: "Altitude",
    units: "m",
    minValue: null,
    maxValue: null,
    increment: null,
    default: null,
    options: [],
  }],
}] as const


// mavlink example dialect

export const mavLink: Dialect<MavCommand> = {
  name: "MavLink",
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
  formats: [

  ]

}
