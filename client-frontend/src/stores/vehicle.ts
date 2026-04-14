import { createWithEqualityFn as create } from 'zustand/traditional'
import { VehicleState } from '@libs/vehicle/state'

type Actions = {
  setVehicleState: (state: Partial<VehicleState>) => void
}

const initialState: VehicleState = {
  lat: null,
  lon: null,
  alt: null,         // MSL altitude in metres
  relativeAlt: null, // AGL altitude in metres
  heading: null,     // degrees 0–360
  roll: null,        // degrees
  rollRate: null,        // degrees
  pitch: null,       // degrees
  pitchRate: null,       // degrees
  yaw: null,         // degrees
  yawRate: null,         // degrees
  airspeed: null,
  throttle: null,
  climb: null,
  batteryVoltage: null,   // volts
  batteryCurrent: null,   // amps (-1 = not available)
  batteryRemaining: null, // percent 0–100, -1 = not available
  batteryConsumedmAh: null, // percent 0–100, -1 = not available
  groundspeed: null,      // m/s
  gpsSatellites: null,
  gpsFixType: null,
  windDirection: null,
  windHSpeed: null,
  windZSpeed: null,
  airspeedVariance: null,
  compassVariance: null,
  posHorizVariance: null,
  posVertVariance: null,
  velocityVariance: null,
  AOA: null,
  SSA: null,
  altError: null,
  aspdError: null,
  navBearing: null,
  navPitch: null,
  navRoll: null,
  targetBearing: null,
  wpDist: null,
  xtrackError: null,
  missionId: null,
  missionMode: null,
  missionState: null,
  missionSeq: null,
  missionTotal: null,
}

export const useVehicle = create<VehicleState & Actions>((set) => ({
  ...initialState,
  setVehicleState: (partial) => set(partial),
}))
