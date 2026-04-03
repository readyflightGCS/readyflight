
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMission } from "@/stores/mission";
import { exportRFJSON1 } from "@libs/mission/format/readlight/json1/export";
export default function ExportMission() {
  const vehicle = useMission(s => s.vehicle)
  const dialect = useMission(s => s.dialect)
  const mission = useMission(s => s.mission)
  return (
    <div>
      <h2>Export</h2>
      <div className="w-full flex flex-col gap-2">
        <label>
          File Name
          <Input defaultValue={"Mission"} />
        </label>
        <label>File Format
          <Select value="RFJSON1">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RFJSON1">Readyflight JSON</SelectItem>
              <SelectItem value="QGCwaypoints">qgc .waypoint</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <Button onClick={() => exportRFJSON1(mission, vehicle, dialect)} variant="green">Export</Button>
      </div>
    </div>
  )
}
