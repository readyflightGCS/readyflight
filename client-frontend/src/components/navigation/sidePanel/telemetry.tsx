import { useVehicle } from "@/stores/vehicle"

export default function Telemetry() {
  let [alt, lat, lon, heading] = useVehicle((v) => [v.alt, v.lat, v.lon, v.heading])
  return (
    <div>
      <div>I am the Telemetry view</div>
      <div>Altitude {alt}</div>
      <div>Latitude {lat}</div>
      <div>Longitude {lon}</div>
      <div>Heading {heading}</div>
    </div>
  )
}

