import { MapPin, Satellite, Cog } from 'lucide-react'
// import { MapPin, Satellite, Plane, Cog } from 'lucide-react'
//import VehicleTabView from './vehicle/vehicle'
import TelemetryView from './telemetry/view'
import SettingsTabView from './settings/view'
import MissionTabView from './mission/view'

export const tabRegistry = [
  {
    name: 'Telemetry',
    Icon: Satellite,
    view: <TelemetryView />
  },
  {
    name: 'Mission',
    Icon: MapPin,
    view: <MissionTabView />
  },
  /*{
    name: 'Vehicle',
    Icon: Plane,
    view: <VehicleTabView />
  },*/
  {
    name: 'Settings',
    Icon: Cog,
    view: <SettingsTabView />
  }
] as const
