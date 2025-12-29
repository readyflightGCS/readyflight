export type DubinsPath = {
  type: "RF.DubinsPath"
  label: string
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
  type: "RF.Group"
  label: string
  name: string
}

export type Waypoint = {
  type: "RF.Waypoint"
  label: string
  latitude: number,
  longitude: number,
  altitude: number // TODO make a generic type for Altitude that we can switch case over (AMSL, Relative, Terrain ...)
}

export type Takeoff = {
  type: "RF.Takeoff"
  label: string
  latitude: number,
  longitude: number,
  altitude: number
}

export type Land = {
  type: "RF.Land"
  label: string
  latitude: number,
  longitude: number,
  altitude: number
}

export type SetServo = {
  type: "RF.SetServo",
  label: string
  servoID: number,
  pwm: number
}

export type RFCommand = DubinsPath | Group | Waypoint | Takeoff | Land | SetServo
