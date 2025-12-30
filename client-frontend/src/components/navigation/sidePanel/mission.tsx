import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMission } from "@/stores/mission";
import { getCommandLabel } from "@libs/commands/helpers";
import { useState } from "react";

export default function Mission() {
  const { mission, setMission, selectedSubMission, selectedCommandIDs, setSelectedSubMission, setSelectedCommandIDs, dialect } = useMission()
  const commands = mission.flatten(selectedSubMission)
  const curMission = mission.get(selectedSubMission)

  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

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
        {commands.map((x, i) => {
          return (
            <div key={i} className={cn("bg-background p-2 rounded-lg", selectedCommandIDs.includes(i) ? "bg-background-muted" : null)} onClick={(e) => handleClick(i, e)}>
              {getCommandLabel(x, dialect)}
            </div>
          )
        })}
        {selectedCommandIDs.length > 1 ? (
          <div className="w-full flex justify-center">
            <Button variant="active" onMouseDown={handleGroup} className="text-center p-1 m-1 w-44">Group {selectedCommandIDs.length} waypoints</Button>

          </div>
        ) : null}
      </div>
      <div className="bg-muted p-2 rounded-lg">
        <h3>Sub Missions</h3>
        <div className="flex flex-col gap-2">
          {mission.getMissions().map((x, i) => (
            <div key={i} className={cn(`bg-background p-2 rounded-lg`, x === selectedSubMission ? "bg-background-muted" : null)} onClick={() => setSelectedSubMission(x)}>{x}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
