import { useVehicle } from '@libs/stores/vehicle'
import { useDialect } from '@libs/stores/dialect'
import { rfIconMap } from '@/lib/rfIcons'

export default function TelemetryActionBump() {
  return (
    <div className="flex flex-1 gap-1 items-center flex-wrap">
      Vehicle: <VehicleArmedStatusIndicator />
      <div className="h-[20px] w-[1px] bg-border shrink-0" />
      Mode: <VehicleModeIndicators />
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
  const availableModes = useDialect((d) => d.activeDialect.availableModes)

  const modeEntry = vehicleMode !== null ? availableModes.find((m) => m.id === vehicleMode) : null

  const label = modeEntry?.label ?? vehicleMode ?? '-'
  const IconComponent = modeEntry?.icon ? rfIconMap[modeEntry.icon] : null

  return (
    <>
      {label} {IconComponent && <IconComponent className="inline align-middle w-4 h-4" />}
    </>
  )
}
