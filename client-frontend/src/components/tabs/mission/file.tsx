import { Button } from '@/components/ui/button'
import { FolderOpen, Upload } from 'lucide-react'
import { useMission } from '@libs/stores/mission'
import { useVehicle } from '@libs/stores/vehicle'
import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import VehicleSettingsDialog from '@/components/dialogs/mission/settings'
import ExportMission from '@/components/dialogs/mission/export'

export default function MissionFile() {
  const uploadMission = useVehicle((s) => s.uploadMission)
  const connected = useVehicle((s) => s.connected)
  const mission = useMission((s) => s.mission)
  const [setVehicle, dialect, setMission] = useMission((s) => [
    s.setVehicle,
    s.dialect,
    s.setMission
  ])
  const [importing, setImporting] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return
    const file = event.target.files[0]
    if (!file) return

    dialect.fileFormats
      .filter((format) => format.import !== undefined)
      .forEach((format) => {
        format.import(file).then((res) => {
          if (res.error !== null) {
            console.log(res.error)
            return
          }
          setMission(res.data.mission)
          setVehicle(res.data.vehicle)
          setImporting(false)
        })
      })
    setImporting(true)
  }

  return (
    <div className="flex flex-col gap-2">
      <VehicleSettingsDialog />

      <div className="grid grid-cols-2 gap-1">
        <Button
          variant="default"
          size="sm"
          className="w-full"
          onClick={() => document.getElementById('missionImportInput')?.click()}
        >
          {importing ? <LoaderCircle className="animate-spin" /> : <FolderOpen />}
          Import
        </Button>
        <input
          type="file"
          accept=".json,.waypoints"
          id="missionImportInput"
          className="hidden"
          onChange={handleFileChange}
        />
        <ExportMission />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-0.5">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${connected ? 'bg-green-500' : 'bg-muted-foreground/50'}`}
          />
          {connected ? 'Vehicle connected' : 'No vehicle connection'}
        </div>
        <Button
          variant="green"
          size="sm"
          className="w-full"
          onClick={() => uploadMission?.(mission)}
          disabled={!connected}
        >
          <Upload />
          Upload to Vehicle
        </Button>
      </div>
    </div>
  )
}
