import { useVehicle } from '@libs/stores/vehicle'
import { ReactNode } from 'react'
import {
  ArrowDownToLine,
  Bot,
  CircleSlash2,
  FoldHorizontal,
  FoldVertical,
  Milestone,
  MousePointerClick
} from 'lucide-react'
import { CopterMode } from '@libs/mission/ardupilot/mavlink-assets/enums/copter-mode'

export default function TelemetryActionBump() {
  return (
    <div className="flex flex-1 gap-1 items-center flex-wrap">
      Vehicle:{' '}
      <VehicleArmedStatusIndicator/>
      <div className="h-[20px] w-[1px] bg-border shrink-0" />
      Mode:{' '}
      <VehicleModeIndicators/>
    </div>
  )
}

function VehicleArmedStatusIndicator() {
  const isArmed = useVehicle((v) => v.isArmed)

  if (isArmed !== null) {
    if (isArmed) {
      return <p className="text-red-400">Armed</p>
    } else {
      return <p className="text-green-400">Disarmed</p>
    }
  } else {
    return <p className="text-blue-400">Unknown State</p>
  }
}

function VehicleModeIndicators() {
  const vehicleMode = useVehicle((v) => v.mode)

  let vehicleModeIcon: ReactNode

  if (vehicleMode !== null) {
    const vehicleModeName = CopterMode[vehicleMode].replace(/^.*?_MODE_/, '').toLowerCase()

    switch (vehicleModeName) {
      case 'guided': {
        vehicleModeIcon = <MousePointerClick className="inline align-middle w-4 h-4" />
        break
      }

      case 'auto': {
        vehicleModeIcon = <Bot className="inline align-middle w-4 h-4" />
        break
      }

      case 'land': {
        vehicleModeIcon = <ArrowDownToLine className="inline align-middle w-4 h-4" />
        break
      }

      case 'follow': {
        vehicleModeIcon = <Milestone className="inline align-middle w-4 h-4" />
        break
      }

      case 'alt_hold': {
        vehicleModeIcon = <FoldVertical className="inline align-middle w-4 h-4" />
        break
      }

      case 'poshold': {
        vehicleModeIcon = <FoldHorizontal className="inline align-middle w-4 h-4" />
        break
      }

      case 'stabilize': {
        vehicleModeIcon = <CircleSlash2 className="inline rotate-45 align-middle w-4 h-4" />
        break
      }

      default: {
        vehicleModeIcon = null
        break
      }
    }
  }

  return (
    <>
      {vehicleMode !== null
        ? CopterMode[vehicleMode].replace(/^.*?_MODE_/, '').toLowerCase()
        : '-'}{' '}
      {vehicleModeIcon}      
    </>
  )
}