import { Button } from "@/components/ui/button";
import { useMission } from "@/stores/mission";
import { Separator } from "@/components/ui/separator";
import { CommandDescription } from "@libs/commands/command";
import { Vehicle } from "@libs/vehicle/types";
import { Mission } from "@libs/mission/mission";
import { useRFMap } from "@/stores/map";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";

export default function ImportMission() {
  const setVehicle = useMission(s => s.setVehicle)
  const setMission = useMission(s => s.setMission)
  const dialect = useMission(s => s.dialect)

  const [loading, setLoading] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return
    }

    const file = event.target.files[0];

    if (!file) {
      console.error("please select a file first")
      return;
    }

    let missionData: { mission: Mission<CommandDescription>, vehicle: Vehicle } | null = null
    dialect.fileFormats.filter(x => x.import !== undefined).forEach(x => {
      console.log("trying parser: ", x.name)
      x.import(file).then(res => {
        if (res.error === null) {
          missionData = res.data
          console.log(missionData)
        } else {
          console.log(res.error)
        }
        if (missionData === null) {
          console.log("failed to parse file")
          return
        }
        setMission(missionData.mission)
        setVehicle(missionData.vehicle)
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
