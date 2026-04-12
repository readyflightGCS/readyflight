import { createWithEqualityFn as create } from 'zustand/traditional'
import { VehicleState } from '@libs/vehicle/state'

type Actions = {
  setVehicleState: (state: Partial<VehicleState>) => void
}

const initialState: VehicleState = {
  lat: null,
  lon: null,
  alt: null,
  relativeAlt: null,
  heading: null,
  roll: null,
  pitch: null,
  yaw: null,
  batteryVoltage: null,
  batteryCurrent: null,
  batteryRemaining: null,
  groundspeed: null,
  gpsSatellites: null,
  gpsFixType: null,
}

export const useVehicle = create<VehicleState & Actions>((set) => ({
  ...initialState,
  setVehicleState: (partial) => set(partial),
}))
