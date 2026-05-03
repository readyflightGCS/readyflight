import { CopterMode } from "@libs/mission/ardupilot/mavlink-assets/enums/copter-mode"
import { PlaneMode } from "@libs/mission/ardupilot/mavlink-assets/enums/plane-mode"
import { useVehicle } from "@libs/stores/vehicle"
import { ArrowDownToLine, Bot, Check, CircleSlash2, FoldHorizontal, FoldVertical, Milestone, MousePointerClick, TriangleAlert, VectorSquareIcon } from "lucide-react"

export default function TelemetryActionBump() {
    const [
        isArmed,
        vehicleMode
    ] = useVehicle((v) => [
        v.isArmed,
        v.mode
    ])

    let vehicleModeIcon

    if (vehicleMode !== null) {
        let vehicleModeName = PlaneMode[vehicleMode].replace(/^.*?_MODE_/, "").toLowerCase()

        switch (vehicleModeName) {
            case "guided": {
                vehicleModeIcon = <MousePointerClick className="inline align-middle"/>
                break
            }

            case "auto" : {
                vehicleModeIcon = <Bot className="inline align-middle"/>
                break
            }

            case "land" : {
                vehicleModeIcon = <ArrowDownToLine className="inline align-middle"/>
                break                
            }

            case "follow" : {
                vehicleModeIcon = <Milestone className="inline align-middle"/>
                break     
            }

            case "alt_hold" : {
                vehicleModeIcon = <FoldVertical className="inline align-middle"/>
                break     
            }

            case "poshold" : {
                vehicleModeIcon = <FoldHorizontal className="inline align-middle"/>
                break     
            }

            case "stabilize" : {
                vehicleModeIcon = <CircleSlash2 className="inline rotate-45 align-middle"/>
                break     
            }

            default  : {
                vehicleModeIcon = null
                break
            }
        }
    }

    return (
        <div className="flex flex-1 gap-1 items-center flex-wrape">
            Vehicle: {isArmed !== null ? isArmed ? <p className="text-red-400">Armed</p> : <p className="text-green-400">Disarmed</p> : <p className="text-blue-400">Unknown State</p> }
            <div className="h-[20px] w-[1px] bg-border shrink-0" />
            Mode: {vehicleMode !== null ? PlaneMode[vehicleMode].replace(/^.*?_MODE_/, "").toLowerCase() : "-"} {vehicleModeIcon}
        </div>
    )
}