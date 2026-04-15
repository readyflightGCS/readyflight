import { Button } from "@/components/ui/button"
import { useVehicle } from "@/stores/vehicle"
import { PlaneMode } from "@libs/mission/ardupilot/mavlink-assets/enums/plane-mode"

export default function Telemetry() {
  let [connected, alt, lat, lon, heading, sendMessage] = useVehicle((v) => [v.connected, v.alt, v.lat, v.lon, v.heading, v.sendMessage])
  return (
    <div>
      <div>{connected ? "Backend Connected" : "Backend Not Connected"}</div>
      <div>Altitude {alt}</div>
      <div>Latitude {lat}</div>
      <div>Longitude {lon}</div>
      <div>Heading {heading}</div>
      <Button onClick={() => sendMessage?.({ type: 'arm' })}>Arm</Button>
      <Button onClick={() => sendMessage?.({ type: 'disarm' })}>Disarm</Button>
      <Button onClick={() => sendMessage?.({ type: 'setMode', mode: PlaneMode.PLANE_MODE_GUIDED })}>Guided</Button>
      <Button onClick={() => sendMessage?.({ type: 'setMode', mode: PlaneMode.PLANE_MODE_AUTO })}>Auto</Button>
      <Button onClick={() => sendMessage?.({ type: 'setMode', mode: PlaneMode.PLANE_MODE_MANUAL })}>Manual</Button>
      <Button onClick={() => sendMessage?.({ type: 'setMode', mode: PlaneMode.PLANE_MODE_TAKEOFF })}>Takeoff</Button>
    </div>
  )
}

