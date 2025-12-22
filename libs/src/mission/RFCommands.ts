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
  type: "SetServo",
  servoID: number,
  pwm: number
}

export type RFCommand = DubinsPath | Group | Waypoint | Takeoff | Land | SetServo
