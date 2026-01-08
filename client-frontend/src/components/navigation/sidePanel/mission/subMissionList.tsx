import ListItem from "@/components/ui/listItem";
import { useMission } from "@/stores/mission";
import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu";
import { CornerLeftUp, Fence, MapPin, PlaneLanding, PlaneTakeoff, Route, Trash2 } from "lucide-react";


const noAddNames = ["Main", "Geofence", "Takeoff", "Landing", "Markers"]

export default function SubMissionList() {
  const selectedSubMission = useMission(s => s.selectedSubMission)
  const setSelectedSubMission = useMission(s => s.setSelectedSubMission)
  const clearSubMission = useMission(s => s.clearSubMission)
  const deleteSubMission = useMission(s => s.deleteSubMission)
  const addSub = useMission(s => s.addSub)

  const subMissionInfo = useMission((s) => {
    let names = s.mission.getMissions()
    let ret: { name: string, cmdCount: number }[] = []
    for (let i = 0; i < names.length; i++) {
      ret.push({ name: names[i], cmdCount: s.mission.get(names[i]).length })
    }
    return ret
  }, (a, b) =>
    a.length === b.length &&
    a.every((v, i) =>
      v.name === b[i].name &&
      v.cmdCount === b[i].cmdCount
    ))

  function clearMission(missionName: string) {
    const a = confirm("Are you sure you want to clear")
    if (a) clearSubMission(missionName)
  }

  function deleteMission(missionName: string) {
    const a = confirm("Are you sure you want to delete")
    if (a) deleteSubMission(missionName)
  }
  return (
    <div className="flex flex-col gap-2">
      {subMissionInfo.map((subMission, id) => {
        const canAdd = !noAddNames.includes(subMission.name)

        return (
          <ListItem name={`${subMission.name} (${subMission.cmdCount})`} icon={subMission.name == "Geofence" ? <span><Fence /></span>
            : subMission.name == "Markers" ? <span><MapPin /></span>
              : subMission.name == "Landing" ? <span><PlaneLanding /></span>
                : subMission.name == "Takeoff" ? <span><PlaneTakeoff /></span>
                  : <span><Route /></span>
          }
            className="justify-start" key={id} onClick={() => setSelectedSubMission(subMission.name)} selected={selectedSubMission == subMission.name}
            menuItems={<>

              {canAdd ? (<DropdownMenuItem
                onClick={() => addSub(subMission.name)}
                className="gap-2"
                disabled={selectedSubMission === subMission.name}
              >
                <CornerLeftUp className="h-4 w-4" />
                <span>Add to Mission</span>
              </DropdownMenuItem>) : null}

              {["Main", "Geofence", "Markers"].includes(selectedSubMission) ? <DropdownMenuItem onClick={() => clearMission(subMission.name)} className="gap-2 text-red-500 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
                <span>Clear</span>
              </DropdownMenuItem> :

                <DropdownMenuItem onClick={() => deleteMission(subMission.name)} className="gap-2 text-red-500 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>}

            </>
            } />
        )
      })}
    </div>
  )
}
