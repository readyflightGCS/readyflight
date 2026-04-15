export type VehicleState = {
  lat: number | null
  lon: number | null
  alt: number | null         // MSL altitude in metres
  relativeAlt: number | null // AGL altitude in metres
  heading: number | null     // degrees 0–360
  roll: number | null        // degrees
  rollRate: number | null        // degrees
  pitch: number | null       // degrees
  pitchRate: number | null       // degrees
  yaw: number | null         // degrees
  yawRate: number | null         // degrees
  airspeed: number | null
  throttle: number | null
  climb: number | null
  batteryVoltage: number | null   // volts
  batteryCurrent: number | null   // amps (-1 = not available)
  batteryRemaining: number | null // percent 0–100, -1 = not available
  batteryConsumedmAh: number | null // percent 0–100, -1 = not available
  groundspeed: number | null      // m/s
  gpsSatellites: number | null
  gpsFixType: number | null
  windDirection: number | null
  windHSpeed: number | null
  windZSpeed: number | null
  airspeedVariance: number | null
  compassVariance: number | null
  posHorizVariance: number | null
  posVertVariance: number | null
  velocityVariance: number | null
  AOA: number | null
  SSA: number | null
  altError: number | null
  aspdError: number | null
  navBearing: number | null
  navPitch: number | null
  navRoll: number | null
  targetBearing: number | null
  wpDist: number | null
  xtrackError: number | null
  missionId: number | null
  missionMode: number | null
  missionState: number | null
  missionSeq: number | null
  missionTotal: number | null
  sendMessage: ((msg: any) => void) | null
}
