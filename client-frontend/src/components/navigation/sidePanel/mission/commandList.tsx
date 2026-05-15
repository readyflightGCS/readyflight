import { useMission } from '@libs/stores/mission'
import { Button } from '@/components/ui/button'
import { DialectCommandDescription, MissionCommand } from '@libs/commands/command'
import CommandItem from './commandItem'

export default function CommandList() {
  const setSelectedSubMission = useMission((s) => s.setSelectedSubMission)
  const mission = useMission((s) => s.mission)
  const setSelectedCommandIDs = useMission((s) => s.setSelectedCommandIDs)
  const selectedCommandIDs = useMission((s) => s.selectedCommandIDs)
  const dialect = useMission((s) => s.dialect)
  const setMission = useMission((s) => s.setMission)
  const selectedSubMission = useMission((s) => s.selectedSubMission)
  const setTool = useMission((s) => s.setTool)

  const curMission = mission.get(selectedSubMission)

  const missions = Array.from(mission.getMissions())

  const hasLanding = missions.includes('Landing')
  const hasTakeoff = missions.includes('Takeoff')


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


  function createTakeoff() {
    const a = mission.clone()
    a.addSubMission('Takeoff', [])
    a.insert(0, 'Main', { type: 'RF.Group', frame: 0, params: { name: 'Takeoff' } })
    setMission(a)
    setSelectedSubMission('Takeoff')
    setSelectedCommandIDs([])
    setTool('Takeoff')
  }

  function createLanding() {
    const a = mission.clone()
    a.addSubMission('Landing', [])
    a.pushToMission('Main', { type: 'RF.Group', frame: 0, params: { name: 'Landing' } })
    setMission(a)
    setSelectedSubMission('Landing')
    setSelectedCommandIDs([])
    setTool('Land')
  }

  let missionWithDubinsGroups: ({
    type: "cmd",
    cmd: MissionCommand<DialectCommandDescription>
  } | {
    type: "dubins",
    cmds: MissionCommand<DialectCommandDescription>
  })[] = []

  for (let i = 0; i < curMission.length; i++) {
    missionWithDubinsGroups.push({ type: "cmd", cmd: curMission[i] })
  }

  return (
    <div className="flex-grow overflow-auto select-none">
      {!hasTakeoff && selectedSubMission == 'Main' ? (
        <div className="px-2 py-1">
          <Button
            name="Add Takeoff"
            onClick={createTakeoff}
            className="text-center w-full my-2 mx-0 h-12"
          >
            Add Takeoff
          </Button>
        </div>
      ) : null}

      {curMission.map((node, i) => (
        <CommandItem key={i} command={node} />
      ))}
      {selectedCommandIDs.length > 1 ? (
        <div className="w-full flex justify-center">
          <Button variant="active" onMouseDown={handleGroup} className="text-center p-1 m-1 w-44">
            Group {selectedCommandIDs.length} waypoints
          </Button>
        </div>
      ) : null}

      {!hasLanding && selectedSubMission == 'Main' ? (
        <div className="px-2 py-1">
          <Button onClick={createLanding} className="w-full my-2 mx-0 h-12">
            Add Landing
          </Button>
        </div>
      ) : null}
    </div>
  )
}
