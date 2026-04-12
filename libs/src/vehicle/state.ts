export type VehicleState = {
  lat: number | null
  lon: number | null
  alt: number | null         // MSL altitude in metres
  relativeAlt: number | null // AGL altitude in metres
  heading: number | null     // degrees 0–360
  roll: number | null        // degrees
  pitch: number | null       // degrees
  yaw: number | null         // degrees
  batteryVoltage: number | null   // volts
  batteryCurrent: number | null   // amps (-1 = not available)
  batteryRemaining: number | null // percent 0–100, -1 = not available
  groundspeed: number | null      // m/s
  gpsSatellites: number | null
  gpsFixType: number | null
}
