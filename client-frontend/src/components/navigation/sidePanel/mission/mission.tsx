import ListItem from "@/components/ui/listItem";
import { useMission } from "@/stores/mission";
import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu";
import { CornerLeftUp, Fence, MapPin, PlaneLanding, PlaneTakeoff, Route, Trash2 } from "lucide-react";
import CommandList from "./commandList";
import MissionFile from "./file";
import { Button } from "@/components/ui/button";
import MissionDialog from "@/components/dialogs/mission";
import SidePanelSection from "@/components/ui/sidePanelSection";

const noAddNames = ["Main", "Geofence", "Takeoff", "Landing", "Markers"]

export default function Mission() {
  const { mission, setMission, selectedSubMission, setSelectedSubMission } = useMission()


  function addSub(name: string) {
    if (selectedSubMission == name) return

    let newWaypoints = mission.clone()
    try {
      newWaypoints.pushToMission(selectedSubMission, { type: "RF.Group", frame: 0, params: { name: name } })
      setMission(newWaypoints)
    } catch (err) {
      return
    }
  }


  function clearMission(missionName: string) {
    const a = confirm("Are you sure you want to clear")
    if (!a) return
    const temp = mission.clone()
    temp.set(missionName, [])
    setMission(temp)
  }

  function deleteMission(missionName: string) {
    const a = confirm("Are you sure you want to delete")
    if (!a) return
    setSelectedSubMission("Main")
    const temp = mission.clone()
    temp.removeSubMission(missionName)
    setMission(temp)
  }

  return (
    <div className="flex flex-col gap-2 h-full">

      <SidePanelSection title="File">
        <MissionDialog />
        <MissionFile />
      </SidePanelSection>

      <SidePanelSection title={selectedSubMission} className="flex-grow">
        <CommandList />
      </SidePanelSection>

      <SidePanelSection title="Sub Missions">
        <div className="flex flex-col gap-2">
          {mission.getMissions().map((subMission, id) => {
            const wp = mission.get(subMission)
            const canAdd = !noAddNames.includes(subMission)

            return (
              <ListItem name={`${subMission} (${wp.length})`} icon={subMission == "Geofence" ? <span><Fence /></span>
                : subMission == "Markers" ? <span><MapPin /></span>
                  : subMission == "Landing" ? <span><PlaneLanding /></span>
                    : subMission == "Takeoff" ? <span><PlaneTakeoff /></span>
                      : <span><Route /></span>
              }
                className="justify-start" key={id} onClick={() => setSelectedSubMission(subMission)} selected={selectedSubMission == subMission}
                menuItems={<>

                  {canAdd ? (<DropdownMenuItem
                    onClick={() => addSub(subMission)}
                    className="gap-2"
                    disabled={selectedSubMission === subMission}
                  >
                    <CornerLeftUp className="h-4 w-4" />
                    <span>Add to Mission</span>
                  </DropdownMenuItem>) : null}

                  {["Main", "Geofence", "Markers"].includes(selectedSubMission) ? <DropdownMenuItem onClick={() => clearMission(subMission)} className="gap-2 text-red-500 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                    <span>Clear</span>
                  </DropdownMenuItem> :

                    <DropdownMenuItem onClick={() => deleteMission(subMission)} className="gap-2 text-red-500 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>}

                </>
                } />
            )
          })}
        </div>
      </SidePanelSection>
    </div >
  )
}
