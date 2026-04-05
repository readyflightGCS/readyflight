import { Button } from "@/components/ui/button";
import { useMission } from "@/stores/mission";
import { Separator } from "@/components/ui/separator";
import { CommandDescription } from "@libs/commands/command";
import { Vehicle } from "@libs/vehicle/types";
import { Mission } from "@libs/mission/mission";
import { avgLatLng } from "@libs/world/latlng";
import { filterLatLngCmds } from "@libs/commands/helpers";
import { useRFMap } from "@/stores/map";

export default function ImportMission() {
  const setVehicle = useMission(s => s.setVehicle)
  const setMission = useMission(s => s.setMission)
  const dialect = useMission(s => s.dialect)
  const mapRef = useRFMap(s => s.mapRef)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return
    }

    const file = event.target.files[0];

    if (!file) {
      console.error("please select a file first")
      return;
    }

    try {
      let missionData: { mission: Mission<CommandDescription>, vehicle: Vehicle } | null = null
      dialect.fileFormats.filter(x => x.import !== undefined).forEach(x => {
        let res = x.import(file)
        if (res.data !== undefined) {
          missionData = res.data
        }
      })
      if (missionData === null) {
        // todo add dialog something
        return
      }
      setMission(missionData.mission)
      setVehicle(missionData.vehicle)

      /* TODO move camera to center of mission
      let main = missionData.mission.get("Main")
      if (main) {
        const avgll = avgLatLng(filterLatLngCmds(missionData.mission.flatten("Main"), dialect).map(getLatLng))
        if (avgll !== undefined) {
          mapRef.current?.panTo(avgll)
        }
      }
      */
    } catch (err) {
      console.error(err)
    }

  };

  return (
    <div>
      <Separator />
      <h2>Import</h2>
      <input type="file" accept=".json, .waypoints" id="importFileInput" className="hidden" onChange={handleFileChange} />
      <Button variant="green" onClick={() => document.getElementById('importFileInput')?.click()}>Import</Button>
    </div>
  )

}
