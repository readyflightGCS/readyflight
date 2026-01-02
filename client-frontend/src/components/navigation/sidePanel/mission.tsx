import { Button } from "@/components/ui/button";
import ListItem from "@/components/ui/listItem";
import { cn } from "@/lib/utils";
import { useMission } from "@/stores/mission";
import { getCommandLabel } from "@libs/commands/helpers";
import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu";
import { CornerLeftUp, Fence, MapPin, PlaneLanding, PlaneTakeoff, Route, Trash2 } from "lucide-react";
import { useState } from "react";
import CommandList from "./commandList";

const noAddNames = ["Main", "Geofence", "Takeoff", "Landing", "Markers"]

export default function Mission() {
  const { mission, setMission, selectedSubMission, selectedCommandIDs, setSelectedSubMission, setSelectedCommandIDs, dialect } = useMission()
  const commands = mission.flatten(selectedSubMission)
  const curMission = mission.get(selectedSubMission)

  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

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


  function handleClick(id: number, e: React.MouseEvent<HTMLDivElement>) {
    if (e.shiftKey && lastSelectedIndex !== null) {
      const range = [lastSelectedIndex, id].sort((a, b) => a - b)
      const newSelection = []
      for (let i = range[0]; i <= range[1]; i++) newSelection.push(i)
      setSelectedCommandIDs(newSelection)
    } else {
      setSelectedCommandIDs([id])
      setLastSelectedIndex(id)
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


  function handleGroup() {
    // get name for mission
    let name: string | null = null
    name = prompt("enter name")
    if (name == null) return

    // remove all selected
    const newCmds = curMission.filter((_, id) => selectedCommandIDs.includes(id))

    // get the nodes for sub mission
    const subMissionCmds = curMission.filter((_, id) => !selectedCommandIDs.includes(id))

    // if _ at the start of the name, don't add to the main mission
    if (name.charAt(0) != '_') {
      subMissionCmds.splice(Math.min(...selectedCommandIDs), 0, { type: "RF.Group", frame: 0, params: { name: name } })
      setSelectedCommandIDs([Math.min(...selectedCommandIDs)])
    } else {
      setSelectedCommandIDs([])
    }

    // update the actual waypoints
    let w = mission.clone()
    w.set(selectedSubMission, subMissionCmds)
    w.set(name, newCmds)
    setMission(w)

  }

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="bg-muted p-2 rounded-lg flex-grow flex flex-col gap-2">
        <h3>{selectedSubMission}</h3>
        <CommandList onHide={() => { }} />
      </div>
      <div className="bg-muted p-2 rounded-lg">
        <h3>Sub Missions</h3>
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
      </div>
    </div>
  )
}
