import { cn } from "@/lib/utils";
import { useVehicle } from "@/stores/vehicle"
import { CopterMode } from "@libs/mission/ardupilot/mavlink-assets/enums/copter-mode";
import { ArrowDown, ArrowUp, LucideAArrowUp, Minus } from "lucide-react";
import { Airspeed, Altimeter, HeadingIndicator } from "react-typescript-flight-indicators"

export default function Telemetry() {
  const [alt, airspeed, heading, groundspeed, voltage, throttle, relativealt, gpsfixtype, gpssatellites, hdop, batteryremaining, mode, isarmed, climb] = useVehicle((v) => [
    v.alt,
    v.airspeed,
    v.heading,
    v.groundspeed,
    v.batteryVoltage,
    v.throttle,
    v.relativeAlt,
    v.gpsFixType,
    v.gpsSatellites,
    v.hdop,
    v.batteryRemaining,
    v.mode,
    v.isArmed,
    v.climb
  ])

  const weightedRelative = (relativealt || 0.1) / 10;

  let isarmedText = "";

  if (isarmed !== null) {
    

    if (isarmed) {
      isarmedText = "Armed";
    } else {
      isarmedText = "Disarmed";
    }
  } else {
    isarmedText = "May be armed";
  }

  let arrowName;

  if (climb){
    let roundedClimb = Math.round(climb);

    if (roundedClimb === 0) {
      arrowName = <Minus className="inline"/>;
    } else if (roundedClimb > 0) {
      arrowName = <ArrowUp className="inline"/>;
    } else {
      arrowName = <ArrowDown className="inline"/>;
    }
  }

  return <div className="w-auto h-auto">
      {/* //<Airspeed speed={airspeed || 0} showBox={false} /> */}
      {/* //<HeadingIndicator heading={heading || 0} showBox={false} /> */}
      {/* <Altimeter altitude={alt || 0} showBox={false}/> */}

      <table>
        <tr>
          <td className="p-1">Airspeed</td>
          <td className="p-1">{Math.round(airspeed || 0)} m/s</td>
          <td className="p-1">Altitude</td>
          <td className="p-1">{Math.round(alt || 0)}m</td>
          <td className="p-1">Heading</td>
          <td className="p-1">{Math.round(heading || 0)}&deg;</td>
        </tr>

        <tr>
          <td className="p-1">Groundspeed</td>
          <td className="p-1">{Math.round(groundspeed || 0)} m/s</td>
          <td className="p-1">Batt Voltage</td>
          <td className="p-1">{voltage || "Unknown"}v</td>
          <td className="p-1">Relative Alt</td>
          <td className="p-1">{Math.round(weightedRelative || 0)}m</td>
        </tr>

        <tr>
          <td className="p-1">Throttle</td>
          <td colSpan={4}>
            <progress value={throttle || 0} max={100}>{throttle}</progress>
          </td>
          <td>{throttle}%</td>
        </tr>

        <tr>
          <td className="p-1">GPS Fix Type</td>
          <td className="p-1">{gpsfixtype}</td>
          <td className="p-1">GPS Satellites</td>
          <td className="p-1">{gpssatellites}</td>
          <td className="p-1">GPS HDOP</td>
          <td className="p-1">{hdop}</td>
        </tr>

        <tr>
          <td className="p-1">Battery remaining</td>
          <td className="p-1">{batteryremaining}</td>
          <td className="p-1">Vehicle Mode</td>
          <td className="p-1">{CopterMode[mode || 0]}</td>
          <td className="p-1">Armed State:</td>
          <td className={cn("p-1", isarmed ? "text-red-400" : "text-green-400")}>{isarmedText}</td>
        </tr>

        <tr>
          <td className="p-1">Climb</td>
          <td className="p-1"><span className="inline">{ climb?.toFixed(2) || 0 }</span> {arrowName}</td>
        </tr>
      </table>
  </div>
}