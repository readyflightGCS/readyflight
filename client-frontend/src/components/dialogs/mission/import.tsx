import { Button } from "@/components/ui/button";
import { useMission } from "@/stores/mission";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";

export default function ImportMission() {
  const [setVehicle, dialect, setMission] = useMission(s => [s.setVehicle, s.dialect, s.setMission])

  const [loading, setLoading] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Early return if no file selected
    if (!event.target.files) {
      return
    }

    const file = event.target.files[0];

    if (!file) {
      // TODO handle with Toast
      console.error("please select a file first")
      return;
    }

    // Go through each file format, check if the file can be parsed. If it succeeds to parse, set it to state
    dialect.fileFormats
      .filter(format => format.import !== undefined)
      .forEach(format => {
        format.import(file).then(res => {

          if (res.error !== null) {
            // TODO handle with Toast
            console.log(res.error)
            return
          }

          setMission(res.data.mission)
          setVehicle(res.data.vehicle)
          setLoading(false)
          /* TODO: move camera to center of mission, close dialog
          let main = missionData.mission.get("Main")
          if (main) {
            const avgll = avgLatLng(filterLatLngCmds(missionData.mission.flatten("Main"), dialect).map(getLatLng))
            if (avgll !== undefined) {
              mapRef.current?.panTo(avgll)
            }
          }
          */
        })
      })
    setLoading(true)
  }

  return (
    <div>
      <Separator />
      <h2>Import</h2>
      <input type="file" accept=".json, .waypoints" id="importFileInput" className="hidden" onChange={handleFileChange} />
      <Button variant="green" onClick={() => document.getElementById('importFileInput')?.click()}>
        {loading ? <LoaderCircle className="animate-spin" /> : <span>Import</span>}
      </Button>
    </div>
  )
}
