import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { downloadBlobAsFile } from '@/lib/utils'
import { useMission } from '@libs/stores/mission'
import { useState } from 'react'
import { Download } from 'lucide-react'

export default function ExportMission() {
  const [vehicle, dialect, mission] = useMission((s) => [s.vehicle, s.dialect, s.mission])

  const startExportType = dialect.fileFormats.filter((x) => x.export !== undefined)[0]?.id as
    | string
    | undefined

  const [fileFormat, setFileFormat] = useState(startExportType)
  const [fileName, setFileName] = useState('mission')
  const [open, setOpen] = useState(false)

  if (startExportType === undefined) {
    return null
  }

  const chosenFileFormat = dialect.fileFormats.find((format) => format.id === fileFormat)

  function onExport() {
    const blob = chosenFileFormat.export(mission, vehicle)
    if (blob.error !== null) {
      console.error(blob.error.message)
      return
    }
    downloadBlobAsFile(`${fileName}${chosenFileFormat.ext}`, blob.data)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="w-full">
          <Download />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-foreground">Export Mission</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-foreground text-sm">File Name</span>
            <Input value={fileName} onChange={(e) => setFileName(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-foreground text-sm">File Format</span>
            <Select value={fileFormat} onValueChange={setFileFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dialect.fileFormats
                  .filter((x) => x.export !== undefined)
                  .map((ff, i) => (
                    <SelectItem key={i} value={ff.id}>
                      {ff.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </label>
          <Button onClick={onExport} variant="green">
            Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
