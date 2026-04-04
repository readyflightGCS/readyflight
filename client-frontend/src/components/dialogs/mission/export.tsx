import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { downloadBlobAsFile } from "@/lib/utils";
import { useMission } from "@/stores/mission";
import { useState } from "react";

export default function ExportMission() {
  const vehicle = useMission(s => s.vehicle)
  const dialect = useMission(s => s.dialect)
  const mission = useMission(s => s.mission)
  let startExportType = ""
  if (dialect.fileFormats.filter(x => x.export !== undefined).length > 0) {
    startExportType = dialect.fileFormats.filter(x => x.export !== undefined)[0].id
  }

  const [fileFormat, setFileFormat] = useState(startExportType)
  const [fileName, setFileName] = useState("mission")
  if (startExportType === "") {
    return null
  }

  const chosenFileFormat = dialect.fileFormats.find(x => x.id == fileFormat)
  function onExport() {
    const blob = chosenFileFormat.export(mission, vehicle)
    if (blob.error !== null) {
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
