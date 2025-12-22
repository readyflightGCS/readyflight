import { Button } from "@/components/ui/button";
import { useMission } from "@/stores/mission";

export default function Mission() {
  const a = useMission()
  const commands = a.mission.flatten("Main")
  return (
    <div>
      <Button onClick={() => { a.addCommand({ type: "Waypoint", latitude: -3, longitude: 52, altitude: 10 }) }}>Add</Button>
      {commands.map((x) => {
        return (
          <div>{x.type}
          </div>
        )
      })}
    </div>
  )
}
