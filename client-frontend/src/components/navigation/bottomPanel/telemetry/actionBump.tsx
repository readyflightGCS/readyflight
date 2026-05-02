import { CopterMode } from "@libs/mission/ardupilot/mavlink-assets/enums/copter-mode"
import { useVehicle } from "@libs/stores/vehicle"

export default function TelemetryActionBump() {
    const [
        isArmed,
        vehicleMode
    ] = useVehicle((v) => [
        v.isArmed,
        v.mode
    ])

    return (
        <div className="flex flex-1 gap-1 items-center flex-wrape">
            Vehicle: {isArmed !== null ? isArmed ? "Armed" : "Disarmed" : "Unknown State" }
            <div className="h-[20px] w-[1px] bg-border shrink-0" />
            Mode: {vehicleMode !== null ? CopterMode[vehicleMode || 0].replace(/.*_/, "") : "-"}
        </div>
    )
}