import { useState } from "react";
import { ArrowDownNarrowWide, Locate, MoveDown, MoveUp, Route, Trash2 } from "lucide-react";
import { useMission } from "@/stores/mission";
import ListItem from "@/components/ui/listItem";
import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu";
import { getCommandLabel } from "@libs/commands/helpers";
import { Button } from "@/components/ui/button";

export default function CommandList() {
  const setSelectedSubMission = useMission(s => s.setSelectedSubMission)
  const mission = useMission(s => s.mission)
  const setSelectedCommandIDs = useMission(s => s.setSelectedCommandIDs)
  const selectedCommandIDs = useMission(s => s.selectedCommandIDs)
  const dialect = useMission(s => s.dialect)
  const setMission = useMission(s => s.setMission)
  const selectedSubMission = useMission(s => s.selectedSubMission)
  const setTool = useMission(s => s.setTool)
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const curMission = mission.get(selectedSubMission)

  const missions = Array.from(mission.getMissions())

  const hasLanding = missions.includes("Landing")
  const hasTakeoff = missions.includes("Takeoff")

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

  function onDelete(id: number) {
    const temp = mission.clone()
    const wp = mission.get(selectedSubMission)[id]
    if (wp.type == "RF.Group" && ["Landing", "Takeoff"].includes(wp.params.name as string)) {
      temp.removeSubMission(wp.params.name as string)
    }
    temp.pop(selectedSubMission, id)
    setMission(temp)
    setSelectedCommandIDs([])
  }

  // delete all selected waypoints
  function onDeleteSelected() {
    const temp = mission.clone()
    const minID = Math.min(...selectedCommandIDs)
    const maxID = Math.max(...selectedCommandIDs)

    const nodes = [...mission.get(selectedSubMission)]
    for (const node of nodes) {
      if (node.type == "RF.Group" && ["Landing", "Takeoff"].includes(node.params.name as string)) {
        temp.removeSubMission(node.params.name as string)
      }
    }
    nodes.splice(minID, (maxID - minID) + 1)
    temp.set(selectedSubMission, nodes)
    setMission(temp)
    setSelectedCommandIDs([])
  }

  function goToSubMission(name: string) {
    setSelectedSubMission(name)
    setSelectedCommandIDs([])
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
    let temp = mission.clone()
    temp.set(selectedSubMission, subMissionCmds)
    temp.set(name, newCmds)
    setMission(temp)

  }

  // ungroup the waypoint group in place in the mission, leaving the sub mission itself alone
  function ungroup(i: number) {
    if (curMission[i].type != "RF.Group") return
    const subMission = mission.get(curMission[i].params.name as string)
    const mainMission = mission.get(selectedSubMission)
    // Remove the collection node and insert the sub mission commands
    mainMission.splice(i, 1, ...subMission)
    let temp = mission.clone()
    temp.set(selectedSubMission, mainMission)
    setMission(temp)
  }

  function createTakeoff() {

    const a = mission.clone()
    a.addSubMission("Takeoff", [])
    a.insert(0, "Main", { type: "RF.Group", frame: 0, params: { name: "Takeoff" } })
    setMission(a)
    setSelectedSubMission("Takeoff")
    setSelectedCommandIDs([])
    setTool("Takeoff")
  }

  function createLanding() {
    const a = mission.clone()
    a.addSubMission("Landing", [])
    a.pushToMission("Main", { type: "RF.Group", frame: 0, params: { name: "Landing" } })
    setMission(a)
    setSelectedSubMission("Landing")
    setSelectedCommandIDs([])
    setTool("Land")
  }

  function moveUp(i: number) {
    const temp = mission.clone()
    const cur = temp.get(selectedSubMission)[i]
    temp.get(selectedSubMission).splice(i, 1)
    temp.get(selectedSubMission).splice(i - 1, 0, cur)
    setMission(temp)
  }

  function moveDown(i: number) {
    const temp = mission.clone()
    const cur = temp.get(selectedSubMission)[i]
    temp.get(selectedSubMission).splice(i, 1)
    temp.get(selectedSubMission).splice(i + 1, 0, cur)
    setMission(temp)
  }


  return (
    <div className="flex-grow overflow-auto select-none">

      {!hasTakeoff && selectedSubMission == "Main" ?
        <div className="px-2 py-1">
          <Button name="Add Takeoff" onClick={createTakeoff} className="text-center w-full my-2 mx-0 h-12">
            Add Takeoff
          </Button>
        </div> : null
      }



      {curMission.map((node, i) => {
        if (node.type == "RF.Group") {

          return (
            <ListItem key={i} icon={<Route />} name={getCommandLabel(node, dialect)} onClick={(e) => handleClick(i, e)} selected={selectedCommandIDs.includes(i)}
              menuItems={
                <>
                  <DropdownMenuItem onClick={() => goToSubMission(node.params.name as string)} className="gap-2">
                    <ArrowDownNarrowWide className="h-4 w-4" />
                    <span>Go To Mission</span>
                  </DropdownMenuItem>

                  {i > 0 ? <DropdownMenuItem onClick={() => moveUp(i)} className="gap-2">
                    <MoveUp className="h-4 w-4" />
                    <span>Move Up</span>
                  </DropdownMenuItem> : null}

                  {i < curMission.length - 1 ? <DropdownMenuItem onClick={() => moveDown(i)} className="gap-2">
                    <MoveDown className="h-4 w-4" />
                    <span>Move Down</span>
                  </DropdownMenuItem> : null}

                  {selectedCommandIDs.length > 1 ? <DropdownMenuItem onClick={() => handleGroup()} className="gap-2">
                    <Route className="h-4 w-4" />
                    <span>Group ({selectedCommandIDs.length})</span>
                  </DropdownMenuItem> : null}

                  <DropdownMenuItem onClick={() => ungroup(i)} className="gap-2">
                    <Route className="h-4 w-4" />
                    <span>Ungroup</span>
                  </DropdownMenuItem>


                  <DropdownMenuItem onClick={() => onDelete(i)} className="gap-2 text-red-500 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>

                  {selectedCommandIDs.length > 1 ? <DropdownMenuItem onClick={() => onDeleteSelected()} className="gap-2 text-red-500 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                    <span>Delete ({selectedCommandIDs.length})</span>
                  </DropdownMenuItem> : null}
                </>
              }
            />
          )
        } else {

          return (
            <ListItem name={getCommandLabel(node, dialect)} icon={<Locate />} key={i} selected={selectedCommandIDs.includes(i)} onClick={(e) => handleClick(i, e)} className="justify-start"
              menuItems={
                <>

                  {selectedCommandIDs.length > 1 ? <DropdownMenuItem onClick={() => handleGroup()} className="gap-2">
                    <Route className="h-4 w-4" />
                    <span>Group ({selectedCommandIDs.length})</span>
                  </DropdownMenuItem> : null}

                  {i > 0 ? <DropdownMenuItem onClick={() => moveUp(i)} className="gap-2">
                    <MoveUp className="h-4 w-4" />
                    <span>Move Up</span>
                  </DropdownMenuItem> : null}

                  {i < curMission.length - 1 ? <DropdownMenuItem onClick={() => moveDown(i)} className="gap-2">
                    <MoveDown className="h-4 w-4" />
                    <span>Move Down</span>
                  </DropdownMenuItem> : null}

                  <DropdownMenuItem onClick={() => onDelete(i)} className="gap-2 text-red-500 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>

                  {selectedCommandIDs.length > 1 ? <DropdownMenuItem onClick={() => onDeleteSelected()} className="gap-2 text-red-500 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                    <span>Delete ({selectedCommandIDs.length})</span>
                  </DropdownMenuItem> : null}
                </>
              }
            />
          )
        }
      })}

      {selectedCommandIDs.length > 1 ? (
        <div className="w-full flex justify-center">
          <Button variant="active" onMouseDown={handleGroup} className="text-center p-1 m-1 w-44">Group {selectedCommandIDs.length} waypoints</Button>

        </div>
      ) : null}

      {!hasLanding && selectedSubMission == "Main" ?
        <div className="px-2 py-1">
          <Button onClick={createLanding} className="w-full my-2 mx-0 h-12">
            Add Landing
          </Button>
        </div> : null
      }
    </div>
  )
}
