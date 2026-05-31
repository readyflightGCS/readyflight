import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import { useMission } from '@libs/stores/mission'
import { useVehicle } from '@libs/stores/vehicle'

export default function MissionFile() {
  const mission = useMission((s) => s.mission)
  const uploadMission = useVehicle((s) => s.uploadMission)

  const handleUpload = () => {
    uploadMission?.(mission)
  }

  return (
    <div>
      <div>
        <span className="text-bold">
          Test Mission <Pencil className="inline-block w-4" />
        </span>
      </div>
      <div className="w-full flex items-center flex-col pt-2">
        <div>{uploadMission ? 'Mission ready to upload' : 'No vehicle connection'}</div>
        <Button variant="green" onClick={handleUpload} disabled={!uploadMission}>
          Upload
        </Button>
      </div>
    </div>
  )
}
