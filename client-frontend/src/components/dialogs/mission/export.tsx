import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { downloadBlobAsFile } from "@/lib/utils";
import { useMission } from "@/stores/mission";
import { useState } from "react";

export default function ExportMission() {
  const [vehicle, dialect, mission] = useMission(s => [s.vehicle, s.dialect, s.mission])

  let startExportType = dialect.fileFormats.filter(x => x.export !== undefined)[0]?.id as string | undefined

  const [fileFormat, setFileFormat] = useState(startExportType)
  const [fileName, setFileName] = useState("mission")

  // return early if we don't have any available export file formats
  if (startExportType === undefined) {
    return null
  }

  const chosenFileFormat = dialect.fileFormats.find(format => format.id == fileFormat)

  function onExport() {
    const blob = chosenFileFormat.export(mission, vehicle)
    if (blob.error !== null) {
      // TODO handle with toast possibly ?
      console.error(blob.error.message)
      return
    }
    downloadBlobAsFile(`${fileName}${chosenFileFormat.ext}`, blob.data)
  }

  return (
    <div>
      <Separator />
      <h2>Export</h2>
      <div className="w-full flex flex-col gap-2">

        <label>
          File Name
          <Input value={fileName} onChange={(e) => setFileName(e.target.value)} />
        </label>

        <label>File Format
          <Select value={fileFormat} onValueChange={setFileFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dialect.fileFormats.filter(x => x.export !== undefined).map((ff, i) => (
                <SelectItem key={i} value={ff.id}>{ff.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <Button onClick={onExport} variant="green">Export</Button>
      </div>
    </div>
  )
}
