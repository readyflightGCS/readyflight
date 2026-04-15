import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import { useMission } from "@/stores/mission"
import { useVehicle } from "@/stores/vehicle"

export default function MissionFile() {
  const dialect = useMission(s => s.dialect)
  const mission = useMission(s => s.mission)
  const sendPacket = useVehicle(s => s.sendPacket)

  const handleUpload = () => {
    if (!sendPacket) return
    dialect.uploadMission(mission, sendPacket)
  }

  return (<div>
    <div>
      <span className="text-bold">Test Mission <Pencil className="inline-block w-4" /></span>
    </div>
    <div className="w-full flex items-center flex-col pt-2">
      <div>{sendPacket ? 'Mission ready to upload' : 'No vehicle connection'}</div>
      <Button variant="green" onClick={handleUpload} disabled={!sendPacket}>Upload</Button>
    </div>
  </div>
  )
}
