import ListItem from '@/components/ui/listItem'
import {
  ArrowDownNarrowWide,
  Locate,
  MoveDown,
  MoveUp,
  PlaneLanding,
  PlaneTakeoff,
  PlugZap,
  Route,
  Spline,
  Trash2
} from 'lucide-react'
import { DialectCommandDescription, MissionCommand } from '@libs/commands/command'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { getCommandLabel } from '@libs/commands/helpers'
import { useMission } from '@libs/stores/mission'
import { useEditor } from '@libs/stores/configurator'

export default function CommandItem({
  command,
  id
}: {
  command: MissionCommand<DialectCommandDescription>
  id: number
}) {
  const lastSelectedCommandIndex = useEditor((s) => s.lastSelectedCommandIndex)
  const setLastSelectedCommandIndex = useEditor((s) => s.setLastSelectedCommandIndex)
  const setSelectedSubMission = useMission((s) => s.setSelectedSubMission)
  const mission = useMission((s) => s.mission)
  const setSelectedCommandIDs = useMission((s) => s.setSelectedCommandIDs)
  const selectedCommandIDs = useMission((s) => s.selectedCommandIDs)
  const dialect = useMission((s) => s.dialect)
  const setMission = useMission((s) => s.setMission)
  const selectedSubMission = useMission((s) => s.selectedSubMission)

  const curMission = mission.get(selectedSubMission)

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
  // ungroup the waypoint group in place in the mission, leaving the sub mission itself alone
  function ungroup(i: number) {
    if (curMission[i].type != 'RF.Group') return
    const subMission = mission.get(curMission[i].params.name as string)
    const mainMission = mission.get(selectedSubMission)
    // Remove the collection node and insert the sub mission commands
    mainMission.splice(i, 1, ...subMission)
    const temp = mission.clone()
    temp.set(selectedSubMission, mainMission)
    setMission(temp)
  }

  function handleClick(id: number, e: React.MouseEvent<HTMLDivElement>) {
    if (e.shiftKey && lastSelectedCommandIndex !== null) {
      const range = [lastSelectedCommandIndex, id].sort((a, b) => a - b)
      const newSelection = []
      for (let i = range[0]; i <= range[1]; i++) newSelection.push(i)
      setSelectedCommandIDs(newSelection)
    } else {
      setSelectedCommandIDs([id])
    }
    setLastSelectedCommandIndex(id)
  }

  function onDelete(id: number) {
    const temp = mission.clone()
    const wp = mission.get(selectedSubMission)[id]
    if (wp.type == 'RF.Group' && ['Landing', 'Takeoff'].includes(wp.params.name as string)) {
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
      if (node.type == 'RF.Group' && ['Landing', 'Takeoff'].includes(node.params.name as string)) {
        temp.removeSubMission(node.params.name as string)
      }
    }
    nodes.splice(minID, maxID - minID + 1)
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
    name = prompt('enter name')
    if (name == null) return

    // remove all selected
    const newCmds = curMission.filter((_, id) => selectedCommandIDs.includes(id))

    // get the nodes for sub mission
    const subMissionCmds = curMission.filter((_, id) => !selectedCommandIDs.includes(id))

    // if _ at the start of the name, don't add to the main mission
    if (name.charAt(0) != '_') {
      subMissionCmds.splice(Math.min(...selectedCommandIDs), 0, {
        type: 'RF.Group',
        frame: 0,
        params: { name: name }
      })
      setSelectedCommandIDs([Math.min(...selectedCommandIDs)])
    } else {
      setSelectedCommandIDs([])
    }

    // update the actual waypoints
    const temp = mission.clone()
    temp.set(selectedSubMission, subMissionCmds)
    temp.set(name, newCmds)
    setMission(temp)
  }

  const icons = {
    'RF.Waypoint': <Locate />,
    'RF.Takeoff': <PlaneTakeoff />,
    'RF.Land': <PlaneLanding />,
    'RF.SetServo': <PlugZap />,
    'RF.DubinsPath': <Spline />
  }

  let icon = <Locate />
  if (command.type in icons) {
    icon = icons[command.type]
  }

  if (command.type == 'RF.Group') {
    return (
      <ListItem
        icon={icon}
        name={getCommandLabel(command, dialect)}
        onClick={(e) => handleClick(id, e)}
        selected={selectedCommandIDs.includes(id)}
        menuItems={
          <>
            <DropdownMenuItem
              onClick={() => goToSubMission(command.params.name as string)}
              className="gap-2"
            >
              <ArrowDownNarrowWide className="h-4 w-4" />
              <span>Go To Mission</span>
            </DropdownMenuItem>

            {id > 0 ? (
              <DropdownMenuItem onClick={() => moveUp(id)} className="gap-2">
                <MoveUp className="h-4 w-4" />
                <span>Move Up</span>
              </DropdownMenuItem>
            ) : null}

            {id < curMission.length - 1 ? (
              <DropdownMenuItem onClick={() => moveDown(id)} className="gap-2">
                <MoveDown className="h-4 w-4" />
                <span>Move Down</span>
              </DropdownMenuItem>
            ) : null}

            {selectedCommandIDs.length > 1 ? (
              <DropdownMenuItem onClick={() => handleGroup()} className="gap-2">
                <Route className="h-4 w-4" />
                <span>Group ({selectedCommandIDs.length})</span>
              </DropdownMenuItem>
            ) : null}

            <DropdownMenuItem onClick={() => ungroup(id)} className="gap-2">
              <Route className="h-4 w-4" />
              <span>Ungroup</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => onDelete(id)}
              className="gap-2 text-red-500 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>

            {selectedCommandIDs.length > 1 ? (
              <DropdownMenuItem
                onClick={() => onDeleteSelected()}
                className="gap-2 text-red-500 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete ({selectedCommandIDs.length})</span>
              </DropdownMenuItem>
            ) : null}
          </>
        }
      />
    )
  } else {
    return (
      <ListItem
        name={getCommandLabel(command, dialect)}
        icon={icon}
        selected={selectedCommandIDs.includes(id)}
        onClick={(e) => handleClick(id, e)}
        className="justify-start"
        menuItems={
          <>
            {selectedCommandIDs.length > 1 ? (
              <DropdownMenuItem onClick={() => handleGroup()} className="gap-2">
                <Route className="h-4 w-4" />
                <span>Group ({selectedCommandIDs.length})</span>
              </DropdownMenuItem>
            ) : null}

            {id > 0 ? (
              <DropdownMenuItem onClick={() => moveUp(id)} className="gap-2">
                <MoveUp className="h-4 w-4 " />
                <span>Move Up</span>
              </DropdownMenuItem>
            ) : null}

            {id < curMission.length - 1 ? (
              <DropdownMenuItem onClick={() => moveDown(id)} className="gap-2">
                <MoveDown className="h-4 w-4" />
                <span>Move Down</span>
              </DropdownMenuItem>
            ) : null}

            <DropdownMenuItem
              onClick={() => onDelete(id)}
              className="gap-2 text-red-500 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>

            {selectedCommandIDs.length > 1 ? (
              <DropdownMenuItem
                onClick={() => onDeleteSelected()}
                className="gap-2 text-red-500 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete ({selectedCommandIDs.length})</span>
              </DropdownMenuItem>
            ) : null}
          </>
        }
      />
    )
  }
}
