import { useVehicle } from "@/stores/vehicle"

export default function Telemetry() {
  let v = useVehicle()
  return (
    <div>
      <div>I am the Telemetry view</div>
      <div>Altitude {v.alt}</div>
      <div>Latitude {v.lat}</div>
      <div>Longitude {v.lon}</div>
      <div>Heading {v.heading}</div>
    </div>
  )
}

